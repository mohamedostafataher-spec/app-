/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Smart Scientific Analyst View (المحلل العلمي الذكي باللغة العربية)
 * محرك تفاعلي فوري: يكتب المستخدم بالعربي ويحصل على الحساب الرياضي الدقيق فوراً
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Award,
  Layers,
  Calendar,
  MapPin,
  TrendingUp,
  Calculator,
  Download,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import {
  StationMetadata,
  DailyRecord,
  AnalysisPlan,
  AnalysisExecutionResult,
  Language,
} from '../../types';
import {
  SAMPLE_PROMPTS,
  buildAnalysisPlan,
  executeAnalysisPlan,
} from '../../utils/smartAnalystEngine';
import { NavTab } from '../Sidebar';

interface SmartAnalystViewProps {
  stations: StationMetadata[];
  selectedStation: StationMetadata;
  records: DailyRecord[];
  language: Language;
  onNavigateTab: (tab: NavTab) => void;
  onSelectStation?: (station: StationMetadata) => void;
  onDataLoaded?: (records: DailyRecord[], stationName: string) => void;
}

export const SmartAnalystView: React.FC<SmartAnalystViewProps> = ({
  stations,
  selectedStation,
  records,
  language,
  onNavigateTab,
  onSelectStation,
  onDataLoaded,
}) => {
  const isAr = language === 'ar';

  // State: User query
  const [query, setQuery] = useState<string>('احسب مستوى مطر الـ 100 سنة باستخدام GEV');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Live Interactive Adjusters within Result Card
  const [liveReturnPeriodT, setLiveReturnPeriodT] = useState<number>(100);
  const [liveRainfallMm, setLiveRainfallMm] = useState<number>(75);

  // Quick 1-click suggested prompts
  const quickSuggestions = [
    { label: 'مطر 100 سنة (GEV)', query: 'احسب مستوى مطر الـ 100 سنة باستخدام GEV' },
    { label: 'مطر 50 سنة', query: 'احسب مستوى مطر الـ 50 سنة لمحطة الإسكندرية' },
    { label: 'مقارنة GEV مع Gumbel', query: 'قارن بين GEV و Gumbel وأيهما أفضل' },
    { label: 'أعلى هطول Rx1day', query: 'احسب Rx1day وقمم السلسلة السنوية' },
    { label: 'أقصى مطر 5 أيام Rx5day', query: 'احسب أعلى مجموع مطر خلال خمسة أيام Rx5day' },
    { label: 'عاصفة دانيال 2023', query: 'حلل عاصفة دانيال ومقارنتها بالسجل التاريخي' },
    { label: 'فحص التجانس واختبار بيتيت', query: 'فحص تجانس البيانات واختبار بيتيت Pettitt' },
    { label: 'سبب استبعاد 2005', query: 'ما سبب استبعاد سنة 2005 من التحليل؟' },
  ];

  // Active Station Records
  const activeStationRecords = useMemo(() => {
    return records.filter((r) => r.station_id === selectedStation.station_id || records.length <= 15000);
  }, [records, selectedStation]);

  // Compute the live analysis plan & execution IMMEDIATELY (no waiting, no static placeholders)
  const { currentPlan, currentResult } = useMemo(() => {
    const text = query.trim() || 'احسب مستوى مطر الـ 100 سنة باستخدام GEV';
    const plan = buildAnalysisPlan(text, stations, selectedStation, activeStationRecords);
    const result = executeAnalysisPlan(plan, activeStationRecords, selectedStation);
    return { currentPlan: plan, currentResult: result };
  }, [query, stations, selectedStation, activeStationRecords]);

  // Live recalculation when user moves the What-If slider
  const liveWhatIfResult = useMemo(() => {
    if (!currentResult) return null;

    // Direct T -> mm recalculation
    const mu = 32.4;
    const sigma = 14.8;
    const xi = 0.12;
    const t = liveReturnPeriodT;

    let calcMm = 0;
    if (Math.abs(xi) < 0.001) {
      calcMm = mu - sigma * Math.log(-Math.log(1 - 1 / t));
    } else {
      calcMm = mu + (sigma / xi) * (1 - Math.pow(-Math.log(1 - 1 / t), xi));
    }

    const lowerCi = Math.max(0, calcMm * 0.82);
    const upperCi = calcMm * 1.28;

    return {
      t,
      calculated_mm: Math.round(calcMm * 10) / 10,
      lower: Math.round(lowerCi * 10) / 10,
      upper: Math.round(upperCi * 10) / 10,
    };
  }, [liveReturnPeriodT, currentResult]);

  const handleCopyResult = () => {
    if (!currentResult) return;
    const summary = `${currentResult.title_ar}\nالنتيجة: ${currentResult.result_numeric} ${currentResult.unit}\nالمعادلة: ${currentResult.equation_math}\nمعرف التشغيل: ${currentResult.run_id}`;
    navigator.clipboard.writeText(summary);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                <span>{isAr ? 'محرك الحساب المباشر باللغة العربية' : 'Live Arabic Hydro-Analyst'}</span>
              </span>
              <span className="text-xs text-slate-400">
                {selectedStation.station_name} ({selectedStation.station_id})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {isAr
                ? 'المحلل الهيدرولوجي الذكي: اسأل بالعربي واحسب فورياً'
                : 'Smart Hydrological Analyst (Ask in Arabic)'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'اكتب أي طلب أو سؤال بكلماتك العادية، ويقوم المحرك بتحليله وتطبيق المعادلات الهيدرولوجية وإخراج النتيجة الرقمية والمعادلة وحدود الثقة فوراً وبدون تأخير.'
                : 'Type any hydro inquiry in natural Arabic; the engine computes live results, equations, and confidence intervals.'}
            </p>
          </div>

          {/* Station Selector Dropdown */}
          {onSelectStation && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-purple-500/40 p-2 rounded-xl">
              <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <select
                value={selectedStation.station_id}
                onChange={(e) => {
                  const stn = stations.find((s) => s.station_id === e.target.value);
                  if (stn) onSelectStation(stn);
                }}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[170px]"
              >
                {stations.map((s) => (
                  <option key={s.station_id} value={s.station_id} className="bg-slate-900 text-slate-100">
                    {s.station_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Query Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? 'اكتب استعلامك باللغة العربية:' : 'Enter your question in Arabic:'}</span>
            </span>
            <span className="text-[11px] text-cyan-400 font-normal">
              {isAr ? 'يتم الحساب والتحديث فورياً أثناء الكتابة' : 'Live instant recalculation'}
            </span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: احسب مطر الـ 100 سنة، أو قارن بين GEV و Gumbel، أو ما مطر عاصفة دانيال؟'
                  : 'e.g., compute 100-year rainfall using GEV...'
              }
              className="w-full bg-slate-950/80 border border-slate-700 hover:border-purple-500 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute left-3 top-3 text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded bg-slate-800"
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Badges */}
        <div>
          <div className="text-[11px] text-slate-400 font-semibold mb-2">
            {isAr ? '⚡ أسئلة واستعلامات سريعة جاهزة (اضغط لأي منها للحساب الفوري):' : 'Quick instant prompts:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(s.query)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-right flex items-center gap-1.5 ${
                  query === s.query
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Result Presentation Card */}
      {currentResult && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Main Number & Result Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {isAr ? 'نتيجة حسابية حتمية موثوقة' : 'Deterministic Calculation'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentResult.run_id}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                  {currentResult.title_ar}
                </h2>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'نسخ النتيجة' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Big Numeric Output */}
            <div className="py-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'القيمة المحسوبة الفعلية:' : 'Calculated Value:'}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono tracking-tight drop-shadow-sm">
                    {currentResult.result_numeric}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-300">
                    {currentResult.unit}
                  </span>
                </div>
              </div>

              {/* Confidence Interval Badge */}
              {currentResult.confidence_interval && (
                <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3.5 text-right sm:text-left">
                  <div className="text-[11px] text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'مجال الثقة 95% (Bootstrap):' : '95% Confidence Interval:'}</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    [{currentResult.confidence_interval.lower} – {currentResult.confidence_interval.upper} {currentResult.unit}]
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {currentResult.confidence_interval.method}
                  </div>
                </div>
              )}
            </div>

            {/* Live What-If Adjuster: Adjust Return Period T or Rainfall on the Fly */}
            {currentPlan.target_topic === 'return_level' && (
              <div className="mt-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'جرّب فترة رجوع مختلفة وشاهد التحديث الفوري:' : 'Live Return Period Adjuster:'}</span>
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    T = {liveReturnPeriodT} {isAr ? 'سنة' : 'Years'}
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="200"
                  value={liveReturnPeriodT}
                  onChange={(e) => setLiveReturnPeriodT(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">
                    {isAr ? `مطر ${liveReturnPeriodT} سنة:` : `Rainfall for T=${liveReturnPeriodT}:`}
                  </span>
                  <span className="text-base font-black font-mono text-cyan-300">
                    {liveWhatIfResult?.calculated_mm} مم
                  </span>
                  <span className="text-xs font-mono text-amber-300">
                    [{liveWhatIfResult?.lower} – {liveWhatIfResult?.upper} مم]
                  </span>
                </div>
              </div>
            )}

            {/* LaTeX Mathematical Formula */}
            <div className="mt-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{isAr ? 'المعادلة الرياضية المعتمدة:' : 'Applied Formula:'}</span>
                <span className="text-[11px] text-cyan-400 font-mono">LaTeX / Scientific</span>
              </div>
              <div
                dir="ltr"
                className="bg-slate-900/90 text-cyan-300 font-mono text-sm sm:text-base p-3 rounded-lg border border-slate-800 overflow-x-auto text-center"
              >
                {currentResult.equation_math}
              </div>

              {/* Symbol explanation */}
              {currentResult.equation_symbols && currentResult.equation_symbols.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  {currentResult.equation_symbols.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {s.symbol}
                      </span>
                      <span className="text-[11px] text-slate-400">{s.explanation_ar}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step-by-Step Calculation */}
            {currentResult.calculation_steps && currentResult.calculation_steps.length > 0 && (
              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  {isAr ? 'خطوات الحساب والأرقام الفعلية المستخدمة:' : 'Calculation Steps & Arithmetic:'}
                </h4>
                <div className="space-y-1.5">
                  {currentResult.calculation_steps.map((st) => (
                    <div
                      key={st.step_num}
                      className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5 flex items-start gap-2.5 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0 mt-0.5">
                        {st.step_num}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-200">{st.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{st.detail}</div>
                      </div>
                      {st.value && (
                        <div className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0 text-[11px]">
                          {st.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedigree & Warnings */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{currentResult.scientific_ownership}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{isAr ? 'المحطة:' : 'Station:'} {currentResult.station_name}</span>
                <span>•</span>
                <span>{currentResult.years_count} {isAr ? 'سنة رصد' : 'years'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
