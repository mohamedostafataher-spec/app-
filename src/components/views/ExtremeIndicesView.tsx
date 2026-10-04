/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Extreme Rainfall Indices (Rx1day, Rx3day, Rx5day) View
 */

import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  Layers,
  Award,
  Download,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { ExtremeIndexRecord, Language } from '../../types';

interface ExtremeIndicesViewProps {
  rx1day: ExtremeIndexRecord[];
  rx3day: ExtremeIndexRecord[];
  rx5day: ExtremeIndexRecord[];
  language: Language;
}

export const ExtremeIndicesView: React.FC<ExtremeIndicesViewProps> = ({
  rx1day,
  rx3day,
  rx5day,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedIndex, setSelectedIndex] = useState<'Rx1day' | 'Rx3day' | 'Rx5day'>('Rx1day');

  const currentList =
    selectedIndex === 'Rx1day' ? rx1day : selectedIndex === 'Rx3day' ? rx3day : rx5day;

  const maxVal = Math.max(...currentList.map((r) => r.value_mm), 10);

  const exportCSV = () => {
    let csv = 'year,station_id,index_name,value_mm,start_date,end_date,valid_records,completeness,eligible,warning\n';
    currentList.forEach((r) => {
      csv += `${r.year},${r.station_id},${r.index_name},${r.value_mm},${r.start_date},${r.end_date},${r.valid_records},${r.completeness},${r.eligible},"${r.warning || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedIndex}_annual_series.csv`);
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
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'مؤشرات الأمطار القصوى (Rx1day وRx3day وRx5day)' : 'Extreme Rainfall Indices'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'حساب مؤشرات الهطول القصوى السنوية وفق المعايير الدولية لمنظمة WMO ومجموعة ETCCDI: أقصى هطول يومي Rx1day، وأقصى مجموع متحرك لـ 3 أيام متتالية Rx3day، وأقصى مجموع متحرك لـ 5 أيام Rx5day، دون احتساب أي نافذة زمنية تحتوي على قيم مفقودة.'
            : 'WMO & ETCCDI standard indices: Annual maximum 1-day (Rx1day), 3-day consecutive (Rx3day), and 5-day consecutive (Rx5day) moving sums.'}
        </p>

        {/* Index Switcher Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
          {(['Rx1day', 'Rx3day', 'Rx5day'] as const).map((idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedIndex === idx
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {idx} {idx === 'Rx1day' ? (isAr ? '(أعلى يوم)' : '(1-Day)') : idx === 'Rx3day' ? (isAr ? '(أعلى 3 أيام)' : '(3-Day)') : (isAr ? '(أعلى 5 أيام)' : '(5-Day)')}
            </button>
          ))}
        </div>
      </div>

      {/* Extreme Index Chart */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr ? `توزيع السلسلة السنوية لمؤشر ${selectedIndex} عبر الزمن:` : `${selectedIndex} Annual Time Series:`}
            </span>
          </h3>
          <button
            onClick={exportCSV}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>تصدير CSV</span>
          </button>
        </div>

        <div className="w-full h-52 bg-slate-900/80 rounded-xl p-3 border border-slate-750 flex flex-col justify-end">
          <div className="flex-1 flex items-end gap-1.5 sm:gap-2.5 px-2">
            {currentList.map((r) => {
              const heightPct = (r.value_mm / maxVal) * 100;
              return (
                <div key={r.year} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    className={`w-full rounded-t transition-all ${
                      r.eligible
                        ? 'bg-cyan-500 hover:bg-cyan-400 shadow'
                        : 'bg-rose-500/60 hover:bg-rose-400'
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    title={`${r.year}: ${r.value_mm} مم (${r.start_date})`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono hidden sm:inline transform -rotate-45 origin-top-left mt-1">
                    {r.year.toString().slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Index Records Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? `جدول قيم وتواريخ نوافذ مؤشر ${selectedIndex}:` : `${selectedIndex} Detailed Event Windows:`}</span>
        </h3>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold">
              <tr>
                <th className="py-2 px-3 text-start">{isAr ? 'السنة' : 'Year'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'القيمة القصوى' : 'Peak Value'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'تاريخ بداية النافذة' : 'Window Start'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'تاريخ نهاية النافذة' : 'Window End'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الأيام الصالحة' : 'Valid Days'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الاكتمال' : 'Completeness'}</th>
                <th className="py-2 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentList.map((row) => (
                <tr key={row.year} className="hover:bg-slate-750/50">
                  <td className="py-2 px-3 font-bold text-white">{row.year}</td>
                  <td className="py-2 px-3 font-mono font-bold text-cyan-300">{row.value_mm.toFixed(1)} مم</td>
                  <td className="py-2 px-3 font-mono text-slate-300">{row.start_date}</td>
                  <td className="py-2 px-3 font-mono text-slate-300">{row.end_date}</td>
                  <td className="py-2 px-3 text-slate-400">{row.valid_records}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{row.completeness}%</td>
                  <td className="py-2 px-3 text-center">
                    {row.eligible ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isAr ? 'معتمد' : 'Eligible'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {isAr ? 'غير مكتمل' : 'Incomplete'}
                      </span>
                    )}
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
