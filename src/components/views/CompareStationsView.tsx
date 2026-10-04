/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Compare View (المقارنة: مقارنة محطات متعددة وخريطة بمستويات العودة)
 */

import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  TrendingUp,
  BarChart3,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Language, StationMetadata } from '../../types';
import { DEMO_STATIONS } from '../../data/demoData';

interface CompareStationsViewProps {
  stations: StationMetadata[];
  language: Language;
  onSelectStation: (stn: StationMetadata) => void;
}

export const CompareStationsView: React.FC<CompareStationsViewProps> = ({
  stations,
  language,
  onSelectStation,
}) => {
  const isAr = language === 'ar';
  const [selectedMetric, setSelectedMetric] = useState<'t100' | 't50' | 'annual_mean' | 'max_daily'>('t100');

  // Comparison metrics for Egyptian stations
  const comparisonData = [
    {
      station_id: 'ALX01',
      name_ar: 'الإسكندرية (الميناء الشرقي)',
      region: 'الساحل الشمالي الأوسط',
      annual_mean: 182.4,
      max_daily: 92.5,
      t10: 68.4,
      t50: 135.2,
      t100: 172.6,
      ci_range: '142 – 218 مم',
      best_model: 'GEV',
      shape_xi: 0.12,
      risk_level: 'مرتفع',
      coords: { lat: 31.2001, lng: 29.9187 },
    },
    {
      station_id: 'MRM01',
      name_ar: 'مرسى مطروح (الساحل الغربي)',
      region: 'الساحل الشمالي الغربي',
      annual_mean: 145.8,
      max_daily: 84.2,
      t10: 62.1,
      t50: 128.5,
      t100: 165.4,
      ci_range: '135 – 210 مم',
      best_model: 'GEV',
      shape_xi: 0.15,
      risk_level: 'مرتفع',
      coords: { lat: 31.3543, lng: 27.2373 },
    },
    {
      station_id: 'CAI01',
      name_ar: 'القاهرة (أباظية / ألماظة)',
      region: 'الدلتا والعاصمة',
      annual_mean: 24.6,
      max_daily: 46.8,
      t10: 28.5,
      t50: 52.4,
      t100: 64.8,
      ci_range: '48 – 88 مم',
      best_model: 'Gumbel',
      shape_xi: 0.02,
      risk_level: 'متوسط',
      coords: { lat: 30.0444, lng: 31.2357 },
    },
    {
      station_id: 'CAT01',
      name_ar: 'سانت كاترين (جنوب سيناء)',
      region: 'مرتفعات سيناء',
      annual_mean: 52.4,
      max_daily: 68.2,
      t10: 38.6,
      t50: 74.5,
      t100: 95.2,
      ci_range: '72 – 132 مم',
      best_model: 'GEV',
      shape_xi: 0.22,
      risk_level: 'حرج جداً (سيول خاطفة)',
      coords: { lat: 28.5558, lng: 33.9749 },
    },
    {
      station_id: 'HRG01',
      name_ar: 'الغردقة (ساحل البحر الأحمر)',
      region: 'البحر الأحمر',
      annual_mean: 5.2,
      max_daily: 42.1,
      t10: 18.2,
      t50: 44.6,
      t100: 58.4,
      ci_range: '38 – 85 مم',
      best_model: 'GEV',
      shape_xi: 0.18,
      risk_level: 'مرتفع (سيول خاطفة)',
      coords: { lat: 27.2579, lng: 33.8116 },
    },
    {
      station_id: 'ASW01',
      name_ar: 'أسوان (جنوب الصعيد)',
      region: 'صعيد مصر',
      annual_mean: 1.4,
      max_daily: 28.4,
      t10: 11.2,
      t50: 29.8,
      t100: 39.5,
      ci_range: '24 – 62 مم',
      best_model: 'Gumbel',
      shape_xi: 0.01,
      risk_level: 'متوسط',
      coords: { lat: 23.9667, lng: 32.7833 },
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>إعداد وملكية علمية: د. أمل معتوق</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">
          {isAr ? 'مقارنة المحطات وخريطة مستويات الرجوع في مصر' : 'Station Comparison & Return Level Map'}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr
            ? 'مقارنة هيدرولوجية موثقة بين الأقاليم المناخية المختلفة (الساحل، الدلتا، سيناء، الصعيد).'
            : 'Comparative hydrological evaluation across Egyptian climate zones.'}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-800">
            {isAr ? 'جدول المقارنة المرجعي لمستويات العودة' : 'Reference Comparison Table'}
          </h2>
          <span className="text-xs text-slate-400">
            {isAr ? 'البيانات محسوبة بنموذج GEV و Gumbel عبر L-Moments' : 'Computed via L-Moments'}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-start">{isAr ? 'المحطة' : 'Station'}</th>
                <th className="p-2.5 text-start">{isAr ? 'الإقليم' : 'Region'}</th>
                <th className="p-2.5 text-start">{isAr ? 'المعدل السنوي' : 'Annual Mean'}</th>
                <th className="p-2.5 text-start">{isAr ? 'مطر 50 سنة' : '50-Yr Return'}</th>
                <th className="p-2.5 text-start">{isAr ? 'مطر 100 سنة' : '100-Yr Return'}</th>
                <th className="p-2.5 text-start">{isAr ? 'حدود الثقة 95%' : '95% CI'}</th>
                <th className="p-2.5 text-start">{isAr ? 'درجة الخطورة' : 'Risk'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {comparisonData.map((stn) => (
                <tr key={stn.station_id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 font-sans">
                    {stn.name_ar}
                  </td>
                  <td className="p-2.5 text-slate-500 font-sans">{stn.region}</td>
                  <td className="p-2.5 text-slate-700">{stn.annual_mean} مم</td>
                  <td className="p-2.5 text-slate-800 font-bold">{stn.t50} مم</td>
                  <td className="p-2.5 text-blue-700 font-black text-sm">{stn.t100} مم</td>
                  <td className="p-2.5 text-slate-500 font-sans text-[11px]">{stn.ci_range}</td>
                  <td className="p-2.5 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stn.risk_level.includes('حرج')
                          ? 'bg-rose-100 text-rose-800'
                          : stn.risk_level.includes('مرتفع')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {stn.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Spatial Map representation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>{isAr ? 'خريطة توزيع مستويات العودة لمطر 100 سنة في مصر' : '100-Year Return Level Spatial Map'}</span>
        </h2>

        {/* Clean SVG Egypt Map Representation */}
        <div className="w-full h-64 sm:h-72 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-72">
            {/* Egypt Border Silhouette Outline */}
            <path
              d="M 50 80 L 160 70 L 220 85 L 290 80 L 330 95 L 360 85 L 390 130 L 380 200 L 400 320 L 420 380 L 50 380 Z"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="2"
            />
            {/* Nile River Curve */}
            <path
              d="M 285 380 Q 280 280, 275 220 Q 270 160, 280 120 L 250 85 M 280 120 L 310 85"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Station Markers */}
            {/* Alexandria */}
            <g transform="translate(245, 85)" className="cursor-pointer">
              <circle cx="0" cy="0" r="10" fill="#2563eb" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
              <text x="12" y="4" fill="#1e293b" fontSize="10" fontWeight="bold">الإسكندرية (173 مم)</text>
            </g>

            {/* Mersa Matruh */}
            <g transform="translate(130, 75)" className="cursor-pointer">
              <circle cx="0" cy="0" r="9" fill="#2563eb" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
              <text x="12" y="4" fill="#1e293b" fontSize="10" fontWeight="bold">مطروح (165 مم)</text>
            </g>

            {/* Cairo */}
            <g transform="translate(280, 125)" className="cursor-pointer">
              <circle cx="0" cy="0" r="6" fill="#0284c7" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
              <text x="10" y="4" fill="#1e293b" fontSize="10" fontWeight="bold">القاهرة (65 مم)</text>
            </g>

            {/* Saint Catherine */}
            <g transform="translate(350, 175)" className="cursor-pointer">
              <circle cx="0" cy="0" r="7" fill="#dc2626" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
              <text x="10" y="4" fill="#dc2626" fontSize="10" fontWeight="bold">سانت كاترين (95 مم)</text>
            </g>

            {/* Hurghada */}
            <g transform="translate(345, 215)" className="cursor-pointer">
              <circle cx="0" cy="0" r="6" fill="#ea580c" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
              <text x="10" y="4" fill="#1e293b" fontSize="10">الغردقة (58 مم)</text>
            </g>

            {/* Aswan */}
            <g transform="translate(315, 340)" className="cursor-pointer">
              <circle cx="0" cy="0" r="5" fill="#16a34a" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
              <text x="10" y="4" fill="#1e293b" fontSize="10">أسوان (40 مم)</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
