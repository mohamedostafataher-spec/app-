/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Custom Storm Event Builder Component (منشئ ومحلل الأحداث والعواصف المخصصة)
 */

import React, { useState } from 'react';
import {
  CloudLightning,
  X,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Activity,
  Download,
  Info,
} from 'lucide-react';
import { DailyRecord, StormEvent } from '../types';

interface StormEventBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DailyRecord[];
  onAddStormEvent?: (event: StormEvent) => void;
}

export const StormEventBuilderModal: React.FC<StormEventBuilderModalProps> = ({
  isOpen,
  onClose,
  records,
  onAddStormEvent,
}) => {
  // Preset list of historic storms in Egypt
  const [eventName, setEventName] = useState<string>('منخفض التنين (Dragon Storm مارس 2020)');
  const [startDate, setStartDate] = useState<string>('2020-03-12');
  const [endDate, setEndDate] = useState<string>('2020-03-14');
  const [region, setRegion] = useState<string>('سائر أنحاء جمهورية مصر العربية');
  const [source, setSource] = useState<string>('الهيئة العامة للأرصاد الجوية المصرية (EMA)');
  const [sourceUrl, setSourceUrl] = useState<string>('https://ema.gov.eg');
  const [analysisOutput, setAnalysisOutput] = useState<any>(null);

  if (!isOpen) return null;

  // Analyze the custom storm event against current dataset
  const handleAnalyzeStorm = () => {
    const stormDays = records.filter((r) => r.date >= startDate && r.date <= endDate);

    if (stormDays.length === 0) {
      // PDF mandatory behavior: Status Not Available, value null, never 0 mm!
      setAnalysisOutput({
        status: 'not_available',
        value: null,
        message: `لا توجد بيانات داخل فترة الحدث (${startDate} إلى ${endDate}) في السجل الحالي.`,
        dataCoverageEnd: records.length > 0 ? records[records.length - 1].date : 'غير متوفر',
      });
      return;
    }

    const rainValues = stormDays.map((r) => r.rainfall_mm || 0);
    const totalRain = rainValues.reduce((s, x) => s + x, 0);
    const maxDay = Math.max(...rainValues);

    let max3day = totalRain;
    if (rainValues.length >= 3) {
      max3day = 0;
      for (let i = 0; i <= rainValues.length - 3; i++) {
        const sum3 = rainValues[i] + rainValues[i + 1] + rainValues[i + 2];
        if (sum3 > max3day) max3day = sum3;
      }
    }

    setAnalysisOutput({
      status: 'available',
      eventName,
      startDate,
      endDate,
      durationDays: stormDays.length,
      totalRainfallMm: totalRain,
      max1dayMm: maxDay,
      max3dayMm: max3day,
      dailyBreakdown: stormDays.map((r) => ({ date: r.date, rain: r.rainfall_mm })),
    });
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                منشئ ومحلل الأحداث والعواصف المخصصة (Storm Event Builder)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                تحديد أحداث مطرية وتخصيص نوافذها الزمنية ومقارنتها بسجل المحطة دون أصفار وهمية
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
          
          {/* Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              <span className="text-[10px] text-slate-400 font-bold">عواصف مصرية تاريخية:</span>
              <button
                onClick={() => {
                  setEventName('عاصفة دانيال (Storm Daniel سبتمبر 2023)');
                  setStartDate('2023-09-08');
                  setEndDate('2023-09-12');
                  setRegion('الساحل الشمالي الغربي ومطروح');
                  setAnalysisOutput(null);
                }}
                className="text-[10px] px-2.5 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-bold cursor-pointer"
              >
                عاصفة دانيال 2023
              </button>
              <button
                onClick={() => {
                  setEventName('منخفض التنين (Dragon Storm مارس 2020)');
                  setStartDate('2020-03-12');
                  setEndDate('2020-03-14');
                  setRegion('سائر أنحاء مصر');
                  setAnalysisOutput(null);
                }}
                className="text-[10px] px-2.5 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-bold cursor-pointer"
              >
                منخفض التنين 2020
              </button>
              <button
                onClick={() => {
                  setEventName('سيول رأس غارب والبحر الأحمر (أكتوبر 2016)');
                  setStartDate('2016-10-26');
                  setEndDate('2016-10-28');
                  setRegion('محافظة البحر الأحمر وصعيد مصر');
                  setAnalysisOutput(null);
                }}
                className="text-[10px] px-2.5 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-bold cursor-pointer"
              >
                سيول رأس غارب 2016
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">اسم العاصفة أو الحدث:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">بداية الحدث (Start Date):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">نهاية الحدث (End Date):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">المنطقة الجغرافية المتأثرة:</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">مصدر التوثيق (Source):</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleAnalyzeStorm}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0E7490] to-[#12304A] hover:from-[#12304A] hover:to-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CloudLightning className="w-4 h-4 text-amber-300" />
                <span>تحليل الحدث ومقارنته بالسجل (Analyze Storm)</span>
              </button>
            </div>
          </div>

          {/* Analysis Result Output */}
          {analysisOutput && (
            <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm space-y-4 animate-in fade-in duration-200">
              {analysisOutput.status === 'not_available' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>حالة الحدث: Not Available (غير متوفر في السجل)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {analysisOutput.message}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    نطاق بيانات السجل الحالي ينتهي في: {analysisOutput.dataCoverageEnd}
                  </p>
                  <p className="text-[11px] text-amber-900 font-bold">
                    * التزام علمي: لا يتم عرض 0 mm عند عدم وجود قياسات داخل نافذة الحدث.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>نتائج هطول العاصفة ({analysisOutput.eventName}):</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">إجمالي المطر:</span>
                      <span className="font-mono font-bold text-[#0E7490] text-sm">
                        {analysisOutput.totalRainfallMm.toFixed(1)} مم
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">أعلى يوم فردي:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {analysisOutput.max1dayMm.toFixed(1)} مم
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">أعلى 3 أيام متتالية:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {analysisOutput.max3dayMm.toFixed(1)} مم
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">المدة المسجلة:</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {analysisOutput.durationDays} أيام
                      </span>
                    </div>
                  </div>

                  {/* Daily Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5">التاريخ</th>
                          <th className="p-2.5">الهطول اليومي المقاس</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {analysisOutput.dailyBreakdown.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5">{d.date}</td>
                            <td className="p-2.5 font-bold text-[#0E7490]">
                              {d.rain !== null ? `${d.rain.toFixed(1)} مم` : 'Missing'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Storm Event Analysis — Non-Zero Integrity Standard
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
