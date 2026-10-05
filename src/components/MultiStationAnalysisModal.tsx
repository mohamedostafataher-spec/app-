/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Multi-Station Comparative Analysis Component (مقارنة وتحليل المحطات المتعددة)
 */

import React, { useState } from 'react';
import {
  Layers,
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  BarChart2,
  Download,
  Info,
} from 'lucide-react';
import { DEMO_STATIONS } from '../data/demoData';

interface MultiStationAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStationId: string;
}

export const MultiStationAnalysisModal: React.FC<MultiStationAnalysisModalProps> = ({
  isOpen,
  onClose,
  currentStationId,
}) => {
  // Demo benchmark metrics for major Egyptian stations
  const stationsComparisonData = [
    {
      id: 'ALX01',
      name: 'الإسكندرية (النزهة)',
      region: 'الساحل الشمالي',
      period: '1957–2023',
      years: 67,
      amsYearsEligible: 19,
      rx1dayMax: 63.8,
      rx3dayMax: 77.0,
      returnLevel100: 146.5,
      bestModel: 'Gumbel',
      trend: 'اتجاه هابط طفيف (غير دال، p=0.48)',
      quality: 'Needs Review (43.2% تغطية)',
      rank: 1,
    },
    {
      id: 'EGE00147727',
      name: 'القاهرة (العباسية)',
      region: 'القاهرة الكبرى / وادي النيل',
      period: '1900–1908',
      years: 9,
      amsYearsEligible: 7,
      rx1dayMax: 25.0,
      rx3dayMax: 32.5,
      returnLevel100: 48.2,
      bestModel: 'Gumbel',
      trend: 'سجل قصير استكشافي',
      quality: 'Needs Review (83.3% تغطية)',
      rank: 4,
    },
    {
      id: 'MRM01',
      name: 'مرسى مطروح',
      region: 'الساحل الشمالي الغربي',
      period: '1981–2023',
      years: 43,
      amsYearsEligible: 32,
      rx1dayMax: 54.2,
      rx3dayMax: 68.4,
      returnLevel100: 122.0,
      bestModel: 'GEV',
      trend: 'مستقر بدون تغير دال',
      quality: 'Good (88.5% تغطية)',
      rank: 2,
    },
    {
      id: 'HRG01',
      name: 'الغردقة',
      region: 'البحر الأحمر',
      period: '1981–2023',
      years: 43,
      amsYearsEligible: 28,
      rx1dayMax: 48.0,
      rx3dayMax: 51.2,
      returnLevel100: 95.4,
      bestModel: 'GEV',
      trend: 'سيول فجائية نادرة',
      quality: 'Fair (76.1% تغطية)',
      rank: 3,
    },
    {
      id: 'ASW01',
      name: 'أسوان',
      region: 'الصعيد / جنوب الوادي',
      period: '1981–2023',
      years: 43,
      amsYearsEligible: 25,
      rx1dayMax: 22.0,
      rx3dayMax: 22.0,
      returnLevel100: 38.0,
      bestModel: 'Gumbel',
      trend: 'شديد الجفاف',
      quality: 'Fair (72.0% تغطية)',
      rank: 5,
    },
  ];

  const [sortField, setSortField] = useState<'returnLevel100' | 'rx1dayMax' | 'amsYearsEligible'>('returnLevel100');

  const sortedStations = [...stationsComparisonData].sort((a, b) => b[sortField] - a[sortField]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                التحليل الإقليمي ومقارنة المحطات (Multi-Station Analysis & Ranking)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                مقارنة قيم القصوى وفترات الرجوع 100 سنة والتصنيف البيئي لمختلف أقاليم مصر المناخية
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
          
          {/* Scientific Caution Alert */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">تنبيه المنهجية الهيدرولوجية:</span>
              <span>
                اختلاف فترات الرصد التاريخية (سجل قديم مثل القاهرة 1900–1908 مقابل سجل حديث) لا يسمح بالمقارنة المباشرة كحقيقة مطلقة دون الأخذ بالاعتبار عدم اليقين وطول السجل المؤهل.
              </span>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700">ترتيب المحطات حسب:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortField('returnLevel100')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                  sortField === 'returnLevel100'
                    ? 'bg-[#0E7490] text-white border-[#0E7490]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                مستوى الرجوع T=100
              </button>
              <button
                onClick={() => setSortField('rx1dayMax')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                  sortField === 'rx1dayMax'
                    ? 'bg-[#0E7490] text-white border-[#0E7490]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                أعلى هطول يومي Rx1day
              </button>
              <button
                onClick={() => setSortField('amsYearsEligible')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                  sortField === 'amsYearsEligible'
                    ? 'bg-[#0E7490] text-white border-[#0E7490]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                سنوات AMS المؤهلة
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="p-3">الرتبة</th>
                    <th className="p-3">المحطة والإقليم</th>
                    <th className="p-3">فترة السجل</th>
                    <th className="p-3">سنوات AMS (≥90%)</th>
                    <th className="p-3">أقصى Rx1day</th>
                    <th className="p-3">أقصى Rx3day</th>
                    <th className="p-3">مستوى T=100</th>
                    <th className="p-3">النموذج الأفضل</th>
                    <th className="p-3">حالة الجودة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStations.map((stn, idx) => {
                    const isCurrent = stn.id === currentStationId;
                    return (
                      <tr
                        key={stn.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-blue-50/60 font-bold' : ''
                        }`}
                      >
                        <td className="p-3 font-mono">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-900 font-black'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{stn.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                                الحالية
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{stn.region}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{stn.period}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{stn.amsYearsEligible} سنة</td>
                        <td className="p-3 font-mono font-bold text-[#0E7490]">{stn.rx1dayMax} مم</td>
                        <td className="p-3 font-mono font-bold text-[#0E7490]">{stn.rx3dayMax} مم</td>
                        <td className="p-3 font-mono font-black text-emerald-700 text-sm">
                          {stn.returnLevel100} مم
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                            {stn.bestModel}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">{stn.quality}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Multi-Station Hydro-Climatological Index Ranking
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
