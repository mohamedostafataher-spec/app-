/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Dashboard View
 */

import React from 'react';
import {
  CloudRain,
  Award,
  Layers,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  MapPin,
  TrendingUp,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  StationMetadata,
  DailyRecord,
  QualityReport,
  ModelFitResult,
  ReturnLevelRecord,
  Language,
} from '../../types';
import { NavTab } from '../Sidebar';

interface DashboardViewProps {
  stations: StationMetadata[];
  records: DailyRecord[];
  selectedStation: StationMetadata;
  setSelectedStation: (st: StationMetadata) => void;
  qualityReport: QualityReport;
  gevFit: ModelFitResult;
  gumbelFit: ModelFitResult;
  returnLevels: ReturnLevelRecord[];
  setCurrentTab: (tab: NavTab) => void;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stations,
  records,
  selectedStation,
  setSelectedStation,
  qualityReport,
  gevFit,
  gumbelFit,
  returnLevels,
  setCurrentTab,
  language,
}) => {
  const isAr = language === 'ar';

  const t100 = returnLevels.find((r) => r.return_period_years === 100);
  const t50 = returnLevels.find((r) => r.return_period_years === 50);
  const t10 = returnLevels.find((r) => r.return_period_years === 10);

  const bestModel = gevFit.aic < gumbelFit.aic ? 'GEV' : 'Gumbel';

  return (
    <div className="space-y-6">
      {/* Dr. Amal Matouk Scientific Ownership Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Award className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? 'إعداد وملكية علمية حصرية: د. أمل معتوق — Dr. Amal Matouk'
                  : 'Scientific Ownership: Dr. Amal Matouk'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              {isAr
                ? 'منظومة النمذجة الإحصائية المتقدمة للأمطار القصوى في مصر'
                : 'Advanced Egyptian Extreme Rainfall Analytics Platform'}
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isAr
                ? 'منصة علمية رصينة لفحص جودة السجلات المطرية، والتجانس، واستخراج سلاسل القمم السنوية (AMS)، وملاءمة توزيعات GEV وGumbel بحسابات حتمية مدققة وتقدير فترات الرجوع وعرض فترات الثقة عبر محاكاة Bootstrap.'
                : 'Scientific platform for quality control, homogeneity, Annual Maximum Series extraction, GEV/Gumbel fitting, return periods estimation, and bootstrap confidence intervals.'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => setCurrentTab('smart_analyst')}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-950/40 flex items-center gap-2 transition-all border border-purple-400/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>{isAr ? 'المحلل العلمي الذكي 🧠' : 'Smart Analyst'}</span>
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{isAr ? 'عرض التقرير العلمي' : 'View Full Report'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTab('innovation_lab')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'مختبر الابتكار (15)' : 'Innovation Lab'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Smart Analyst Quick Invitation Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{isAr ? 'اسأل المحلل العلمي الذكي بالعربية' : 'Ask the Smart Scientific Analyst in Arabic'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                {isAr ? 'خطة من 10 عناصر' : '10-Point Plan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isAr
                ? 'مثل: "احسب Rx1day لمحطة الإسكندرية"، "ما معادلة Rx3day؟"، "قارن بين GEV وGumbel"، "حلل عاصفة دانيال".'
                : 'e.g. "Compute Rx1day for Alexandria", "Formula of Rx3day", "Compare GEV vs Gumbel", "Analyze Storm Daniel".'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('smart_analyst')}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
        >
          <span>{isAr ? 'ابدأ الاستفسار والتحليل' : 'Start Analyst'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Station Selector Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-300">
            {isAr ? 'المحطة النشطة للتحليل الحالي:' : 'Active Analysis Station:'}
          </span>
          <select
            value={selectedStation.station_id}
            onChange={(e) => {
              const found = stations.find((s) => s.station_id === e.target.value);
              if (found) setSelectedStation(found);
            }}
            className="bg-slate-900 text-cyan-300 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-400"
          >
            {stations.map((st) => (
              <option key={st.station_id} value={st.station_id}>
                {st.station_name} ({st.governorate}) {st.is_gridded ? '[CHIRPS Grid]' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{isAr ? 'الإحداثيات:' : 'Coords:'} {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E</span>
          <span>•</span>
          <span>{isAr ? 'الارتفاع:' : 'Elevation:'} {selectedStation.elevation_m} م</span>
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Record Length */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'فترة السجل' : 'Record Period'}</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {records.length > 0 
              ? `${Math.round(records.length / 365.25)} ${isAr ? 'سنة' : 'Years'}`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-400">
            {records.length > 0 
              ? `${records[0]?.date.split('-')[0]} – ${records[records.length - 1]?.date.split('-')[0]} (${records.length} ${isAr ? 'يوم' : 'days'})`
              : (isAr ? 'لا توجد بيانات' : 'No data')}
          </div>
        </div>

        {/* Card 2: Annual Completeness */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'نسبة الاكتمال' : 'Completeness'}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {(100 - qualityReport.missing_percentage).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">
            {qualityReport.total_missing} {isAr ? 'قيمة مفقودة' : 'missing'}
          </div>
        </div>

        {/* Card 3: Max Daily Observed */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'أعلى هطول يومي' : 'Max Observed'}</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-300">
            {qualityReport.max_rainfall.toFixed(1)} <span className="text-xs font-normal text-slate-400">مم</span>
          </div>
          <div className="text-[11px] text-slate-400">{isAr ? 'سجل الرصد التاريخي' : 'Historical peak'}</div>
        </div>

        {/* Card 4: Best Fitted Model */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'النموذج الأمثل' : 'Best Model'}</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300">{bestModel}</div>
          <div className="text-[11px] text-slate-400">AIC: {Math.min(gevFit.aic, gumbelFit.aic).toFixed(1)}</div>
        </div>

        {/* Card 5: Return Level 50 yr */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'مطر 50 سنة' : '50-Yr Level'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-300">
            {t50 ? t50.return_level_mm.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">مم</span>
          </div>
          <div className="text-[11px] text-slate-400">
            CI: {t50 ? `${t50.lower_ci_mm} – ${t50.upper_ci_mm}` : '—'}
          </div>
        </div>

        {/* Card 6: Return Level 100 yr */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'مطر 100 سنة' : '100-Yr Level'}</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-300">
            {t100 ? t100.return_level_mm.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">مم</span>
          </div>
          <div className="text-[11px] text-slate-400">
            CI: {t100 ? `${t100.lower_ci_mm} – ${t100.upper_ci_mm}` : '—'}
          </div>
        </div>
      </div>

      {/* Main Grid: Return Levels Table & Storm Daniel Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Return Levels Summary Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'مستويات وفترات الرجوع المحسوبة حتمياً' : 'Calculated Return Levels & Confidence Intervals'}
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('return_levels')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>{isAr ? 'المنحنى التفصيلي' : 'Detailed Curve'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/40">
                  <th className="py-2 px-3 text-start">{isAr ? 'فترة الرجوع (T)' : 'Period (T)'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'الاحتمال السنوي' : 'Annual Exceedance'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'مستوى الهطول' : 'Return Level'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'حد الثقة 95% الأدنى' : 'Lower 95% CI'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'حد الثقة 95% الأعلى' : 'Upper 95% CI'}</th>
                  <th className="py-2 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {returnLevels.map((rl) => (
                  <tr key={rl.return_period_years} className="hover:bg-slate-750/50">
                    <td className="py-2 px-3 font-bold text-white">
                      {rl.return_period_years} {isAr ? 'سنة' : 'years'}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {((1 / rl.return_period_years) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 font-bold text-cyan-300">
                      {rl.return_level_mm.toFixed(1)} مم
                    </td>
                    <td className="py-2 px-3 text-slate-300">{rl.lower_ci_mm.toFixed(1)} مم</td>
                    <td className="py-2 px-3 text-slate-300">{rl.upper_ci_mm.toFixed(1)} مم</td>
                    <td className="py-2 px-3 text-center">
                      {rl.extrapolation_warning ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {isAr ? 'استقراء' : 'Extrap'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {isAr ? 'موثوق' : 'Valid'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              {isAr
                ? 'الحسابات منفذة وفق خوارزمية L-Moments ومحاكاة Bootstrap البارامترية (5000 تكرار).'
                : 'Computed via deterministic L-Moments and Parametric Bootstrap.'}
            </span>
            <span className="text-amber-400 font-medium">د. أمل معتوق</span>
          </div>
        </div>

        {/* Storm Daniel Spotlight Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-indigo-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'دراسة حالة: عاصفة دانيال (سبتمبر 2023)' : 'Case Study: Storm Daniel (Sept 2023)'}
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('storm_events')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <span>{isAr ? 'تفاصيل العاصفة' : 'Details'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'إعصار متوسطي شبيه بالاستوائي (Medicane) تشكل فوق البحر الأيوني ثم تحرك نحو السواحل الشمالية لمصر. سجلت المحطة الساحلية الغربية ذروة بلغت 62.4 مم/يوم.'
              : 'Subtropical Mediterranean cyclone that impacted Western North Coast of Egypt, recording peak daily rainfall of 62.4 mm/day.'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'إجمالي الحدث' : 'Event Total'}</span>
              <span className="text-base font-bold text-white">78.6 مم</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'أعلى ساعة' : 'Max 1-Hour'}</span>
              <span className="text-base font-bold text-rose-300">24.5 مم/س</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'الترتيب التاريخي' : 'Historical Rank'}</span>
              <span className="text-base font-bold text-amber-300">المركز الثاني (2nd)</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'فترة الرجوع المقدرة' : 'Est. Return Period'}</span>
              <span className="text-base font-bold text-cyan-300">~ 48 سنة</span>
            </div>
          </div>

          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>
              {isAr
                ? 'القيمة تقع قرب مستوى الرجوع المقدر لـ 50 سنة وفق نموذج GEV المقدر، مع نطاق عدم يقين من 32 إلى 75 سنة.'
                : 'Event magnitude aligns closely with 50-year return level (95% CI: 32–75 yrs).'}
            </span>
          </div>
        </div>
      </div>

      {/* Network Stations Quick Grid */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'شبكة محطات الرصد المناخي المدرجة بالمنصة' : 'Monitored Egyptian Weather Stations'}
            </h3>
          </div>
          <button
            onClick={() => setCurrentTab('maps')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>{isAr ? 'عرض خريطة مصر التفاعلية' : 'Interactive Egypt Map'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stations.map((st) => (
            <div
              key={st.station_id}
              onClick={() => setSelectedStation(st)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                st.station_id === selectedStation.station_id
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{st.station_name}</span>
                    {st.is_gridded && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        شبكي
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {st.governorate} • {st.latitude.toFixed(2)}°N, {st.longitude.toFixed(2)}°E
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {st.station_id}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{st.start_date.substring(0, 4)} – {st.end_date.substring(0, 4)}</span>
                <span className="text-cyan-400 font-medium">{st.instrument_type.split('+')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
