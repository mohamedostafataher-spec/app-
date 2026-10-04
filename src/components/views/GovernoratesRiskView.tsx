/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Governorate Risk Profiles View (ملف مخاطر المحافظات المصرية)
 */

import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Award,
  Filter,
  Printer,
  Calendar,
  Layers,
  Clock,
  ExternalLink,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { GovernorateRiskProfile, Language } from '../../types';
import { EGYPT_GOVERNORATES_RISK } from '../../data/demoData';

interface GovernoratesRiskViewProps {
  language: Language;
}

export const GovernoratesRiskView: React.FC<GovernoratesRiskViewProps> = ({ language }) => {
  const isAr = language === 'ar';
  const [selectedGovName, setSelectedGovName] = useState<string>('الإسكندرية');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');

  const governorates = EGYPT_GOVERNORATES_RISK;

  const filteredGovs = governorates.filter((g) => {
    if (selectedRegionFilter === 'all') return true;
    return g.region_ar.includes(selectedRegionFilter);
  });

  const selectedGov = governorates.find((g) => g.governorate_ar === selectedGovName) || governorates[0];

  const handlePrintGovBrief = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'ملفات تقييم المخاطر المطرية لمحافظات مصر (Governorate Risk Profiles)' : 'Egyptian Governorates Rainfall Risk Profiles'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'ملف مخاطر هيدرولوجي مخصص لكل محافظة من محافظات جمهورية مصر العربية: يعرض المحطات المتاحة، المتوسط السنوي، أعلى قيمة يومية مرصودة، أقصى هطول لـ 3 و5 أيام، مستويات الرجوع لـ 50 و100 سنة، تقييم مستوى الخطورة وتوصيات التصميم الهندسي.'
            : 'Dedicated risk assessment profiles for Egyptian governorates: available stations, historical peaks, 50-yr and 100-yr return levels, risk tier, and engineering design criteria.'}
        </p>

        {/* Region Filter & Governorate Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300 font-semibold">{isAr ? 'الإقليم:' : 'Region:'}</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
              {[
                { id: 'all', labelAr: 'كافة المحافظات' },
                { id: 'الساحل', labelAr: 'الساحل الشمالي' },
                { id: 'القاهرة', labelAr: 'القاهرة الكبرى' },
                { id: 'سيناء', labelAr: 'شبه جزيرة سيناء' },
                { id: 'البحر الأحمر', labelAr: 'البحر الأحمر' },
                { id: 'الصعيد', labelAr: 'صعيد مصر' },
                { id: 'الدلتا', labelAr: 'الدلتا' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setSelectedRegionFilter(rf.id)}
                  className={`px-2.5 py-0.5 rounded transition-all ${
                    selectedRegionFilter === rf.id
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rf.labelAr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">{isAr ? 'اختر المحافظة:' : 'Select Governorate:'}</span>
            <select
              value={selectedGov.governorate_ar}
              onChange={(e) => setSelectedGovName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
            >
              {filteredGovs.map((g) => (
                <option key={g.governorate_ar} value={g.governorate_ar}>
                  {g.governorate_ar} ({g.region_ar})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Governorate Main Risk Brief (Printable) */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-extrabold text-white">
                محافظة {selectedGov.governorate_ar} ({selectedGov.governorate_en})
              </h3>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                  selectedGov.risk_level === 'حرج جداً'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedGov.risk_level === 'مرتفع'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                مستوى الخطورة: {selectedGov.risk_level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              الإقليم الجغرافي: {selectedGov.region_ar} • عدد محطات الرصد: {selectedGov.stations_count} ({selectedGov.station_ids.join(', ')})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintGovBrief}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة بطاقة المحافظة' : 'Print Risk Brief'}</span>
            </button>
          </div>
        </div>

        {/* 6 Key Indicators Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'المتوسط السنوي' : 'Annual Mean'}</span>
            <span className="text-base font-bold text-cyan-300 font-mono">{selectedGov.annual_mean_rainfall_mm} مم</span>
            <span className="text-[10px] text-slate-400 block">{isAr ? 'معدل الهطول العادي' : 'Normal rainfall'}</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'أعلى هطول يومي' : 'Max Daily'}</span>
            <span className="text-base font-bold text-rose-300 font-mono">{selectedGov.max_daily_observed_mm} مم</span>
            <span className="text-[10px] text-slate-400 block">{isAr ? 'أقصى رصد تاريخي' : 'Historical record'}</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'أعلى Rx3day' : 'Max Rx3day'}</span>
            <span className="text-base font-bold text-amber-300 font-mono">{selectedGov.max_3day_mm} مم</span>
            <span className="text-[10px] text-slate-400 block">3 {isAr ? 'أيام متتالية' : 'consecutive days'}</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'مطر 50 سنة' : '50-Yr Return'}</span>
            <span className="text-base font-bold text-white font-mono">{selectedGov.return_level_50yr_mm} مم</span>
            <span className="text-[10px] text-slate-400 block">p = 2% سنوياً</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'مطر 100 سنة' : '100-Yr Return'}</span>
            <span className="text-base font-bold text-rose-400 font-mono">{selectedGov.return_level_100yr_mm} مم</span>
            <span className="text-[10px] text-slate-400 block">{selectedGov.return_level_ci_range}</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-750">
            <span className="text-slate-400 text-xs block">{isAr ? 'جودة البيانات' : 'Quality Score'}</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{selectedGov.data_quality_score}/100</span>
            <span className="text-[10px] text-slate-400 block">{selectedGov.data_source_category}</span>
          </div>
        </div>

        {/* Extreme Event Benchmark & Engineering Guideline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>{isAr ? 'الحدث الساحق الأبرز في السجل التاريخي:' : 'Worst Recorded Storm Event:'}</span>
            </div>
            <p className="text-slate-200 font-semibold">{selectedGov.historical_extreme_event}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{selectedGov.notes_ar}</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'التوجيه الهندسي الموصى به لتصاميم السيول:' : 'Engineering Design Guideline:'}</span>
            </div>
            <p className="text-slate-200 font-semibold leading-relaxed">
              {selectedGov.recommended_design_guideline}
            </p>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300">
              تنبيه إلزامي: هذا التقييم أداة استرشادية، ويخضع أي قرار تنفيذي لمراجعة المهندس الهيدرولوجي الميداني.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span>منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية</span>
          <span className="font-semibold text-amber-400">إعداد وملكية علمية: د. أمل معتوق</span>
        </div>
      </div>

      {/* Complete Governorates Quick Comparison Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'جدول المقارنة الشاملة لجميع المحافظات المدرجة:' : 'All Governorates Risk Comparison:'}</span>
        </h3>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-2 px-3 text-start">{isAr ? 'المحافظة' : 'Governorate'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الإقليم' : 'Region'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'المتوسط السنوي' : 'Annual Mean'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'أعلى هطول يومي' : 'Max Daily'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'مطر 50 سنة' : '50-Yr Level'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'مطر 100 سنة' : '100-Yr Level'}</th>
                <th className="py-2 px-3 text-center">{isAr ? 'درجة الخطورة' : 'Risk Level'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'أبرز حدث تاريخي' : 'Key Extreme Event'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredGovs.map((gov) => (
                <tr
                  key={gov.governorate_ar}
                  onClick={() => setSelectedGovName(gov.governorate_ar)}
                  className={`cursor-pointer transition-colors ${
                    gov.governorate_ar === selectedGov.governorate_ar
                      ? 'bg-cyan-950/40 text-cyan-200'
                      : 'hover:bg-slate-750/50'
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-white">{gov.governorate_ar}</td>
                  <td className="py-2 px-3 text-slate-400">{gov.region_ar}</td>
                  <td className="py-2 px-3 font-mono">{gov.annual_mean_rainfall_mm} مم</td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-300">{gov.max_daily_observed_mm} مم</td>
                  <td className="py-2 px-3 font-mono">{gov.return_level_50yr_mm} مم</td>
                  <td className="py-2 px-3 font-mono font-bold text-cyan-300">{gov.return_level_100yr_mm} مم</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        gov.risk_level === 'حرج جداً'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : gov.risk_level === 'مرتفع'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {gov.risk_level}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[200px]">
                    {gov.historical_extreme_event}
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
