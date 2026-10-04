/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Egyptian Meteorological Stations & Spatial Map View
 */

import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Award,
  Calendar,
  Activity,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StationMetadata, Language } from '../../types';

interface MapsStationsViewProps {
  stations: StationMetadata[];
  selectedStation: StationMetadata;
  setSelectedStation: (st: StationMetadata) => void;
  language: Language;
}

export const MapsStationsView: React.FC<MapsStationsViewProps> = ({
  stations,
  selectedStation,
  setSelectedStation,
  language,
}) => {
  const isAr = language === 'ar';
  const [mapColorMetric, setMapColorMetric] = useState<'rx1day' | 't100' | 'quality' | 'source'>('rx1day');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const filteredStations = stations.filter((st) => {
    if (selectedRegion === 'all') return true;
    if (selectedRegion === 'coast') return st.governorate.includes('الإسكندرية') || st.governorate.includes('مطروح') || st.governorate.includes('بورسعيد');
    if (selectedRegion === 'cairo') return st.governorate.includes('القاهرة') || st.governorate.includes('الجيزة');
    if (selectedRegion === 'redsea_sinai') return st.governorate.includes('البحر الأحمر') || st.governorate.includes('سيناء');
    if (selectedRegion === 'upper_egypt') return st.governorate.includes('أسوان') || st.governorate.includes('أسيوط') || st.governorate.includes('الأقصر');
    return true;
  });

  // Convert lat/lon of Egypt to SVG coordinates (Lat ~22 to 32, Lon ~25 to 36)
  const toSVGCoords = (lat: number, lon: number) => {
    const minLat = 21.5;
    const maxLat = 32.0;
    const minLon = 24.5;
    const maxLon = 37.0;

    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'الخريطة التفاعلية لمحطات الرصد والأقاليم المناخية في مصر' : 'Interactive Egyptian Stations Map'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'توزيع مكاني لمحطات الرصد المناخي عبر الأقاليم الهيدرولوجية المصرية (الساحل الشمالي المتوسطي، دلتا النيل، حوض البحر الأحمر وسيناء، وإقليم الصعيد وجنوب الوادي)، مع التمييز الصارم بين المحطات الأرضية والنقاط الشبكية (CHIRPS).'
            : 'Spatial distribution of climate stations across Egyptian hydrological regimes (Mediterranean Coast, Nile Delta, Red Sea & Sinai, Upper Egypt).'}
        </p>

        {/* Region & Metric Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">{isAr ? 'تصفية الإقليم:' : 'Region:'}</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
              {[
                { id: 'all', labelAr: 'كافة الأقاليم' },
                { id: 'coast', labelAr: 'الساحل الشمالي' },
                { id: 'cairo', labelAr: 'القاهرة الكبرى' },
                { id: 'redsea_sinai', labelAr: 'البحر الأحمر وسيناء' },
                { id: 'upper_egypt', labelAr: 'صعيد مصر' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setSelectedRegion(rf.id)}
                  className={`px-2.5 py-0.5 rounded transition-all ${
                    selectedRegion === rf.id
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
            <span className="text-xs text-slate-300 font-semibold">{isAr ? 'تلوين المحطات وفق:' : 'Color Stations By:'}</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setMapColorMetric('rx1day')}
                className={`px-2 py-0.5 rounded transition-all ${
                  mapColorMetric === 'rx1day'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                أعلى هطول Rx1day
              </button>
              <button
                onClick={() => setMapColorMetric('t100')}
                className={`px-2 py-0.5 rounded transition-all ${
                  mapColorMetric === 't100'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                مطر 100 سنة
              </button>
              <button
                onClick={() => setMapColorMetric('quality')}
                className={`px-2 py-0.5 rounded transition-all ${
                  mapColorMetric === 'quality'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                جودة البيانات
              </button>
              <button
                onClick={() => setMapColorMetric('source')}
                className={`px-2 py-0.5 rounded transition-all ${
                  mapColorMetric === 'source'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                نوع المصدر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map & Detail Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Container (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 z-10">
            <span className="text-xs font-bold text-slate-200">
              {isAr ? 'خريطة جمهورية مصر العربية' : 'Arab Republic of Egypt'}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>محطة رصد أرضية (GHCN)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                <span>نقطة شبكية (CHIRPS)</span>
              </span>
            </div>
          </div>

          {/* Egypt Geographic Contour SVG */}
          <div className="w-full h-80 relative flex items-center justify-center">
            <svg className="w-full h-full max-h-80" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* Egypt Border Simplified Silhouette */}
              <polygon
                points="12,12 85,12 86,28 92,38 90,44 78,54 75,68 82,78 78,92 12,92"
                fill="rgba(30, 41, 59, 0.7)"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Mediterranean Sea label */}
              <text x="45" y="8" fill="#38bdf8" fontSize="3" fontWeight="bold" textAnchor="middle">
                البحر الأبيض المتوسط (Mediterranean)
              </text>

              {/* Red Sea label */}
              <text x="86" y="58" fill="#38bdf8" fontSize="2.5" fontWeight="bold" transform="rotate(45, 86, 58)">
                البحر الأحمر (Red Sea)
              </text>

              {/* Sinai Peninsula Outline */}
              <polygon
                points="72,12 85,12 86,28 78,35 72,12"
                fill="rgba(51, 65, 85, 0.4)"
                stroke="#475569"
                strokeWidth="0.6"
              />

              {/* Nile River Curve */}
              <path
                d="M 52,92 Q 52,70 50,55 Q 52,40 50,30 Q 48,22 47,15"
                fill="none"
                stroke="#0284c7"
                strokeWidth="0.8"
                opacity="0.6"
              />

              {/* Delta Branch */}
              <path
                d="M 50,30 L 44,14 M 50,30 L 56,15"
                fill="none"
                stroke="#0284c7"
                strokeWidth="0.7"
                opacity="0.6"
              />

              {/* Station Markers */}
              {filteredStations.map((st) => {
                const { x, y } = toSVGCoords(st.latitude, st.longitude);
                const isSelected = st.station_id === selectedStation.station_id;
                const isGridded = st.is_gridded;

                return (
                  <g
                    key={st.station_id}
                    onClick={() => setSelectedStation(st)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle cx={x} cy={y} r="6" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8" className="animate-ping" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? '4' : '3'}
                      fill={isGridded ? '#c084fc' : isSelected ? '#38bdf8' : '#06b6d4'}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                    <text
                      x={x + 3}
                      y={y + 1}
                      fill="#ffffff"
                      fontSize="2.4"
                      fontWeight="bold"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {st.station_name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full text-center text-[10px] text-slate-400 mt-1">
            {isAr ? 'اضغط على أي محطة على الخريطة لعرض بطاقة التوصيف والنتائج الحتمية' : 'Click any station marker for instant metadata'}
          </div>
        </div>

        {/* Selected Station Detail Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">{selectedStation.station_name}</h3>
                {selectedStation.is_gridded && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    شبكي
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStation.governorate} • {selectedStation.station_id}
              </p>
            </div>
            <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-750">
              {selectedStation.elevation_m} م فوق البحر
            </span>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'الإحداثيات:' : 'Coordinates:'}</span>
              <span className="font-mono text-slate-200">
                {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'فترة السجل المرصود:' : 'Record Period:'}</span>
              <span className="font-mono text-slate-200">{selectedStation.start_date} → {selectedStation.end_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'نوع جهاز القياس:' : 'Instrument:'}</span>
              <span className="text-slate-200 truncate max-w-[200px]">{selectedStation.instrument_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'مالك البيانات:' : 'Data Owner:'}</span>
              <span className="text-amber-300 font-medium">{selectedStation.data_owner}</span>
            </div>
          </div>

          {/* Climatological Context */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-cyan-300 block">{isAr ? 'الملاحظات والسياق الهيدرولوجي:' : 'Hydrological Context:'}</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {selectedStation.notes}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-850 rounded-lg border border-slate-750">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'حالة المحطة' : 'Station Status'}</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{selectedStation.station_status === 'active' ? 'نشطة وعاملة' : 'محدثة'}</span>
              </span>
            </div>
            <div className="p-2.5 bg-slate-850 rounded-lg border border-slate-750">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'نوع الرصد' : 'Observation Mode'}</span>
              <span className="font-bold text-cyan-300 block mt-0.5">
                {selectedStation.is_gridded ? 'قمر صناعي شبكي' : 'محطة قياس أرضية'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
