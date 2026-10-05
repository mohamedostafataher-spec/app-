/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Arabic Natural Language Query Parser Component (محلل الطلبات الذكي باللغة العربية)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Send,
  FileText,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StructuredArabicPlan, DailyRecord } from '../types';
import { computeManualListCalculation } from '../utils/statisticalEngine';

interface ArabicQueryParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStationId: string;
  currentStationName: string;
  onExecutePlan: (plan: StructuredArabicPlan) => void;
}

export const ArabicQueryParserModal: React.FC<ArabicQueryParserModalProps> = ({
  isOpen,
  onClose,
  currentStationId,
  currentStationName,
  onExecutePlan,
}) => {
  const [queryText, setQueryText] = useState<string>(
    'احسب أعلى مجموع مطر خلال 3 أيام لمحطة القاهرة بين 1900 و 1908'
  );
  const [parsedPlan, setParsedPlan] = useState<StructuredArabicPlan | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  if (!isOpen) return null;

  // Deterministic Arabic Parser
  const parseArabicQuery = (text: string): StructuredArabicPlan => {
    const q = text.trim();
    let analysis: StructuredArabicPlan['analysis'] = 'Summary';
    let model: 'GEV' | 'Gumbel' | null = null;
    let unit = 'mm';
    let dateStart = '';
    let dateEnd = '';
    let stnId = currentStationId;
    let stnName = currentStationName;
    const outputs = ['result', 'formula', 'steps', 'warnings'];

    // Detect station in text
    if (q.includes('القاهرة')) {
      stnId = 'EGE00147727';
      stnName = 'القاهرة العباسية (CAIRO ABBASSIA)';
    } else if (q.includes('الإسكندرية') || q.includes('اسكندرية')) {
      stnId = 'ALX01';
      stnName = 'الإسكندرية النزهة';
    }

    // Detect dates/years
    const yearMatches = q.match(/\b(19\d\d|20\d\d)\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      dateStart = `${yearMatches[0]}-01-01`;
      dateEnd = `${yearMatches[1]}-12-31`;
    } else if (yearMatches && yearMatches.length === 1) {
      dateStart = `${yearMatches[0]}-01-01`;
      dateEnd = `${yearMatches[0]}-12-31`;
    }

    // Detect analysis index
    if (q.includes('Rx3day') || q.includes('3 أيام') || q.includes('ثلاثة أيام') || q.includes('ثلاث ايام')) {
      analysis = 'Rx3day';
    } else if (q.includes('Rx5day') || q.includes('5 أيام') || q.includes('خمسة أيام') || q.includes('خمس ايام')) {
      analysis = 'Rx5day';
    } else if (q.includes('Rx1day') || q.includes('يومي') || q.includes('أعلى يوم') || q.includes('اعلى يوم') || q.includes('أقصى مطر')) {
      analysis = 'Rx1day';
    } else if (q.includes('GEV') || q.includes('Gumbel') || q.includes('جامبل') || q.includes('توزيع')) {
      analysis = 'GEV_Gumbel';
      if (q.includes('GEV')) model = 'GEV';
      else if (q.includes('Gumbel') || q.includes('جامبل')) model = 'Gumbel';
    } else if (q.includes('فترة الرجوع') || q.includes('فترات الرجوع') || q.includes('Return Level') || q.includes('100 سنة') || q.includes('50 سنة')) {
      analysis = 'ReturnLevel';
    } else if (q.includes('دانيال') || q.includes('عاصفة')) {
      analysis = 'DanielStorm';
    }

    return {
      station_id: stnId,
      station_name: stnName,
      date_start: dateStart || undefined,
      date_end: dateEnd || undefined,
      analysis,
      model,
      unit,
      confidence_level: 0.95,
      outputs,
      user_query: q,
      warnings: !dateStart ? ['لم يتم تحديد فترة زمنية صريحة؛ سيتم استخدام كامل السجل المتاح للمحطة.'] : undefined,
    };
  };

  const handleParseQuery = () => {
    const plan = parseArabicQuery(queryText);
    setParsedPlan(plan);
    setIsApproved(false);
    setExecutionResult(null);
  };

  const handleConfirmAndExecute = () => {
    if (!parsedPlan) return;
    setIsApproved(true);

    // If query has inline numbers like: 10, 25, 4, 36, 18
    const inlineNumbers = queryText.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (inlineNumbers && inlineNumbers.length >= 3 && !queryText.includes('1900') && !queryText.includes('2020')) {
      const nums = inlineNumbers.map(Number).filter((n) => !isNaN(n));
      const res = computeManualListCalculation(nums, parsedPlan.analysis === 'Rx3day' ? 'Rx3day' : 'Rx1day');
      setExecutionResult({
        type: 'inline_calculation',
        result: res.result,
        formula: res.formula,
        steps: res.steps,
      });
    } else {
      onExecutePlan(parsedPlan);
      setExecutionResult({
        type: 'pipeline_dispatched',
        message: `تم تحويل الطلب واعتماده بنجاح وتوجيهه إلى المسار الهيدرولوجي لمؤشر ${parsedPlan.analysis}.`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                محلل ومنشئ الطلبات الذكي باللغة العربية (Natural Language Parser)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                كتابة طلبات التحليل باللغة الطبيعية وتحويلها إلى خطة منظمة ثم تنفيذها برمجياً بدقة قطعية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F7F9FA]">
          
          {/* Query Input Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-800 block">
              اكتب طلب التحليل بالعربية (مثل: حساب مؤشر، مقارنة نماذج، عاصفة، أو قيم معينة):
            </label>
            <div className="flex gap-2">
              <textarea
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  setParsedPlan(null);
                }}
                rows={2}
                className="flex-1 p-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                placeholder="اكتب طلبك هنا..."
              />
              <button
                onClick={handleParseQuery}
                className="px-5 bg-[#0E7490] hover:bg-[#12304A] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>تحليل الطلب</span>
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-bold">أمثلة معيارية:</span>
              {[
                'احسب أعلى مجموع مطر خلال 3 أيام لمحطة القاهرة بين 1900 و 1908',
                'احسب Rx1day للقيم 10, 25, 4, 36, 18',
                'قارن GEV و Gumbel لهذه السلسلة السنوية',
                'احسب Return Level لمدة 100 سنة مع حدود الثقة',
                'حلل عاصفة دانيال من 8 إلى 12 سبتمبر 2023',
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQueryText(ex);
                    setParsedPlan(parseArabicQuery(ex));
                  }}
                  className="text-[10px] px-2.5 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-bold cursor-pointer"
                >
                  {ex.slice(0, 35)}...
                </button>
              ))}
            </div>
          </div>

          {/* Understood Your Request Plan (Mandatory from PDF pages 14, 54, 55) */}
          {parsedPlan && (
            <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>فهمت طلبك — خطة التحليل المنظمة قبل الاعتماد (Pre-Execution Plan):</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F7F3E8] p-4 rounded-xl border border-[#D7B98E]/50">
                <div>
                  <span className="text-[10px] text-slate-500 block">المحطة:</span>
                  <span className="font-bold text-slate-900">{parsedPlan.station_name || currentStationName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المؤشر أو التحليل:</span>
                  <span className="font-bold text-[#0E7490]">{parsedPlan.analysis}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الوحدة المعتمدة:</span>
                  <span className="font-bold text-slate-900">مليمتر (mm)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الفترة الزمنية:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {parsedPlan.date_start && parsedPlan.date_end
                      ? `${parsedPlan.date_start} إلى ${parsedPlan.date_end}`
                      : 'كامل السجل'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">مستوى الثقة:</span>
                  <span className="font-mono font-bold text-slate-900">95%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المخرجات:</span>
                  <span className="font-bold text-slate-700">القيمة، المعادلة، الخطوات، والتحذيرات</span>
                </div>
              </div>

              {/* Structured JSON representation */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Structured Plan JSON:
                </span>
                <pre className="p-3 bg-slate-900 text-cyan-300 rounded-xl font-mono text-[11px] overflow-x-auto" dir="ltr">
                  {JSON.stringify(parsedPlan, null, 2)}
                </pre>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleConfirmAndExecute}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>اعتماد وتنفيذ (Confirm & Execute)</span>
                </button>
              </div>

              {/* Result Area if executed */}
              {isApproved && executionResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 block">تم التنفيذ بنجاح:</span>
                  {executionResult.type === 'inline_calculation' ? (
                    <div>
                      <div className="text-xl font-black text-emerald-700 font-mono">
                        {executionResult.result} مم
                      </div>
                      <div className="text-slate-700 font-mono text-[11px] mt-1">{executionResult.formula}</div>
                    </div>
                  ) : (
                    <div className="text-emerald-800 font-medium">{executionResult.message}</div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Deterministic Natural Language Pipeline | No LLM Hallucinations for Math
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
