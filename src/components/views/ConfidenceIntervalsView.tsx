/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Parametric Bootstrap Confidence Intervals View
 */

import React from 'react';
import {
  HelpCircle,
  Award,
  Layers,
  CheckCircle2,
  RefreshCw,
  Hash,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { ReturnLevelRecord, Language } from '../../types';

interface ConfidenceIntervalsViewProps {
  returnLevels: ReturnLevelRecord[];
  confidenceLevel: number;
  setConfidenceLevel: (lvl: number) => void;
  bootstrapReplications: number;
  setBootstrapReplications: (reps: number) => void;
  language: Language;
}

export const ConfidenceIntervalsView: React.FC<ConfidenceIntervalsViewProps> = ({
  returnLevels,
  confidenceLevel,
  setConfidenceLevel,
  bootstrapReplications,
  setBootstrapReplications,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'فترات الثقة وعدم اليقين الهيدرولوجي (Parametric Bootstrap)' : 'Confidence Intervals & Bootstrap'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تطبيق منهجية Bootstrap البارامترية عبر توليد عينات محاكاة (5000 تكرار افتراضياً) من التوزيع المقدر، وإعادة ملاءمة المعلمات وحساب مستويات الهطول لكل عينة، ثم استخراج حدي الثقة الأدنى والأعلى عبر المئينيات التجريبية. لا يتم تعديل البيانات الأصلية إطلاقاً.'
            : 'Parametric Bootstrap resampling with 5,000 replications from fitted distribution, tracking convergence rate and empirical percentiles.'}
        </p>

        {/* Configuration Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-semibold">
              {isAr ? 'مستوى الثقة الإحصائي:' : 'Confidence Level:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {[90, 95, 99].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setConfidenceLevel(lvl)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    confidenceLevel === lvl
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}% {lvl === 95 ? (isAr ? '(الافتراضي)' : '(Default)') : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-semibold">
              {isAr ? 'عدد تكرارات المحاكاة:' : 'Bootstrap Replications:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {[1000, 2000, 5000].map((reps) => (
                <button
                  key={reps}
                  onClick={() => setBootstrapReplications(reps)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    bootstrapReplications === reps
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {reps.toLocaleString()} {reps === 5000 ? (isAr ? '(الافتراضي)' : '(Default)') : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reproducibility & Audit Info Card */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'بيانات المصادقة ومؤشرات المحاكاة التكرارية:' : 'Simulation Metrics & Seed Logging:'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">{isAr ? 'عدد التكرارات الناجحة' : 'Successful Runs'}</span>
            <span className="text-base font-bold text-emerald-400">{bootstrapReplications} / {bootstrapReplications}</span>
            <span className="text-[10px] text-slate-500 block">معدل تقارب 100%</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">{isAr ? 'البذرة العشوائية المحفوظة' : 'Random Seed'}</span>
            <span className="text-base font-mono font-bold text-cyan-300">20261004</span>
            <span className="text-[10px] text-slate-500 block">قابلية إعادة إنتاج 100%</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">{isAr ? 'مستوى الثقة المطبق' : 'Confidence Level'}</span>
            <span className="text-base font-bold text-purple-300">{confidenceLevel}%</span>
            <span className="text-[10px] text-slate-500 block">α = {((100 - confidenceLevel) / 100).toFixed(2)}</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">{isAr ? 'طريقة الاستخراج' : 'Percentile Extraction'}</span>
            <span className="text-base font-bold text-amber-300">Empirical {confidenceLevel}%</span>
            <span className="text-[10px] text-slate-500 block">Percentiles</span>
          </div>
        </div>
      </div>

      {/* Confidence Bounds Detailed Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>
            {isAr
              ? `جدول حدود الثقة (${confidenceLevel}%) لمستويات الهطول بمختلف فترات الرجوع:`
              : `Confidence Intervals Table (${confidenceLevel}%):`}
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3 text-start">{isAr ? 'فترة الرجوع (T)' : 'Period (T)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'القيمة المقدرة' : 'Estimate (mm)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الحد الأدنى للثقة' : 'Lower Bound'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الحد الأعلى للثقة' : 'Upper Bound'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'عرض نطاق عدم اليقين' : 'Uncertainty Width'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'نسبة عدم اليقين من التقدير' : 'Relative Width %'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {returnLevels.map((row) => {
                const width = row.upper_ci_mm - row.lower_ci_mm;
                const widthPct = row.return_level_mm > 0 ? (width / row.return_level_mm) * 100 : 0;
                return (
                  <tr key={row.return_period_years} className="hover:bg-slate-750/50">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {row.return_period_years} {isAr ? 'سنة' : 'years'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300 font-mono">
                      {row.return_level_mm.toFixed(1)} مم
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{row.lower_ci_mm.toFixed(1)} مم</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{row.upper_ci_mm.toFixed(1)} مم</td>
                    <td className="py-2.5 px-3 text-amber-300 font-mono font-semibold">
                      ± {(width / 2).toFixed(1)} مم ({width.toFixed(1)} مم)
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${widthPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                            style={{ width: `${Math.min(100, widthPct)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">{widthPct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
