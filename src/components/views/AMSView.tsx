/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Annual Maximum Series (AMS) View
 */

import React, { useState } from 'react';
import {
  CalendarDays,
  Download,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AMSRecord, Language } from '../../types';

interface AMSViewProps {
  amsList: AMSRecord[];
  language: Language;
}

export const AMSView: React.FC<AMSViewProps> = ({ amsList, language }) => {
  const isAr = language === 'ar';
  const [selectedIndex, setSelectedIndex] = useState<'Rx1day' | 'Rx3day' | 'Rx5day'>('Rx1day');

  const filtered = amsList.filter((r) => r.index_name === selectedIndex);
  const eligibleCount = filtered.filter((r) => r.eligible_for_model).length;
  const totalYears = filtered.length;

  const exportCSV = () => {
    let csv = 'year,station_id,index_name,maximum_value_mm,start_date,end_date,valid_records,completeness_percentage,eligible_for_model,exclusion_reason\n';
    filtered.forEach((r) => {
      csv += `${r.year},${r.station_id},${r.index_name},${r.maximum_value_mm},${r.start_date},${r.end_date},${r.valid_records},${r.completeness_percentage},${r.eligible_for_model},"${r.exclusion_reason || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AMS_${selectedIndex}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'سلسلة القمم السنوية (Annual Maximum Series - AMS)' : 'Annual Maximum Series (AMS)'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'بناء سلسلة القمم السنوية المستقلة (قيمة واحدة قصوى لكل سنة تقويمية) تمهيداً لملاءمة التوزيعات الاحتمالية للقيم القصوى (GEV وGumbel). لا تدخل السنة غير المكتملة في التحليل الاحتمالي إلا بعد تسجيل القرار.'
            : 'One peak value per calendar year per index. Years falling below completeness threshold are flagged and excluded.'}
        </p>

        {/* Index Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {(['Rx1day', 'Rx3day', 'Rx5day'] as const).map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedIndex === idx
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                }`}
              >
                AMS: {idx}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>تصدير جدول AMS</span>
          </button>
        </div>
      </div>

      {/* Record Length Evaluation Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
          eligibleCount >= 30
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : eligibleCount >= 20
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">
            {eligibleCount >= 30
              ? (isAr ? 'طول السجل مثالي وكافٍ إحصائياً (30 سنة أو أكثر):' : 'Ideal Record Length (30+ Years):')
              : eligibleCount >= 20
              ? (isAr ? 'طول السجل صالح للتحليل الاستكشافي (20–29 سنة):' : 'Exploratory Record Length (20-29 Years):')
              : (isAr ? 'تحذير حرج: طول السجل أقل من 20 سنة:' : 'Critical Warning: Record length under 20 years:')}
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {isAr
              ? `السلسلة تحتوي على ${eligibleCount} سنة مؤهلة من إجمالي ${totalYears} سنة. استقراء فترات الرجوع الطويلة (مثل 100 سنة) يتطلب حذراً إضافياً وفحص فترات الثقة.`
              : `Series has ${eligibleCount} eligible years out of ${totalYears}. Caution required for long return periods.`}
          </p>
        </div>
      </div>

      {/* AMS Data Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? `بيانات سلسلة القمم السنوية لمؤشر ${selectedIndex}:` : `AMS Table (${selectedIndex}):`}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {eligibleCount} {isAr ? 'سنوات صالحة للنمذجة' : 'Years Valid'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold">
              <tr>
                <th className="py-2 px-3 text-start">{isAr ? 'السنة' : 'Year'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'كود المحطة' : 'Station ID'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'المؤشر' : 'Index'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'القيمة القصوى (مم)' : 'Maximum (mm)'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'فترة الحدوث' : 'Event Window'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'نسبة الاكتمال' : 'Completeness'}</th>
                <th className="py-2 px-3 text-center">{isAr ? 'مؤهل للنمذجة؟' : 'Eligible?'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'سبب الاستبعاد إن وجد' : 'Exclusion Reason'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.year} className="hover:bg-slate-750/50">
                  <td className="py-2 px-3 font-bold text-white">{r.year}</td>
                  <td className="py-2 px-3 text-slate-400">{r.station_id}</td>
                  <td className="py-2 px-3 font-mono text-cyan-300">{r.index_name}</td>
                  <td className="py-2 px-3 font-bold text-cyan-300 font-mono">{r.maximum_value_mm.toFixed(1)}</td>
                  <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                    {r.start_date === r.end_date ? r.start_date : `${r.start_date} → ${r.end_date}`}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{r.completeness_percentage}%</td>
                  <td className="py-2 px-3 text-center">
                    {r.eligible_for_model ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isAr ? 'مؤهلة' : 'Eligible'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {isAr ? 'مستبعدة' : 'Excluded'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{r.exclusion_reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
