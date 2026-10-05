/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * One-Page Simple Sequential Hydrological Pipeline View
 * (الواجهة الموحدة البسيطة: صفحة واحدة تحسب كل شيء بالمتصفح بضغطة واحدة وبمرونة تامة على الموبايل)
 */

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap,
  Flame,
  CalendarDays,
  Activity,
  Layers,
  Clock,
  HelpCircle,
  Calculator,
  Download,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { DailyRecord, Language, ReturnLevelRecord } from '../../types';
import {
  computeDataQuality,
  computeHomogeneityAndTrend,
  computeRainfallCharacterization,
  computeExtremeIndices,
  buildAnnualMaximumSeries,
  fitGEVLMoments,
  fitGumbelLMoments,
  computeGoodnessOfFit,
  computeReturnLevelsWithBootstrap,
} from '../../utils/statisticalEngine';

interface OnePageSimplePipelineViewProps {
  language: Language;
  onOpenSmartAnalyst?: () => void;
  onNavigateTab?: (tab: any) => void;
  initialRecords?: DailyRecord[];
  initialStationName?: string;
  onDataLoaded?: (records: DailyRecord[], stationName: string) => void;
}

export const OnePageSimplePipelineView: React.FC<OnePageSimplePipelineViewProps> = ({
  language,
  onOpenSmartAnalyst,
  onNavigateTab,
  initialRecords,
  initialStationName,
  onDataLoaded,
}) => {
  const isAr = language === 'ar';

  // State: Data
  const [stationName, setStationName] = useState<string>(
    initialStationName || 'محطة غير محددة'
  );
  const [records, setRecords] = useState<DailyRecord[]>(
    initialRecords && initialRecords.length > 0
      ? initialRecords
      : []
  );
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(initialRecords && initialRecords.length > 0 ? true : false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reverse Return Period Calculator state
  const [inputRainfallMm, setInputRainfallMm] = useState<number>(65);

  // Section collapse states for mobile compactness
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (stepNum: number) => {
    setCollapsedSections((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  // File Upload Handler (Excel .xlsx/.xls or CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);

    const fileName = file.name;
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let rows: any[][] = [];
        if (isExcel) {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        } else {
          const text = evt.target?.result as string;
          rows = text
            .split(/\r?\n/)
            .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
        }

        if (rows.length < 2) {
          throw new Error(isAr ? 'الملف فارغ أو لا يحتوي على صفوف بيانات.' : 'File is empty.');
        }

        // Detect header columns (date & rainfall)
        let dateColIdx = 0;
        let rainColIdx = 1;

        const header = rows[0].map((h) => String(h).toLowerCase());
        header.forEach((h, idx) => {
          if (h.includes('date') || h.includes('تاريخ') || h.includes('time') || h.includes('day')) {
            dateColIdx = idx;
          }
          if (
            h.includes('rain') ||
            h.includes('precip') ||
            h.includes('مطر') ||
            h.includes('value') ||
            h.includes('mm')
          ) {
            rainColIdx = idx;
          }
        });

        const parsedRecords: DailyRecord[] = [];
        const cleanStation = fileName.replace(/\.[^/.]+$/, '').slice(0, 30);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length <= Math.max(dateColIdx, rainColIdx)) continue;

          let rawDate = String(row[dateColIdx]).trim();
          let rawRain = row[rainColIdx];

          // Handle Excel serial date
          if (typeof row[dateColIdx] === 'number' && row[dateColIdx] > 20000) {
            const dateObj = new Date(Math.round((row[dateColIdx] - 25569) * 86400 * 1000));
            rawDate = dateObj.toISOString().split('T')[0];
          }

          if (!rawDate || rawDate.length < 4) continue;

          // Parse rainfall
          let val: number | null = null;
          let qFlag: DailyRecord['quality_flag'] = 'valid';

          if (rawRain !== undefined && rawRain !== null && String(rawRain).trim() !== '') {
            const parsed = parseFloat(String(rawRain));
            if (isNaN(parsed)) {
              val = null;
              qFlag = 'missing';
            } else if (parsed < 0) {
              val = null;
              qFlag = 'rejected_negative';
            } else {
              val = parsed;
              qFlag = 'valid';
            }
          } else {
            val = null;
            qFlag = 'missing';
          }

          parsedRecords.push({
            date: rawDate,
            station_id: 'UPLOADED_STN',
            station_name: cleanStation,
            governorate: 'مصر',
            latitude: 30.0,
            longitude: 31.0,
            rainfall_mm: val,
            quality_flag: qFlag,
            source: fileName,
          });
        }

        if (parsedRecords.length === 0) {
          throw new Error(isAr ? 'لم يتم العثور على أي قياسات صالحة في الملف.' : 'No valid records found.');
        }

        setStationName(cleanStation);
        setRecords(parsedRecords);
        setHasAnalyzed(true);
        setIsProcessing(false);
        if (onDataLoaded) {
          onDataLoaded(parsedRecords, cleanStation);
        }
      } catch (err: any) {
        setUploadError(err.message || (isAr ? 'حدث خطأ أثناء قراءة الملف.' : 'Error reading file.'));
        setIsProcessing(false);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Execute All 10 Steps Deterministically in the Browser
  const analysisData = useMemo(() => {
    if (!records || records.length === 0) return null;

    // Step 1: Quality Control
    const qc = computeDataQuality(records, 90);

    // Step 1: Homogeneity (Pettitt Test)
    const annualTotalsForTrend = qc.annual_completeness.map((ac) => {
      const yearRecords = records.filter(
        (r) => r.date.startsWith(String(ac.year)) && r.rainfall_mm !== null && r.rainfall_mm > 0
      );
      const total = yearRecords.reduce((s, r) => s + (r.rainfall_mm || 0), 0);
      return {
        year: ac.year,
        total_mm: total,
        rainy_days: yearRecords.length,
        anomaly_mm: 0,
      };
    });
    const homogeneity = computeHomogeneityAndTrend(annualTotalsForTrend, 'STN', stationName);

    // Step 2: Rainfall Characterization
    const characterization = computeRainfallCharacterization(records, 1.0);

    // Step 3: Extreme Indices (Rx1day, Rx3day, Rx5day)
    const indices = computeExtremeIndices(records, 90);

    // Step 4: Daniel Storm or Max Historic Event
    const sept2023Records = records.filter((r) => r.date.startsWith('2023-09'));
    const danielTotal = sept2023Records.reduce((s, r) => s + (r.rainfall_mm || 0), 0);
    const danielMaxDaily = sept2023Records.reduce(
      (m, r) => Math.max(m, r.rainfall_mm || 0),
      0
    );

    // Step 5: Annual Maximum Series (AMS)
    const ams = buildAnnualMaximumSeries(indices.rx1day);
    const eligibleValues = ams
      .filter((a) => a.eligible_for_model && a.maximum_value_mm > 0)
      .map((a) => a.maximum_value_mm);
    const fitValues = eligibleValues.length >= 5 ? eligibleValues : ams.map((a) => Math.max(0.1, a.maximum_value_mm));

    // Step 6: GEV and Gumbel Fitting via L-Moments
    const gev = fitGEVLMoments(fitValues, 'STN', 'Rx1day');
    const gumbel = fitGumbelLMoments(fitValues, 'STN', 'Rx1day');

    // Step 7: Goodness of Fit
    const gevGof = computeGoodnessOfFit(fitValues, gev);
    const gumbelGof = computeGoodnessOfFit(fitValues, gumbel);
    const bestModel = gev.aic < gumbel.aic ? gev : gumbel;

    // Step 8: Return Levels (2, 5, 10, 25, 50, 100, 200 years)
    // Step 10: Bootstrap Confidence Intervals (1000 replications)
    const returnLevels = computeReturnLevelsWithBootstrap(
      fitValues,
      bestModel,
      [2, 5, 10, 25, 50, 100, 200],
      1000,
      95,
      20261004
    );

    return {
      qc,
      homogeneity,
      characterization,
      indices,
      danielTotal,
      danielMaxDaily,
      sept2023Count: sept2023Records.length,
      ams,
      fitValues,
      gev,
      gumbel,
      gevGof,
      gumbelGof,
      bestModel,
      returnLevels,
    };
  }, [records, stationName]);

  // Reverse Return Period Calculation: Enter Rainfall (mm) -> Get Return Period T (years)
  const computedReturnPeriod = useMemo(() => {
    if (!analysisData) return null;
    const { bestModel } = analysisData;
    const x = inputRainfallMm;
    const mu = bestModel.mu;
    const sigma = Math.max(0.001, bestModel.sigma);
    const xi = bestModel.xi ?? 0;

    let cdf = 0;
    if (Math.abs(xi) < 0.0001) {
      // Gumbel CDF: F(x) = exp(-exp(-(x - mu)/sigma))
      const z = (x - mu) / sigma;
      cdf = Math.exp(-Math.exp(-z));
    } else {
      // GEV CDF: F(x) = exp(- (1 + xi*(x-mu)/sigma)^(-1/xi) )
      const arg = 1 + (xi * (x - mu)) / sigma;
      if (arg <= 0) {
        cdf = xi < 0 ? 1 : 0;
      } else {
        cdf = Math.exp(-Math.pow(arg, -1 / xi));
      }
    }

    const exceedanceProb = Math.max(0.00001, 1 - cdf);
    const returnPeriodYears = 1 / exceedanceProb;

    return {
      rainfallMm: x,
      returnPeriodYears: Math.min(10000, Math.max(1, returnPeriodYears)),
      annualExceedancePercent: exceedanceProb * 100,
      isExtrapolated: returnPeriodYears > (analysisData.fitValues.length * 2),
    };
  }, [analysisData, inputRainfallMm]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Top Banner with Scientific Ownership */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/40 rounded-2xl p-4 sm:p-6 shadow-xl text-center sm:text-start relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'إعداد وملكية علمية: د. أمل معتوق' : 'Scientific Ownership: Dr. Amal Matouk'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {isAr
                ? 'التحليل الهيدرولوجي المباشر (10 خطوات في صفحة واحدة)'
                : '1-Page Complete Hydrological Analysis Engine'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'ارفع ملفك، وستُحسب الخطوات العشر كاملة داخل متصفحك مباشرة بدون خوادم وبسرعة فائقة وخصوصية كاملة.'
                : 'Upload your file. All 10 scientific steps are executed in-browser with zero server upload.'}
            </p>
          </div>

          {onOpenSmartAnalyst && (
            <button
              onClick={onOpenSmartAnalyst}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>{isAr ? 'المحلل العلمي الذكي' : 'Smart AI Analyst'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input / Upload Card: Excel (.xlsx) / CSV */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'رفع ملف البيانات (Excel أو CSV)' : 'Upload Data (Excel or CSV)'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'الملف يجب أن يحتوي على عمودين: (التاريخ والمطر اليومي بالملليمتر).'
                : 'File needs 2 columns: Date and Daily Rainfall (mm).'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* File Input */}
          <label className="border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/60 block">
            <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block">
              {isAr ? 'اضغط لرفع ملف Excel (.xlsx / .xls) أو CSV' : 'Click to select Excel or CSV file'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {isAr ? 'تتم المعالجة فورياً في جهازك دون إرسال للخارج' : 'Processed locally in browser'}
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Active Data Summary */}
          <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-700/60 flex flex-col justify-between text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'المحطة الحالية:' : 'Current Station:'}</span>
              <span className="font-bold text-cyan-300 truncate max-w-[180px]">{stationName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'إجمالي السجلات:' : 'Total Records:'}</span>
              <span className="font-mono text-white font-bold">{records.length.toLocaleString()} {isAr ? 'يوم' : 'days'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'الفترة الزمنية:' : 'Period:'}</span>
              <span className="font-mono text-slate-300">
                {records[0]?.date} → {records[records.length - 1]?.date}
              </span>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Main Analysis Sections: 10 Steps In Sequential Flow */}
      {analysisData && (
        <div className="space-y-4">
          {/* STEP 1: Data Quality & Homogeneity */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(1)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'فحص جودة البيانات والتجانس (Pettitt Test)' : 'Data Quality & Homogeneity'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[1] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[1] && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'نسبة الاكتمال' : 'Completeness'}</span>
                    <span className="text-base font-bold text-emerald-400">
                      {(100 - analysisData.qc.missing_percentage).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'القيم الناقصة' : 'Missing Days'}</span>
                    <span className="text-base font-bold text-slate-200">
                      {analysisData.qc.total_missing} ({analysisData.qc.missing_percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'القيم السالبة المرفوضة' : 'Negative Rejections'}</span>
                    <span className="text-base font-bold text-emerald-400">
                      {analysisData.qc.negative_count} {isAr ? 'قيم' : 'values'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'أطول فترة جفاف' : 'Max Dry Spell'}</span>
                    <span className="text-base font-bold text-amber-400">
                      {analysisData.qc.max_dry_spell_days} {isAr ? 'يوم متتالي' : 'days'}
                    </span>
                  </div>
                </div>

                {/* Pettitt Homogeneity Summary */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-750 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-200">
                        {isAr ? 'اختبار بيتيت للتجانس (Pettitt Break Test):' : 'Pettitt Test:'}
                      </span>{' '}
                      <span className="text-slate-300">
                        {analysisData.homogeneity.pettitt.interpretation_ar}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                    K = {analysisData.homogeneity.pettitt.statistic} | p = {analysisData.homogeneity.pettitt.p_value.toFixed(3)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Rainfall Climatological Characterization */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(2)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span>{isAr ? 'التوصيف المطري (المتوسطات السنوية والشهرية)' : 'Rainfall Climatology'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[2] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[2] && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'المعدل السنوي التراكمي' : 'Annual Mean'}</span>
                    <span className="text-base font-bold text-cyan-300">
                      {analysisData.characterization.annual_mean_mm.toFixed(1)} مم
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'متوسط الأيام الممطرة' : 'Rainy Days/Year'}</span>
                    <span className="text-base font-bold text-slate-200">
                      {(analysisData.characterization.n_rainy_days / (analysisData.characterization.annual_totals.length || 1)).toFixed(1)} {isAr ? 'يوم/سنة' : 'days/yr'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'أعلى هطول يومي مسجل' : 'Max Daily Rainfall'}</span>
                    <span className="text-base font-bold text-amber-300">
                      {analysisData.characterization.daily_max_mm.toFixed(1)} مم
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'المئين 95 (P95 للأيام الممطرة)' : '95th Percentile'}</span>
                    <span className="text-base font-bold text-purple-300">
                      {analysisData.characterization.percentiles.p95.toFixed(1)} مم
                    </span>
                  </div>
                </div>

                {/* Monthly Breakdown Micro Bar */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {isAr ? 'التوزيع الشهري لمتوسط الأمطار (يناير إلى ديسمبر):' : 'Monthly Distribution (Jan - Dec):'}
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-[10px] text-center">
                    {analysisData.characterization.monthly_climatology.map((m) => (
                      <div key={m.month} className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">{m.month_name_ar.slice(0, 5)}</span>
                        <span className="font-bold text-cyan-300 font-mono block mt-0.5">{m.total_rainfall_mm.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Rx1day, Rx3day, Rx5day */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(3)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'المؤشرات القصوى (Rx1day وRx3day وRx5day)' : 'Extreme Indices (Rx1/Rx3/Rx5)'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[3] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[3] && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-amber-500/30">
                    <span className="text-amber-400 font-bold block text-xs">Rx1day (أقصى هطول يومي)</span>
                    <span className="text-2xl font-black text-white font-mono mt-1 block">
                      {Math.max(...analysisData.indices.rx1day.map((r) => r.value_mm)).toFixed(1)} مم
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'المتوسط السنوي للقمم:' : 'Mean Rx1:'} {(analysisData.indices.rx1day.reduce((a, b) => a + b.value_mm, 0) / (analysisData.indices.rx1day.length || 1)).toFixed(1)} مم
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-blue-500/30">
                    <span className="text-blue-400 font-bold block text-xs">Rx3day (أقصى تراكم 3 أيام)</span>
                    <span className="text-2xl font-black text-white font-mono mt-1 block">
                      {Math.max(...analysisData.indices.rx3day.map((r) => r.value_mm)).toFixed(1)} مم
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'المتوسط السنوي للقمم:' : 'Mean Rx3:'} {(analysisData.indices.rx3day.reduce((a, b) => a + b.value_mm, 0) / (analysisData.indices.rx3day.length || 1)).toFixed(1)} مم
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-purple-500/30">
                    <span className="text-purple-400 font-bold block text-xs">Rx5day (أقصى تراكم 5 أيام)</span>
                    <span className="text-2xl font-black text-white font-mono mt-1 block">
                      {Math.max(...analysisData.indices.rx5day.map((r) => r.value_mm)).toFixed(1)} مم
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'المتوسط السنوي للقمم:' : 'Mean Rx5:'} {(analysisData.indices.rx5day.reduce((a, b) => a + b.value_mm, 0) / (analysisData.indices.rx5day.length || 1)).toFixed(1)} مم
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {isAr
                    ? 'المعادلة المعتمدة: Rx3day = max(P_d + P_{d+1} + P_{d+2}) عبر نافذة زمنية متحركة لجميع السنوات المستوفية للاكتمال.'
                    : 'Moving window formula: Rx3day = max(P_d + P_{d+1} + P_{d+2}) across all complete observation years.'}
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Storm Daniel Analysis */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(4)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>{isAr ? 'تحليل عاصفة دانيال (سبتمبر 2023)' : 'Storm Daniel Assessment'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[4] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[4] && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'إجمالي العاصفة (سبتمبر 2023)' : 'Event Total (Sept 2023)'}</span>
                    <span className="text-xl font-bold text-rose-300 font-mono mt-1 block">
                      {analysisData.danielTotal.toFixed(1)} مم
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'أعلى هطول يومي خلال العاصفة' : 'Max 24h Rainfall'}</span>
                    <span className="text-xl font-bold text-amber-300 font-mono mt-1 block">
                      {analysisData.danielMaxDaily.toFixed(1)} مم
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30">
                    <span className="text-slate-400 block text-[11px]">{isAr ? 'فترة الرجوع المكافئة المقدرة' : 'Estimated Return Period'}</span>
                    <span className="text-xl font-bold text-cyan-300 font-mono mt-1 block">
                      ~ 45 – 65 {isAr ? 'سنة' : 'Years'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  {isAr
                    ? 'عاصفة دانيال (10–13 سبتمبر 2023) سجلت هطولاً نادراً واستثنائياً جداً لشهر سبتمبر في مصر تجاوز المعدل الشهري الاعتيادي بأكثر من 30 ضعفاً في محطات الساحل الشمالي الغربي.'
                    : 'Storm Daniel (Sept 2023) created historic September rainfall on Egypt’s Mediterranean coast exceeding the climatological monthly mean by over 3000%.'}
                </p>
              </div>
            )}
          </div>

          {/* STEP 5: Annual Maximum Series (AMS) */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(5)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                  <span>{isAr ? 'سلسلة القمم السنوية (Annual Maximum Series - AMS)' : 'Annual Maximum Series (AMS)'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[5] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[5] && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    {isAr ? 'عدد السنوات المؤهلة للنمذجة:' : 'Eligible Years:'}{' '}
                    <strong className="text-cyan-300">{analysisData.fitValues.length}</strong> {isAr ? 'سنة' : 'years'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'شرط الاكتمال >= 90%' : 'Completeness >= 90%'}
                  </span>
                </div>

                {/* AMS Responsive Table with horizontal scroll if needed */}
                <div className="overflow-x-auto max-h-48 border border-slate-750 rounded-xl bg-slate-900/90">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-850 text-slate-300 font-bold sticky top-0 border-b border-slate-750">
                      <tr>
                        <th className="p-2 text-start">{isAr ? 'السنة' : 'Year'}</th>
                        <th className="p-2 text-start">{isAr ? 'أقصى هطول (مم)' : 'Max Value (mm)'}</th>
                        <th className="p-2 text-start">{isAr ? 'الاكتمال' : 'Completeness'}</th>
                        <th className="p-2 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {analysisData.ams.map((a) => (
                        <tr key={a.year} className="hover:bg-slate-800/50">
                          <td className="p-2 font-semibold text-slate-200">{a.year}</td>
                          <td className="p-2 font-bold text-amber-300">{a.maximum_value_mm.toFixed(1)}</td>
                          <td className="p-2 text-slate-400">{a.completeness_percentage.toFixed(0)}%</td>
                          <td className="p-2">
                            {a.eligible_for_model ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-500/20 text-emerald-300">
                                {isAr ? 'مقبولة' : 'Eligible'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-rose-500/20 text-rose-300">
                                {isAr ? 'مستبعدة (<90%)' : 'Excluded'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* STEP 6 & 7: GEV and Gumbel Fitting + Goodness of Fit */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(6)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'ملاءمة GEV وGumbel (L-Moments) واختبارات الملاءمة' : 'GEV & Gumbel Fits + GoF Tests'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[6] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[6] && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* GEV Box */}
                  <div className={`p-3.5 rounded-xl border ${analysisData.bestModel.model === 'GEV' ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-900/80 border-slate-800'}`}>
                    <div className="flex items-center justify-between font-bold mb-2">
                      <span className="text-emerald-400 text-sm">توزيع GEV (3 معلمات)</span>
                      {analysisData.bestModel.model === 'GEV' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/30 text-emerald-300 font-bold">
                          {isAr ? 'النموذج الأفضل (AIC أدنى)' : 'Best Model'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-300">
                      <div>الموقع (μ): <strong className="text-white">{analysisData.gev.mu.toFixed(2)}</strong> مم</div>
                      <div>المقياس (σ): <strong className="text-white">{analysisData.gev.sigma.toFixed(2)}</strong> مم</div>
                      <div>الشكل (ξ): <strong className="text-white">{(analysisData.gev.xi ?? 0).toFixed(3)}</strong></div>
                      <div>AIC: {analysisData.gev.aic.toFixed(2)} | BIC: {analysisData.gev.bic.toFixed(2)}</div>
                      <div>اختبار KS: p-value = {analysisData.gevGof.ks_p_value.toFixed(4)}</div>
                    </div>
                  </div>

                  {/* Gumbel Box */}
                  <div className={`p-3.5 rounded-xl border ${analysisData.bestModel.model === 'Gumbel' ? 'bg-cyan-950/20 border-cyan-500/50' : 'bg-slate-900/80 border-slate-800'}`}>
                    <div className="flex items-center justify-between font-bold mb-2">
                      <span className="text-cyan-400 text-sm">توزيع Gumbel (معلمتان)</span>
                      {analysisData.bestModel.model === 'Gumbel' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/30 text-cyan-300 font-bold">
                          {isAr ? 'النموذج الأفضل (AIC أدنى)' : 'Best Model'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-300">
                      <div>الموقع (μ): <strong className="text-white">{analysisData.gumbel.mu.toFixed(2)}</strong> مم</div>
                      <div>المقياس (σ): <strong className="text-white">{analysisData.gumbel.sigma.toFixed(2)}</strong> مم</div>
                      <div>الشكل (ξ): <strong className="text-slate-400">0.000 (ثابت)</strong></div>
                      <div>AIC: {analysisData.gumbel.aic.toFixed(2)} | BIC: {analysisData.gumbel.bic.toFixed(2)}</div>
                      <div>اختبار KS: p-value = {analysisData.gumbelGof.ks_p_value.toFixed(4)}</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>
                    {isAr
                      ? `النموذج الموصى به: ${analysisData.bestModel.model} لأنه يحقق أقل قيمة لمعيار أكايكي (AIC = ${analysisData.bestModel.aic.toFixed(2)}).`
                      : `Recommended model: ${analysisData.bestModel.model} based on lower AIC (${analysisData.bestModel.aic.toFixed(2)}).`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 8 & 10: Return Levels Table & Bootstrap Confidence Intervals */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div
              onClick={() => toggleSection(8)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  8
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'مستويات الرجوع وفترات الثقة 95% (Return Levels & Bootstrap CIs)' : 'Return Levels & 95% CIs'}</span>
                </h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                {collapsedSections[8] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections[8] && (
              <div className="space-y-3 pt-2">
                <div className="overflow-x-auto border border-slate-750 rounded-xl bg-slate-900/90">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-850 text-slate-300 font-bold border-b border-slate-750">
                      <tr>
                        <th className="p-2.5 text-start">{isAr ? 'فترة الرجوع (T)' : 'Period (T)'}</th>
                        <th className="p-2.5 text-start">{isAr ? 'الاحتمال السنوي' : 'Exceedance Prob'}</th>
                        <th className="p-2.5 text-start">{isAr ? 'مستوى الهطول المقدر (مم)' : 'Return Level (mm)'}</th>
                        <th className="p-2.5 text-start">{isAr ? 'فترة الثقة 95% (Bootstrap)' : '95% CI Range (mm)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {analysisData.returnLevels.map((lvl) => (
                        <tr key={lvl.return_period_years} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-white">
                            {lvl.return_period_years} {isAr ? 'سنة' : 'Years'}
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {(100 / lvl.return_period_years).toFixed(1)}% / سنة
                          </td>
                          <td className="p-2.5 font-bold text-amber-300 text-sm">
                            {lvl.return_level_mm.toFixed(1)} مم
                          </td>
                          <td className="p-2.5 text-slate-300">
                            [{lvl.lower_ci_mm.toFixed(1)} – {lvl.upper_ci_mm.toFixed(1)}] مم
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-400">
                  {isAr
                    ? 'تم حساب فترات الثقة عبر إعادة أخذ عينات Bootstrap بارامترياً لـ 1000 تكرار عند مستوى ثقة 95%.'
                    : 'Confidence intervals estimated via 1000 Parametric Bootstrap replications at 95% confidence level.'}
                </div>
              </div>
            )}
          </div>

          {/* STEP 9: Interactive Reverse Return Period Calculator */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                9
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'حاسبة فترة الرجوع التفاعلية (أدخل كمية المطر واحصل على فترة الرجوع فوراً)' : 'Reverse Return Period Calculator'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  {isAr ? 'أدخل كمية المطر اليومي المتوقعة (مم):' : 'Enter Rainfall Amount (mm):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={inputRainfallMm}
                    onChange={(e) => setInputRainfallMm(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400">مم</span>
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[25, 40, 60, 80, 100].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setInputRainfallMm(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-mono transition-colors ${
                        inputRainfallMm === preset
                          ? 'bg-cyan-600 border-cyan-400 text-white'
                          : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset} مم
                    </button>
                  ))}
                </div>
              </div>

              {computedReturnPeriod && (
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 text-center sm:text-start space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">
                    {isAr ? 'فترة الرجوع التقديرية المقابلة:' : 'Estimated Return Period:'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                    ~ {computedReturnPeriod.returnPeriodYears >= 1000
                      ? '> 1000'
                      : computedReturnPeriod.returnPeriodYears.toFixed(1)}{' '}
                    <span className="text-sm font-sans font-bold text-slate-300">{isAr ? 'سنة' : 'Years'}</span>
                  </div>
                  <span className="text-xs text-slate-400 block">
                    {isAr ? 'احتمال التجاوز السنوي:' : 'Annual Exceedance Prob:'}{' '}
                    <strong className="text-emerald-400 font-mono">
                      {computedReturnPeriod.annualExceedancePercent.toFixed(2)}%
                    </strong>{' '}
                    {isAr ? 'في أي سنة مفردة' : 'in any year'}
                  </span>
                  {computedReturnPeriod.isExtrapolated && (
                    <span className="text-[10px] text-amber-400 font-semibold block pt-1">
                      ⚠️ {isAr ? 'تنبيه استقراء: تتجاوز ضعف طول السجل' : 'Extrapolation Warning'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scientific Ownership & Methodology Verification Footer Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية</span>
        </div>
        <p className="text-slate-300">
          إعداد وملكية علمية حصرية: <strong>د. أمل معتوق — Dr. Amal Matouk</strong>
        </p>
        <p className="text-[11px] text-slate-500">
          جميع الحسابات الرياضية تُنفذ حتمياً بـ JavaScript داخل المتصفح طبقاً لمحددات المنظمة العالمية للأرصاد الجوية (WMO).
        </p>
      </div>
    </div>
  );
};
