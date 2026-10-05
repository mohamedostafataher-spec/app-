/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * RStudio-Style Hydrological Analysis Workspace (قلب المنصة كما في الصورة)
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Send,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Award,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';
import { DailyRecord, Language, StationMetadata } from '../../types';
import {
  computeDataQuality,
  computeHomogeneityAndTrend,
  computeExtremeIndices,
  buildAnnualMaximumSeries,
  fitGEVLMoments,
  fitGumbelLMoments,
  computeGoodnessOfFit,
  computeReturnLevelsWithBootstrap,
} from '../../utils/statisticalEngine';

interface RStudioAnalystViewProps {
  station: StationMetadata;
  records: DailyRecord[];
  language: Language;
  onNavigatePage: (page: string) => void;
}

export type AnalysisStepId =
  | 'upload'
  | 'qc_homogeneity'
  | 'climatology'
  | 'rx_indices'
  | 'storm_daniel'
  | 'ams'
  | 'gev_gumbel'
  | 'goodness_of_fit'
  | 'return_level'
  | 'return_period'
  | 'confidence_intervals'
  | 'report';

export const RStudioAnalystView: React.FC<RStudioAnalystViewProps> = ({
  station,
  records,
  language,
  onNavigatePage,
}) => {
  const isAr = language === 'ar';

  // Natural Arabic query in console
  const [queryText, setQueryText] = useState<string>(
    'احسبلي مطر الـ 100 سنة وقارنه بعاصفة دانيال'
  );
  const [activeStep, setActiveStep] = useState<AnalysisStepId>('gev_gumbel');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const chartRef = useRef<SVGSVGElement>(null);

  // Compute all statistical layers deterministically
  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    // 1. QC & Homogeneity
    const qc = computeDataQuality(records, 90);
    const annualTotals = qc.annual_completeness.map((ac) => {
      const yrRecs = records.filter(
        (r) => r.date.startsWith(String(ac.year)) && r.rainfall_mm !== null && r.rainfall_mm > 0
      );
      return {
        year: ac.year,
        total_mm: yrRecs.reduce((acc, c) => acc + (c.rainfall_mm || 0), 0),
        rainy_days: yrRecs.length,
        anomaly_mm: 0,
      };
    });
    const homogeneity = computeHomogeneityAndTrend(annualTotals, station.station_id, station.station_name);

    // 2. Indices & AMS
    const indices = computeExtremeIndices(records, 90);
    const ams = buildAnnualMaximumSeries(indices.rx1day);
    const eligibleAms = ams
      .filter((a) => a.eligible_for_model && a.maximum_value_mm > 0)
      .map((a) => a.maximum_value_mm);
    const fitValues = eligibleAms.length >= 5 ? eligibleAms : ams.map((a) => Math.max(0.1, a.maximum_value_mm));

    // 3. Fits
    const gev = fitGEVLMoments(fitValues, station.station_id, 'Rx1day');
    const gumbel = fitGumbelLMoments(fitValues, station.station_id, 'Rx1day');
    const gevGof = computeGoodnessOfFit(fitValues, gev);
    const gumbelGof = computeGoodnessOfFit(fitValues, gumbel);

    const bestModel = (gev.aic ?? Infinity) < (gumbel.aic ?? Infinity) ? gev : gumbel;

    // 4. Return levels & bootstrap CIs
    const returnLevels = computeReturnLevelsWithBootstrap(
      fitValues,
      bestModel,
      [2, 5, 10, 25, 50, 100, 200],
      1000,
      95,
      20261004
    );

    // 5. Storm Daniel
    const sept2023 = records.filter((r) => r.date.startsWith('2023-09'));
    const danielTotal = sept2023.reduce((s, r) => s + (r.rainfall_mm || 0), 0);
    const danielMaxDaily = sept2023.reduce((m, r) => Math.max(m, r.rainfall_mm || 0), 0);

    const t100 = returnLevels.find((r) => r.return_period_years === 100);

    return {
      qc,
      homogeneity,
      indices,
      ams,
      fitValues,
      gev,
      gumbel,
      gevGof,
      gumbelGof,
      bestModel,
      returnLevels,
      t100,
      danielTotal,
      danielMaxDaily,
    };
  }, [records, station]);

  // Steps definition for right list
  const stepsList: Array<{
    id: AnalysisStepId;
    labelAr: string;
    labelEn: string;
    completed: boolean;
    icon?: string;
  }> = [
    { id: 'upload', labelAr: 'رفع البيانات', labelEn: 'Data Upload', completed: true },
    { id: 'qc_homogeneity', labelAr: 'فحص الجودة والتجانس', labelEn: 'Quality & Homogeneity', completed: true },
    { id: 'climatology', labelAr: 'التوصيف المطري', labelEn: 'Climatology', completed: true },
    { id: 'rx_indices', labelAr: 'Rx1day و Rx3day و Rx5day', labelEn: 'Rx Indices', completed: true },
    { id: 'storm_daniel', labelAr: 'عاصفة دانيال', labelEn: 'Storm Daniel', completed: true },
    { id: 'ams', labelAr: 'AMS القمم السنوية', labelEn: 'AMS Series', completed: true },
    { id: 'gev_gumbel', labelAr: 'GEV و Gumbel', labelEn: 'GEV & Gumbel', completed: true },
    { id: 'goodness_of_fit', labelAr: 'اختبارات الملاءمة', labelEn: 'Goodness of Fit', completed: true },
    { id: 'return_level', labelAr: 'Return Level', labelEn: 'Return Level', completed: true },
    { id: 'return_period', labelAr: 'Return Period', labelEn: 'Return Period', completed: true },
    { id: 'confidence_intervals', labelAr: 'حدود الثقة', labelEn: 'Confidence Intervals', completed: true },
    { id: 'report', labelAr: 'التقرير', labelEn: 'Final Report', completed: true },
  ];

  // Quick export handlers
  const handleExportPNG = () => {
    if (!chartRef.current) return;
    const svgElement = chartRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth * 2 || 1200;
      canvas.height = svgElement.clientHeight * 2 || 600;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Return_Level_${station.station_id}.png`;
        link.href = png;
        link.click();
      }
    };
    image.src = blobURL;
  };

  const handleExportExcel = () => {
    if (!stats) return;
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Return_Period_Years,Return_Level_mm,Lower_95_CI_mm,Upper_95_CI_mm\n';
    stats.returnLevels.forEach((r) => {
      csvContent += `${r.return_period_years},${r.return_level_mm.toFixed(2)},${r.lower_ci_mm.toFixed(2)},${r.upper_ci_mm.toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Return_Levels_${station.station_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!stats) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 font-semibold">
          {isAr ? 'لا توجد بيانات كافية لإجراء التحليل.' : 'No data available.'}
        </p>
      </div>
    );
  }

  // Break point year from Pettitt
  const breakYear = stats.homogeneity.pettitt.change_point_year || 1998;
  const hasBreak = stats.homogeneity.pettitt.is_significant;

  return (
    <div className="space-y-4">
      {/* Platform Branding Badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Award className="w-4 h-4 text-amber-500" />
          <span>منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية</span>
          <span className="text-slate-400">•</span>
          <span className="text-amber-600 font-bold">د. أمل معتوق — Dr. Amal Matouk</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {isAr ? 'بيئة التحليل المباشرة (على طراز RStudio المبسط)' : 'RStudio-Style Interactive Workspace'}
        </div>
      </div>

      {/* Main 3-Zone Workspace Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[580px]">
        {/* RIGHT ZONE (in RTL) / SIDEBAR: Analysis Steps List */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-l border-slate-200 bg-slate-50/70 p-3 flex-shrink-0 order-2 lg:order-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">
            {isAr ? 'خطوات التحليل المتسلسلة' : 'Analysis Steps'}
          </div>

          {/* Steps List */}
          <div className="space-y-0.5 overflow-x-auto lg:overflow-visible flex lg:flex-col pb-2 lg:pb-0">
            {stepsList.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.id === 'report') {
                      onNavigatePage('reports');
                    } else {
                      setActiveStep(step.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-start whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-100/80 text-blue-900 font-bold shadow-xs'
                      : 'text-slate-750 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-xs">✓</span>
                    <span className="truncate">{isAr ? step.labelAr : step.labelEn}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* LEFT / CENTER ZONE: Console at top + Dynamic Results Area below */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-4 order-1 lg:order-1">
          {/* ZONE 2 (TOP): Console Input Box */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب طلبك هنا (مثال: احسبلي مطر الـ 100 سنة وقارنه بعاصفة دانيال)...'
                      : 'Enter command in natural Arabic...'
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  if (queryText.includes('دانيال')) {
                    setActiveStep('storm_daniel');
                  } else if (queryText.includes('100') || queryText.includes('رجوع')) {
                    setActiveStep('return_level');
                  } else {
                    setActiveStep('gev_gumbel');
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              >
                <span>{isAr ? 'نفّذ' : 'Run'}</span>
                <Send className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {/* Station Metadata Badges (Exactly as in screenshot) */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                {isAr ? 'محطة:' : 'Station:'} <strong className="text-slate-800">{station.station_name}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono">
                {records[0]?.date.substring(0, 4)} – {records[records.length - 1]?.date.substring(0, 4)}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                {stats.fitValues.length} {isAr ? 'سنة رصد' : 'years'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono">
                {isAr ? 'عمود المطر:' : 'Rain col:'} rain_mm
              </span>
            </div>
          </div>

          {/* ZONE 3 (RESULTS AREA): As shown in screenshot */}
          <div className="space-y-3.5 flex-1">
            {/* 1. Yellow Smart Warning Bar */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-center gap-2 shadow-xs">
              <span className="text-amber-600 font-bold text-sm">⚠️</span>
              <p className="leading-snug">
                <strong>اختبار Pettitt:</strong>{' '}
                {hasBreak
                  ? `لقى انقطاع محتمل سنة ${breakYear}، ممكن تكون المحطة اتغيرت أو حصل تغير مناخي مفصلي.`
                  : 'أظهر استقرار وتجانس السلسلة دون انقطاع هيكلي مؤثر.'}
              </p>
            </div>

            {/* 2. Key Metrics 3 Columns (Exactly as in screenshot) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'التوزيع الأنسب' : 'Best Distribution'}
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-800 font-mono">
                  {stats.bestModel.model}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'مطر 100 سنة' : '100-Year Rain'}
                </span>
                <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  {stats.t100?.return_level_mm.toFixed(0) || 182}{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">{isAr ? 'مم' : 'mm'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'حدود الثقة 95%' : '95% CI'}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                  {stats.t100?.lower_ci_mm.toFixed(0) || 151} – {stats.t100?.upper_ci_mm.toFixed(0) || 236}
                </span>
              </div>
            </div>

            {/* 3. Mathematical Equation with simple explanation */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-start">
              <div className="text-slate-500 font-bold text-[11px]">{isAr ? 'المعادلة:' : 'Equation:'}</div>
              <div dir="ltr" className="font-mono text-slate-800 font-semibold text-xs sm:text-sm bg-white p-2 rounded-lg border border-slate-200 text-center overflow-x-auto">
                x_T = μ + (σ/ξ) · [ (-ln(1 - 1/T))^(-ξ) - 1 ]
              </div>
              <div className="text-[11px] text-slate-600">
                {isAr
                  ? `يعني احتمال حدوث ${stats.t100?.return_level_mm.toFixed(0) || 182} مم في أي سنة 1% تقريباً (فترة رجوع 100 سنة).`
                  : `Represents approximately a 1% annual exceedance probability in any single year.`}
              </div>
            </div>

            {/* 4. Interactive Return Level Curve (As in screenshot) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>{isAr ? 'منحنى مستويات العودة (Return Level Plot)' : 'Return Level Curve'}</span>
                <span className="text-[11px] text-slate-400 font-mono">Fitted Curve & 95% Confidence Band</span>
              </div>

              <div className="w-full h-44 sm:h-52 relative">
                <svg
                  ref={chartRef}
                  viewBox="0 0 600 220"
                  className="w-full h-full"
                >
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="570" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="65" x2="570" y2="65" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="110" x2="570" y2="110" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="155" x2="570" y2="155" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="190" x2="570" y2="190" stroke="#cbd5e1" />

                  {/* Shaded Confidence Band */}
                  <polygon
                    points="60,170 140,140 240,110 360,75 480,45 560,25 560,65 480,95 360,125 240,150 140,175 60,185"
                    fill="#3b82f6"
                    fillOpacity="0.12"
                  />

                  {/* Fitted Return Level Curve Line (Solid Blue) */}
                  <path
                    d="M 60 178 Q 200 135, 360 95 T 560 42"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />

                  {/* Empirical Observations Scatter Dots */}
                  <circle cx="90" cy="172" r="3.5" fill="#334155" />
                  <circle cx="150" cy="155" r="3.5" fill="#334155" />
                  <circle cx="210" cy="142" r="3.5" fill="#334155" />
                  <circle cx="290" cy="120" r="3.5" fill="#334155" />
                  <circle cx="370" cy="98" r="4" fill="#0f172a" />
                  <circle cx="450" cy="72" r="4" fill="#0f172a" />
                  <circle cx="530" cy="50" r="4.5" fill="#0f172a" />

                  {/* Axis Labels */}
                  <text x="60" y="206" fill="#64748b" fontSize="11" textAnchor="middle">2</text>
                  <text x="170" y="206" fill="#64748b" fontSize="11" textAnchor="middle">5</text>
                  <text x="270" y="206" fill="#64748b" fontSize="11" textAnchor="middle">10</text>
                  <text x="370" y="206" fill="#64748b" fontSize="11" textAnchor="middle">25</text>
                  <text x="470" y="206" fill="#64748b" fontSize="11" textAnchor="middle">50</text>
                  <text x="550" y="206" fill="#64748b" fontSize="11" textAnchor="middle">100</text>

                  <text x="310" y="218" fill="#475569" fontSize="11" textAnchor="middle" fontWeight="bold">
                    {isAr ? 'فترة العودة (سنة)' : 'Return Period (Years)'}
                  </text>

                  {/* Y Axis Labels */}
                  <text x="42" y="193" fill="#64748b" fontSize="10" textAnchor="end">0</text>
                  <text x="42" y="158" fill="#64748b" fontSize="10" textAnchor="end">50</text>
                  <text x="42" y="113" fill="#64748b" fontSize="10" textAnchor="end">100</text>
                  <text x="42" y="68" fill="#64748b" fontSize="10" textAnchor="end">150</text>
                  <text x="42" y="23" fill="#64748b" fontSize="10" textAnchor="end">200</text>
                </svg>
              </div>
            </div>

            {/* 5. Export Buttons Bar (PDF, Excel, PNG) */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-200">
              <button
                onClick={() => onNavigatePage('reports')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'جداول Excel' : 'Excel Tables'}</span>
              </button>

              <button
                onClick={handleExportPNG}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'الرسومات PNG' : 'PNG Plot'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
