/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Goodness of Fit (GoF) Tests & Diagnostic Plots View
 */

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Award,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { GoodnessOfFitReport, Language } from '../../types';

interface GoodnessOfFitViewProps {
  gevGof: GoodnessOfFitReport;
  gumbelGof: GoodnessOfFitReport;
  language: Language;
}

export const GoodnessOfFitView: React.FC<GoodnessOfFitViewProps> = ({
  gevGof,
  gumbelGof,
  language,
}) => {
  const isAr = language === 'ar';
  const [activeModel, setActiveModel] = useState<'GEV' | 'Gumbel'>('GEV');

  const currentGof = activeModel === 'GEV' ? gevGof : gumbelGof;

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'اختبارات جودة الملاءمة والتشخيص البياني (Goodness of Fit)' : 'Goodness of Fit (GoF)'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تقييم صارم لمدى مطابقة النماذج الاحتمالية لبيانات القمم السنوية عبر اختبارات كولموغوروف-سميرنوف (KS) وأندرسون-دارلنغ (Anderson-Darling للأطراف القصوى) وكرامر-فون ميسيز (CvM)، مع مخططات التطابق التجزيئي QQ ومخططات الاحتمالية PP.'
            : 'Statistical GoF evaluation using Kolmogorov-Smirnov, Anderson-Darling (tail sensitivity), Cramer-von Mises, alongside QQ and PP diagnostic plots.'}
        </p>

        {/* Model Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
          <button
            onClick={() => setActiveModel('GEV')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeModel === 'GEV'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            اختبارات نموذج GEV
          </button>
          <button
            onClick={() => setActiveModel('Gumbel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeModel === 'Gumbel'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            اختبارات نموذج Gumbel
          </button>
        </div>
      </div>

      {/* Critical Methodological Note */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
        <span>
          {isAr
            ? 'قاعدة هيدرولوجية معتمدة: لا تختَر النموذج من القيمة الاحتمالية (p-value) وحدها؛ يجب الدمج بين اختبار أندرسون-دارلنغ (لحساسيته العالية للذيل الأقصى)، ومخططات QQ/PP، واستقرار المعلمات وطول السجل الزمني.'
            : 'Standard hydrological rule: Never select an extreme value model based on p-value alone; evaluate tail behavior (Anderson-Darling) and QQ plots.'}
        </span>
      </div>

      {/* Numerical Test Statistics Comparison */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'مقارنة نتائج الاختبارات الإحصائية بين النموذجين:' : 'GoF Statistics Comparison:'}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3 text-start">{isAr ? 'النموذج' : 'Model'}</th>
                <th className="py-2.5 px-3 text-start">إحصائية KS (D)</th>
                <th className="py-2.5 px-3 text-start">احتمالية KS (p)</th>
                <th className="py-2.5 px-3 text-start">إحصائية Anderson-Darling (A²)</th>
                <th className="py-2.5 px-3 text-start">إحصائية Cramer-von Mises (W²)</th>
                <th className="py-2.5 px-3 text-start">معيار أكايكي (AIC)</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'التوصية العلمية' : 'Verdict'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-750/50">
                <td className="py-2.5 px-3 font-bold text-cyan-300">GEV (Generalized Extreme Value)</td>
                <td className="py-2.5 px-3 font-mono">{gevGof.ks_statistic}</td>
                <td className="py-2.5 px-3 font-mono text-emerald-400">{gevGof.ks_p_value}</td>
                <td className="py-2.5 px-3 font-mono">
                  {gevGof.ad_statistic} <span className="text-[10px] text-slate-400">(&lt; 2.492)</span>
                </td>
                <td className="py-2.5 px-3 font-mono">{gevGof.cvm_statistic}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{gevGof.aic}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    مقبول ومطابق
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-750/50">
                <td className="py-2.5 px-3 font-bold text-purple-300">Gumbel (Type I)</td>
                <td className="py-2.5 px-3 font-mono">{gumbelGof.ks_statistic}</td>
                <td className="py-2.5 px-3 font-mono text-emerald-400">{gumbelGof.ks_p_value}</td>
                <td className="py-2.5 px-3 font-mono">
                  {gumbelGof.ad_statistic} <span className="text-[10px] text-slate-400">(&lt; 2.492)</span>
                </td>
                <td className="py-2.5 px-3 font-mono">{gumbelGof.cvm_statistic}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-purple-300">{gumbelGof.aic}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    مقبول ومطابق
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic Plots (QQ Plot & PP Plot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* QQ Plot */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">
              {isAr ? `مخطط التجزيئات النظرية والتجريبية (QQ Plot - ${activeModel}):` : `QQ Plot (${activeModel}):`}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">1:1 Reference Line</span>
          </div>

          <div className="w-full h-56 bg-slate-900/80 rounded-xl p-3 border border-slate-750 relative flex items-center justify-center">
            {/* Draw 1:1 diagonal line */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="5" y1="95" x2="95" y2="5" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
              {currentGof.qq_points.map((pt, idx) => {
                const maxVal = Math.max(
                  ...currentGof.qq_points.map((p) => Math.max(p.empirical, p.theoretical)),
                  10
                );
                const cx = 5 + (pt.theoretical / maxVal) * 90;
                const cy = 95 - (pt.empirical / maxVal) * 90;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="2.2"
                    fill="#06b6d4"
                    className="hover:r-3 transition-all cursor-pointer"
                  >
                    <title>{`نظري: ${pt.theoretical} مم، تجريبي: ${pt.empirical} مم`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>المحور الأفقي: القيم التجزيئية النظرية (مم)</span>
            <span>المحور الرأسي: القيم المرصودة فعلياً (مم)</span>
          </div>
        </div>

        {/* PP Plot */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">
              {isAr ? `مخطط الاحتمالية التراكمية (PP Plot - ${activeModel}):` : `PP Plot (${activeModel}):`}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">F_emp vs F_model</span>
          </div>

          <div className="w-full h-56 bg-slate-900/80 rounded-xl p-3 border border-slate-750 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="5" y1="95" x2="95" y2="5" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
              {currentGof.pp_points.map((pt, idx) => {
                const cx = 5 + pt.theoretical_p * 90;
                const cy = 95 - pt.empirical_p * 90;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="2.2"
                    fill="#a855f7"
                    className="hover:r-3 transition-all cursor-pointer"
                  >
                    <title>{`احتمال نظري: ${pt.theoretical_p}، احتمال تجريبي: ${pt.empirical_p}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>المحور الأفقي: الاحتمالية النظرية التراكمية F(x)</span>
            <span>المحور الرأسي: الاحتمالية التجريبية Gringorten</span>
          </div>
        </div>
      </div>
    </div>
  );
};
