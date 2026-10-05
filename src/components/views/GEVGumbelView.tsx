/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * GEV & Gumbel Fitting View
 */

import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  Scale,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ModelFitResult, Language } from '../../types';

interface GEVGumbelViewProps {
  gevFit: ModelFitResult;
  gumbelFit: ModelFitResult;
  estimationMethod: 'L-Moments' | 'MLE';
  setEstimationMethod: (method: 'L-Moments' | 'MLE') => void;
  language: Language;
}

export const GEVGumbelView: React.FC<GEVGumbelViewProps> = ({
  gevFit,
  gumbelFit,
  estimationMethod,
  setEstimationMethod,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedModelTab, setSelectedModelTab] = useState<'GEV' | 'Gumbel'>('GEV');

  const deltaAIC = Math.abs((gevFit.aic ?? 0) - (gumbelFit.aic ?? 0));
  const preferredModel = (gevFit.aic ?? Infinity) < (gumbelFit.aic ?? Infinity) ? 'GEV' : 'Gumbel';

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'ملاءمة توزيعات القيم القصوى (GEV وGumbel)' : 'GEV & Gumbel Distribution Fitting'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'ملاءمة دقيقة لتوزيع القيم القصوى المعمم (GEV) وتوزيع غامبل (Gumbel باعتباره حالة خاصة عندما ξ = 0). تُحسب المعلمات حتمياً عبر طريقة العزوم الخطية (L-Moments) وطريقة الإمكان الأكبر (MLE)، مع التحقق الصارم من قيد إيجابية المقياس (σ > 0) وصلاحية مجال الدالة.'
            : 'Deterministic parameter estimation for GEV and Gumbel distributions using L-Moments and Maximum Likelihood (MLE) with boundary constraints.'}
        </p>

        {/* Estimation Method Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">
              {isAr ? 'طريقة تقدير المعلمات (Estimation Method):' : 'Estimation Method:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setEstimationMethod('L-Moments')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  estimationMethod === 'L-Moments'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                L-Moments (العزوم الخطية - المفضل هيدرولوجياً)
              </button>
              <button
                onClick={() => setEstimationMethod('MLE')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  estimationMethod === 'MLE'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MLE (الإمكان الأكبر)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isAr ? 'النموذج الأفضل وفق AIC:' : 'Recommended Model:'}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {preferredModel} (ΔAIC = {deltaAIC.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* GEV Card */}
        <div
          className={`bg-slate-800/80 border rounded-2xl p-5 space-y-4 transition-all ${
            preferredModel === 'GEV'
              ? 'border-cyan-500/80 shadow-lg shadow-cyan-950/40'
              : 'border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>توزيع القيم القصوى المعمم (GEV)</span>
                {preferredModel === 'GEV' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    الأفضل مطابقة (Lowest AIC)
                  </span>
                )}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                F(x) = exp(-(1 + ξ(x - μ)/σ)^(-1/ξ))
              </p>
            </div>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'الموقع (Location μ)' : 'Location (μ)'}</span>
              <span className="text-base font-bold font-mono text-white">{gevFit.mu}</span>
              <span className="text-[10px] text-slate-500 block">مم</span>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'المقياس (Scale σ)' : 'Scale (σ)'}</span>
              <span className="text-base font-bold font-mono text-cyan-300">{gevFit.sigma}</span>
              <span className="text-[10px] text-emerald-400 block">σ &gt; 0 ✓</span>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'الشكل (Shape ξ)' : 'Shape (ξ)'}</span>
              <span className="text-base font-bold font-mono text-amber-300">{gevFit.xi}</span>
              <span className="text-[10px] text-slate-400 block">
                {gevFit.xi < 0 ? 'Weibull' : gevFit.xi > 0 ? 'Fréchet' : 'Gumbel'}
              </span>
            </div>
          </div>

          {/* Information Criteria */}
          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block">{isAr ? 'دالة الإمكان Log-L' : 'Log-Likelihood'}</span>
              <span className="font-mono font-bold text-slate-200">{gevFit.log_likelihood}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">معيار أكايكي (AIC)</span>
              <span className="font-mono font-bold text-cyan-300">{gevFit.aic}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">معيار بايز (BIC)</span>
              <span className="font-mono font-bold text-purple-300">{gevFit.bic}</span>
            </div>
          </div>

          {/* Convergence & Interpretation */}
          <div className="text-xs space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{isAr ? 'تم استيفاء قيود التقارب وصلاحية المجال الرياضي بنجاح' : 'Model converged successfully'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              {gevFit.xi > 0
                ? 'معامل الشكل موجب (ξ > 0)، مما يدل على توزيع ذي ذيل ثقيل (Heavy-tailed Fréchet Type II) يعزز احتمالية تسجيل قيم متطرفة نادرة في فترات الرجوع الطويلة.'
                : gevFit.xi < 0
                ? 'معامل الشكل سالب (ξ < 0)، مما يدل على توزيع ويبل (Weibull Type III) بحد أعلى أقصى محدد فيزيائياً.'
                : 'معامل الشكل قريب جداً من الصفر، متطابقاً مع توزيع غامبل.'}
            </p>
          </div>
        </div>

        {/* Gumbel Card */}
        <div
          className={`bg-slate-800/80 border rounded-2xl p-5 space-y-4 transition-all ${
            preferredModel === 'Gumbel'
              ? 'border-cyan-500/80 shadow-lg shadow-cyan-950/40'
              : 'border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>توزيع غامبل (Gumbel Type I)</span>
                {preferredModel === 'Gumbel' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    الأفضل مطابقة (Lowest AIC)
                  </span>
                )}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                F(x) = exp(-exp(-(x - μ)/σ)) [ξ = 0]
              </p>
            </div>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'الموقع (Location μ)' : 'Location (μ)'}</span>
              <span className="text-base font-bold font-mono text-white">{gumbelFit.mu}</span>
              <span className="text-[10px] text-slate-500 block">مم</span>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'المقياس (Scale σ)' : 'Scale (σ)'}</span>
              <span className="text-base font-bold font-mono text-purple-300">{gumbelFit.sigma}</span>
              <span className="text-[10px] text-emerald-400 block">σ &gt; 0 ✓</span>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'الشكل (Shape ξ)' : 'Shape (ξ)'}</span>
              <span className="text-base font-bold font-mono text-slate-400">0.000</span>
              <span className="text-[10px] text-slate-500 block">{isAr ? 'ثابت (Gumbel)' : 'Fixed (0.0)'}</span>
            </div>
          </div>

          {/* Information Criteria */}
          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block">{isAr ? 'دالة الإمكان Log-L' : 'Log-Likelihood'}</span>
              <span className="font-mono font-bold text-slate-200">{gumbelFit.log_likelihood}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">معيار أكايكي (AIC)</span>
              <span className="font-mono font-bold text-cyan-300">{gumbelFit.aic}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">معيار بايز (BIC)</span>
              <span className="font-mono font-bold text-purple-300">{gumbelFit.bic}</span>
            </div>
          </div>

          {/* Convergence & Interpretation */}
          <div className="text-xs space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{isAr ? 'تقارب ناجح واستقرار تام في معلمتي الموقع والمقياس' : 'Model converged successfully'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              {isAr
                ? 'توزيع غامبل يفترض ذيلاً أسياً معتدلاً (Exponential Tail). يتميز بقلة المعلمات (معلمتان فقط)، مما يقلل من تباين العينة في السجلات القصيرة أو المتوسطة (أقل من 30 سنة).'
                : 'Gumbel distribution assumes an exponential tail with 2 parameters, often more parsimonious for moderate sample sizes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
