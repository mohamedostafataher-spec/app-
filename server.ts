import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our statistical engine logic to run on "the backend"
import { 
  computeDataQuality, 
  computeHomogeneityAndTrend, 
  computeRainfallCharacterization, 
  computeExtremeIndices, 
  buildAnnualMaximumSeries, 
  fitGEVLMoments, 
  fitGumbelLMoments, 
  computeGoodnessOfFit, 
  computeReturnLevelsWithBootstrap 
} from './src/utils/statisticalEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId || '(default)');
const projectsCol = db.collection('projects');

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));

  // API Routes - Simulated Cloud Functions
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Egypt Rainfall Engine (Integrated)' });
  });

  /**
   * createAnalysisRun (Page 11/12)
   * Orchestrates the creation of a run and triggers scientific processing
   */
  app.post('/api/analysis/run', async (req, res) => {
    const { projectId, datasetId, stationId, analysisType, parameters, records } = req.body;
    try {
      const authHeader = req.headers.authorization;

      if (!projectId || !datasetId || !records) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Security check (Simulation of token verification)
      // In production, we'd verify the Firebase ID Token here.
      
      const projectRef = projectsCol.doc(projectId);
      const projectSnapshot = await projectRef.get();
      if (!projectSnapshot.exists) {
        // Create the project if it doesn't exist
        await projectRef.set({
          ownerId: 'SIMULATED_USER',
          name: 'Default Research Project',
          title: 'Default Research Project',
          language: 'ar',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      
      const runRef = projectRef.collection('runs').doc();
      const runId = runRef.id;

      // 1. Create Run Record (Queued)
      await runRef.set({
        ownerId: 'SIMULATED_USER', // Should come from decoded token
        datasetId,
        stationId: stationId || null,
        analysisType: analysisType || 'full-analysis',
        parameters: parameters || {},
        status: 'running',
        warnings: [],
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Perform Scientific Computation (Simulated Cloud Run call)
      // This is normally where we'd call the Python engine.
      // Here we use our robust JS engine on the "server side".
      
      const qc = computeDataQuality(records, 90);
      const annualTotals = qc.annual_completeness.map(ac => ({
        year: ac.year,
        total_mm: records.filter((r: any) => r.date.startsWith(String(ac.year))).reduce((s: number, r: any) => s + (r.rainfall_mm || 0), 0)
      }));
      const homogeneity = computeHomogeneityAndTrend(annualTotals, 'STN', stationId || 'STN');
      const characterization = computeRainfallCharacterization(records, 1.0);
      const indices = computeExtremeIndices(records, 90);
      const ams = buildAnnualMaximumSeries(indices.rx1day);
      const fitValues = ams.filter(a => a.eligible_for_model).map(a => a.maximum_value_mm);
      
      let models = null;
      let returnLevels = null;
      
      if (fitValues.length >= 5) {
        const gev = fitGEVLMoments(fitValues, 'STN', 'Rx1day');
        const gumbel = fitGumbelLMoments(fitValues, 'STN', 'Rx1day');
        const bestModel = gev.aic < gumbel.aic ? gev : gumbel;
        const gof = computeGoodnessOfFit(fitValues, bestModel);
        const rl = computeReturnLevelsWithBootstrap(fitValues, bestModel, [2, 5, 10, 25, 50, 100], 1000);
        
        models = { gev, gumbel, best: bestModel, gof };
        returnLevels = rl;
      }

      const results = {
        qc,
        homogeneity,
        characterization,
        indices: ams,
        models,
        return_levels: returnLevels,
        canModel: fitValues.length >= 5
      };

      // 3. Update Run Record with results
      await runRef.update({
        status: 'completed',
        results: results,
        completedAt: FieldValue.serverTimestamp(),
      });

      // 4. Log Audit (Page 12)
      await projectRef.collection('audit').add({
        action: "analysis_run_completed",
        entity: "run",
        entityId: runId,
        after: { runId, status: 'completed' },
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({
        runId,
        status: 'completed',
        results
      });

    } catch (err: any) {
      console.error("ERROR IN ANALYSIS RUN [projectId:", projectId, ", datasetId:", datasetId, "]:", err);
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // Setup Vite
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Integrated Professional Hydrology Platform running at http://localhost:${PORT}`);
  });
}

startServer();
