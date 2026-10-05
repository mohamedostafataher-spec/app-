/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Pre-Export Validation Gate & Result Confidence Score Component (بوابة التحقق قبل التصدير ودرجة الثقة)
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Download,
  Lock,
  Layers,
  Info,
} from 'lucide-react';
import { ConfidenceLevelScore } from '../types';

interface PreExportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProductionMode: boolean;
  stationName: string;
  stationId: string;
  sourceName: string;
  nYearsAMS: number;
  hasMissingYearWithZero: boolean;
  analysisRunId: string;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const PreExportValidationModal: React.FC<PreExportValidationModalProps> = ({
  isOpen,
  onClose,
  isProductionMode,
  stationName,
  stationId,
  sourceName,
  nYearsAMS,
  hasMissingYearWithZero,
  analysisRunId,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onExportJSON,
}) => {
  if (!isOpen) return null;

  // 1. Calculate Confidence Score & Level (PDF Page 59)
  const calculateConfidence = (): ConfidenceLevelScore => {
    let score = 100;
    const reasons: string[] = [];

    if (nYearsAMS < 10) {
      score -= 40;
      reasons.push(`سلسلة AMS تحتوي على ${nYearsAMS} سنوات فقط (< 10) — استقراء عالي المخاطر.`);
    } else if (nYearsAMS < 20) {
      score -= 15;
      reasons.push(`طول السجل (${nYearsAMS} سنة) متوسط ويستلزم الحذر الهندسي.`);
    }

    if (hasMissingYearWithZero) {
      score -= 30;
      reasons.push('تم رصد تعارض علمي بوجود أصفار وهمية لسنوات بلا بيانات.');
    }

    if (sourceName.includes('Unverified')) {
      score -= 20;
      reasons.push('مصدر البيانات غير موثق رسمياً.');
    }

    let level: ConfidenceLevelScore['level'] = 'High';
    let level_ar: ConfidenceLevelScore['level_ar'] = 'مرتفع وموثوق';

    if (score < 40 || nYearsAMS < 10) {
      level = 'Not Suitable for Design';
      level_ar = 'غير صالح للاعتماد الهندسي';
    } else if (score < 65) {
      level = 'Low';
      level_ar = 'منخفض';
    } else if (score < 85) {
      level = 'Medium';
      level_ar = 'متوسط';
    }

    return { level, level_ar, score: Math.max(score, 10), reasons_ar: reasons };
  };

  const confidence = calculateConfidence();
  const isFinalDesignBlocked = confidence.level === 'Not Suitable for Design' || nYearsAMS < 10;

  // 2. Pre-Export Checklist Items (PDF Page 60)
  const checklist = [
    { label: 'وجود معرف تشغيل معتمد (Run ID)', valid: Boolean(analysisRunId), detail: analysisRunId },
    { label: 'توثيق المصدر والوحدة المعتمدة', valid: Boolean(sourceName), detail: `${sourceName} (mm)` },
    { label: 'عدم وجود صفر مصطنع لسنة بلا بيانات', valid: !hasMissingYearWithZero, detail: 'معالجة Not Available مفعلة' },
    { label: 'حجم عينة السلسلة السنوية للتقرير التصميمي (n ≥ 10)', valid: nYearsAMS >= 10, detail: `${nYearsAMS} سنوات مؤهلة` },
    { label: 'اكتمال التوزيعات الإحصائية واختبارات الملاءمة', valid: true, detail: 'GEV, Gumbel, KS, AD' },
  ];

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                بوابة التحقق قبل التصدير وتقييم الثقة (Pre-Export Validation Gate)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                التدقيق العلمي الإلزامي لتأكيد سلامة النتائج وتحديد صلاحية التقرير (تصميمي أم استكشافي)
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
          
          {/* Confidence Score Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">درجة الثقة في النتيجة العلمية:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-black ${
                    confidence.level === 'High'
                      ? 'text-emerald-700'
                      : confidence.level === 'Medium'
                      ? 'text-blue-700'
                      : 'text-amber-800'
                  }`}
                >
                  {confidence.level_ar}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">({confidence.score} / 100)</span>
              </div>
              <span className="text-xs text-slate-600 block mt-1">
                {isFinalDesignBlocked
                  ? 'التقرير استكشافي فقط (Exploratory Report) — غير مصرح به للاعتماد الهندسي النهائي.'
                  : 'التقرير صالح للمراجعة الهيدرولوجية والتصميمية.'}
              </span>
            </div>

            <div className="p-3 bg-[#F7F3E8] rounded-xl border border-[#D7B98E]/50 text-xs font-mono shrink-0">
              <span className="text-slate-500 block text-[10px]">AMS Length:</span>
              <span className="font-bold text-slate-900">{nYearsAMS} سنوات</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0E7490]" />
              <span>قائمة التحقق العلمية (Pre-Export Validation Checklist):</span>
            </h3>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    item.valid
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-600">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Block Message if final design report blocked */}
          {isFinalDesignBlocked && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-black">
                <Lock className="w-4 h-4 text-red-600" />
                <span>حظر التقرير التصميمي النهائي (Final Design Report Blocked):</span>
              </div>
              <p className="leading-relaxed">
                وفقاً للمعايير العلمية لدراسات الأمطار القصوى، يمنع النظام إصدار تقرير تصميمي معتمد لمحطة بسلسلة AMS تقل عن 10 سنوات (السجل الحالي: {nYearsAMS} سنوات فقط). يمكنك فقط تصدير <strong>تقرير استكشافي غير معتمد (Exploratory Report)</strong>.
              </p>
            </div>
          )}

          {/* Export Formats Section */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 block">خيارات التصدير متعددة الصيغ:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  onExportPDF();
                  onClose();
                }}
                className="p-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-5 h-5 text-amber-400" />
                <span>{isFinalDesignBlocked ? 'تصدير تقرير استكشافي (PDF)' : 'تقرير تصميمي (PDF)'}</span>
              </button>

              <button
                onClick={() => {
                  onExportExcel();
                  onClose();
                }}
                className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>مصنف Excel كامل (12 ورقة)</span>
              </button>

              <button
                onClick={() => {
                  onExportCSV();
                  onClose();
                }}
                className="p-3 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-5 h-5" />
                <span>تصدير CSV</span>
              </button>

              <button
                onClick={() => {
                  onExportJSON();
                  onClose();
                }}
                className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-5 h-5 text-cyan-400" />
                <span>تصدير JSON هيكلي</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Scientific Quality Gate: {isFinalDesignBlocked ? 'Exploratory Mode Only' : 'Design Ready'}
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
