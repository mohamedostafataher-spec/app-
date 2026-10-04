/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Homogeneity & Trend Tests View
 */

import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Award,
  Info,
  ArrowUpRight,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { HomogeneityReport, RainfallCharacterization, Language } from '../../types';

interface HomogeneityTrendViewProps {
  homogeneityReport: HomogeneityReport;
  characterization: RainfallCharacterization;
  language: Language;
}

export const HomogeneityTrendView: React.FC<HomogeneityTrendViewProps> = ({
  homogeneityReport,
  characterization,
  language,
}) => {
  const isAr = language === 'ar';
  const { pettitt, snht, buishand, mann_kendall } = homogeneityReport;

  const annuals = characterization.annual_totals;
  const maxRain = annuals.length > 0 ? Math.max(...annuals.map((a) => a.total_mm)) : 100;

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'اختبارات التجانس وكشف الاتجاه وتغير السلسلة' : 'Homogeneity & Trend Analysis'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تطبيق الاختبارات الإحصائية الأربعة المعتمدة عالمياً في الهيدرولوجيا المناخية: اختبار بتيت (Pettitt)، واختبار SNHT لكشف التغيرات الطرفية، واختبار بويشاند (Buishand)، واختبار مان-كيندال (Mann-Kendall) وميل سن (Sen\'s Slope) لكشف الاتجاهات الرتيبة.'
            : 'Pettitt, SNHT, Buishand tests for structural break points, alongside Mann-Kendall and Sen’s Slope for monotonic trend detection.'}
        </p>
      </div>

      {/* Critical Scientific Note Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            {isAr ? 'قاعدة منهجية هيدرولوجية هامة:' : 'Crucial Methodological Principle:'}
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isAr
              ? 'وجود نقطة انكسار (Break Point) لا يعني تلقائياً وجود خطأ في البيانات أو تغيراً مناخياً مؤكداً؛ يجب ربط النتيجة بسجل تاريخ المحطة (Metadata) للتأكد من عدم نقل موقع جهاز القياس أو تغيير نوع المسجل أو تغير وقت الرصد اليومي.'
              : 'Detection of a break point does not automatically signify climate change or measurement error. It must be cross-referenced with station metadata (relocations, gauge changes, observation times).'}
          </p>
        </div>
      </div>

      {/* Tests Results Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Test 1: Pettitt */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">اختبار بتيت (Pettitt)</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                pettitt.is_significant
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {pettitt.is_significant ? (isAr ? 'تغير محتمل' : 'Shift') : (isAr ? 'متجانس' : 'Homogeneous')}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">إحصائية K:</span>
              <span className="font-mono font-bold">{pettitt.statistic}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">القيمة الاحتمالية p:</span>
              <span className="font-mono font-bold text-cyan-300">{pettitt.p_value}</span>
            </div>
            {pettitt.change_point_year && (
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">سنة الانكسار المقدرة:</span>
                <span className="font-bold text-amber-400">{pettitt.change_point_year}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850 leading-relaxed">
            {isAr ? pettitt.interpretation_ar : pettitt.interpretation_en}
          </p>
        </div>

        {/* Test 2: SNHT */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">اختبار SNHT</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                snht.is_significant
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {snht.is_significant ? (isAr ? 'تغير محتمل' : 'Shift') : (isAr ? 'متجانس' : 'Homogeneous')}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">إحصائية T0:</span>
              <span className="font-mono font-bold">{snht.statistic}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">القيمة الاحتمالية p:</span>
              <span className="font-mono font-bold text-cyan-300">{snht.p_value}</span>
            </div>
            {snht.change_point_year && (
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">سنة الانكسار:</span>
                <span className="font-bold text-amber-400">{snht.change_point_year}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850 leading-relaxed">
            {isAr ? snht.interpretation_ar : snht.interpretation_en}
          </p>
        </div>

        {/* Test 3: Buishand */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">اختبار بويشاند (Buishand)</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                buishand.is_significant
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {buishand.is_significant ? (isAr ? 'انحراف' : 'Deviation') : (isAr ? 'مستقر' : 'Stable')}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">إحصائية R/√n:</span>
              <span className="font-mono font-bold">{buishand.statistic}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">القيمة الاحتمالية p:</span>
              <span className="font-mono font-bold text-cyan-300">{buishand.p_value}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">مستوى المعنوية:</span>
              <span className="font-mono text-slate-300">α = 0.05</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850 leading-relaxed">
            {isAr ? buishand.interpretation_ar : buishand.interpretation_en}
          </p>
        </div>

        {/* Test 4: Mann-Kendall & Sen's Slope */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">مان-كيندال (Mann-Kendall)</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                mann_kendall.trend === 'increasing'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : mann_kendall.trend === 'decreasing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {mann_kendall.trend === 'increasing' && <TrendingUp className="w-3 h-3" />}
              {mann_kendall.trend === 'decreasing' && <TrendingDown className="w-3 h-3" />}
              {mann_kendall.trend === 'no_trend' && <Minus className="w-3 h-3" />}
              <span>
                {mann_kendall.trend === 'increasing'
                  ? (isAr ? 'اتجاه صاعد' : 'Increasing')
                  : mann_kendall.trend === 'decreasing'
                  ? (isAr ? 'اتجاه هابط' : 'Decreasing')
                  : (isAr ? 'لا اتجاه' : 'No Trend')}
              </span>
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">ميل سن (Sen's Slope):</span>
              <span className="font-mono font-bold text-cyan-300">
                {mann_kendall.sen_slope_mm_per_year > 0 ? '+' : ''}
                {mann_kendall.sen_slope_mm_per_year} مم/سنة
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">إحصائية Z:</span>
              <span className="font-mono font-bold">{mann_kendall.z_score}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">القيمة الاحتمالية p:</span>
              <span className="font-mono font-bold">{mann_kendall.p_value}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850 leading-relaxed">
            {isAr ? mann_kendall.interpretation_ar : mann_kendall.interpretation_en}
          </p>
        </div>
      </div>

      {/* Visual Time Series & Break Point Indicator */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'رسم السلسلة السنوية ومؤشر نقطة الانكسار المقدرة:' : 'Annual Series & Break Point Plot:'}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {characterization.annual_mean_mm} مم/سنة (متوسط السلسلة)
          </span>
        </div>

        {/* Responsive SVG Bar & Line Chart */}
        <div className="w-full h-56 bg-slate-900/80 rounded-xl p-3 border border-slate-750 flex flex-col justify-end">
          <div className="flex-1 flex items-end gap-1.5 sm:gap-2.5 pt-4 px-2 relative">
            {/* Break Point marker vertical line if significant */}
            {pettitt.change_point_year && (
              <div
                className="absolute top-0 bottom-6 border-r-2 border-dashed border-amber-400/80 pointer-events-none z-10"
                style={{
                  left: `${
                    ((pettitt.change_point_year - (annuals[0]?.year || 1994)) /
                      Math.max(1, annuals.length - 1)) *
                    95
                  }%`,
                }}
              >
                <span className="text-[10px] font-bold text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/40 absolute -top-1 -right-6 shadow">
                  Break ({pettitt.change_point_year})
                </span>
              </div>
            )}

            {annuals.map((a) => {
              const heightPct = maxRain > 0 ? (a.total_mm / maxRain) * 100 : 0;
              const isBreakYear = a.year === pettitt.change_point_year;
              return (
                <div key={a.year} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isBreakYear
                        ? 'bg-amber-400 shadow-lg shadow-amber-500/30'
                        : 'bg-cyan-500/80 hover:bg-cyan-400'
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    title={`${a.year}: ${a.total_mm} مم`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono hidden sm:inline transform -rotate-45 origin-top-left mt-1">
                    {a.year.toString().slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
              <span>{isAr ? 'الهطول السنوي (مم)' : 'Annual Rain (mm)'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span>{isAr ? 'نقطة الانكسار المحتملة' : 'Break Point'}</span>
            </span>
          </div>
          <span>د. أمل معتوق — منصة مصر لتحليل الأمطار القصوى</span>
        </div>
      </div>
    </div>
  );
};
