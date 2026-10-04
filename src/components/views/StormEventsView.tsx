/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Storm Events & Storm Daniel Analysis View
 */

import React, { useState } from 'react';
import {
  Flame,
  Award,
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Activity,
  Plus,
} from 'lucide-react';
import { StormEvent, HourlyRecord, Language } from '../../types';
import { STORM_DANIEL_EVENT, STORM_DANIEL_HOURLY } from '../../data/demoData';

interface StormEventsViewProps {
  language: Language;
}

export const StormEventsView: React.FC<StormEventsViewProps> = ({ language }) => {
  const isAr = language === 'ar';
  const event = STORM_DANIEL_EVENT;

  const [activeTab, setActiveTab] = useState<'overview' | 'hyetograph' | 'comparison'>('overview');

  const hyetograph = event.hyetograph || [];
  const maxCumulative = hyetograph.length > 0 ? hyetograph[hyetograph.length - 1].cumulative_mm : 80;

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'تحليل العواصف والأحداث المطرية الاستثنائية' : 'Storm Events & Extreme Analysis'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'دراسة تفصيلية للعواصف المطرية الشديدة وحساب إجمالي الحدث وأعلى هطول يومي وساعي، ومنحنى المطر التراكمي (Hyetograph)، ومقارنة ذروة العاصفة مع منحنيات فترات الرجوع بدقة إحصائية دون مبالغة.'
            : 'In-depth assessment of extreme storm events, hyetographs, cumulative mass curves, and return period comparisons.'}
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'عاصفة دانيال (نظرة شاملة)' : 'Storm Daniel (Overview)'}
          </button>
          <button
            onClick={() => setActiveTab('hyetograph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hyetograph'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'منحنى الشدة التراكمية (Hyetograph)' : 'Hyetograph & Hourly Curve'}
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'comparison'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'المقارنة مع فترات الرجوع والتاريخ' : 'Return Period Benchmark'}
          </button>
        </div>
      </div>

      {/* Critical Scientific Formulation Banner */}
      <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">
            {isAr ? 'قاعدة التعبير الإحصائي السليم:' : 'Scientifically Sound Formulation Rule:'}
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {isAr
              ? 'تمنع المنصة الجزم بأن عاصفة معينة هي «عاصفة 100 سنة» بصورة قطعية دون ذكر النموذج ونطاق عدم اليقين. الصياغة العلمية المعتمدة: «القيمة تقع قرب مستوى الرجوع المقدر لفترة T وفق النموذج، مع عدم يقين من الحد الأدنى إلى الحد الأعلى».'
              : 'Never declare an event "a 100-year storm" without explicitly providing the model, record length, and confidence intervals.'}
          </p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Main Daniel Case Study Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{event.event_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Medicane
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>8 سبتمبر 2023 – 12 سبتمبر 2023</span>
                  <span>•</span>
                  <span>{event.region}</span>
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
                {event.source}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              {event.notes}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'إجمالي هطول العاصفة' : 'Event Total'}</span>
                <span className="text-base font-bold text-white font-mono">{event.metrics.event_total_mm} مم</span>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'خلال 5 أيام' : '5 Days total'}</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'أعلى هطول يومي' : 'Max Daily'}</span>
                <span className="text-base font-bold text-rose-300 font-mono">{event.metrics.max_daily_mm} مم</span>
                <span className="text-[10px] text-slate-400 block">10 سبتمبر 2023</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'أعلى هطول ساعي' : 'Max 1-Hour'}</span>
                <span className="text-base font-bold text-cyan-300 font-mono">{event.metrics.max_hourly_mm} مم/س</span>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'شدة عاصفة فائقة' : 'Peak Intensity'}</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'أعلى مجموع لـ 3 أيام' : 'Max 3-Day'}</span>
                <span className="text-base font-bold text-amber-300 font-mono">{event.metrics.max_3day_mm} مم</span>
                <span className="text-[10px] text-slate-400 block">Rx3day Event</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'الترتيب التاريخي' : 'Historical Rank'}</span>
                <span className="text-base font-bold text-white font-mono">المركز {event.metrics.historical_rank}</span>
                <span className="text-[10px] text-purple-300 block">{event.metrics.percentile_in_history}% مئيني</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
                <span className="text-slate-400 text-xs block">{isAr ? 'فترة الرجوع المقدرة' : 'Est. Return Period'}</span>
                <span className="text-base font-bold text-cyan-300 font-mono">~ {event.metrics.estimated_return_period_years} سنة</span>
                <span className="text-[10px] text-slate-400 block">95% CI: 32–75 سنة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hyetograph' && (
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'مخطط الهيتوغراف والتراكم الزمني لهطول عاصفة دانيال:' : 'Storm Daniel Hyetograph & Mass Curve:'}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              محطة مرسى مطروح الساحلية (MRM01)
            </span>
          </div>

          {/* Hyetograph SVG Plot */}
          <div className="w-full h-64 bg-slate-900/90 rounded-xl p-4 border border-slate-750 relative flex flex-col justify-end">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Cumulative Line Path */}
              {(() => {
                const points = hyetograph.map((h, idx) => {
                  const x = 5 + (idx / Math.max(1, hyetograph.length - 1)) * 90;
                  const y = 90 - (h.cumulative_mm / maxCumulative) * 75;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <path d={`M ${points.join(' L ')}`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                    {hyetograph.map((h, idx) => {
                      const x = 5 + (idx / Math.max(1, hyetograph.length - 1)) * 90;
                      const y = 90 - (h.cumulative_mm / maxCumulative) * 75;
                      return <circle key={idx} cx={x} cy={y} r="2.5" fill="#38bdf8" />;
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Time labels */}
            <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 px-2 border-t border-slate-700">
              {hyetograph.map((h, idx) => (
                <span key={idx} className="truncate max-w-[50px]">
                  {h.timestamp.slice(5)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>المنحنى الأزرق: التراكم الإجمالي للأمطار بالملليمتر عبر ساعات الحدث</span>
            <span>الذروة المسجلة: 24.5 مم خلال 6 ساعات فجر 10 سبتمبر</span>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'مقارنة عاصفة دانيال مع السجل التاريخي ومستويات الرجوع:' : 'Comparison with Historical Records:'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'مقارنة بنفس الشهر (سبتمبر)' : 'Same Month Baseline'}</span>
              <span className="text-base font-bold text-rose-300">أعلى حدث على الإطلاق</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                متوسط هطول شهر سبتمبر في الساحل الشمالي أقل من 3 مم عادة. عاصفة دانيال سجلت أكثر من 25 ضعف المعدل الشهري.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'مستوى الرجوع 50 سنة المقدر' : '50-Year Return Level'}</span>
              <span className="text-base font-bold text-amber-300">64.2 مم</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ذروة العاصفة (62.4 مم) تقع بدقة ضمن نطاق ثقة 95% لفترة رجوع 50 سنة [48.5 – 82.0 مم].
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'المقارنة بين المحطة وCHIRPS' : 'Ground vs CHIRPS Twin'}</span>
              <span className="text-base font-bold text-cyan-300">54.0 مم في CHIRPS</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                المنتج الشبكي CHIRPS خفض الذروة النقطية بحوالي 13% نتيجة التنعيم المكاني لخلية 5 كم.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
