import React from 'react';
import { X, Calculator, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CalculationStepExplanation } from '../types';

interface CalculationStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CalculationStepExplanation | null;
}

export const CalculationStepsModal: React.FC<CalculationStepsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !data) return null;

  const handleCopy = () => {
    const text = `${data.title_ar}\n\nالمعادلة العامة:\n${data.general_formula}\n\nصيغة LaTeX:\n${data.latex_formula}\n\nالقيم المستخدمة والتعويض العددي:\n${data.numerical_substitution}\n\nالنتيجة النهائية: ${data.final_result} ${data.unit}\nالمصدر: ${data.data_source}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{data.title_ar}</h3>
              <p className="text-[11px] text-slate-400">شرح خطوات الحساب والتعويض العددي المباشر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* 1. General Formula */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. المعادلة العامة المعتمدة</span>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm font-bold text-blue-900 text-center ltr" dir="ltr">
              {data.general_formula}
            </div>
          </div>

          {/* 2. LaTeX Representation */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. صيغة LaTeX للتوثيق الأكاديمي</span>
            <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto ltr" dir="ltr">
              {data.latex_formula}
            </div>
          </div>

          {/* 3. Parameters Used */}
          {data.parameters && data.parameters.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">3. القيم والمتغيرات المستخدمة</span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">المتغير</th>
                      <th className="p-2.5">الرمز</th>
                      <th className="p-2.5">القيمة</th>
                      <th className="p-2.5">الوحدة</th>
                      <th className="p-2.5">الوصف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                        <td className="p-2.5 font-mono text-blue-600 font-bold">{p.symbol}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{p.value}</td>
                        <td className="p-2.5 text-slate-500">{p.unit || '—'}</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{p.description_ar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Step-by-Step Numerical Substitution */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">4. التعويض العددي خطوة بخطوة</span>
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl whitespace-pre-line text-xs font-mono font-medium text-amber-950 leading-relaxed">
              {data.numerical_substitution}
            </div>
          </div>

          {/* 5. Final Result & Unit */}
          <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-300 uppercase block mb-1">النتيجة النهائية المحسوبة</span>
              <div className="text-2xl font-black font-mono tracking-tight text-white">
                {data.final_result} <span className="text-sm font-sans text-blue-300">{data.unit}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          {/* 6. Provenance & Warnings */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] p-2 bg-slate-50 rounded-xl">
              <span>مصدر البيانات:</span>
              <span className="font-bold text-slate-700">{data.data_source}</span>
            </div>
            {data.warnings && data.warnings.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
                {data.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-red-700 text-[11px] font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ بنجاح' : 'نسخ الخطوات والـ LaTeX'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
