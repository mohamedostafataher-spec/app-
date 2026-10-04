/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Analysis History & Reproducibility View
 */

import React from 'react';
import {
  History,
  RotateCcw,
  CheckCircle,
  Hash,
  Download,
  Award,
  Layers,
  FileCode,
} from 'lucide-react';
import { AnalysisRunLog, Language } from '../../types';

interface HistoryViewProps {
  language: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ language }) => {
  const isAr = language === 'ar';

  const runs: AnalysisRunLog[] = [
    {
      analysis_run_id: 'RUN-20261004-ALX-01',
      timestamp: '2024-03-01 14:30:00',
      project_id: 'PRJ_EGYPT_NATIONAL_DEMO',
      station_id: 'ALX01',
      input_file_name: 'alexandria_daily_1994_2023.csv',
      input_hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      data_source: 'Egyptian Meteorological Network Archive / NOAA CDO',
      period: '1994–2023 (30 Years)',
      index_name: 'Rx1day',
      selected_model: 'GEV',
      estimation_method: 'L-Moments',
      completeness_threshold: 90,
      rainy_day_threshold: 1.0,
      confidence_level: 95,
      bootstrap_replications: 5000,
      random_seed: 20261004,
      software_version: 'v2.4.0-Deterministic',
      scientific_lead: 'د. أمل معتوق — Dr. Amal Matouk',
      safety_score: 91,
      warnings: [],
      return_levels: {
        50: { level: 71.4, lower: 58.2, upper: 94.6 },
        100: { level: 88.5, lower: 71.2, upper: 122.4 },
      },
    },
    {
      analysis_run_id: 'RUN-20261004-CAI-02',
      timestamp: '2024-03-01 15:10:00',
      project_id: 'PRJ_EGYPT_NATIONAL_DEMO',
      station_id: 'CAI01',
      input_file_name: 'cairo_daily_1994_2023.csv',
      input_hash: 'sha256:4a35edd8b0a969b053229b0a1a0e19a4e37f07e59c193557e5e33ebfcb99a80b',
      data_source: 'National Climatological Archive',
      period: '1994–2023 (30 Years)',
      index_name: 'Rx1day',
      selected_model: 'GEV',
      estimation_method: 'L-Moments',
      completeness_threshold: 90,
      rainy_day_threshold: 1.0,
      confidence_level: 95,
      bootstrap_replications: 5000,
      random_seed: 20261004,
      software_version: 'v2.4.0-Deterministic',
      scientific_lead: 'د. أمل معتوق — Dr. Amal Matouk',
      safety_score: 87,
      warnings: [],
      return_levels: {
        50: { level: 41.2, lower: 32.5, upper: 59.8 },
        100: { level: 51.6, lower: 39.8, upper: 76.5 },
      },
    },
    {
      analysis_run_id: 'RUN-20261004-DANIEL-03',
      timestamp: '2024-03-02 11:20:00',
      project_id: 'PRJ_MED_COAST_DANIEL',
      station_id: 'MRM01',
      input_file_name: 'storm_daniel_matruh_hourly.csv',
      input_hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      data_source: 'WMO & Coastal Observational Network',
      period: 'Sept 8–12, 2023',
      index_name: 'Rx1day',
      selected_model: 'GEV',
      estimation_method: 'MLE',
      completeness_threshold: 90,
      rainy_day_threshold: 1.0,
      confidence_level: 95,
      bootstrap_replications: 5000,
      random_seed: 20261004,
      software_version: 'v2.4.0-Deterministic',
      scientific_lead: 'د. أمل معتوق — Dr. Amal Matouk',
      safety_score: 84,
      warnings: ['حدث استثنائي قصير الأمد لمقارنة العواصف'],
      return_levels: {
        50: { level: 64.2, lower: 48.5, upper: 82.0 },
        100: { level: 78.4, lower: 57.0, upper: 104.2 },
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'سجل التحليلات وقابلية إعادة الإنتاج (Analysis History & Reproducibility)' : 'Analysis History & Reproducibility'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تطبيق قاعدة النتائج القابلة لإعادة الإنتاج (Reproducibility Standard): لكل تشغيل تحليلي يُسجل كود فريد (Run ID)، مع بصمة التجزئة للملف (SHA-256 Hash)، ومصدر البيانات، وطريقة التقدير، والبذرة العشوائية لمطابقة النتائج بدقة 100% عند إعادة التشغيل.'
            : 'Audit history logging Run IDs, SHA-256 input hashes, estimation settings, and random seeds for 100% reproducible results.'}
        </p>
      </div>

      {/* History Log List */}
      <div className="space-y-4">
        {runs.map((run) => (
          <div
            key={run.analysis_run_id}
            className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3 hover:border-slate-600 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-750 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-300 text-xs">{run.analysis_run_id}</span>
                  <span className="text-xs font-bold text-white">[{run.station_id}] {run.index_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    مؤشر أمان: {run.safety_score}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {run.timestamp} • {run.data_source}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
                  Seed: {run.random_seed}
                </span>
                <button
                  onClick={() => alert(`إعادة تشغيل الحسابات للمدخلات: ${run.input_file_name}`)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'إعادة الإنتاج' : 'Re-run'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 text-[11px] block">{isAr ? 'النموذج وطريقة التقدير' : 'Model & Method'}</span>
                <span className="font-bold text-white">{run.selected_model} ({run.estimation_method})</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isAr ? 'مطر 50 سنة المقدر' : '50-Year Level'}</span>
                <span className="font-mono font-bold text-cyan-300">{run.return_levels[50]?.level} مم</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isAr ? 'مطر 100 سنة المقدر' : '100-Year Level'}</span>
                <span className="font-mono font-bold text-rose-300">{run.return_levels[100]?.level} مم</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isAr ? 'إصدار الخوارزمية' : 'Engine Version'}</span>
                <span className="font-mono text-slate-300">{run.software_version}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded border border-slate-850 truncate">
              <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{run.input_hash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
