/**
 * منصة تحليل الأمطار القصوى
 * رسومات بيانية هيدرولوجية وإحصائية تفاعلية عالية الدقة بـ SVG مع تصدير PNG فوري
 */

import React, { useRef } from 'react';
import { Download } from 'lucide-react';

// Helper to export any SVG element as high-res PNG
export function downloadSvgAsPng(svgElement: SVGSVGElement | null, filename: string) {
  if (!svgElement) return;

  const xml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2; // High-resolution retina scale
    const width = svgElement.clientWidth || 700;
    const height = svgElement.clientHeight || 400;

    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      // Dark slate background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = filename;
      a.href = pngUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

// ==========================================
// 1. Q-Q Plot and P-P Plot Component
// ==========================================
interface QQPPPlotProps {
  qqPoints: Array<{ empirical: number; theoretical: number }>;
  ppPoints: Array<{ empirical_p: number; theoretical_p: number }>;
  modelName: string;
}

export const QQPPPlot: React.FC<QQPPPlotProps> = ({ qqPoints, ppPoints, modelName }) => {
  const qqSvgRef = useRef<SVGSVGElement>(null);
  const ppSvgRef = useRef<SVGSVGElement>(null);

  // Compute Q-Q bounds
  const maxQ = Math.max(
    ...qqPoints.map((p) => Math.max(p.empirical, p.theoretical)),
    10
  );
  const minQ = 0;

  const width = 360;
  const height = 280;
  const pad = 45;

  const scaleQ = (v: number) => {
    return pad + ((v - minQ) / (maxQ - minQ)) * (width - 2 * pad);
  };
  const scaleQY = (v: number) => {
    return height - pad - ((v - minQ) / (maxQ - minQ)) * (height - 2 * pad);
  };

  const scaleP = (v: number) => {
    return pad + v * (width - 2 * pad);
  };
  const scalePY = (v: number) => {
    return height - pad - v * (height - 2 * pad);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Q-Q Plot */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            رسم Q-Q (القيم النظرية مقابل التجريبية) — {modelName}
          </span>
          <button
            onClick={() => downloadSvgAsPng(qqSvgRef.current, `QQ_Plot_${modelName}.png`)}
            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="تصدير صورة PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <svg
          ref={qqSvgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-[10px]"
        >
          {/* Grid lines */}
          <line
            x1={pad}
            y1={scaleQY(maxQ * 0.25)}
            x2={width - pad}
            y2={scaleQY(maxQ * 0.25)}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={pad}
            y1={scaleQY(maxQ * 0.5)}
            x2={width - pad}
            y2={scaleQY(maxQ * 0.5)}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={pad}
            y1={scaleQY(maxQ * 0.75)}
            x2={width - pad}
            y2={scaleQY(maxQ * 0.75)}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />

          {/* 1:1 Reference Diagonal Line */}
          <line
            x1={scaleQ(0)}
            y1={scaleQY(0)}
            x2={scaleQ(maxQ)}
            y2={scaleQY(maxQ)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Points */}
          {qqPoints.map((pt, i) => (
            <circle
              key={i}
              cx={scaleQ(pt.theoretical)}
              cy={scaleQY(pt.empirical)}
              r="3.5"
              className="fill-emerald-400 stroke-slate-950 stroke-1 hover:r-5 transition-all"
            />
          ))}

          {/* Axes */}
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#64748b" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#64748b" />

          {/* Axis Labels */}
          <text x={width / 2} y={height - 12} textAnchor="middle" fill="#94a3b8">
            القيم النظرية (مم)
          </text>
          <text
            x={16}
            y={height / 2}
            textAnchor="middle"
            fill="#94a3b8"
            transform={`rotate(-90, 16, ${height / 2})`}
          >
            القيم الفعلية (مم)
          </text>
        </svg>
      </div>

      {/* P-P Plot */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            رسم P-P (الاحتمال التراكمي النظري مقابل التجريبي)
          </span>
          <button
            onClick={() => downloadSvgAsPng(ppSvgRef.current, `PP_Plot_${modelName}.png`)}
            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="تصدير صورة PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <svg
          ref={ppSvgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-[10px]"
        >
          {/* Grid lines */}
          <line x1={pad} y1={scalePY(0.5)} x2={width - pad} y2={scalePY(0.5)} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={scaleP(0.5)} y1={pad} x2={scaleP(0.5)} y2={height - pad} stroke="#1e293b" strokeDasharray="3 3" />

          {/* 1:1 Reference Line */}
          <line
            x1={scaleP(0)}
            y1={scalePY(0)}
            x2={scaleP(1)}
            y2={scalePY(1)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Points */}
          {ppPoints.map((pt, i) => (
            <circle
              key={i}
              cx={scaleP(pt.theoretical_p)}
              cy={scalePY(pt.empirical_p)}
              r="3.5"
              className="fill-cyan-400 stroke-slate-950 stroke-1 hover:r-5 transition-all"
            />
          ))}

          {/* Axes */}
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#64748b" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#64748b" />

          {/* Labels */}
          <text x={width / 2} y={height - 12} textAnchor="middle" fill="#94a3b8">
            الاحتمال النظري F(x)
          </text>
          <text
            x={16}
            y={height / 2}
            textAnchor="middle"
            fill="#94a3b8"
            transform={`rotate(-90, 16, ${height / 2})`}
          >
            الاحتمال التجريبي P_emp
          </text>
        </svg>
      </div>
    </div>
  );
};

// ==========================================
// 2. Return Level Curve with 95% Bootstrap CI
// ==========================================
interface ReturnLevelCurveChartProps {
  levels: Array<{
    period: number;
    level: number;
    lower: number;
    upper: number;
  }>;
  userHighlightT?: number;
  userHighlightMm?: number;
}

export const ReturnLevelCurveChart: React.FC<ReturnLevelCurveChartProps> = ({
  levels,
  userHighlightT,
  userHighlightMm,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 680;
  const height = 340;
  const pad = 50;

  // Logarithmic scale for Return Period T (from T=1.5 to T=250)
  const minLogT = Math.log10(1.5);
  const maxLogT = Math.log10(250);

  const maxMm = Math.max(...levels.map((l) => l.upper), (userHighlightMm || 0) * 1.1, 80);
  const minMm = 0;

  const scaleX = (t: number) => {
    const logT = Math.log10(Math.max(1.5, t));
    return pad + ((logT - minLogT) / (maxLogT - minLogT)) * (width - 2 * pad);
  };

  const scaleY = (mm: number) => {
    return height - pad - ((mm - minMm) / (maxMm - minMm)) * (height - 2 * pad);
  };

  // Build SVG path for main curve
  const curvePath = levels
    .map((l, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(l.period)} ${scaleY(l.level)}`)
    .join(' ');

  // Build CI shaded polygon path (Upper forward, Lower reversed)
  const upperPoints = levels.map((l) => `${scaleX(l.period)},${scaleY(l.upper)}`);
  const lowerPointsReversed = [...levels].reverse().map((l) => `${scaleX(l.period)},${scaleY(l.lower)}`);
  const ciPolygonPoints = [...upperPoints, ...lowerPointsReversed].join(' ');

  const gridT = [2, 5, 10, 25, 50, 100, 200];

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white">
            منحنى مستويات الرجوع الهيدرولوجية مع نطاق فترات الثقة 95% (Bootstrap)
          </h4>
          <p className="text-[11px] text-slate-400">
            مقياس لوغاريتمي لفترات العودة T (سنوات) مقابل كمية المطر القصوى (مم/يوم)
          </p>
        </div>
        <button
          onClick={() => downloadSvgAsPng(svgRef.current, 'Return_Level_Curve_95CI.png')}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>تصدير PNG</span>
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-[10px]"
      >
        {/* Vertical Grid lines for T */}
        {gridT.map((t) => (
          <g key={t}>
            <line
              x1={scaleX(t)}
              y1={pad}
              x2={scaleX(t)}
              y2={height - pad}
              stroke="#1e293b"
              strokeDasharray="3 3"
            />
            <text x={scaleX(t)} y={height - pad + 15} textAnchor="middle" fill="#64748b">
              {t}
            </text>
          </g>
        ))}

        {/* Horizontal Grid lines for mm */}
        {[20, 40, 60, 80, 100, 120].filter((v) => v < maxMm).map((v) => (
          <g key={v}>
            <line
              x1={pad}
              y1={scaleY(v)}
              x2={width - pad}
              y2={scaleY(v)}
              stroke="#1e293b"
              strokeDasharray="3 3"
            />
            <text x={pad - 8} y={scaleY(v) + 3} textAnchor="end" fill="#64748b">
              {v}
            </text>
          </g>
        ))}

        {/* 95% Bootstrap CI Shaded Band */}
        <polygon points={ciPolygonPoints} fill="rgba(16, 185, 129, 0.15)" stroke="none" />

        {/* Upper CI Line */}
        <path
          d={levels.map((l, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(l.period)} ${scaleY(l.upper)}`).join(' ')}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Lower CI Line */}
        <path
          d={levels.map((l, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(l.period)} ${scaleY(l.lower)}`).join(' ')}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Main Return Level Fitted Curve */}
        <path d={curvePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

        {/* Data points on curve */}
        {levels.map((l) => (
          <g key={l.period}>
            <circle cx={scaleX(l.period)} cy={scaleY(l.level)} r="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
            <text x={scaleX(l.period)} y={scaleY(l.level) - 8} textAnchor="middle" fill="#e2e8f0" fontWeight="bold">
              {l.level}
            </text>
          </g>
        ))}

        {/* User Highlight Point if specified */}
        {userHighlightT && userHighlightMm && (
          <g>
            <circle cx={scaleX(userHighlightT)} cy={scaleY(userHighlightMm)} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x={scaleX(userHighlightT)} y={scaleY(userHighlightMm) - 12} textAnchor="middle" fill="#f59e0b" fontWeight="bold">
              {userHighlightMm} مم ({userHighlightT} سنة)
            </text>
          </g>
        )}

        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#475569" strokeWidth="1.5" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#475569" strokeWidth="1.5" />

        {/* Axis titles */}
        <text x={width / 2} y={height - 10} textAnchor="middle" fill="#94a3b8" fontWeight="600">
          فترة العودة T (سنوات) — مقياس لوغاريتمي
        </text>
        <text
          x={16}
          y={height / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontWeight="600"
          transform={`rotate(-90, 16, ${height / 2})`}
        >
          مستوى الهطول المكافئ (مم)
        </text>
      </svg>
    </div>
  );
};

// ==========================================
// 3. Storm Daniel Daily Rainfall Chart
// ==========================================
interface DanielStormChartProps {
  dailyData: Array<{ date: string; rainfall_mm: number }>;
  historicalMax: number;
  isAvailable?: boolean;
  warningMessage?: string;
}

export const DanielStormChart: React.FC<DanielStormChartProps> = ({
  dailyData,
  historicalMax,
  isAvailable = true,
  warningMessage,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  if (!isAvailable || !dailyData || dailyData.length === 0) {
    return (
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-mono font-bold">
          Status: Not Available
        </div>
        <div className="space-y-1 max-w-md">
          <h4 className="text-sm font-bold text-white">لا توجد بيانات داخل فترة الحدث في الملف الحالي</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {warningMessage || 'الفترة الزمنية للبيانات المرفوعة لا تغطي أيام عاصفة دانيال (8 – 12 سبتمبر 2023). تم حجب الحساب منعاً لعرض إجمالي 0 مم مضلل.'}
          </p>
        </div>
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const pad = 40;

  const maxVal = Math.max(...dailyData.map((d) => d.rainfall_mm), 30);

  const barWidth = Math.max(16, (width - 2 * pad) / Math.max(1, dailyData.length) - 8);

  const scaleY = (mm: number) => {
    return height - pad - (mm / maxVal) * (height - 2 * pad);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200">
          التوزيع اليومي لهطول الأمطار خلال عاصفة دانيال (سبتمبر 2023)
        </span>
        <button
          onClick={() => downloadSvgAsPng(svgRef.current, 'Storm_Daniel_Daily_Rainfall.png')}
          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="تصدير صورة PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-[10px]"
      >
        {/* Horizontal grid lines */}
        {[10, 20, 30, 40, 50, 60, 80].filter((v) => v < maxVal).map((v) => (
          <line
            key={v}
            x1={pad}
            y1={scaleY(v)}
            x2={width - pad}
            y2={scaleY(v)}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
        ))}

        {/* Bars */}
        {dailyData.map((item, i) => {
          const x = pad + i * (barWidth + 8) + 4;
          const y = scaleY(item.rainfall_mm);
          const barHeight = height - pad - y;
          const isPeak = item.rainfall_mm === Math.max(...dailyData.map((d) => d.rainfall_mm));

          return (
            <g key={item.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="3"
                className={isPeak ? 'fill-amber-400' : 'fill-cyan-500 hover:fill-cyan-400'}
              />
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill="#e2e8f0" fontWeight="bold">
                {item.rainfall_mm > 0 ? `${item.rainfall_mm} مم` : '0'}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - pad + 15}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                {item.date.slice(5)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#475569" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#475569" />
      </svg>
    </div>
  );
};

// ==========================================
// 4. AMS Annual Maximum Series Chart
// ==========================================
interface AMSChartProps {
  amsData: Array<{ year: number; maximum_value_mm: number }>;
}

export const AMSChart: React.FC<AMSChartProps> = ({ amsData }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 640;
  const height = 240;
  const pad = 40;

  const maxVal = Math.max(...amsData.map((d) => d.maximum_value_mm), 50);
  const minVal = 0;

  const scaleX = (i: number) => {
    return pad + (i / Math.max(1, amsData.length - 1)) * (width - 2 * pad);
  };
  const scaleY = (mm: number) => {
    return height - pad - (mm / maxVal) * (height - 2 * pad);
  };

  const linePath = amsData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.maximum_value_mm)}`)
    .join(' ');

  const meanVal =
    amsData.length > 0
      ? amsData.reduce((acc, d) => acc + d.maximum_value_mm, 0) / amsData.length
      : 0;

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200">
          سلسلة القمم القصوى السنوية (AMS) — أقصى هطول يومي لكل سنة
        </span>
        <button
          onClick={() => downloadSvgAsPng(svgRef.current, 'AMS_Annual_Maxima_Series.png')}
          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="تصدير صورة PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-[10px]"
      >
        {/* Mean line */}
        <line
          x1={pad}
          y1={scaleY(meanVal)}
          x2={width - pad}
          y2={scaleY(meanVal)}
          stroke="#f59e0b"
          strokeDasharray="4 4"
        />
        <text x={width - pad - 5} y={scaleY(meanVal) - 5} textAnchor="end" fill="#f59e0b">
          المتوسط: {meanVal.toFixed(1)} مم
        </text>

        {/* AMS Curve */}
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" />

        {/* Points */}
        {amsData.map((d, i) => (
          <circle
            key={d.year}
            cx={scaleX(i)}
            cy={scaleY(d.maximum_value_mm)}
            r="3"
            fill="#10b981"
            stroke="#0f172a"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#475569" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#475569" />

        {/* Start and end years */}
        {amsData.length > 0 && (
          <>
            <text x={pad} y={height - pad + 15} textAnchor="middle" fill="#94a3b8">
              {amsData[0].year}
            </text>
            <text x={width - pad} y={height - pad + 15} textAnchor="middle" fill="#94a3b8">
              {amsData[amsData.length - 1].year}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
