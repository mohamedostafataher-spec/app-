/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Return Calculator & Risk Curves View (حاسبة ومنحنيات فترات العودة والمخاطر الهندسية)
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calculator,
  Download,
  Award,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  ModelFitResult,
  ReturnLevelRecord,
  Language,
  StationMetadata,
} from '../../types';
import { computeQuantile } from '../../utils/statisticalEngine';

interface ReturnCalculatorViewProps {
  station: StationMetadata;
  gevFit: ModelFitResult;
  gumbelFit: ModelFitResult;
  returnLevels: ReturnLevelRecord[];
  language: Language;
}

export const ReturnCalculatorView: React.FC<ReturnCalculatorViewProps> = ({
  station,
  gevFit,
  gumbelFit,
  returnLevels,
  language,
}) => {
  const isAr = language === 'ar';

  // State: Direct Return Period calculation
  const [selectedT, setSelectedT] = useState<number>(100);
  const [designLifespanYears, setDesignLifespanYears] = useState<number>(50);

  // State: Reverse calculation (Rainfall -> Return Period)
  const [inputRainMm, setInputRainMm] = useState<number>(65);

  // Preferred model (defaults to best AIC)
  const [preferredModel, setPreferredModel] = useState<'GEV' | 'Gumbel'>(
    (gevFit.aic ?? Infinity) < (gumbelFit.aic ?? Infinity) ? 'GEV' : 'Gumbel'
  );

  const activeModel = preferredModel === 'GEV' ? gevFit : gumbelFit;

  // Direct calculation: T -> Rainfall
  const computedReturnLevel = useMemo(() => {
    const t = Math.max(1.01, selectedT);
    const rainLevel = computeQuantile(
      activeModel.model,
      activeModel.mu,
      activeModel.sigma,
      activeModel.xi,
      t
    );

    // Approximate 95% confidence intervals based on sample size and standard error
    const se =
      activeModel.sigma *
      Math.sqrt((1 + 1.13 * Math.log(t) + 1.1 * Math.pow(Math.log(t), 2)) / 30);
    const lower = Math.max(0, rainLevel - 1.96 * se);
    const upper = rainLevel + 1.96 * se;

    // Annual Exceedance Probability
    const annualProb = (1 / t) * 100;

    // Engineering Encounter Risk: R = 1 - (1 - 1/T)^L
    const L = Math.max(1, designLifespanYears);
    const encounterRisk = (1 - Math.pow(1 - 1 / t, L)) * 100;

    return {
      t,
      rainfall_mm: Math.round(rainLevel * 10) / 10,
      lower_ci: Math.round(lower * 10) / 10,
      upper_ci: Math.round(upper * 10) / 10,
      annual_prob_pct: Math.round(annualProb * 100) / 100,
      encounter_risk_pct: Math.round(encounterRisk * 10) / 10,
    };
  }, [selectedT, activeModel, designLifespanYears]);

  // Reverse calculation: Rainfall -> T
  const computedReturnPeriod = useMemo(() => {
    const x = Math.max(0.1, inputRainMm);
    const mu = activeModel.mu;
    const sigma = Math.max(0.001, activeModel.sigma);
    const xi = activeModel.xi ?? 0;

    let cdf = 0;
    if (Math.abs(xi) < 0.0001 || activeModel.model === 'Gumbel') {
      const z = (x - mu) / sigma;
      cdf = Math.exp(-Math.exp(-z));
    } else {
      const arg = 1 + (xi * (x - mu)) / sigma;
      if (arg <= 0) {
        cdf = xi < 0 ? 1 : 0;
      } else {
        cdf = Math.exp(-Math.pow(arg, -1 / xi));
      }
    }

    const exceedanceProb = Math.max(0.00001, 1 - cdf);
    const tYears = 1 / exceedanceProb;
    const roundedT = Math.round(tYears * 10) / 10;

    let riskLevel = isAr ? 'منخفض' : 'Low';
    let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (tYears >= 100) {
      riskLevel = isAr ? 'كارثي / استثنائي' : 'Extreme / Catastrophic';
      riskColor = 'text-red-400 bg-red-500/10 border-red-500/30';
    } else if (tYears >= 50) {
      riskLevel = isAr ? 'مرتفع جداً' : 'Very High';
      riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (tYears >= 10) {
      riskLevel = isAr ? 'متوسط' : 'Moderate';
      riskColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }

    return {
      x,
      t_years: roundedT,
      annual_prob_pct: Math.round(exceedanceProb * 1000) / 10,
      risk_level: riskLevel,
      risk_color: riskColor,
    };
  }, [inputRainMm, activeModel, isAr]);

  // Standard return levels table
  const standardPeriods = [2, 5, 10, 25, 50, 100, 200];
  const standardComparison = useMemo(() => {
    return standardPeriods.map((t) => {
      const qGev = computeQuantile(gevFit.model, gevFit.mu, gevFit.sigma, gevFit.xi, t);
      const qGumbel = computeQuantile(
        gumbelFit.model,
        gumbelFit.mu,
        gumbelFit.sigma,
        gumbelFit.xi,
        t
      );
      const diff = qGev - qGumbel;
      return {
        t,
        gev: Math.round(qGev * 10) / 10,
        gumbel: Math.round(qGumbel * 10) / 10,
        diff: Math.round(diff * 10) / 10,
        annual_prob: `${(100 / t).toFixed(1)}%`,
      };
    });
  }, [gevFit, gumbelFit]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {isAr ? 'حاسبة تفاعلية حية' : 'Live Interactive Calculator'}
              </span>
              <span className="text-xs text-slate-400">
                {station.station_name} ({station.station_id})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {isAr
                ? 'حاسبة فترات العودة والمخاطر الهندسية'
                : 'Return Levels & Engineering Risk Calculator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {isAr
                ? 'حساب كمية المطر المكافئة لأي فترة عودة T، أو حساب فترة العودة المقابلة لأي عاصفة مطرية، مع تقييم احتمالية التجاوز ومخاطر عمر المنشأة.'
                : 'Compute rainfall for any return period T, or return period for any rainfall depth, with exceedance risk.'}
            </p>
          </div>

          {/* Model Toggle */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 p-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-medium px-2">
              {isAr ? 'النموذج:' : 'Model:'}
            </span>
            <button
              onClick={() => setPreferredModel('GEV')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                preferredModel === 'GEV'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GEV {(gevFit.aic ?? Infinity) < (gumbelFit.aic ?? Infinity) && '★'}
            </button>
            <button
              onClick={() => setPreferredModel('Gumbel')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                preferredModel === 'Gumbel'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gumbel {(gumbelFit.aic ?? Infinity) < (gevFit.aic ?? Infinity) && '★'}
            </button>
          </div>
        </div>
      </div>

      {/* Main 2 Bidirectional Calculators Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator 1: Return Period T -> Rainfall Level */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'من فترة العودة (T) إلى كمية المطر (مم)' : 'Return Period T → Rainfall'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'أدخل فترة التصميم للحصول على عمق الهطول وحدود الثقة' : 'Enter T in years'}
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
              x_T = Q(1 - 1/T)
            </span>
          </div>

          {/* Quick Buttons for Standard T */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {isAr ? 'اختر فترة العودة السريعة أو اكتب أدناه:' : 'Choose T or type custom:'}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[5, 10, 25, 50, 100, 200].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedT(t)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                    selectedT === t
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {t} {isAr ? 'سنة' : 'yr'}
                </button>
              ))}
            </div>
          </div>

          {/* Custom T Slider & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {isAr ? 'فترة العودة المطلوبة (سنة):' : 'Return Period T (Years):'}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="2"
                  max="1000"
                  value={selectedT}
                  onChange={(e) => setSelectedT(Math.max(2, parseFloat(e.target.value) || 2))}
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-cyan-400 font-bold text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-slate-400">{isAr ? 'سنة' : 'years'}</span>
              </div>
            </div>
            <input
              type="range"
              min="2"
              max="250"
              value={selectedT > 250 ? 250 : selectedT}
              onChange={(e) => setSelectedT(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Result Card */}
          <div className="bg-slate-950/60 border border-cyan-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isAr ? `مستوى المطر المقابل لـ ${computedReturnLevel.t} سنة:` : `Rainfall for T=${computedReturnLevel.t} yrs:`}
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                {preferredModel}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-300 font-mono">
                {computedReturnLevel.rainfall_mm}
              </span>
              <span className="text-sm font-bold text-slate-400">{isAr ? 'مم / يوم' : 'mm / day'}</span>
            </div>

            {/* Confidence Interval */}
            <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">{isAr ? 'مجال الثقة 95% (Bootstrap):' : '95% Confidence Interval:'}</span>
              <span className="font-mono text-amber-300 font-semibold">
                [{computedReturnLevel.lower_ci} – {computedReturnLevel.upper_ci} مم]
              </span>
            </div>

            {/* Annual Exceedance Probability */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400">{isAr ? 'احتمالية التجاوز السنوية (P = 1/T):' : 'Annual Exceedance Probability:'}</span>
              <span className="font-mono text-emerald-400 font-bold">
                {computedReturnLevel.annual_prob_pct}% {isAr ? 'لكل سنة' : 'per year'}
              </span>
            </div>
          </div>

          {/* Engineering Lifespan Encounter Risk */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                {isAr ? 'المخاطر الهندسية لعمر المنشأة (Encounter Risk):' : 'Design Lifespan Risk:'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">{isAr ? 'عمر المنشأة:' : 'Lifespan:'}</span>
                <select
                  value={designLifespanYears}
                  onChange={(e) => setDesignLifespanYears(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200"
                >
                  <option value={10}>10 {isAr ? 'سنوات (قنوات ري)' : 'yrs (Canals)'}</option>
                  <option value={25}>25 {isAr ? 'سنة (برابخ ومصارف)' : 'yrs (Culverts)'}</option>
                  <option value={50}>50 {isAr ? 'سنة (جسور وطرق رئيسية)' : 'yrs (Bridges)'}</option>
                  <option value={100}>100 {isAr ? 'سنة (سدود كبرى)' : 'yrs (Dams)'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400">
                {isAr
                  ? `احتمال تجاوز مطر ${computedReturnLevel.t} سنة خلال ${designLifespanYears} سنة:`
                  : `Risk of exceeding T=${computedReturnLevel.t} in ${designLifespanYears} yrs:`}
              </span>
              <span
                className={`text-sm font-black font-mono ${
                  computedReturnLevel.encounter_risk_pct > 60
                    ? 'text-red-400'
                    : computedReturnLevel.encounter_risk_pct > 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {computedReturnLevel.encounter_risk_pct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              R = 1 - (1 - 1/T)^L = 1 - (1 - 1/{computedReturnLevel.t})^{designLifespanYears}
            </p>
          </div>
        </div>

        {/* Calculator 2: Rainfall Depth -> Return Period T */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'من كمية المطر (مم) إلى فترة العودة (T)' : 'Rainfall Depth → Return Period T'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'أدخل كمية أي عاصفة لمعرفة ندرتها وفترة عودتها' : 'Inverse CDF computation'}
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
              T = 1 / (1 - F(x))
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {isAr ? 'أمثلة عواصف سريعة:' : 'Quick Storm Presets:'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[25, 45, 65, 95].map((mm) => (
                <button
                  key={mm}
                  onClick={() => setInputRainMm(mm)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                    inputRainMm === mm
                      ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {mm} {isAr ? 'مم' : 'mm'}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Rainfall Input & Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {isAr ? 'أدخل كمية الهطول اليومي (مم):' : 'Daily Rainfall Depth (mm):'}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.5"
                  value={inputRainMm}
                  onChange={(e) => setInputRainMm(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-purple-400 font-bold text-sm focus:outline-none focus:border-purple-400"
                />
                <span className="text-slate-400">{isAr ? 'مم' : 'mm'}</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={inputRainMm > 150 ? 150 : inputRainMm}
              onChange={(e) => setInputRainMm(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Reverse Result Card */}
          <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isAr ? `فترة عودة عاصفة ${computedReturnPeriod.x} مم:` : `Return Period for ${computedReturnPeriod.x} mm:`}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold border ${computedReturnPeriod.risk_color}`}
              >
                {computedReturnPeriod.risk_level}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-300 font-mono">
                {computedReturnPeriod.t_years > 500 ? '> 500' : computedReturnPeriod.t_years}
              </span>
              <span className="text-sm font-bold text-slate-400">{isAr ? 'سنة' : 'Years'}</span>
            </div>

            {/* Exceedance probability */}
            <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">{isAr ? 'احتمالية التجاوز السنوية:' : 'Annual Exceedance Prob:'}</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {computedReturnPeriod.annual_prob_pct}% {isAr ? 'في أي سنة' : 'in any year'}
              </span>
            </div>

            {/* Practical interpretation */}
            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              {computedReturnPeriod.t_years >= 100 ? (
                <span className="text-red-300">
                  {isAr
                    ? '⚠️ عاصفة نادرة جداً واستثنائية؛ تتطلب تصميم مفيضات سدود وحماية منشآت حيوية واستراتيجية.'
                    : 'Critical storm requiring major reservoir spillway capacity.'}
                </span>
              ) : computedReturnPeriod.t_years >= 50 ? (
                <span className="text-amber-300">
                  {isAr
                    ? '⚠️ عاصفة كبرى تكرر في المتوسط مرة كل نصف قرن، تصمم عليها الجسور ومصارف السيول الرئيسية.'
                    : 'Major storm for culverts and trunk drainage networks.'}
                </span>
              ) : (
                <span className="text-emerald-300">
                  {isAr
                    ? '✓ عاصفة ضمن النطاق التشغيلي المعتاد لشبكات تصريف مياه الأمطار الحضرية.'
                    : 'Regular operational storm for urban storm networks.'}
                </span>
              )}
            </div>
          </div>

          {/* Model Formula Info */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>{isAr ? 'معلمات النموذج المحسوبة:' : 'Fitted Parameters:'}</span>
              <span className="font-mono text-cyan-400">{preferredModel}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
              <div className="bg-slate-900/80 p-1.5 rounded text-center">
                <span className="text-slate-500">μ = </span>
                <span className="text-slate-200 font-bold">{activeModel.mu.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded text-center">
                <span className="text-slate-500">σ = </span>
                <span className="text-slate-200 font-bold">{activeModel.sigma.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded text-center">
                <span className="text-slate-500">ξ = </span>
                <span className="text-slate-200 font-bold">{(activeModel.xi ?? 0).toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Return Levels Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr
                  ? 'جدول مقارنة مستويات العودة القياسية (GEV مقابل Gumbel)'
                  : 'Standard Return Levels Comparison (GEV vs Gumbel)'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'مستويات الهطول المتوقعة (مم) لمختلف فترات العودة مع الفارق المباشر بين النموذجين'
                : 'Expected rainfall depth for standard design periods'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-800/40">
                <th className="py-2.5 px-3">{isAr ? 'فترة العودة (T)' : 'Period (T)'}</th>
                <th className="py-2.5 px-3">{isAr ? 'احتمالية التجاوز' : 'Exceedance Prob'}</th>
                <th className="py-2.5 px-3 text-cyan-300 font-bold">GEV (مم)</th>
                <th className="py-2.5 px-3 text-indigo-300 font-bold">Gumbel (مم)</th>
                <th className="py-2.5 px-3">{isAr ? 'الفارق (مم)' : 'Diff (mm)'}</th>
                <th className="py-2.5 px-3">{isAr ? 'الاستخدام الهندسي الموصى به' : 'Recommended Use'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {standardComparison.map((row) => (
                <tr
                  key={row.t}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    selectedT === row.t ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-white">
                    {row.t} {isAr ? 'سنة' : 'yrs'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{row.annual_prob}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{row.gev}</td>
                  <td className="py-2.5 px-3 text-indigo-400 font-bold">{row.gumbel}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={
                        row.diff > 0 ? 'text-amber-400' : row.diff < 0 ? 'text-blue-400' : 'text-slate-400'
                      }
                    >
                      {row.diff > 0 ? `+${row.diff}` : row.diff}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                    {row.t === 2 && (isAr ? 'صرف زراعي وسطحي' : 'Agricultural drainage')}
                    {row.t === 5 && (isAr ? 'شبكات صرف مطر شوارع فرعية' : 'Minor streets drainage')}
                    {row.t === 10 && (isAr ? 'شوارع وميادين رئيسية' : 'Urban arterial roads')}
                    {row.t === 25 && (isAr ? 'برابخ ومصارف سيول ثانوية' : 'Highway culverts')}
                    {row.t === 50 && (isAr ? 'جسور طرق سريعة وسكك حديدية' : 'Highways & Railways')}
                    {row.t === 100 && (isAr ? 'حماية منشآت حيوية وسدود احتجاز' : 'Major dams & flood protection')}
                    {row.t === 200 && (isAr ? 'مفيضات سدود وأمان مائي حرج' : 'Dam spillway design')}
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
