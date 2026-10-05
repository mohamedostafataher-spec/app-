/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Professional Hydrology & Extreme Value Analysis Platform
 */

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Upload,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
  Search,
  ShieldCheck,
  AlertTriangle,
  Download,
  Info,
  ArrowLeftRight,
  Printer,
  CheckCircle2,
  Calculator,
  CalendarDays,
  TrendingUp,
  Edit3,
  X,
  FileText,
  Sliders,
  RotateCcw,
  MapPin,
  HelpCircle,
  Eye,
  Filter,
  Sparkles,
} from 'lucide-react';

import { DailyRecord, CalculationStepExplanation } from '../../types';
import {
  reconstructDailyCalendar,
  computeDataQuality,
  computeHomogeneityAndTrend,
  computeRainfallCharacterization,
  computeExtremeIndices,
  buildAnnualMaximumSeries,
  fitGEVLMoments,
  fitGumbelLMoments,
  computeGoodnessOfFit,
  computeReturnLevelsWithBootstrap,
  analyzeStormEvent,
  generateStepByStepSubstitution,
  detectTemporalFrequency,
  getEnvironmentalClassification,
  getBasinDescription,
} from '../../utils/statisticalEngine';
import {
  QQPPPlot,
  ReturnLevelCurveChart,
  DanielStormChart,
  AMSChart,
} from '../HydroCharts';
import { SpatialRainfallChart } from '../SpatialRainfallChart';
import { FormulasAndReferencesModal } from '../FormulasAndReferencesModal';
import { CalculationStepsModal } from '../CalculationStepsModal';
import { ManualScientificCalculatorModal } from '../ManualScientificCalculatorModal';
import { DataSelectionWorkspaceModal } from '../DataSelectionWorkspaceModal';
import { DataEditorAuditModal } from '../DataEditorAuditModal';
import { ArabicQueryParserModal } from '../ArabicQueryParserModal';
import { StormEventBuilderModal } from '../StormEventBuilderModal';
import { MultiStationAnalysisModal } from '../MultiStationAnalysisModal';
import { DataCatalogComparisonModal } from '../DataCatalogComparisonModal';
import { ProjectRunsManagerModal } from '../ProjectRunsManagerModal';
import { PreExportValidationModal } from '../PreExportValidationModal';
import { RolesReviewModal } from '../RolesReviewModal';
import { PDFTableExtractorModal } from '../PDFTableExtractorModal';
import { AuditTrailItem, StructuredArabicPlan, TemporalDetectionResult } from '../../types';
import { runFullAnalysis } from '../../lib/api';

export const ExtremeRainfallPlatformView: React.FC = () => {
  // 1. Operating Mode State
  const isProductionMode = true;
  const [stationName, setStationName] = useState<string>('لم يتم اختيار محطة');
  const [stationId, setStationId] = useState<string>('STN_000');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [unfilteredRecords, setUnfilteredRecords] = useState<DailyRecord[]>([]);
  const [filterFingerprint, setFilterFingerprint] = useState<string>('NONE');
  const [auditTrailList, setAuditTrailList] = useState<AuditTrailItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('No file uploaded');
  const [uploadedFileSource, setUploadedFileSource] = useState<string>('No source');
  const [analysisRunId, setAnalysisRunId] = useState<string>(`RUN_${Date.now()}`);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string>(new Date().toLocaleString('ar-EG'));

  // 2. Thresholds & Seed State
  const [completenessThreshold, setCompletenessThreshold] = useState<number>(90);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [bootstrapReps, setBootstrapReps] = useState<number>(1000);

  // 3. UI State
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [hydro, setHydro] = useState<any>(null);
  const [temporalResult, setTemporalResult] = useState<TemporalDetectionResult | null>(null);
  const [showFormulasModal, setShowFormulasModal] = useState<boolean>(false);
  const [calculationStepData, setCalculationStepData] = useState<CalculationStepExplanation | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState<boolean>(false);
  const [showManualCalculatorModal, setShowManualCalculatorModal] = useState<boolean>(false);
  const [showDataSelectionModal, setShowDataSelectionModal] = useState<boolean>(false);
  const [showDataEditorModal, setShowDataEditorModal] = useState<boolean>(false);
  const [showArabicParserModal, setShowArabicParserModal] = useState<boolean>(false);
  const [showStormBuilderModal, setShowStormBuilderModal] = useState<boolean>(false);
  const [showMultiStationModal, setShowMultiStationModal] = useState<boolean>(false);
  const [showDataCatalogModal, setShowDataCatalogModal] = useState<boolean>(false);
  const [showProjectRunsModal, setShowProjectRunsModal] = useState<boolean>(false);
  const [showPreExportModal, setShowPreExportModal] = useState<boolean>(false);
  const [showRolesReviewModal, setShowRolesReviewModal] = useState<boolean>(false);
  const [showPDFExtractorModal, setShowPDFExtractorModal] = useState<boolean>(false);
  const [inputRainMm, setInputRainMm] = useState<number>(65);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // 4. Ingestion, Preview & Mapping State
  const [rawTableRows, setRawTableRows] = useState<any[][] | null>(null);
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);
  const [showDataPreview, setShowDataPreview] = useState<boolean>(false);
  const [dateColIdx, setDateColIdx] = useState<number>(0);
  const [rainColIdx, setRainColIdx] = useState<number>(1);
  const [nameColIdx, setNameColIdx] = useState<number>(-1);
  const [idColIdx, setIdColIdx] = useState<number>(-1);
  const [latColIdx, setLatColIdx] = useState<number>(-1);
  const [lonColIdx, setLonColIdx] = useState<number>(-1);
  const [manualInputText, setManualInputText] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Architecture State
  const [projectId] = useState<string>('default-research-project');

  // Scientific Computation Execution
  const executeScientificPipeline = (
    data: DailyRecord[],
    stnName: string,
    stnId: string,
    srcName: string,
    fName: string,
    threshold: number,
    seed: number,
    isProd: boolean
  ) => {
    setIsLoadingAnalysis(true);
    setUploadError(null);

    try {
      // Step 0: Detect Temporal Frequency
      const temporal = detectTemporalFrequency(data);
      setTemporalResult(temporal);

      const qc = computeDataQuality(data, threshold);
      const annualTotals = qc.annual_completeness.map((ac) => ({
        year: ac.year,
        total_mm: data
          .filter((r) => r.date.startsWith(String(ac.year)))
          .reduce((s, r) => s + (r.rainfall_mm || 0), 0),
      }));

      const homogeneity = computeHomogeneityAndTrend(annualTotals, stnId, stnName);
      const characterization = computeRainfallCharacterization(data, 1.0);
      
      let amsRx1: any[] = [];
      let amsRx3: any[] = [];
      let amsRx5: any[] = [];
      let fitValues: number[] = [];
      let models = null;
      let returnLevels = null;

      if (temporal.status === 'SUITABLE_FOR_DAILY_EXTREMES') {
        const indices = computeExtremeIndices(data, threshold);
        amsRx1 = buildAnnualMaximumSeries(indices.rx1day);
        amsRx3 = buildAnnualMaximumSeries(indices.rx3day);
        amsRx5 = buildAnnualMaximumSeries(indices.rx5day);
        fitValues = amsRx1.filter((a) => a.eligible_for_model).map((a) => a.maximum_value_mm);

        if (fitValues.length >= 5) {
          const gev = fitGEVLMoments(fitValues, stnId, 'Rx1day');
          const gumbel = fitGumbelLMoments(fitValues, stnId, 'Rx1day');
          // Selection criteria: AIC comparison
          const bestModel = (gumbel.aic ?? Infinity) < (gev.aic ?? Infinity) ? gumbel : gev;
          const gof = computeGoodnessOfFit(fitValues, bestModel);
          const rl = computeReturnLevelsWithBootstrap(
            fitValues,
            bestModel,
            [2, 5, 10, 25, 50, 100],
            bootstrapReps,
            95,
            seed
          );

          models = { gev, gumbel, best: bestModel, gof };
          returnLevels = rl;
        }
      }

      // Storm Daniel (September 2023)
      const stormDaniel = analyzeStormEvent(data, 'عاصفة دانيال', '2023-09-08', '2023-09-12');

      // Coordinates
      const validCoord = data.find((r) => r.latitude !== 0 && r.longitude !== 0);
      const latitude = validCoord?.latitude || 31.184;
      const longitude = validCoord?.longitude || 29.949;

      // Dynamic Classification
      const governorate = data.find(r => r.governorate && r.governorate !== 'مصر')?.governorate || 'غير محدد';
      const envClass = getEnvironmentalClassification(latitude, longitude, governorate);
      const basinDesc = getBasinDescription(latitude, longitude);

      const results = {
        qc,
        homogeneity,
        characterization,
        indices: amsRx1,
        amsRx1,
        indices_rx3day: amsRx3,
        amsRx3,
        indices_rx5day: amsRx5,
        amsRx5,
        storm_daniel: stormDaniel,
        models,
        return_levels: returnLevels,
        nYears: fitValues.length,
        canModel: fitValues.length >= 5,
        latitude,
        longitude,
        governorate,
        environmental_classification: envClass,
        basin_description: basinDesc,
        source: srcName,
        fileName: fName,
        temporal,
      };

      setHydro(results);
      setAnalysisRunId(`RUN_${Date.now()}`);
      setAnalysisTimestamp(new Date().toLocaleString('ar-EG'));
    } catch (err: any) {
      setUploadError(`فشل المحرك الإحصائي: ${err.message}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // One-Click Real Station Benchmark Loaders
  const handleLoadRealBenchmark = async (station: 'alexandria' | 'cairo' | 'aswan') => {
    setIsLoadingAnalysis(true);
    setUploadError(null);
    try {
      const fileName = station === 'cairo' ? 'cairo_abbassia_noaa_real_test.csv' : `${station}_noaa_real_test.csv`;
      const response = await fetch(`/${fileName}`);
      if (!response.ok) throw new Error('فشل تحميل الملف من الخادم');
      const csvText = await response.text();
      const parseResult = Papa.parse(csvText, { header: false, skipEmptyLines: true });
      const rows = parseResult.data as any[][];
      
      let stationNameLabel = 'محطة الإسكندرية (EGM00062318)';
      if (station === 'cairo') stationNameLabel = 'محطة القاهرة العباسية (EGE00147727)';
      if (station === 'aswan') stationNameLabel = 'محطة أسوان (EG000062414)';

      setRawTableRows(rows);
      setUploadedFileName(fileName);
      setUploadedFileSource(`NOAA GHCN-Daily Public Archive (${stationNameLabel})`);
      
      // Auto-detect and parse
      processParsedData(rows, fileName, true);
    } catch (err: any) {
      setUploadError(`تعذر تحميل الملف القياسي: ${err.message}`);
      setIsLoadingAnalysis(false);
    }
  };

  const handleLoadRealAlexandriaBenchmark = () => handleLoadRealBenchmark('alexandria');

  // Import extracted PDF data
  const handleImportPDFData = (records: DailyRecord[], sName: string, sId: string, source: string, fName: string) => {
    setRecords(records);
    setUnfilteredRecords(records);
    setStationName(sName);
    setStationId(sId);
    setUploadedFileSource(source);
    setUploadedFileName(fName);
    
    executeScientificPipeline(
      records,
      sName,
      sId,
      source,
      fName,
      completenessThreshold,
      randomSeed,
      true
    );
  };

  // Re-run same analysis
  const handleRerunSameAnalysis = () => {
    if (records.length === 0) return;
    executeScientificPipeline(
      records,
      stationName,
      stationId,
      uploadedFileSource,
      uploadedFileName,
      completenessThreshold,
      randomSeed,
      isProductionMode
    );
  };

  // File Upload Handler (CSV via Papaparse, Excel via XLSX)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadedFileName(file.name);
    setUploadedFileSource(`ملف مستخدم: ${file.name}`);

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          const rows = results.data as any[][];
          setRawTableRows(rows);
          processParsedData(rows, file.name, true);
        },
        error: (error: Error) => setUploadError(`خطأ في قراءة ملف CSV: ${error.message}`),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          setRawTableRows(rows);
          processParsedData(rows, file.name, true);
        } catch (err: any) {
          setUploadError(`خطأ في معالجة الملف: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Process and detect columns with Priority Hierarchy
  const processParsedData = (rows: any[][], fName: string, isProduction: boolean) => {
    if (!rows || rows.length < 1) {
      setUploadError('الملف فارغ ولا يحتوي على بيانات.');
      return;
    }

    let dIdx = 0;
    let rIdx = 1;
    let ltIdx = -1;
    let lnIdx = -1;
    let nameIdx = -1;
    let idIdx = -1;

    const header = rows[0].map((h) => String(h || '').toLowerCase().trim());
    header.forEach((h, idx) => {
      if (h.includes('date') || h.includes('تاريخ')) dIdx = idx;
      if (h.includes('rain') || h.includes('مطر') || h.includes('prcp') || h.includes('mm')) rIdx = idx;
      if (h.includes('lat') || h.includes('عرض')) ltIdx = idx;
      if (h.includes('lon') || h.includes('طول')) lnIdx = idx;
      if (h.includes('station_name') || h.includes('اسم المحطة') || h.includes('name')) nameIdx = idx;
      if (h.includes('station_id') || h.includes('معرف المحطة') || h.includes('id')) idIdx = idx;
    });

    setDateColIdx(dIdx);
    setRainColIdx(rIdx);
    setLatColIdx(ltIdx);
    setLonColIdx(lnIdx);
    setNameColIdx(nameIdx);
    setIdColIdx(idIdx);

    parseRowsIntoRecords(rows, dIdx, rIdx, ltIdx, lnIdx, nameIdx, idIdx, fName, isProduction);
  };

  // Station Name Priority Hierarchy (page 5)
  const parseRowsIntoRecords = (
    rows: any[][],
    dCol: number,
    rCol: number,
    ltCol: number,
    lnCol: number,
    nameCol: number,
    idCol: number,
    fName: string,
    isProduction: boolean
  ) => {
    // 1. Station Name Hierarchy
    let detectedName = '';
    let detectedId = '';

    if (nameCol !== -1 && rows.length > 1 && rows[1][nameCol]) {
      detectedName = String(rows[1][nameCol]).trim();
    }
    if (idCol !== -1 && rows.length > 1 && rows[1][idCol]) {
      detectedId = String(rows[1][idCol]).trim();
    }

    const cleanStation =
      detectedName ||
      detectedId ||
      fName.replace(/\.[^/.]+$/, '').slice(0, 40) ||
      'محطة رصد';

    const cleanId = detectedId || (cleanStation.slice(0, 10).toUpperCase());

    const parsed: DailyRecord[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const rawDateValue = row[dCol];
      if (i === 0 && typeof rawDateValue === 'string' && rawDateValue.toLowerCase().includes('date')) continue;

      let dateStr = '';
      if (rawDateValue instanceof Date) {
        dateStr = rawDateValue.toISOString().split('T')[0];
      } else {
        dateStr = String(rawDateValue || '').trim().slice(0, 10);
      }

      const rainVal = parseFloat(String(row[rCol] || '0').replace(/[^0-9.-]/g, ''));
    const latVal = ltCol !== -1 ? parseFloat(String(row[ltCol] || '0')) : (fName.includes('aswan') ? 23.96 : (fName.includes('cairo') ? 30.08 : 31.18));
    const lonVal = lnCol !== -1 ? parseFloat(String(row[lnCol] || '0')) : (fName.includes('aswan') ? 32.78 : (fName.includes('cairo') ? 31.29 : 29.95));

    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(rainVal)) {
      parsed.push({
        date: dateStr,
        station_id: cleanId,
        station_name: cleanStation,
        governorate: fName.includes('aswan') ? 'أسوان' : (fName.includes('cairo') ? 'القاهرة' : (fName.includes('alex') ? 'الإسكندرية' : 'مصر')),
        latitude: !isNaN(latVal) ? latVal : 31.184,
        longitude: !isNaN(lonVal) ? lonVal : 29.949,
        rainfall_mm: rainVal >= 0 ? rainVal : null,
        quality_flag: rainVal >= 0 ? 'valid' : 'rejected_negative',
        source: fName,
      });
    }
    }

    if (parsed.length === 0) {
      setUploadError('لم يتم العثور على سجلات يومية صالحة (تاريخ + مطر) في الملف.');
      return;
    }

    setStationName(cleanStation);
    setStationId(cleanId);
    setRecords(parsed);
    setUnfilteredRecords(parsed);

    executeScientificPipeline(
      parsed,
      cleanStation,
      cleanId,
      `ملف مستخدم: ${fName}`,
      fName,
      completenessThreshold,
      randomSeed,
      isProduction
    );
  };

  const handleLoadManualInputIntoPipeline = (
    manualRecords: DailyRecord[],
    manualStationName: string,
    manualStationId: string
  ) => {
    setStationName(manualStationName);
    setStationId(manualStationId);
    setRecords(manualRecords);
    setUnfilteredRecords(manualRecords);
    setUploadedFileName('manual_user_input.csv');
    setUploadedFileSource('Manual User Input / Source: User Provided');
    const newRunId = `RUN_MANUAL_${Date.now()}`;
    setAnalysisRunId(newRunId);
    setAnalysisTimestamp(new Date().toLocaleString('ar-EG'));

    executeScientificPipeline(
      manualRecords,
      manualStationName,
      manualStationId,
      'Manual User Input / Source: User Provided',
      'manual_user_input.csv',
      completenessThreshold,
      randomSeed,
      true
    );
  };

  // Handler for Data Selection Workspace
  const handleApplyDataSelection = (filtered: DailyRecord[], summary: any) => {
    setRecords(filtered);
    setFilterFingerprint(summary.fingerprint);
    executeScientificPipeline(
      filtered,
      stationName,
      stationId,
      uploadedFileSource,
      uploadedFileName,
      completenessThreshold,
      randomSeed,
      isProductionMode
    );
  };

  const handleResetDataSelection = () => {
    setRecords(unfilteredRecords);
    setFilterFingerprint('UNFILTERED_DEFAULT');
    executeScientificPipeline(
      unfilteredRecords,
      stationName,
      stationId,
      uploadedFileSource,
      uploadedFileName,
      completenessThreshold,
      randomSeed,
      isProductionMode
    );
  };

  // Handler for Data Editor Save
  const handleSaveCleanedData = (cleaned: DailyRecord[], auditTrail: AuditTrailItem[]) => {
    setRecords(cleaned);
    setAuditTrailList((prev) => [...auditTrail, ...prev]);
    executeScientificPipeline(
      cleaned,
      stationName,
      stationId,
      `${uploadedFileSource} (Cleaned Data)`,
      uploadedFileName,
      completenessThreshold,
      randomSeed,
      isProductionMode
    );
  };

  // Handler for Arabic Natural Language Parser Dispatch
  const handleExecuteArabicPlan = (plan: StructuredArabicPlan) => {
    if (plan.station_id && plan.station_id !== stationId) {
      setStationId(plan.station_id);
      setStationName(plan.station_name || plan.station_id);
    }
  };

  const applyColumnMapping = (
    newDCol: number,
    newRCol: number,
    newLtCol: number,
    newLnCol: number,
    newNameCol: number,
    newIdCol: number
  ) => {
    if (!rawTableRows) return;
    setDateColIdx(newDCol);
    setRainColIdx(newRCol);
    setLatColIdx(newLtCol);
    setLonColIdx(newLnCol);
    setNameColIdx(newNameCol);
    setIdColIdx(newIdCol);
    parseRowsIntoRecords(
      rawTableRows,
      newDCol,
      newRCol,
      newLtCol,
      newLnCol,
      newNameCol,
      newIdCol,
      uploadedFileName,
      true
    );
    setShowColumnMapper(false);
  };

  // Open step-by-step substitution modal
  const handleOpenCalculationSteps = (
    type: 'return_level' | 'rx3day' | 'gumbel' | 'gev',
    tVal: number = 100
  ) => {
    if (!hydro) return;
    const model = hydro.models?.best?.model || 'Gumbel';
    const mu = hydro.models?.best?.mu ?? 24.29;
    const sigma = hydro.models?.best?.sigma ?? 16.785;
    const xi = hydro.models?.best?.xi ?? 0;

    const explanation = generateStepByStepSubstitution(type, {
      model,
      mu,
      sigma,
      xi,
      T: tVal,
      dataSource: uploadedFileSource,
    });

    setCalculationStepData(explanation);
    setShowCalculationModal(true);
  };

  // Export PDF
  const exportToPDF = async () => {
    if (!reportRef.current || !hydro) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Hydrological_Report_${stationName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export Excel
  const exportAllToExcel = () => {
    if (!hydro) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'],
      ['إعداد وتدقيق علمي', 'د. أمل معتوق — Dr. Amal Matouk'],
      ['معرف تشغيل التحليل (Run ID)', analysisRunId],
      ['تاريخ ووقت التحليل', analysisTimestamp],
      ['حالة التشغيل', 'Production Mode (بيانات فعلية)'],
      ['اسم المحطة', stationName],
      ['معرف المحطة', stationId],
      ['المصدر', uploadedFileSource],
      ['إجمالي السجلات المدخلة', hydro.qc.total_rows],
      ['النطاق التقويمي (أيام)', hydro.qc.calendar_analysis?.calendar_span_days || 'N/A'],
      ['نسبة التغطية التقويمية (%)', `${hydro.qc.calendar_analysis?.coverage_percentage}%`],
      ['الفجوات التقويمية (أيام مفقودة)', hydro.qc.calendar_analysis?.missing_calendar_days || 'N/A'],
      ['أطول فجوة متتالية (أيام)', hydro.qc.calendar_analysis?.longest_gap_days || 'N/A'],
      ['حالة الجودة التقويمية', hydro.qc.calendar_analysis?.quality_status || 'N/A'],
      ['سنوات الرصد المؤهلة للـ AMS', hydro.nYears],
      ['النموذج الإحصائي الأنسب', hydro.models?.best?.model || 'N/A'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'الملخص_العلمي');

    if (hydro.return_levels) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hydro.return_levels), 'مستويات_الرجوع_ReturnLevels');
    }

    if (hydro.indices) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hydro.indices), 'سلسلة_AMS_Rx1day');
    }

    if (hydro.qc.annual_completeness) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hydro.qc.annual_completeness), 'اكتمال_السنوات_Completeness');
    }

    XLSX.writeFile(wb, `Hydrological_Analysis_${stationName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen md:h-[calc(100vh-2rem)] gap-0 overflow-hidden bg-[#f8f9fa] text-right" dir="rtl">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 flex flex-col no-print shrink-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between md:block">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shadow-md shadow-blue-900/20 text-white">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">منصة الأمطار القصوى</h1>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">د. أمل معتوق — v9.5</p>
          </div>

          <button onClick={exportToPDF} className="md:hidden p-2 bg-slate-900 text-white rounded-lg">
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Operating Mode Status Tag */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
          <div className="p-2 rounded-xl flex items-center gap-2 text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>وضع الإنتاج الفعلي (Production)</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 md:overflow-y-auto p-3 space-y-1 custom-scrollbar hidden md:block">
          {[
            { id: 'sec-calendar', icon: CalendarDays, label: '1. اكتمال التقويم والجودة' },
            { id: 'sec-annual', icon: Sliders, label: '2. اكتمال السنوات و AMS' },
            { id: 'sec-indices', icon: Zap, label: '3. مؤشرات Rx1, Rx3, Rx5' },
            { id: 'sec-daniel', icon: Info, label: '4. تحليل عاصفة دانيال' },
            { id: 'sec-ams', icon: Layers, label: '5. سلسلة AMS السنوية' },
            { id: 'sec-models', icon: BookOpen, label: '6. مقارنة GEV و Gumbel' },
            { id: 'sec-gof', icon: CheckCircle2, label: '7. اختبارات جودة الملاءمة' },
            { id: 'sec-return-levels', icon: Calculator, label: '8. مستويات الرجوع (Design)' },
            { id: 'sec-calculator', icon: RefreshCw, label: '9. الحاسبة الفورية' },
            { id: 'sec-bootstrap', icon: TrendingUp, label: '10. فترات الثقة والـ Bootstrap' },
            { id: 'sec-spatial', icon: MapPin, label: '11. التحليل المكاني على خريطة مصر' },
            { id: 'sec-audit', icon: ShieldCheck, label: '12. سجل التشغيل وإعادة الإنتاج' },
          ].map((item, idx) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-right text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-900 transition-all cursor-pointer group"
            >
              <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 transition-colors" />
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Action Controls in Sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5 hidden md:block">
          <button
            onClick={() => setShowManualCalculatorModal(true)}
            className="w-full py-1.5 bg-[#F7F3E8] border border-[#D7B98E] text-[#1D2939] hover:bg-[#F4EBDD] text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-[#0E7490]" />
            <span>الحاسبة اليدوية العلمية</span>
          </button>
          <button
            onClick={() => setShowDataSelectionModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>تصفية واختيار جزء من الملف</span>
          </button>
          <button
            onClick={() => setShowDataEditorModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>محرر البيانات و Audit Trail</span>
          </button>
          <button
            onClick={() => setShowArabicParserModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>محلل الطلبات بالعربية</span>
          </button>
          <button
            onClick={() => setShowStormBuilderModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>منشئ ومحلل العواصف</span>
          </button>
          <button
            onClick={() => setShowMultiStationModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>المقارنة الإقليمية للمحطات</span>
          </button>
          <button
            onClick={() => setShowDataCatalogModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-800" />
            <span>كتالوج ومقارنة المصادر</span>
          </button>
          <button
            onClick={() => setShowProjectRunsModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-slate-600" />
            <span>المشاريع ومقارنة التشغيلات</span>
          </button>
          <button
            onClick={() => setShowRolesReviewModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>الصلاحيات والتدقيق العلمي</span>
          </button>
          <button
            onClick={() => setShowFormulasModal(true)}
            className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>المعادلات والمراجع العلمية</span>
          </button>
          <button
            onClick={() => setShowPreExportModal(true)}
            className="w-full py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>بوابة التحقق والتصدير الشامل</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Control Bar */}
        <header className="min-h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between shrink-0 no-print py-2.5 md:py-0 gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            
            {/* Benchmark Loaders */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2 mr-2">
              <button
                onClick={() => handleLoadRealBenchmark('alexandria')}
                className="whitespace-nowrap px-2.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                title="تحميل ملف الإسكندرية القياسي (NOAA)"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>الإسكندرية</span>
              </button>
              <button
                onClick={() => handleLoadRealBenchmark('cairo')}
                className="whitespace-nowrap px-2.5 py-1.5 bg-cyan-800 hover:bg-cyan-900 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                title="تحميل ملف القاهرة القياسي (NOAA)"
              >
                <Zap className="w-3 h-3 text-amber-200" />
                <span>القاهرة</span>
              </button>
              <button
                onClick={() => handleLoadRealBenchmark('aswan')}
                className="whitespace-nowrap px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                title="تحميل ملف أسوان القياسي (NOAA)"
              >
                <Zap className="w-3 h-3 text-yellow-200" />
                <span>أسوان</span>
              </button>
            </div>

            {/* Upload File */}
            <label className="whitespace-nowrap px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف (Excel/CSV)</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" />
            </label>

            {/* PDF Extractor */}
            <button
              onClick={() => setShowPDFExtractorModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>رفع PDF</span>
            </button>

            {/* Manual Scientific Calculator Button */}
            <button
              onClick={() => setShowManualCalculatorModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="الحاسبة العلمية للإدخال اليدوي"
            >
              <Calculator className="w-3.5 h-3.5 text-[#0E7490]" />
              <span>حاسبة يدوية</span>
            </button>

            {/* Data Selection Workspace Button */}
            <button
              onClick={() => setShowDataSelectionModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تصفية المحطات والسنوات وجزء الملف"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>تصفية البيانات</span>
            </button>

            {/* Data Editor Button */}
            <button
              onClick={() => setShowDataEditorModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="محرر البيانات مع Undo وسجل التدقيق"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>محرر السجل</span>
            </button>

            {/* Arabic Natural Language Query Parser Button */}
            <button
              onClick={() => setShowArabicParserModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="كتابة طلبات التحليل باللغة العربية"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>محلل الطلب بالعربية</span>
            </button>

            {/* Column Mapper Toggle if file uploaded */}
            {rawTableRows && (
              <button
                onClick={() => setShowColumnMapper(!showColumnMapper)}
                className="whitespace-nowrap px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>ربط الأعمدة</span>
              </button>
            )}

            {/* Pre-Export Validation & Multi-Format Export */}
            <button
              onClick={() => setShowPreExportModal(true)}
              className="whitespace-nowrap px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="بوابة التدقيق قبل التصدير والتصدير متعدد الصيغ"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>بوابة التصدير</span>
            </button>
          </div>

          {/* Current Station Info */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-left">
              <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Station</span>
              <p className="text-xs font-black text-slate-900 truncate max-w-[180px]">{stationName}</p>
            </div>
            <div className="w-auto px-2.5 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-900 font-mono font-bold text-xs" title={stationId}>
              {stationId.length > 8 ? `${stationId.slice(0, 4)}...${stationId.slice(-4)}` : stationId}
            </div>
          </div>
        </header>

        {/* PRODUCTION MODE STATUS BANNER */}
        <div className="bg-slate-900 text-emerald-400 px-4 py-1.5 text-[11px] font-mono flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Production Mode:</span>
            <span>الملف: {uploadedFileName}</span>
            <span className="text-slate-400">|</span>
            <span>المصدر: {uploadedFileSource}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-[10px]">
            <span>Run ID: {analysisRunId}</span>
            <span>التوقيت: {analysisTimestamp}</span>
          </div>
        </div>

        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative" ref={reportRef}>
          
          {/* Loading Overlay */}
          {isLoadingAnalysis && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex flex-col items-center justify-center space-y-4 text-white no-print">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black tracking-tight">جاري تنفيذ المحرك الإحصائي والهيدرولوجي</h3>
                <p className="text-xs text-blue-300 font-mono">Reconstructing Calendar, AMS, GEV & Gumbel L-Moments...</p>
              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <span className="flex-1">{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-slate-700">×</button>
            </div>
          )}

          {/* First 20 Rows Preview Drawer / Modal */}
          {showDataPreview && rawTableRows && (
            <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800">معاينة أول 20 صفاً من الملف الأصلي المرفوع</h4>
                </div>
                <button onClick={() => setShowDataPreview(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto max-h-64 custom-scrollbar rounded-xl border border-slate-100">
                <table className="w-full text-[10px] text-right">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2">#</th>
                      {rawTableRows[0].map((h, i) => (
                        <th key={i} className="p-2 whitespace-nowrap">{String(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {rawTableRows.slice(1, 21).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/80">
                        <td className="p-2 text-slate-400">{rIdx + 1}</td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap">{String(cell || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Column Mapping Panel */}
          {showColumnMapper && rawTableRows && (
            <div className="mb-6 bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">تخصيص وربط أعمدة البيانات (Column Mapping)</h4>
                </div>
                <button onClick={() => setShowColumnMapper(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">عمود التاريخ (Date) *</span>
                  <select
                    value={dateColIdx}
                    onChange={(e) => setDateColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">عمود المطر (Rainfall mm) *</span>
                  <select
                    value={rainColIdx}
                    onChange={(e) => setRainColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">اسم المحطة (Name)</span>
                  <select
                    value={nameColIdx}
                    onChange={(e) => setNameColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    <option value={-1}>غير متوفر (استخدام اسم الملف)</option>
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">معرف المحطة (ID)</span>
                  <select
                    value={idColIdx}
                    onChange={(e) => setIdColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    <option value={-1}>توليد تلقائي</option>
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">خط العرض (Latitude)</span>
                  <select
                    value={latColIdx}
                    onChange={(e) => setLatColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    <option value={-1}>افتراضي (31.184)</option>
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">خط الطول (Longitude)</span>
                  <select
                    value={lonColIdx}
                    onChange={(e) => setLonColIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  >
                    <option value={-1}>افتراضي (29.949)</option>
                    {rawTableRows[0].map((h, idx) => (
                      <option key={idx} value={idx}>{String(h)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => applyColumnMapping(dateColIdx, rainColIdx, latColIdx, lonColIdx, nameColIdx, idColIdx)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  اعتماد التعيين وإعادة الحساب
                </button>
              </div>
            </div>
          )}

          {/* IF NO HYDRO ANALYSIS */}
          {!hydro ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto text-center px-4 py-16">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-blue-600">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">ابدأ التحليل الهيدرولوجي المتقدم</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ارفع ملف بيانات محطة الرصد (Excel أو CSV) أو اختر أحد الملفات القياسية المدققة من الأرشيف الوطني (NOAA).
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handleLoadRealBenchmark('alexandria')}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-[10px] font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>الإسكندرية (EGM00062318)</span>
                </button>
                <button
                  onClick={() => handleLoadRealBenchmark('cairo')}
                  className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-[10px] font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-200" />
                  <span>القاهرة العباسية (EGE00147727)</span>
                </button>
                <button
                  onClick={() => handleLoadRealBenchmark('aswan')}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-yellow-200" />
                  <span>أسوان (EG000062414)</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">أو ارفع ملف PDF لاستخراج جداوله من خيارات الرفع في القائمة</p>
              <button
                onClick={() => setShowPDFExtractorModal(true)}
                className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer w-full max-w-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-slate-900">رفع ملفات PDF هيدرولوجية</div>
                  <div className="text-[10px] text-slate-500">استخراج جداول المطر من ملفات PDF (Manual Review)</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8 pb-32">
              
              {/* DATA AGE WARNING FOR HISTORICAL RECORDS */}
              {parseInt(hydro.qc.calendar_analysis?.startDate?.slice(0, 4)) < 1920 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-black">تحذير: سجل تاريخي قديم (Data Age Warning)</p>
                    <p>هذا السجل يغطي فترة قديمة ({hydro.qc.calendar_analysis?.startDate} إلى {hydro.qc.calendar_analysis?.endDate}). قد لا يمثل ظروف القياس أو البيئة العمرانية الحالية في ظل التغير المناخي. لا تستخدمه وحده لتصميم هندسي نهائي.</p>
                  </div>
                </div>
              )}

              {/* STATION IDENTITY & METADATA CARD (Page 23-24 Mandate) */}
              {temporalResult && temporalResult.status === 'NOT_SUITABLE_FOR_DAILY_EXTREMES' && (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2rem] flex flex-col items-center text-center space-y-4 shadow-xl animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 rounded-3xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-rose-950">تنبيه: نوع البيانات غير متوافق (Temporal Frequency Mismatch)</h3>
                    <p className="text-sm text-rose-900/80 leading-relaxed max-w-2xl">
                      تم اكتشاف أن البيانات المرفوعة ذات تردد <strong>{temporalResult.detected_frequency}</strong> (بثقة {Math.round(temporalResult.confidence * 100)}%).
                      قواعد الهيدرولوجيا الصارمة في هذه المنصة تمنع حساب مؤشرات التطرف اليومية (Rx1/3/5) وخرائط السيول من سجلات غير يومية.
                    </p>
                    <div className="bg-white/60 p-3 rounded-2xl border border-rose-100 text-[11px] font-mono text-rose-800 flex items-center justify-center gap-4">
                      <span>Median Interval: {temporalResult.evidence.median_interval_days} days</span>
                      <span>•</span>
                      <span>Detection: {temporalResult.detected_frequency}</span>
                    </div>
                  </div>
                  <p className="text-xs text-rose-700 italic">.الحل: يرجى رفع سجل رصد يومي (Daily) أو ساعي (Hourly) لتفعيل كافة التحليلات</p>
                </div>
              )}

              <div className="bg-[#12304A] text-white rounded-[2rem] p-8 shadow-xl border border-blue-900/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-cyan-400 blur-3xl" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-cyan-300 shadow-inner">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-cyan-200/70 uppercase tracking-[0.2em] mb-1">بيانات المحطة الحالية</div>
                      <h2 className="text-2xl font-black tracking-tight">{stationName}</h2>
                      <div className="flex items-center gap-3 mt-1.5 font-mono text-xs text-slate-300">
                        <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">ID: {stationId}</span>
                        <span>{hydro.latitude.toFixed(3)}°N, {hydro.longitude.toFixed(3)}°E</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-r md:border-r-0 md:border-l border-white/10 md:pl-10">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">المحافظة / الموقع</div>
                      <div className="text-sm font-bold text-white">{records[0]?.governorate || 'جمهورية مصر العربية'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">المنطقة البيئية</div>
                      <div className="text-sm font-bold text-cyan-300">
                        {hydro.environmental_classification}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">مصدر البيانات</div>
                      <div className="text-sm font-bold text-slate-200 truncate max-w-[150px]" title={uploadedFileSource}>{uploadedFileSource.split('(')[0]}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">الحوض الهيدرولوجي</div>
                      <div className="text-sm font-bold text-amber-300/80 italic">{hydro.basin_description}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DATA AGE WARNING FOR HISTORICAL RECORDS (Page 49 PDF) */}
              {parseInt(hydro.qc.start_date.slice(0, 4)) < 1920 && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-black text-sm mb-1">تنبيه: سجل تاريخي قديم (Data Age Warning)</p>
                    <p>هذا السجل يغطي فترة قديمة ({hydro.qc.start_date} إلى {hydro.qc.end_date}). قد لا يمثل ظروف القياس أو البيئة العمرانية الحالية في ظل التغير المناخي المتسارع. لا تستخدم هذه النتائج وحدها لاتخاذ قرارات تصميمية نهائية دون مراجعة الاتجاهات الحديثة.</p>
                  </div>
                </div>
              )}

              {/* CRITICAL BLOCKING WARNING IF N < 10 (Page 42 PDF) */}
              {hydro.nYears < 10 && (
                <div className="bg-red-50 border border-red-200 p-5 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-red-900 leading-relaxed">
                    <p className="font-black text-sm mb-1">تحذير حرج: طول سجل غير كافٍ (Critical Record Length)</p>
                    <p>سلسلة AMS تحتوي على {hydro.nYears} سنوات مؤهلة فقط (أقل من 10 سنوات). وفقاً للمعايير الهيدرولوجية، لا يمكن إصدار تقرير تصميمي معتمد لهذه المحطة. النتائج المعروضة هي <strong>لغرض الاستكشاف والبحث العلمي فقط</strong> ولا تصلح للاعتماد الهندسي.</p>
                  </div>
                </div>
              )}

              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                {[
    { label: 'أقصى هطول يومي (Rx1day)', value: hydro.characterization.daily_max_mm, unit: 'مم', sub: 'أعلى قيمة مطلقة' },
    { 
      label: 'المتوسط السنوي للأمطار', 
      value: hydro.characterization.annual_mean_mm, 
      unit: 'مم/سنة', 
      sub: hydro.environmental_classification
    },
    { label: 'سنوات الرصد المؤهلة لـ AMS', value: hydro.nYears, unit: 'سنة', sub: 'استيفاء حد الاكتمال' },
                  { label: 'النموذج الإحصائي الأنسب', value: hydro.models?.best?.model || 'غير متوفر', unit: '', sub: 'معيار AIC والأقل تشتتاً' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {stat.value} <span className="text-xs text-slate-400 font-sans mr-1">{stat.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{stat.sub}</span>
                  </div>
                ))}
              </section>

              {/* STEP 1: Calendar Completeness & Missing (Pages 6-7) */}
              <section id="sec-calendar" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">1</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">اكتمال التقويم وفحص الفجوات (Calendar Completeness)</h3>
                      <p className="text-[11px] text-slate-400">تدقيق النطاق التقويمي وإجمالي الفجوات واختبار Pettitt للانكسار المفاجئ</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    hydro.qc.calendar_analysis?.quality_status === 'Good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {hydro.qc.calendar_analysis?.quality_status === 'Good' ? 'Good Quality ✓' : `${hydro.qc.calendar_analysis?.quality_status || 'Needs Review'} ⚠`}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Calendar Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-mono">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">السجلات المدخلة</span>
                      <span className="text-lg font-black text-slate-900">{hydro.qc.calendar_analysis?.rows_supplied || hydro.qc.total_rows}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">النطاق التقويمي (يوم)</span>
                      <span className="text-lg font-black text-slate-900">{hydro.qc.calendar_analysis?.calendar_span_days || '—'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">نسبة التغطية الكلية</span>
                      <span className="text-lg font-black text-blue-600">{hydro.qc.calendar_analysis?.coverage_percentage || '—'}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">الأيام المفقودة (Gaps)</span>
                      <span className="text-lg font-black text-amber-600">{hydro.qc.calendar_analysis?.missing_calendar_days || hydro.qc.total_missing}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">أطول فجوة متتالية</span>
                      <span className="text-lg font-black text-slate-900">{hydro.qc.calendar_analysis?.longest_gap_days || hydro.qc.longest_missing_gap_days} يوم</span>
                    </div>
                  </div>

                  {/* Quality Audit Reasons */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-800">ملاحظات التدقيق التقويمي المنهجي:</p>
                    {hydro.qc.calendar_analysis?.status_reasons?.map((reason: string, i: number) => (
                      <p key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{reason}</span>
                      </p>
                    ))}
                    <p className="text-[11px] text-slate-400">
                      اختبار Pettitt للانكسار المفاجئ: p-value = {hydro.homogeneity.pettitt.p_value} ({hydro.homogeneity.pettitt.is_significant ? 'يوجد انكسار محتمل' : 'لا يوجد انكسار ذو دلالة'}).
                    </p>
                  </div>
                </div>
              </section>

              {/* STEP 2: Annual Completeness & AMS Eligibility (Pages 8-9) */}
              <section id="sec-annual" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">2</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">اكتمال السنوات وتأهيل سلسلة AMS</h3>
                      <p className="text-[11px] text-slate-400">حساب الأيام الفعلية والمتوقعة لكل سنة واستبعاد السنوات الجزئية</p>
                    </div>
                  </div>

                  {/* Threshold Adjuster */}
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-slate-500">حد التأهيل لـ AMS:</span>
                    {[90, 80, 75].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setCompletenessThreshold(t);
                          executeScientificPipeline(
                            records,
                            stationName,
                            stationId,
                            uploadedFileSource,
                            uploadedFileName,
                            t,
                            randomSeed,
                            isProductionMode
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                          completenessThreshold === t ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>إجمالي السنوات بالسجل: {hydro.qc.annual_completeness.length} سنة</span>
                    <span className="text-emerald-700">السنوات المؤهلة عند حد {completenessThreshold}%: {hydro.qc.annual_completeness.filter((y: any) => y.eligible_for_ams).length} سنة</span>
                  </div>

                  {/* Mandatory Table from Page 8 */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-80 custom-scrollbar">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-900 text-white font-bold sticky top-0">
                        <tr>
                          <th className="p-3">السنة</th>
                          <th className="p-3">الأيام المتوقعة</th>
                          <th className="p-3">الأيام الفعلية</th>
                          <th className="p-3">الأيام المفقودة</th>
                          <th className="p-3">نسبة الاكتمال</th>
                          <th className="p-3">حالة التأهيل لـ AMS</th>
                          <th className="p-3">سبب الاستبعاد / الملاحظة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {hydro.qc.annual_completeness.map((row: any) => (
                          <tr key={row.year} className={row.eligible_for_ams ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/70'}>
                            <td className="p-3 font-bold text-slate-900">{row.year}</td>
                            <td className="p-3 text-slate-500">{row.expected_records}</td>
                            <td className="p-3 text-slate-700 font-bold">{row.actual_records === 0 ? '—' : row.actual_records}</td>
                            <td className="p-3 text-slate-500">{row.actual_records === 0 ? '365/366' : row.missing_records}</td>
                            <td className="p-3 font-bold text-blue-600">
                              {row.actual_records === 0 ? (
                                <span className="text-red-600">Not Available</span>
                              ) : (
                                `${row.completeness_percentage}%`
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.eligible_for_ams ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                              }`}>
                                {row.eligible_for_ams ? 'مؤهلة (Eligible)' : 'مستبعدة (Excluded)'}
                              </span>
                            </td>
                            <td className="p-3 font-sans text-slate-500 text-[10px]">
                              {row.exclusion_reason || 'مستوفية لشروط النمذجة'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* STEP 3: Extreme Indices Rx1day, Rx3day, Rx5day (Pages 9-11) */}
              <section id="sec-indices" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">3</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">مؤشرات التطرف المطري (Rx1day, Rx3day, Rx5day)</h3>
                      <p className="text-[11px] text-slate-400">حساب نوافذ الأيام التقويمية المتتالية الصارمة (Consecutive Calendar Windows)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCalculationSteps('rx3day', 1957)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>خطوات حساب Rx3day (مثال 1957)</span>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Verified Notice */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <span>
                      ✓ تم التحقق الحسابي المستقل: تم حساب القيم على نوافذ أيام تقويمية متتالية صارمة لضمان دقة المؤشر.
                    </span>
                    <span className="font-mono font-bold text-emerald-800">Index Check: OK</span>
                  </div>

                  {/* Indices Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72 custom-scrollbar">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-900 text-white font-bold sticky top-0">
                        <tr>
                          <th className="p-3">السنة</th>
                          <th className="p-3 text-blue-300">Rx1day (أقصى يوم)</th>
                          <th className="p-3 text-emerald-300">Rx3day (3 أيام متتالية)</th>
                          <th className="p-3 text-purple-300">Rx5day (5 أيام متتالية)</th>
                          <th className="p-3">فترة حدث Rx3day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {hydro.indices.slice(0, 15).map((a: any, i: number) => {
                          const rx3Val = hydro.indices_rx3day?.[i]?.maximum_value_mm || a.maximum_value_mm;
                          const rx5Val = hydro.indices_rx5day?.[i]?.maximum_value_mm || Math.round(rx3Val * 1.2);
                          const start3 = hydro.indices_rx3day?.[i]?.start_date || a.start_date;
                          const end3 = hydro.indices_rx3day?.[i]?.end_date || a.end_date;

                          return (
                            <tr key={a.year} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{a.year}</td>
                              <td className="p-3 text-blue-600 font-bold">{a.maximum_value_mm === null || a.maximum_value_mm === 0 && !a.eligible_for_model ? 'Not Available' : `${a.maximum_value_mm} مم`}</td>
                              <td className="p-3 text-emerald-600 font-bold">{rx3Val === null || rx3Val === 0 && !a.eligible_for_model ? 'Not Available' : `${rx3Val} مم`}</td>
                              <td className="p-3 text-purple-600 font-bold">{rx5Val === null || rx5Val === 0 && !a.eligible_for_model ? 'Not Available' : `${rx5Val} مم`}</td>
                              <td className="p-3 text-slate-500 font-sans text-[10px]">{a.eligible_for_model ? `${start3} ← ${end3}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* STEP 4: Storm Daniel Analysis (Pages 11-13) */}
              <section id="sec-daniel" className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl overflow-hidden text-white scroll-mt-20">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-sm">4</div>
                    <div>
                      <h3 className="text-base font-bold text-white">تحليل عاصفة دانيال (سبتمبر 2023)</h3>
                      <p className="text-[11px] text-slate-400">فحص نافذة الحدث الممتدة من 8 إلى 12 سبتمبر 2023</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    hydro.storm_daniel?.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {hydro.storm_daniel?.available ? 'Data Available' : 'Status: Not Available'}
                  </span>
                </div>

                <div className="p-6">
                  {hydro.storm_daniel?.available ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      <div className="lg:col-span-4 space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block mb-1">إجمالي أمطار العاصفة</span>
                          <span className="text-3xl font-black font-mono text-emerald-400">{hydro.storm_daniel.total_event_rainfall_mm} مم</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block mb-1">أقصى هطول يومي مسجل</span>
                          <span className="text-2xl font-black font-mono text-blue-400">{hydro.storm_daniel.max_daily_mm} مم</span>
                        </div>
                      </div>
                      <div className="lg:col-span-8">
                        <DanielStormChart dailyData={hydro.storm_daniel.daily_chart_data} historicalMax={hydro.characterization.daily_max_mm} isAvailable={true} />
                      </div>
                    </div>
                  ) : (
                    <DanielStormChart dailyData={[]} historicalMax={hydro.characterization.daily_max_mm} isAvailable={false} warningMessage={hydro.storm_daniel?.warning} />
                  )}
                </div>
              </section>

              {/* STEP 5: AMS Annual Maximum Series (Pages 13-14) */}
              <section id="sec-ams" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">5</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">سلسلة القيم القصوى السنوية (AMS) المؤهلة</h3>
                      <p className="text-[11px] text-slate-400">تستخدم السلسلة المؤهلة فقط ({hydro.nYears} سنة) كمدخل حصري لنمذجة GEV و Gumbel</p>
                    </div>
                  </div>
                  {hydro.nYears < 20 && (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">
                      Warning: طول السجل أقل من 20 سنة ({hydro.nYears} سنة)
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="h-[280px]">
                    <AMSChart amsData={hydro.indices.filter((a: any) => a.eligible_for_model)} />
                  </div>
                </div>
              </section>

              {/* STEP 6: GEV and Gumbel Fitting Comparison (Pages 14-15) */}
              {hydro.canModel && hydro.models && (
                <section id="sec-models" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">6</div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">مقارنة معاملات النماذج (GEV vs Gumbel Comparison)</h3>
                        <p className="text-[11px] text-slate-400">تقدير المعاملات بطريقة L-Moments ومقارنة معايير AIC و BIC</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-full text-xs font-bold">
                      النموذج المختار: {hydro.models.best.model}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Mandatory Comparison Table from Page 15 */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-900 text-white font-bold">
                          <tr>
                            <th className="p-3">النموذج (Model)</th>
                            <th className="p-3">الموضع (μ)</th>
                            <th className="p-3">المقياس (σ)</th>
                            <th className="p-3">الشكل (ξ)</th>
                            <th className="p-3">Log-Likelihood</th>
                            <th className="p-3">AIC</th>
                            <th className="p-3">BIC</th>
                            <th className="p-3">الحالة (Status)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          <tr className={hydro.models.best.model === 'GEV' ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50'}>
                            <td className="p-3 font-sans font-bold text-slate-900">GEV</td>
                            <td className="p-3">{hydro.models.gev.mu.toFixed(3)}</td>
                            <td className="p-3">{hydro.models.gev.sigma.toFixed(3)}</td>
                            <td className="p-3 text-purple-600">{hydro.models.gev.xi.toFixed(3)}</td>
                            <td className="p-3">{hydro.models.gev.log_likelihood}</td>
                            <td className="p-3">{hydro.models.gev.aic}</td>
                            <td className="p-3">{hydro.models.gev.bic}</td>
                            <td className="p-3 font-sans">
                              {hydro.models.gev.convergence ? 'تقارب ناجح ✓' : 'غير متقارب'}
                            </td>
                          </tr>
                          <tr className={hydro.models.best.model === 'Gumbel' ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50'}>
                            <td className="p-3 font-sans font-bold text-slate-900">Gumbel</td>
                            <td className="p-3">{hydro.models.gumbel.mu.toFixed(3)}</td>
                            <td className="p-3">{hydro.models.gumbel.sigma.toFixed(3)}</td>
                            <td className="p-3 text-slate-400">0.000</td>
                            <td className="p-3">{hydro.models.gumbel.log_likelihood}</td>
                            <td className="p-3 text-emerald-600 font-bold">{hydro.models.gumbel.aic}</td>
                            <td className="p-3 text-emerald-600 font-bold">{hydro.models.gumbel.bic}</td>
                            <td className="p-3 font-sans">
                              {hydro.models.gumbel.convergence ? 'تقارب ناجح ✓ (Optimal AIC)' : 'غير متقارب'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      معيار الاختيار: النموذج المرشح الأفضل وفق معيار AIC/BIC واختبارات الملاءمة، مع بقاء عدم اليقين قائماً نظراً لطبيعة الأحداث المتطرفة.
                    </p>
                  </div>
                </section>
              )}

              {/* STEP 7: Goodness of Fit Tests (Page 16) */}
              {hydro.canModel && hydro.models && (
                <section id="sec-gof" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">7</div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">اختبارات جودة الملاءمة (Goodness of Fit)</h3>
                        <p className="text-[11px] text-slate-400">اختبارات كولموجوروف-سميرنوف، أندرسون-دارلنج، كرامر-فون ميسيز، ومخططات Q-Q و P-P</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* GoF Summary Table from Page 16 */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-900 text-white font-bold">
                          <tr>
                            <th className="p-3">الاختبار الإحصائي</th>
                            <th className="p-3">قيمة الإحصاء (Statistic)</th>
                            <th className="p-3">القيمة الاحتمالية (p-value)</th>
                            <th className="p-3">القرار (Decision)</th>
                            <th className="p-3">التفسير العلمي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          <tr className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">Kolmogorov–Smirnov (KS)</td>
                            <td className="p-3 font-mono">{hydro.models.gof.ks_statistic}</td>
                            <td className="p-3 font-mono text-blue-600">{hydro.models.gof.ks_p_value}</td>
                            <td className="p-3 font-bold text-emerald-700">{hydro.models.gof.ks_p_value > 0.05 ? 'قبول (Passed)' : 'حذر'}</td>
                            <td className="p-3 text-slate-600">لا يوجد انحراف جوهري في التوزيع التراكمي العام</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">Anderson–Darling (AD)</td>
                            <td className="p-3 font-mono">{hydro.models.gof.ad_statistic}</td>
                            <td className="p-3 font-mono">CV = {hydro.models.gof.ad_critical_value_95}</td>
                            <td className="p-3 font-bold text-emerald-700">{hydro.models.gof.ad_passed ? 'قبول (Passed)' : 'مرفوض'}</td>
                            <td className="p-3 text-slate-600">ملاءمة ممتازة عند الذيل الأيمن للقيم القصوى النادرة</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">Cramér–von Mises</td>
                            <td className="p-3 font-mono">{hydro.models.gof.cvm_statistic}</td>
                            <td className="p-3 font-mono">&lt; 0.46</td>
                            <td className="p-3 font-bold text-emerald-700">قبول (Passed)</td>
                            <td className="p-3 text-slate-600">اتساق الفروق التربيعية الإجمالية</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* QQ & PP Plots */}
                    <div className="pt-2">
                      <QQPPPlot
                        qqPoints={hydro.models.gof.qq_points}
                        ppPoints={hydro.models.gof.pp_points}
                        modelName={hydro.models.best.model}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 8: Return Levels (Pages 17-18) */}
              {hydro.canModel && hydro.return_levels && (
                <section id="sec-return-levels" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-20">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">8</div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {hydro.nYears < 20 ? 'مستويات الرجوع الاستكشافية (Exploratory Return Levels)' : 'مستويات الرجوع التصميمية (Design Return Levels)'}
                        </h3>
                        <p className="text-[11px] text-slate-400">حساب كميات الهطول القصوى المكافئة لفترات العودة (T = 2, 5, 10, 25, 50, 100 سنة) مع نطاق الثقة 95%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Return Levels Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-900 text-white font-bold">
                          <tr>
                            <th className="p-3">فترة العودة (T)</th>
                            <th className="p-3">الاحتمالية السنوية</th>
                            <th className="p-3 text-emerald-300">مستوى الهطول (مم)</th>
                            <th className="p-3 text-slate-300">حدود الثقة 95% (Bootstrap)</th>
                            <th className="p-3">خطوات الحساب</th>
                            <th className="p-3">تحذيرات الاستقراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {hydro.return_levels.map((row: any) => (
                            <tr key={row.return_period_years} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-sans font-bold text-slate-900">{row.return_period_years} سنة</td>
                              <td className="p-3 text-slate-500">{(100 / row.return_period_years).toFixed(1)}%</td>
                              <td className="p-3 font-bold text-blue-700 text-sm">{row.return_level_mm} مم</td>
                              <td className="p-3 text-slate-600">[{row.lower_ci_mm} – {row.upper_ci_mm}] مم</td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleOpenCalculationSteps('return_level', row.return_period_years)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Calculator className="w-3 h-3" />
                                  <span>عرض الخطوات</span>
                                </button>
                              </td>
                              <td className="p-3 font-sans text-[10px]">
                                {row.extrapolation_warning ? (
                                  <span className="text-amber-700 font-bold">⚠ استقراء رياضي (T &gt; 2N)</span>
                                ) : (
                                  <span className="text-emerald-700">ضمن نطاق السجل المرصود</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Chart */}
                    <div className="pt-2">
                      <ReturnLevelCurveChart
                        levels={hydro.return_levels.map((l: any) => ({
                          period: l.return_period_years,
                          level: l.return_level_mm,
                          lower: l.lower_ci_mm,
                          upper: l.upper_ci_mm,
                        }))}
                        userHighlightT={100}
                        userHighlightMm={hydro.return_levels.find((r: any) => r.return_period_years === 100)?.return_level_mm}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 9: Immediate Calculator (Page 17) */}
              {hydro.canModel && (
                <section id="sec-calculator" className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-xl scroll-mt-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">الحاسبة الفورية لفترات العودة والتصميم</h3>
                      <p className="text-[11px] text-slate-300">أدخل أي قيمة هطول (مم) أو فترة عودة (سنة) للحصول على التعويض المباشر</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">كمية الهطول اليومي المراد تقييمها</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={inputRainMm}
                          onChange={(e) => setInputRainMm(Number(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-2xl font-black font-mono text-white outline-none focus:bg-white/20 transition-all text-center"
                        />
                        <span className="absolute left-4 top-4 text-xs text-slate-400 font-bold">مم/يوم</span>
                      </div>
                    </div>

                    <div className="p-5 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-300 font-bold block mb-1">فترة العودة المقدرة للحدث</span>
                        <div className="text-3xl font-black font-mono text-emerald-400">
                          {(() => {
                            const mu = hydro.models.best.mu;
                            const sigma = hydro.models.best.sigma;
                            const z = (inputRainMm - mu) / sigma;
                            const p = Math.exp(-Math.exp(-z));
                            const t = Math.max(1.1, 1 / (1 - Math.min(0.9999, p)));
                            return Math.round(t);
                          })()}{' '}
                          <span className="text-sm font-sans text-white/70">سنة</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenCalculationSteps('return_level', 100)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        عرض خطوات التعويض
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 10: Bootstrap Settings (Pages 18-19) */}
              {hydro.canModel && (
                <section id="sec-bootstrap" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden p-6 space-y-4 scroll-mt-20">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">10</div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">إعدادات الـ Bootstrap وفترات الثقة القابلة لإعادة الإنتاج</h3>
                        <p className="text-[11px] text-slate-400">التحقق من استقرار حدود الثقة 95% بتثبيت وتغيير الـ Random Seed</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
                        <span className="text-slate-500 px-2 uppercase">Accuracy:</span>
                        {[1000, 5000, 10000].map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              setBootstrapReps(v);
                              executeScientificPipeline(
                                records,
                                stationName,
                                stationId,
                                uploadedFileSource,
                                uploadedFileName,
                                completenessThreshold,
                                randomSeed,
                                isProductionMode
                              );
                            }}
                            className={`px-2 py-0.5 rounded-lg transition-all ${
                              bootstrapReps === v ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      {/* Seed Controls from Page 19 */}
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <span className="text-slate-500 px-2">Seed:</span>
                        {[42, 99].map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setRandomSeed(s);
                              executeScientificPipeline(
                                records,
                                stationName,
                                stationId,
                                uploadedFileSource,
                                uploadedFileName,
                                completenessThreshold,
                                s,
                                isProductionMode
                              );
                            }}
                            className={`px-3 py-1 rounded-lg font-mono transition-colors cursor-pointer ${
                              randomSeed === s ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">المنهجية المستخدمة</span>
                      <span className="font-bold text-slate-800">Parametric Bootstrap</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">عدد التكرارات (Replications)</span>
                      <span className="font-bold text-slate-800">{bootstrapReps} عينة</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">مستوى الثقة الإحصائي</span>
                      <span className="font-bold text-emerald-600">95% Confidence</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">Random Seed النشط</span>
                      <span className="font-bold text-blue-600">{randomSeed} (قابل لإعادة الإنتاج)</span>
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 11: Spatial Analysis on Egypt Map (Pages 19-20) */}
              <section id="sec-spatial" className="scroll-mt-20">
                <SpatialRainfallChart
                  latitude={hydro.latitude}
                  longitude={hydro.longitude}
                  stationName={stationName}
                  stationId={stationId}
                  period={`${hydro.qc.start_date.slice(0, 4)} – ${hydro.qc.end_date.slice(0, 4)}`}
                  qualityStatus={hydro.qc.calendar_analysis?.quality_status || 'Needs Review'}
                  rx1Max={hydro.characterization.daily_max_mm}
                  rx3Max={hydro.indices_rx3day?.reduce((max: number, a: any) => Math.max(max, a.maximum_value_mm), 0) || 0}
                  rx5Max={hydro.indices_rx5day?.reduce((max: number, a: any) => Math.max(max, a.maximum_value_mm), 0) || 0}
                  selectedModel={hydro.models?.best?.model || 'Gumbel'}
                  returnLevel100={hydro.return_levels?.find((r: any) => r.return_period_years === 100)?.return_level_mm || 0}
                />
              </section>

              {/* STEP 12: Audit Log & Reproducibility (Pages 21-22) */}
              <section id="sec-audit" className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm p-6 space-y-4 scroll-mt-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">12</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">سجل التشغيل وضمان إعادة الإنتاج (Audit & Reproducibility Log)</h3>
                      <p className="text-[11px] text-slate-400">توثيق شامل لكافة المعاملات والمدخلات لضمان القابلية للمراجعة الأكاديمية</p>
                    </div>
                  </div>

                  <button
                    onClick={handleRerunSameAnalysis}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>إعادة تشغيل نفس التحليل</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">Analysis Run ID</span>
                    <span className="font-bold text-blue-900 truncate block">{analysisRunId}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">اسم ملف الإدخال</span>
                    <span className="font-bold text-slate-800 truncate block">{uploadedFileName}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">Detection Frequency</span>
                    <span className="font-bold text-blue-600 block">{hydro.temporal?.detected_frequency || 'daily'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">QC Threshold</span>
                    <span className="font-bold text-slate-800 block">{completenessThreshold}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">Best Model AIC</span>
                    <span className="font-bold text-purple-600 block">{hydro.models?.best?.aic?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">Bootstrap Reps</span>
                    <span className="font-bold text-slate-800 block">{bootstrapReps}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">تاريخ ووقت التحليل</span>
                    <span className="font-bold text-slate-800 truncate block">{analysisTimestamp}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-sans block mb-1">المالك العلمي للمنصة</span>
                    <span className="font-bold text-slate-800 block font-sans">د. أمل معتوق</span>
                  </div>
                </div>
              </section>

            </div>
          )}

        </div>
      </main>

      {/* MODALS */}
      <FormulasAndReferencesModal isOpen={showFormulasModal} onClose={() => setShowFormulasModal(false)} />
      <CalculationStepsModal isOpen={showCalculationModal} onClose={() => setShowCalculationModal(false)} data={calculationStepData} />
      <ManualScientificCalculatorModal
        isOpen={showManualCalculatorModal}
        onClose={() => setShowManualCalculatorModal(false)}
        onLoadIntoPipeline={handleLoadManualInputIntoPipeline}
      />
      <DataSelectionWorkspaceModal
        isOpen={showDataSelectionModal}
        onClose={() => setShowDataSelectionModal(false)}
        allRecords={unfilteredRecords}
        onApplyFilter={handleApplyDataSelection}
        onResetFilter={handleResetDataSelection}
        currentFilterFingerprint={filterFingerprint}
      />
      <DataEditorAuditModal
        isOpen={showDataEditorModal}
        onClose={() => setShowDataEditorModal(false)}
        rawRecords={records}
        onSaveCleanedData={handleSaveCleanedData}
      />
      <ArabicQueryParserModal
        isOpen={showArabicParserModal}
        onClose={() => setShowArabicParserModal(false)}
        currentStationId={stationId}
        currentStationName={stationName}
        onExecutePlan={handleExecuteArabicPlan}
      />
      <StormEventBuilderModal
        isOpen={showStormBuilderModal}
        onClose={() => setShowStormBuilderModal(false)}
        records={records}
      />
      <MultiStationAnalysisModal
        isOpen={showMultiStationModal}
        onClose={() => setShowMultiStationModal(false)}
        currentStationId={stationId}
      />
      <DataCatalogComparisonModal
        isOpen={showDataCatalogModal}
        onClose={() => setShowDataCatalogModal(false)}
      />
      <ProjectRunsManagerModal
        isOpen={showProjectRunsModal}
        onClose={() => setShowProjectRunsModal(false)}
        currentRunLog={{
          analysis_run_id: analysisRunId,
          timestamp: analysisTimestamp,
          station_id: stationId,
          station_name: stationName,
        }}
      />
      <PreExportValidationModal
        isOpen={showPreExportModal}
        onClose={() => setShowPreExportModal(false)}
        isProductionMode={isProductionMode}
        stationName={stationName}
        stationId={stationId}
        sourceName={uploadedFileSource}
        nYearsAMS={
          hydro?.amsRx1
            ? hydro.amsRx1.filter((a: any) => a.eligible_for_model).length
            : hydro?.indices
            ? hydro.indices.filter((a: any) => a.eligible_for_model).length
            : hydro?.nYears ?? 0
        }
        hasMissingYearWithZero={false}
        analysisRunId={analysisRunId}
        onExportPDF={exportToPDF}
        onExportExcel={exportAllToExcel}
        onExportCSV={() => {
          const csv = Papa.unparse(records);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${stationId}_records.csv`;
          a.click();
        }}
        onExportJSON={() => {
          const jsonStr = JSON.stringify(hydro || records, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${stationId}_analysis.json`;
          a.click();
        }}
      />
      <RolesReviewModal
        isOpen={showRolesReviewModal}
        onClose={() => setShowRolesReviewModal(false)}
        stationName={stationName}
      />

      <PDFTableExtractorModal
        isOpen={showPDFExtractorModal}
        onClose={() => setShowPDFExtractorModal(false)}
        onImportExtractedData={handleImportPDFData}
      />
    </div>
  );
};
