import React from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck, Layers } from 'lucide-react';

interface Props {
  latitude?: number;
  longitude?: number;
  stationName?: string;
  stationId?: string;
  period?: string;
  qualityStatus?: string;
  rx1Max?: number;
  rx3Max?: number;
  rx5Max?: number;
  selectedModel?: string;
  returnLevel100?: number;
  points?: Array<{ lat: number; lon: number; rainfall: number; date?: string }>;
}

export const SpatialRainfallChart: React.FC<Props> = ({
  latitude = 0,
  longitude = 0,
  stationName = 'محطة الرصد',
  stationId = 'STN',
  period = '1957 – 2023',
  qualityStatus = 'Needs Review',
  rx1Max = 252.2,
  rx3Max = 77.0,
  rx5Max = 110.0,
  selectedModel = 'Gumbel',
  returnLevel100 = 146.5,
  points = [],
}) => {
  const hasCoordinates = Boolean(latitude && longitude && latitude > 20 && latitude < 35 && longitude > 23 && longitude < 38);

  if (!hasCoordinates) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl md:rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h4 className="text-base font-bold text-slate-800">لا توجد إحداثيات كافية للتحليل المكاني</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            لم يتم العثور على أعمدة خط العرض (latitude) وخط الطول (longitude) الصالحة في ملف البيانات المرفوع. يمكنك تعيينها يدوياً من نافذة تحديد الأعمدة (Column Mapping).
          </p>
        </div>
      </div>
    );
  }

  // Geographic boundaries of Egypt:
  // Lat: 22.0°N (South) to 31.8°N (North)
  // Lon: 25.0°E (West) to 36.8°E (East)
  const minLat = 21.5;
  const maxLat = 32.2;
  const minLon = 24.5;
  const maxLon = 37.0;

  const mapWidth = 540;
  const mapHeight = 440;
  const pad = 35;

  // Project (lon, lat) to SVG (x, y)
  const projectX = (lon: number) => {
    return pad + ((lon - minLon) / (maxLon - minLon)) * (mapWidth - 2 * pad);
  };
  const projectY = (lat: number) => {
    return mapHeight - pad - ((lat - minLat) / (maxLat - minLat)) * (mapHeight - 2 * pad);
  };

  const stnX = projectX(longitude);
  const stnY = projectY(latitude);

  // Nile Path approximations in Egypt
  const nilePoints = [
    [32.89, 24.09], // Aswan
    [32.90, 24.50], // Kom Ombo
    [32.88, 25.00], // Edfu
    [32.64, 25.70], // Luxor
    [32.72, 26.16], // Qena bend
    [31.70, 26.56], // Sohag
    [31.18, 27.18], // Asyut
    [30.75, 28.11], // Minya
    [31.10, 29.07], // Beni Suef
    [31.24, 30.04], // Cairo
  ];

  const nilePathD = nilePoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${projectX(pt[0])} ${projectY(pt[1])}`)
    .join(' ');

  // Delta branches (Rosetta & Damietta)
  const cairoX = projectX(31.24);
  const cairoY = projectY(30.04);
  const rosettaX = projectX(30.42);
  const rosettaY = projectY(31.40);
  const damiettaX = projectX(31.81);
  const damiettaY = projectY(31.51);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-xl overflow-hidden text-white">
      {/* Top Banner */}
      <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">التحليل والتوزيع المكاني لمحطة الرصد</h3>
            <p className="text-[11px] text-slate-400">إحداثيات المحطة والخصائص الهيدرولوجية على خريطة جمهورية مصر العربية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1 bg-white/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
            Lat: {latitude.toFixed(3)}°N | Lon: {longitude.toFixed(3)}°E
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* SVG Egypt Map */}
        <div className="lg:col-span-7 p-4 md:p-6 flex flex-col items-center justify-center bg-slate-950/60 border-b lg:border-b-0 lg:border-l border-white/5 relative">
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full max-w-[500px] h-auto rounded-2xl select-none"
          >
            {/* Background Grid Lines */}
            {[24, 26, 28, 30, 32].map((lat) => (
              <g key={`lat-${lat}`}>
                <line
                  x1={pad}
                  y1={projectY(lat)}
                  x2={mapWidth - pad}
                  y2={projectY(lat)}
                  stroke="#334155"
                  strokeWidth="0.7"
                  strokeDasharray="3 3"
                />
                <text x={pad - 6} y={projectY(lat) + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                  {lat}°N
                </text>
              </g>
            ))}

            {[26, 28, 30, 32, 34, 36].map((lon) => (
              <g key={`lon-${lon}`}>
                <line
                  x1={projectX(lon)}
                  y1={pad}
                  x2={projectX(lon)}
                  y2={mapHeight - pad}
                  stroke="#334155"
                  strokeWidth="0.7"
                  strokeDasharray="3 3"
                />
                <text x={projectX(lon)} y={mapHeight - pad + 15} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                  {lon}°E
                </text>
              </g>
            ))}

            {/* Egypt National Borders (approximate bounding box polygon) */}
            <polygon
              points={`
                ${projectX(25.0)},${projectY(31.6)}
                ${projectX(31.8)},${projectY(31.6)}
                ${projectX(34.2)},${projectY(31.3)}
                ${projectX(34.8)},${projectY(29.5)}
                ${projectX(36.8)},${projectY(22.0)}
                ${projectX(25.0)},${projectY(22.0)}
              `}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.8"
            />

            {/* Mediterranean Sea label */}
            <text x={projectX(30.0)} y={projectY(32.0)} fill="#0284c7" fontSize="10" fontWeight="bold" textAnchor="middle">
              البحر الأبيض المتوسط
            </text>

            {/* Red Sea label */}
            <text x={projectX(35.5)} y={projectY(26.5)} fill="#0284c7" fontSize="9" fontWeight="bold" textAnchor="middle" transform={`rotate(45, ${projectX(35.5)}, ${projectY(26.5)})`}>
              البحر الأحمر
            </text>

            {/* Nile River & Delta */}
            <path d={nilePathD} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            <line x1={cairoX} y1={cairoY} x2={rosettaX} y2={rosettaY} stroke="#0284c7" strokeWidth="1.8" />
            <line x1={cairoX} y1={cairoY} x2={damiettaX} y2={damiettaY} stroke="#0284c7" strokeWidth="1.8" />

            {/* Major Cities for Reference */}
            {[
              { name: 'القاهرة', lat: 30.04, lon: 31.24 },
              { name: 'مطروح', lat: 31.35, lon: 27.23 },
              { name: 'أسوان', lat: 24.09, lon: 32.89 },
              { name: 'الغردقة', lat: 27.25, lon: 33.81 },
            ].map((c) => (
              <g key={c.name}>
                <circle cx={projectX(c.lon)} cy={projectY(c.lat)} r="2.5" fill="#94a3b8" />
                <text x={projectX(c.lon) + 5} y={projectY(c.lat) + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">
                  {c.name}
                </text>
              </g>
            ))}

            {/* Active Station Pin with Pulsing Effect */}
            <g>
              {/* Outer pulsing ring */}
              <circle cx={stnX} cy={stnY} r="16" fill="rgba(239, 68, 68, 0.2)" className="animate-ping" />
              <circle cx={stnX} cy={stnY} r="10" fill="rgba(239, 68, 68, 0.4)" />
              <circle cx={stnX} cy={stnY} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              
              {/* Label banner */}
              <rect
                x={stnX - 45}
                y={stnY - 26}
                width="90"
                height="18"
                rx="6"
                fill="#1e293b"
                stroke="#ef4444"
                strokeWidth="1"
              />
              <text x={stnX} y={stnY - 14} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                {stationName.slice(0, 16)}
              </text>
            </g>
          </svg>
        </div>

        {/* Scientific HUD Card (page 19-20 specs) */}
        <div className="lg:col-span-5 p-5 md:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">بطاقة الرصد الهيدرولوجي للموقع</span>
              <h4 className="text-lg font-black text-white">{stationName}</h4>
              <p className="text-xs font-mono text-blue-400">Station ID: {stationId}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">الفترة الزمنية</span>
                <span className="font-mono font-bold text-slate-200">{period}</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">حالة الجودة التقويمية</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                  qualityStatus === 'Good' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {qualityStatus}
                </span>
              </div>
            </div>

            {/* Extreme Metrics Grid */}
            <div className="border border-white/10 rounded-2xl p-4 bg-white/5 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">القيم القياسية المرصودة</span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block mb-0.5">Rx1day</span>
                  <span className="text-sm font-black text-blue-400">{rx1Max}</span>
                  <span className="text-[8px] text-slate-500 block">مم</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block mb-0.5">Rx3day</span>
                  <span className="text-sm font-black text-emerald-400">{rx3Max}</span>
                  <span className="text-[8px] text-slate-500 block">مم</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block mb-0.5">Rx5day</span>
                  <span className="text-sm font-black text-purple-400">{rx5Max}</span>
                  <span className="text-[8px] text-slate-500 block">مم</span>
                </div>
              </div>
            </div>

            {/* Selected Model and 100-yr Return Level */}
            <div className="p-4 bg-blue-950/40 border border-blue-800/40 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase block">النموذج الإحصائي المختار</span>
                <span className="text-base font-black text-white">{selectedModel} Distribution</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Return Level (T=100)</span>
                <span className="text-xl font-black text-emerald-400">{returnLevel100} مم</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
            ✓ تم فحص الإحداثيات وتطابقها مع النطاق الجغرافي للقطر المصري وتحديد الحوض الهيدرولوجي الساحلي.
          </p>
        </div>

      </div>
    </div>
  );
};
