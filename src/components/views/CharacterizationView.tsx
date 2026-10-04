/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Rainfall Climatological Characterization View
 */

import React from 'react';
import {
  BarChart3,
  Calendar,
  Layers,
  Award,
  Clock,
  Droplets,
  Flame,
  Sun,
  CloudRain,
} from 'lucide-react';
import { RainfallCharacterization, Language } from '../../types';

interface CharacterizationViewProps {
  characterization: RainfallCharacterization;
  rainyDayThreshold: number;
  setRainyDayThreshold: (val: number) => void;
  language: Language;
}

export const CharacterizationView: React.FC<CharacterizationViewProps> = ({
  characterization,
  rainyDayThreshold,
  setRainyDayThreshold,
  language,
}) => {
  const isAr = language === 'ar';
  const c = characterization;

  const maxMonthly = Math.max(...c.monthly_climatology.map((m) => m.mean_rainfall_mm), 10);

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'توصيف الأمطار والمناخ الإحصائي (Rainfall Characterization)' : 'Rainfall Characterization'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'يقدم هذا القسم تحليلاً إحصائياً ومناخياً شاملاً لخصائص الهطول: المتوسط والوسيط والانحراف ومعامل الاختلاف والالتواء والتفرطح ومئينيات التوزيع (P1 إلى P99)، بالإضافة إلى أطول فترات الجفاف وأطول فترات المطر المتصلة والمعدل الشهري المعتاد.'
            : 'Statistical climatology metrics: Mean, Median, Std, CV, Skewness, Kurtosis, Percentiles (P1-P99), Dry/Wet spells, and monthly climatology.'}
        </p>

        {/* Rainy threshold selector */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
          <span className="text-xs text-slate-300 font-semibold">
            {isAr ? 'حد تعريف اليوم الممطر (Rainy Day Threshold):' : 'Rainy Day Threshold:'}
          </span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            {[0.1, 0.5, 1.0, 2.0, 5.0].map((val) => (
              <button
                key={val}
                onClick={() => setRainyDayThreshold(val)}
                className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                  rainyDayThreshold === val
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {val} مم {val === 1.0 ? (isAr ? '(الافتراضي)' : '(Default)') : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Metrics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'المتوسط السنوي' : 'Annual Mean'}</span>
          <span className="text-base font-bold text-cyan-300">{c.annual_mean_mm} مم</span>
          <span className="text-[10px] text-slate-400">± {c.annual_std_mm} مم</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'المتوسط اليومي' : 'Daily Mean'}</span>
          <span className="text-base font-bold text-white">{c.daily_mean_mm} مم</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'لكل الأيام' : 'All days'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'الوسيط اليومي' : 'Daily Median'}</span>
          <span className="text-base font-bold text-white">{c.daily_median_mm} مم</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'الصفر غالب' : 'P50'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'معامل الاختلاف' : 'Coeff. of Var.'}</span>
          <span className="text-base font-bold text-purple-300">{c.daily_cv}</span>
          <span className="text-[10px] text-slate-400">CV = σ / μ</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'معامل الالتواء' : 'Skewness'}</span>
          <span className="text-base font-bold text-amber-300">{c.skewness}</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'ذيل أيمن طويل' : 'Right-skewed'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'معامل التفرطح' : 'Kurtosis'}</span>
          <span className="text-base font-bold text-amber-300">{c.kurtosis}</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'قمم حادة' : 'Leptokurtic'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'أطول فترة جفاف' : 'Max Dry Spell'}</span>
          <span className="text-base font-bold text-rose-400">{c.max_dry_spell} {isAr ? 'يوم' : 'd'}</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'متتالي' : 'Consecutive'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'أطول فترة مطر' : 'Max Wet Spell'}</span>
          <span className="text-base font-bold text-emerald-400">{c.max_wet_spell} {isAr ? 'أيام' : 'd'}</span>
          <span className="text-[10px] text-slate-400">{isAr ? 'متتالي' : 'Consecutive'}</span>
        </div>
      </div>

      {/* Monthly Climatology Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'المناخ الشهري للأمطار والأيام الممطرة (Monthly Climatology):' : 'Monthly Climatology:'}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'توزيع الهطول عبر فصول السنة' : 'Seasonal Distribution'}
            </span>
          </div>

          <div className="w-full h-52 bg-slate-900/80 rounded-xl p-3 border border-slate-750 flex flex-col justify-end">
            <div className="flex-1 flex items-end gap-2 sm:gap-4 px-2">
              {c.monthly_climatology.map((m) => {
                const heightPct = (m.mean_rainfall_mm / maxMonthly) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all shadow"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      title={`${m.month_name_ar}: ${m.mean_rainfall_mm} مم، ${m.rainy_days} يوم ممطر`}
                    />
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                      {isAr ? m.month_name_ar.slice(0, 3) : m.month_name_en.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/40">
                  <th className="py-1.5 px-2 text-start">{isAr ? 'الشهر' : 'Month'}</th>
                  {c.monthly_climatology.map((m) => (
                    <th key={m.month} className="py-1.5 px-2 text-center">
                      {isAr ? m.month_name_ar.slice(0, 3) : m.month_name_en.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                <tr>
                  <td className="py-1.5 px-2 font-bold text-cyan-300">{isAr ? 'المتوسط (مم)' : 'Mean (mm)'}</td>
                  {c.monthly_climatology.map((m) => (
                    <td key={m.month} className="py-1.5 px-2 text-center font-mono">
                      {m.mean_rainfall_mm.toFixed(1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-bold text-amber-300">{isAr ? 'أعلى يوم (مم)' : 'Max Day'}</td>
                  {c.monthly_climatology.map((m) => (
                    <td key={m.month} className="py-1.5 px-2 text-center font-mono">
                      {m.max_daily_mm.toFixed(1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Percentiles Table (4 cols) */}
        <div className="lg:col-span-4 bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'مئينيات التوزيع الإحصائي (Percentiles):' : 'Percentiles Distribution:'}</span>
          </h3>

          <div className="space-y-1.5 text-xs">
            {[
              { p: 'P99 (الـ 1% الأشد مطراً)', val: c.percentiles.p99, color: 'text-rose-400 font-bold' },
              { p: 'P95', val: c.percentiles.p95, color: 'text-amber-300 font-bold' },
              { p: 'P90', val: c.percentiles.p90, color: 'text-cyan-300' },
              { p: 'P75 (الربع الأعلى Q3)', val: c.percentiles.p75, color: 'text-slate-200' },
              { p: 'P50 (الوسيط Median)', val: c.percentiles.p50, color: 'text-slate-200' },
              { p: 'P25 (الربع الأدنى Q1)', val: c.percentiles.p25, color: 'text-slate-300' },
              { p: 'P10', val: c.percentiles.p10, color: 'text-slate-400' },
              { p: 'P5', val: c.percentiles.p5, color: 'text-slate-400' },
              { p: 'P1', val: c.percentiles.p1, color: 'text-slate-500' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800"
              >
                <span className="text-slate-300">{item.p}</span>
                <span className={`font-mono ${item.color}`}>{item.val.toFixed(1)} مم</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
