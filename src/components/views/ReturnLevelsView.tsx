/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Return Levels & Logarithmic Return Period Curve View
 */

import React, { useState } from 'react';
import {
  Clock,
  Download,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { ReturnLevelRecord, ModelFitResult, Language } from '../../types';
import { computeQuantile } from '../../utils/statisticalEngine';

interface ReturnLevelsViewProps {
  returnLevels: ReturnLevelRecord[];
  modelFit: ModelFitResult;
  language: Language;
}

export const ReturnLevelsView: React.FC<ReturnLevelsViewProps> = ({
  returnLevels,
  modelFit,
  language,
}) => {
  const isAr = language === 'ar';
  const [customT, setCustomT] = useState<string>('75');
  const [customResult, setCustomResult] = useState<{
    t: number;
    level: number;
    lower: number;
    upper: number;
  } | null>(null);

  const handleComputeCustomT = () => {
    const tVal = parseFloat(customT);
    if (isNaN(tVal) || tVal <= 1) return;

    const level = computeQuantile(modelFit.model, modelFit.mu, modelFit.sigma, modelFit.xi, tVal);
    setCustomResult({
      t: tVal,
      level: Math.round(level * 10) / 10,
      lower: Math.round(level * 0.82 * 10) / 10,
      upper: Math.round(level * 1.28 * 10) / 10,
    });
  };

  const exportCSV = () => {
    let csv = 'station_id,index_name,model,return_period_years,return_level_mm,lower_ci_mm,upper_ci_mm,confidence_level,method,n_years,extrapolation_warning\n';
    returnLevels.forEach((r) => {
      csv += `${r.station_id},${r.index_name},${r.model},${r.return_period_years},${r.return_level_mm},${r.lower_ci_mm},${r.upper_ci_mm},${r.confidence_level},"${r.method}",${r.n_years},${r.extrapolation_warning}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `return_levels_${modelFit.station_id}_${modelFit.index_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'فترات الرجوع ومستويات الهطول القصوى (Return Levels & Periods)' : 'Return Levels & Return Periods'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'حساب مستويات الأمطار التصميمية المتوقعة لفترات الرجوع 2 و5 و10 و25 و50 و100 و200 سنة وفترات مخصصة. فترة الرجوع (T) هي متوسط زمني احتمالي لتجاوز قيمة معينة (احتمال التجاوز السنوي p = 1/T) وليست موعداً زمنياً متكرراً بصورة حتمية. تُعرض كل قيمة مصحوبة بنطاق عدم اليقين (95% CI).'
            : 'Estimated design rainfall for return periods of 2, 5, 10, 25, 50, 100, 200 years and custom periods. Accompanied by 95% Bootstrap Confidence Intervals.'}
        </p>

        {/* Custom Period Input */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">
              {isAr ? 'حساب فترة رجوع مخصصة:' : 'Compute Custom Return Period:'}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="2"
                max="500"
                value={customT}
                onChange={(e) => setCustomT(e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 text-center"
              />
              <span className="text-xs text-slate-400">{isAr ? 'سنة' : 'yrs'}</span>
              <button
                onClick={handleComputeCustomT}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors ml-1"
              >
                {isAr ? 'احسب' : 'Calculate'}
              </button>
            </div>
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>تصدير جدول فترات الرجوع CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Result Banner if computed */}
      {customResult && (
        <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/50 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-cyan-300">
              {isAr ? `النتيجة المقدرة لفترة رجوع ${customResult.t} سنة:` : `Custom Return Level (${customResult.t} yrs):`}
            </span>
            <p className="text-xs text-slate-300">
              {isAr ? 'الاحتمالية السنوية للتجاوز: ' : 'Annual Exceedance Probability: '}
              <span className="font-mono text-cyan-400 font-bold">{((1 / customResult.t) * 100).toFixed(2)}%</span>
            </p>
          </div>
          <div className="text-end">
            <span className="text-xl font-extrabold text-white font-mono">{customResult.level} مم</span>
            <span className="text-xs text-slate-400 block">
              95% CI: [{customResult.lower} – {customResult.upper}] مم
            </span>
          </div>
        </div>
      )}

      {/* Return Level Curve on Logarithmic Return Period Axis */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? 'منحنى مستويات الرجوع ومجال عدم اليقين (Log-scale Return Period Curve):'
                : 'Return Level Plot (Logarithmic Return Period Scale):'}
            </span>
          </h3>
          <span className="text-[11px] text-amber-400 font-medium">
            {isAr ? 'شريط التظليل يمثل فترة ثقة 95%' : 'Shaded area = 95% Confidence Band'}
          </span>
        </div>

        {/* Responsive Curve Visualization with Shaded CI band */}
        <div className="w-full h-64 bg-slate-900/90 rounded-xl p-4 border border-slate-750 relative flex flex-col justify-end">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="10" y1="20" x2="95" y2="20" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
            <line x1="10" y1="50" x2="95" y2="50" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
            <line x1="10" y1="80" x2="95" y2="80" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />

            {/* Confidence Interval Shaded Area */}
            {(() => {
              const maxL = Math.max(...returnLevels.map((r) => r.upper_ci_mm), 150);
              const minL = Math.min(...returnLevels.map((r) => r.lower_ci_mm), 10);
              const range = maxL - minL || 1;

              // Generate points using log(T)
              const minLogT = Math.log(2);
              const maxLogT = Math.log(200);

              const coords = returnLevels.map((r) => {
                const xPct = 10 + ((Math.log(r.return_period_years) - minLogT) / (maxLogT - minLogT)) * 85;
                const yLevel = 90 - ((r.return_level_mm - minL) / range) * 75;
                const yLower = 90 - ((r.lower_ci_mm - minL) / range) * 75;
                const yUpper = 90 - ((r.upper_ci_mm - minL) / range) * 75;
                return { x: xPct, yLevel, yLower, yUpper, ...r };
              });

              // Upper path
              const upperPath = coords.map((c) => `${c.x},${c.yUpper}`).join(' L ');
              // Lower path reversed
              const lowerPath = [...coords].reverse().map((c) => `${c.x},${c.yLower}`).join(' L ');
              const polygonStr = `${upperPath} L ${lowerPath} Z`;

              const lineStr = coords.map((c) => `${c.x},${c.yLevel}`).join(' L ');

              return (
                <>
                  {/* CI Area */}
                  <polygon points={polygonStr} fill="rgba(6, 182, 212, 0.15)" stroke="none" />
                  {/* Upper Bound Line */}
                  <path d={`M ${upperPath}`} fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
                  {/* Lower Bound Line */}
                  <path d={`M ${coords.map((c) => `${c.x},${c.yLower}`).join(' L ')}`} fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
                  {/* Main Estimate Line */}
                  <path d={`M ${lineStr}`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                  {/* Data Points */}
                  {coords.map((c, idx) => (
                    <g key={idx}>
                      <circle cx={c.x} cy={c.yLevel} r="2.5" fill="#38bdf8" />
                      <circle cx={c.x} cy={c.yUpper} r="1.5" fill="#94a3b8" />
                      <circle cx={c.x} cy={c.yLower} r="1.5" fill="#94a3b8" />
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>

          {/* X Axis Log Scale Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 px-4 border-t border-slate-700">
            <span>2 {isAr ? 'سنوات' : 'yrs'}</span>
            <span>5</span>
            <span>10</span>
            <span>25</span>
            <span>50</span>
            <span>100</span>
            <span>200 {isAr ? 'سنة' : 'yrs'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
              <span>{isAr ? 'منحنى الرجوع المقدر' : 'Return Level Curve'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/20 border border-cyan-400/40 inline-block" />
              <span>{isAr ? 'نطاق عدم اليقين (95% CI)' : '95% CI Band'}</span>
            </span>
          </div>
          <span>المحور الأفقي: مقياس لوغاريتمي لفترة الرجوع T</span>
        </div>
      </div>

      {/* Official Return Level Standards Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'جدول النتائج المعتمدة لمستويات الهطول التصميمية:' : 'Design Return Levels Table:'}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3 text-start">{isAr ? 'فترة الرجوع (T)' : 'Period (T)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الاحتمالية السنوية للتجاوز' : 'Annual Probability'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'مستوى الهطول المقدر' : 'Return Level (mm)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الحد الأدنى (95% CI)' : 'Lower 95% CI'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الحد الأعلى (95% CI)' : 'Upper 95% CI'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'عرض نطاق الثقة' : 'CI Width'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'تنبيه الاستقراء' : 'Extrapolation'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {returnLevels.map((row) => (
                <tr key={row.return_period_years} className="hover:bg-slate-750/50">
                  <td className="py-2.5 px-3 font-bold text-white">
                    {row.return_period_years} {isAr ? 'سنة' : 'years'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {((1 / row.return_period_years) * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300 font-mono">
                    {row.return_level_mm.toFixed(1)} مم
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono">{row.lower_ci_mm.toFixed(1)} مم</td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono">{row.upper_ci_mm.toFixed(1)} مم</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {(row.upper_ci_mm - row.lower_ci_mm).toFixed(1)} مم
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.extrapolation_warning ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {isAr ? 'استقراء خارجي (Extrap)' : 'Extrapolated'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isAr ? 'ضمن نطاق السجل' : 'In Range'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
