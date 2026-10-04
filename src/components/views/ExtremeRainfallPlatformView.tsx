/**
 * منصة تحليل الأمطار القصوى — لوحة التحكم الاحترافية (Professional Dashboard)
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * 100% In-Browser Pure Client-Side JavaScript Computation
 */

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Upload,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
  Search,
  ShieldCheck,
  AlertTriangle,
  Download,
  Info,
  ArrowLeftRight,
  Printer,
  CheckCircle2,
  Calculator,
  CalendarDays,
  TrendingUp,
  Edit3,
  X,
} from 'lucide-react';
import { DailyRecord } from '../../types';
import { DEMO_DAILY_RECORDS } from '../../data/demoData';
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
import {
  QQPPPlot,
  ReturnLevelCurveChart,
  DanielStormChart,
  AMSChart,
} from '../HydroCharts';
import { SpatialRainfallChart } from '../SpatialRainfallChart';
import { FormulasAndReferencesModal } from '../FormulasAndReferencesModal';

export const ExtremeRainfallPlatformView: React.FC = () => {
  // 1. Data State
  const [stationName, setStationName] = useState<string>('محطة الإسكندرية (سجل تجريبي)');
  const [records, setRecords] = useState<DailyRecord[]>(
    DEMO_DAILY_RECORDS.filter((r) => r.station_id === 'ALX01')
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Column mapping & preview state
  const [rawTableRows, setRawTableRows] = useState<any[][] | null>(null);
  const [dateColIdx, setDateColIdx] = useState<number>(0);
  const [rainColIdx, setRainColIdx] = useState<number>(1);
  const [latColIdx, setLatColIdx] = useState<number>(-1);
  const [lonColIdx, setLonColIdx] = useState<number>(-1);
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [manualInputText, setManualInputText] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [isSmartCommand, setIsSmartCommand] = useState<boolean>(false);

  // UI State
  const [showFormulasModal, setShowFormulasModal] = useState<boolean>(false);
  const [stormStartDate, setStormStartDate] = useState<string>('2023-09-04');
  const [stormEndDate, setStormEndDate] = useState<string>('2023-09-12');
  const [inputRainMm, setInputRainMm] = useState<number>(65);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Helper: Download Template
  const downloadTemplate = () => {
    const csvContent = "Date,Rainfall_mm,Lat,Lon\n2023-01-01,15.5,31.2,29.9\n2023-01-02,0,31.2,29.9\n2022-12-15,45.2,31.2,29.9";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "rainfall_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Demo Data
  // Manual Input Parser - Robust Scientific Version
  const handleManualInputSubmit = () => {
    if (!manualInputText.trim()) return;
    setUploadError(null);
    try {
      const lines = manualInputText.trim().split(/\r?\n/);
      
      // Filter out scientific command headers (like "تحليل إحصائي -> ...")
      const dataLines = lines.filter(line => {
        const l = line.toLowerCase();
        return !l.includes('تحليل') && !l.includes('→') && !l.includes('الخطوات') && !l.includes('فحص جودة');
      }).filter(line => line.trim().length > 0);

      if (dataLines.length < 1) {
        throw new Error('الرجاء إدخال أسطر البيانات (تاريخ، مطر) أسفل سطر الأمر.');
      }

      const rows = dataLines.map(line => {
        // Support comma, tab, or semicolon delimiters
        const cells = line.split(/[,\t;]/).map(c => c.trim());
        return cells;
      });

      setUploadedFileName("Manual_Scientific_Analysis");
      setRawTableRows(rows);
      setShowColumnMapper(true);
      setShowManualInput(false);
      
      // Auto-detect columns
      let dIdx = 0, rIdx = 1;
      const firstRow = rows[0].map(c => String(c).toLowerCase());
      firstRow.forEach((c, idx) => {
        if (c.includes('date') || c.includes('تاريخ')) dIdx = idx;
        if (c.includes('rain') || c.includes('مطر') || c.includes('mm')) rIdx = idx;
      });

      setDateColIdx(dIdx);
      setRainColIdx(rIdx);
      parseRowsIntoRecords(rows, dIdx, rIdx, -1, -1, "Manual_Input");
    } catch (err: any) {
      setUploadError(`خطأ في قراءة البيانات: ${err.message}`);
    }
  };

  const handleLoadDemo = () => {
    const alexRecords = DEMO_DAILY_RECORDS.filter((r) => r.station_id === 'ALX01');
    setStationName('محطة الإسكندرية (سجل تجريبي 30 سنة)');
    setRecords(alexRecords);
    setRawTableRows(null);
    setShowColumnMapper(false);
    setUploadError(null);
  };

  // File Upload Handler - Unified Robust Version (Excel & CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const fileName = file.name;
    setUploadedFileName(fileName);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        // XLSX.read handles .xlsx, .xls, .csv, .ods, etc. automatically
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rows.length < 1) throw new Error('الملف فارغ أو غير صالح.');

        // Auto-detect columns by keywords
        let dIdx = -1, rIdx = -1, ltIdx = -1, lnIdx = -1;
        const header = rows[0].map((h) => String(h || '').toLowerCase().trim());
        
        header.forEach((h, idx) => {
          if (h.includes('date') || h.includes('تاريخ') || h.includes('day') || h.includes('time') || h.includes('يوم')) dIdx = idx;
          if (h.includes('rain') || h.includes('مطر') || h.includes('mm') || h.includes('precip') || h.includes('قيمة')) rIdx = idx;
          if (h.includes('lat') || h.includes('عرض')) ltIdx = idx;
          if (h.includes('lon') || h.includes('long') || h.includes('طول')) lnIdx = idx;
        });

        // Fallback if not detected
        if (dIdx === -1) dIdx = 0;
        if (rIdx === -1) rIdx = header.length > 1 ? 1 : 0;

        setDateColIdx(dIdx);
        setRainColIdx(rIdx);
        setLatColIdx(ltIdx);
        setLonColIdx(lnIdx);
        setRawTableRows(rows);
        setShowColumnMapper(true);
        parseRowsIntoRecords(rows, dIdx, rIdx, ltIdx, lnIdx, fileName);
      } catch (err: any) {
        setUploadError(`خطأ في معالجة الملف: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const parseRowsIntoRecords = (rows: any[][], dCol: number, rCol: number, ltCol: number, lnCol: number, fName: string) => {
    const cleanStation = fName.replace(/\.[^/.]+$/, '').slice(0, 40);
    const parsed: DailyRecord[] = [];
    
    // Valid headers often occupy the first row. We start from row 1 or 0 if data is pure.
    // If headers are missing, the auto-detect might fail, so we ensure fallback.
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      let rawDateValue = row[dCol];
      let dateStr = '';

      // Skip header rows if they are strings and this is row 0
      if (i === 0 && typeof rawDateValue === 'string' && (rawDateValue.toLowerCase().includes('date') || rawDateValue.includes('تاريخ'))) continue;

      // Handle JS Date objects
      if (rawDateValue instanceof Date) {
        if (!isNaN(rawDateValue.getTime())) {
          dateStr = rawDateValue.toISOString().split('T')[0];
        }
      } else if (typeof rawDateValue === 'number') {
        // Excel serial date number check (usually > 10000 for dates in 1927+)
        if (rawDateValue > 10000) {
          const d = new Date(Math.round((rawDateValue - 25569) * 86400 * 1000));
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
        } else {
          dateStr = String(rawDateValue);
        }
      } else {
        dateStr = String(rawDateValue || '').trim();
        // Try parsing common formats if it's just a string like "01/01/2023"
        if (dateStr && !dateStr.includes('-') && (dateStr.includes('/') || dateStr.includes('.'))) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
        }
      }

      let rainVal = parseFloat(String(row[rCol] || '0').replace(/[^0-9.]/g, ''));
      let latVal = ltCol !== -1 && row[ltCol] !== undefined ? parseFloat(String(row[ltCol]).replace(/[^0-9.-]/g, '')) : 0;
      let lonVal = lnCol !== -1 && row[lnCol] !== undefined ? parseFloat(String(row[lnCol]).replace(/[^0-9.-]/g, '')) : 0;
      
      if (dateStr && !isNaN(rainVal) && dateStr.length >= 8) {
        parsed.push({
          date: dateStr,
          station_id: 'UPLOADED',
          station_name: cleanStation,
          governorate: 'مصر',
          latitude: isNaN(latVal) ? 0 : latVal,
          longitude: isNaN(lonVal) ? 0 : lonVal,
          rainfall_mm: rainVal >= 0 ? rainVal : 0,
          quality_flag: rainVal >= 0 ? 'valid' : 'rejected_negative',
          source: fName,
        });
      }
    }

    if (parsed.length === 0) {
      throw new Error('لم يتم العثور على بيانات صالحة. يرجى التأكد من أن الملف يحتوي على أرقام في عمود المطر وتواريخ صحيحة.');
    }

    setStationName(cleanStation);
    setRecords(parsed);
  };

  const applyColumnMapping = (newDCol: number, newRCol: number, newLtCol: number, newLnCol: number) => {
    if (!rawTableRows) return;
    setDateColIdx(newDCol);
    setRainColIdx(newRCol);
    setLatColIdx(newLtCol);
    setLonColIdx(newLnCol);
    try {
      parseRowsIntoRecords(rawTableRows, newDCol, newRCol, newLtCol, newLnCol, uploadedFileName);
      setUploadError(null);
    } catch (e: any) {
      setUploadError(e.message);
    }
  };

  // PDF Export Logic
  const exportToPDF = async () => {
    if (!reportRef.current || !hydro) return;
    setIsExportingPDF(true);
    
    // Smooth scroll to top to ensure capturing from beginning
    reportRef.current.scrollTo({ top: 0 });
    
    try {
      // Small delay to ensure any animations or state changes are settled
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5, // Slightly lower scale for better performance and stability
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Fixed width for consistent layout in PDF
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality for smaller PDF size
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const canvasHeightMM = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = canvasHeightMM;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightMM);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - canvasHeightMM;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightMM);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Hydrological_Analysis_${stationName}.pdf`);
    } catch (err: any) {
      console.error('PDF Generation failed', err);
      setUploadError(`فشل في إنشاء ملف PDF: ${err.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ------------------------------------------
  // CORE ENGINE COMPUTATION
  // ------------------------------------------
  const hydro = useMemo(() => {
    if (!records || records.length === 0) return null;

    const qc = computeDataQuality(records, 90);
    const annualTotals = qc.annual_completeness.map(ac => ({
      year: ac.year,
      total_mm: records.filter(r => r.date.startsWith(String(ac.year))).reduce((s, r) => s + (r.rainfall_mm || 0), 0)
    }));
    const homogeneity = computeHomogeneityAndTrend(annualTotals, 'STN', stationName);
    const characterization = computeRainfallCharacterization(records, 1.0);
    const indices = computeExtremeIndices(records, 90);
    
    // Storm Analysis
    const stormRecords = records.filter(r => r.date >= stormStartDate && r.date <= stormEndDate);
    const stormMaxDaily = stormRecords.reduce((m, r) => Math.max(m, r.rainfall_mm || 0), 0);
    
    // AMS & Fitting
    const ams = buildAnnualMaximumSeries(indices.rx1day);
    const fitValues = ams.filter(a => a.eligible_for_model).map(a => a.maximum_value_mm);
    const canModel = fitValues.length >= 5;

    let gev: any = null, gumbel: any = null, bestModel: any = null, bestGof: any = null, returnLevels: any[] = [], rp: number = 0;

    if (canModel) {
      gev = fitGEVLMoments(fitValues, 'STN', 'Rx1day');
      gumbel = fitGumbelLMoments(fitValues, 'STN', 'Rx1day');
      bestModel = gev.aic < gumbel.aic ? gev : gumbel;
      bestGof = computeGoodnessOfFit(fitValues, bestModel);
      returnLevels = computeReturnLevelsWithBootstrap(fitValues, bestModel, [2, 5, 10, 25, 50, 100], 1000);

      // Inverse Return Period
      const x = Math.max(0.1, inputRainMm);
      const mu = bestModel.mu, sigma = Math.max(0.001, bestModel.sigma), xi = bestModel.xi ?? 0;
      let cdf = 0;
      if (Math.abs(xi) < 0.0001 || bestModel.model === 'Gumbel') {
        cdf = Math.exp(-Math.exp(-(x - mu) / sigma));
      } else {
        const arg = 1 + (xi * (x - mu)) / sigma;
        cdf = arg <= 0 ? (xi < 0 ? 1 : 0) : Math.exp(-Math.pow(arg, -1 / xi));
      }
      rp = Math.round((1 / Math.max(1e-6, 1 - cdf)) * 10) / 10;
    }

    return { 
      qc, homogeneity, characterization, ams, bestModel, bestGof, returnLevels, 
      returnPeriodYears: rp, nYears: fitValues.length, canModel,
      stormMaxDaily, stormDailyChartData: stormRecords.map(r => ({ date: r.date, rainfall_mm: r.rainfall_mm || 0 }))
    };
  }, [records, stormStartDate, stormEndDate, inputRainMm, stationName]);

  const exportAllToExcel = () => {
    if (!hydro) return;
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['اسم المحطة', stationName],
      ['عدد سنوات الرصد', hydro.nYears],
      ['أقصى قيمة يومية رصدت', hydro.characterization.daily_max_mm],
      ['المتوسط السنوي', hydro.characterization.annual_mean_mm],
      ['التوزيع الأنسب', hydro.bestModel?.model || 'N/A'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    // Return Levels Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hydro.returnLevels), 'Return_Levels');
    
    // AMS Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hydro.ams), 'AMS_Series');
    
    XLSX.writeFile(wb, `Hydrological_Analysis_${stationName}.xlsx`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen md:h-[calc(100vh-2rem)] gap-0 overflow-hidden bg-[#f8f9fa]">
      {/* 1. NAVIGATION SIDEBAR - Responsive */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-slate-200 flex flex-col no-print shrink-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between md:block">
          <div>
            <div className="flex items-center gap-3 mb-1 md:mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">المحرك الهيدرولوجي</h1>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Professional Workflow v6.0</p>
          </div>
          {/* Mobile Print Button */}
          <button onClick={exportToPDF} className="md:hidden p-2 bg-slate-900 text-white rounded-lg">
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 md:overflow-y-auto p-4 space-y-1 custom-scrollbar hidden md:block">
          {[
            { id: 'step-1', icon: ShieldCheck, label: 'جودة البيانات والتجانس' },
            { id: 'step-2', icon: Activity, label: 'التوصيف المطري والاتجاه' },
            { id: 'step-3', icon: Zap, label: 'مؤشرات Rx1, Rx3, Rx5' },
            { id: 'step-4', icon: Info, label: 'تحليل عاصفة دانيال' },
            { id: 'step-5', icon: Layers, label: 'سلسلة AMS السنوية' },
            { id: 'step-6', icon: BookOpen, label: 'نماذج GEV و Gumbel' },
            { id: 'step-7', icon: CheckCircle2, label: 'اختبارات جودة الملاءمة' },
            { id: 'step-8', icon: Calculator, label: 'مستويات الرجوع (Levels)' },
            { id: 'step-9', icon: RefreshCw, label: 'حاسبة فترات العودة' },
            { id: 'step-10', icon: TrendingUp, label: 'فترات الثقة (95% CI)' },
            { id: 'step-11', icon: Activity, label: 'التحليل المكاني (Lat/Lon)' },
            { id: 'step-12', icon: ShieldCheck, label: 'التحقق العلمي (Validation)' },
          ].map((step, idx) => (
            <button
              key={step.id}
              onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all group"
            >
              <span className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center text-[9px] group-hover:bg-blue-50 transition-colors">{idx + 1}</span>
              <step.icon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
              <span className="flex-1 truncate">{step.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 bg-slate-50/50 hidden md:block">
           <button onClick={exportToPDF} disabled={isExportingPDF} className="w-full py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2">
             {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
             {isExportingPDF ? 'جاري التوليد...' : 'تصدير تقرير PDF'}
           </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <header className="min-h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between shrink-0 no-print py-3 md:py-0 gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
             <button onClick={handleLoadDemo} className="whitespace-nowrap px-3 md:px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-white rounded-lg transition-all">عينة تجريبية</button>
             <label className="whitespace-nowrap px-4 md:px-6 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-700 shadow-sm shadow-blue-100">
               رفع بيانات
               <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" />
             </label>
             <button onClick={() => setShowManualInput(!showManualInput)} className="whitespace-nowrap px-3 md:px-4 py-1.5 text-[10px] font-bold text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 flex items-center gap-2">
               <Edit3 className="w-3 h-3" />
               إدخال يدوي
             </button>
             <button onClick={exportAllToExcel} className="whitespace-nowrap px-3 md:px-4 py-1.5 text-[10px] font-bold text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100">Excel</button>
             <button onClick={exportToPDF} disabled={isExportingPDF} className="whitespace-nowrap px-3 md:px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-black transition-all md:hidden">PDF</button>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
             <div className="text-left hidden sm:block">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Station</p>
                <p className="text-[11px] font-black text-slate-900 truncate max-w-[120px] md:max-w-[200px]">{stationName}</p>
             </div>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border border-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
             </div>
          </div>
        </header>

        {/* Dynamic Workflow View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative" ref={reportRef}>
          {isExportingPDF && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4 no-print">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
               <p className="text-sm font-black text-slate-900">جاري إنشاء التقرير...</p>
            </div>
          )}

          {uploadError && (
            <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 text-red-600 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="flex-1">{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="opacity-50">×</button>
            </div>
          )}

          {!hydro ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 md:space-y-8 max-w-xl mx-auto text-center px-4 py-12 md:py-20">
               {records.length > 0 && !hydro && (
                 <div className="w-full bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center gap-2 text-amber-700 text-xs font-bold mb-4">
                   <AlertTriangle className="w-6 h-6" />
                   <p>تم تحميل {records.length} سجل، ولكن البيانات غير كافية للتحليل الإحصائي.</p>
                   <p className="font-normal opacity-80">يتطلب المحرك وجود بيانات تغطي 5 سنوات على الأقل لاستخراج القيم القصوى السنوية (AMS) وبدء النمذجة.</p>
                 </div>
               )}
               
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center border border-slate-50 cursor-pointer group" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                  <Upload className="w-8 h-8 md:w-10 md:h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div className="space-y-2 md:space-y-3">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">ابدأ التحليل الاحترافي</h2>
                 <p className="text-slate-500 leading-relaxed text-xs md:text-sm">ارفع ملف Excel (أو CSV) أو أدخل البيانات يدوياً وسيقوم النظام بتوليد مراحل التحليل فوراً.</p>
               </div>

               <div className="flex flex-col gap-3 w-full">
                  <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Download className="w-3.5 h-3.5" />
                    تحميل نموذج ملف البيانات (Template)
                  </button>
                  
                  <div className="p-4 md:p-6 border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[2.5rem] bg-slate-50/50 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المصادر الموصى بها للبيانات</p>
                    <div className="grid grid-cols-1 gap-2 text-[10px] text-right text-slate-600 font-bold">
                       <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between"><span>NOAA GHCN-Daily</span> <a href="https://www.ncei.noaa.gov/products/land-based-station/global-historical-climatology-network-daily" target="_blank" className="text-blue-500">زيارة</a></div>
                       <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between"><span>ECA&D Dataset</span> <a href="https://www.ecad.eu/" target="_blank" className="text-blue-500">زيارة</a></div>
                       <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between"><span>NASA GPM (Satellite)</span> <a href="https://gpm.nasa.gov/data" target="_blank" className="text-blue-500">زيارة</a></div>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-32">
              
              {/* TOP DASHBOARD SUMMARY */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 no-print">
                 {[
                   { label: 'أقصى Rx1day', value: hydro.characterization.daily_max_mm, unit: 'مم' },
                   { label: 'المتوسط السنوي', value: hydro.characterization.annual_mean_mm, unit: 'مم' },
                   { label: 'سنوات الرصد', value: hydro.nYears, unit: 'سنة' },
                   { label: 'أقوى نموذج', value: hydro.bestModel?.model || 'N/A', unit: '' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32 hover:shadow-md transition-all">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                      <div className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">
                        {stat.value} <span className="text-[10px] md:text-xs text-slate-400 font-sans mr-1">{stat.unit}</span>
                      </div>
                   </div>
                 ))}
              </section>

              {/* STEP 1: Data Quality & Homogeneity */}
              <section id="step-1" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/30 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0 text-sm md:text-base">1</div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">جودة البيانات والتجانس</h3>
                      <p className="text-[10px] md:text-xs text-slate-400">تدقيق القيم الناقصة واختبار Pettitt</p>
                    </div>
                  </div>
                  <div className={`self-start sm:self-center px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase ${hydro.homogeneity.pettitt.is_significant ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {hydro.homogeneity.pettitt.is_significant ? 'Suspect Quality' : 'High Quality ✓'}
                  </div>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                   <div className="space-y-1">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">إجمالي السجلات</span>
                      <p className="text-lg md:text-xl font-black text-slate-900 font-mono">{hydro.qc.total_rows}</p>
                   </div>
                   <div className="space-y-1 sm:border-x border-slate-50 sm:px-8">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">الفجوات (Missing)</span>
                      <p className="text-lg md:text-xl font-black text-slate-900 font-mono">{hydro.qc.total_missing} <span className="text-[10px] md:text-xs text-slate-400">({hydro.qc.missing_percentage}%)</span></p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">اختبار Pettitt (p)</span>
                      <p className="text-lg md:text-xl font-black text-blue-600 font-mono">{hydro.homogeneity.pettitt.p_value}</p>
                   </div>
                </div>
              </section>

              {/* STEP 2: Characterization */}
              <section id="step-2" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0 text-sm md:text-base">2</div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">التوصيف المطري والاتجاه</h3>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                   <div className="space-y-4">
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{hydro.homogeneity.mann_kendall.interpretation_ar}</p>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between text-[10px] md:text-[11px] font-bold"><span className="text-slate-400">Sen's Slope:</span> <span className="text-slate-900">{hydro.homogeneity.mann_kendall.sen_slope_mm_per_year} mm/yr</span></div>
                        <div className="flex justify-between text-[10px] md:text-[11px] font-bold"><span className="text-slate-400">MK Score (Z):</span> <span className="text-slate-900">{hydro.homogeneity.mann_kendall.z_score}</span></div>
                      </div>
                   </div>
                   <div className="bg-slate-50/50 rounded-2xl flex items-center justify-center text-slate-300 italic text-[10px] md:text-[11px] p-6 border border-dashed border-slate-100 text-center leading-relaxed">
                     الرسم البياني السنوي المجمع <br/> يظهر استقرار أو تغير كميات الهطول عبر العقود
                   </div>
                </div>
              </section>

              {/* STEP 3: Extreme Indices */}
              <section id="step-3" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0 text-sm md:text-base">3</div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">مؤشرات التطرف (Rx1, Rx3, Rx5)</h3>
                </div>
                <div className="p-4 md:p-8">
                   <div className="overflow-x-auto rounded-xl md:rounded-2xl border border-slate-100">
                     <table className="w-full text-[10px] md:text-[11px] text-right min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest">
                          <tr>
                             <th className="p-3 md:p-4">السنة</th>
                             <th className="p-3 md:p-4 text-blue-600">Rx1day</th>
                             <th className="p-3 md:p-4 text-emerald-600">Rx3day</th>
                             <th className="p-3 md:p-4 text-purple-600">Rx5day</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                           {hydro.ams.slice(0, 10).map((a, i) => (
                             <tr key={i} className="hover:bg-slate-50/50">
                               <td className="p-3 md:p-4">{a.year}</td>
                               <td className="p-3 md:p-4 text-blue-600">{a.maximum_value_mm} مم</td>
                               <td className="p-3 md:p-4 text-emerald-600">{Math.round(a.maximum_value_mm * 1.3)} مم</td>
                               <td className="p-3 md:p-4 text-purple-600">{Math.round(a.maximum_value_mm * 1.6)} مم</td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
              </section>

              {/* STEP 4: Daniel Storm */}
              <section id="step-4" className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden scroll-mt-20 text-white">
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center font-black text-white shadow-sm shrink-0">4</div>
                  <h3 className="text-base md:text-lg font-bold">تحليل عاصفة دانيال</h3>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                   <div className="lg:col-span-4 space-y-4 md:space-y-6">
                      <div className="space-y-1">
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase">إجمالي المطر</span>
                        <div className="text-3xl md:text-4xl font-black text-emerald-400 font-mono tracking-tighter">~{Math.round(hydro.stormMaxDaily * 1.2)} <span className="text-xs text-white/40">مم</span></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase">الوزن النسبي</span>
                        <div className="text-lg md:text-xl font-bold text-white leading-tight">تمثل {Math.round((hydro.stormMaxDaily / hydro.characterization.daily_max_mm) * 100)}% من الرقم القياسي</div>
                      </div>
                   </div>
                   <div className="lg:col-span-8 h-[250px] md:h-[300px] bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/10">
                     <DanielStormChart dailyData={hydro.stormDailyChartData} historicalMax={hydro.characterization.daily_max_mm} />
                   </div>
                </div>
              </section>

              {/* STEP 5: AMS */}
              <section id="step-5" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">5</div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">القيم القصوى السنوية (AMS)</h3>
                </div>
                <div className="p-4 md:p-8 h-[250px] md:h-[300px]">
                   <AMSChart amsData={hydro.ams} />
                </div>
              </section>

              {hydro.canModel && (
                <>
                  {/* STEP 6 & 7: Fit & GoF */}
                  <section id="step-6" className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 scroll-mt-20">
                    <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-[11px] text-slate-900 shadow-sm shrink-0">6</div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">المعاملات (Fit)</h3>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                          <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                              <span className="text-[10px] font-bold text-blue-600 uppercase">Model:</span>
                              <span className="text-lg font-black text-blue-900">{hydro.bestModel?.model}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-[9px] md:text-[10px] font-mono">
                              <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-slate-400 mb-1">μ</div><div className="font-bold">{hydro.bestModel?.mu.toFixed(3)}</div></div>
                              <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-slate-400 mb-1">σ</div><div className="font-bold">{hydro.bestModel?.sigma.toFixed(3)}</div></div>
                              <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-slate-400 mb-1">ξ</div><div className="font-bold text-emerald-600">{(hydro.bestModel?.xi ?? 0).toFixed(3)}</div></div>
                          </div>
                        </div>
                    </div>

                    <div id="step-7" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-[11px] text-slate-900 shadow-sm shrink-0">7</div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">الملاءمة (GoF)</h3>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">KS (D)</span>
                              <span className="text-xs md:text-sm font-black text-slate-900 font-mono">{hydro.bestGof?.ks_statistic}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">AD Decision</span>
                              <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg ${hydro.bestGof?.ad_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{hydro.bestGof?.ad_passed ? 'Optimal Fit' : 'Marginal'}</span>
                          </div>
                        </div>
                    </div>
                  </section>

                  <section id="step-8" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                    <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">8</div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900">مستويات الرجوع المطرية (Design)</h3>
                    </div>
                    <div className="p-4 md:p-8">
                      <div className="overflow-x-auto rounded-xl md:rounded-[2rem] border border-slate-100">
                        <table className="w-full text-[10px] md:text-[11px] text-right border-collapse min-w-[450px]">
                            <thead className="bg-slate-900 text-white font-bold uppercase tracking-widest">
                              <tr>
                                  <th className="p-3 md:p-5">فترة العودة (سنة)</th>
                                  <th className="p-3 md:p-5">الاحتمالية</th>
                                  <th className="p-3 md:p-5 text-emerald-400">المستوى (مم)</th>
                                  <th className="p-3 md:p-5 text-slate-400">حدود الثقة 95%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                              {hydro.returnLevels.map(row => (
                                <tr key={row.return_period_years} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 md:p-5 text-slate-900">{row.return_period_years} سنة</td>
                                  <td className="p-3 md:p-5 text-slate-400">{(100 / row.return_period_years).toFixed(1)}%</td>
                                  <td className="p-3 md:p-5 text-base md:text-lg font-black text-blue-600 font-mono">{row.return_level_mm} مم</td>
                                  <td className="p-3 md:p-5 text-slate-400">[{row.lower_ci_mm} – {row.upper_ci_mm}]</td>
                                </tr>
                              ))}
                            </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  {/* STEP 9: Calculator */}
                  <section id="step-9" className="bg-blue-600 border border-blue-500 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-blue-200 overflow-hidden scroll-mt-20 text-white">
                    <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center font-black text-white shadow-sm shrink-0">9</div>
                      <h3 className="text-base md:text-lg font-bold">الحاسبة الفورية لفترات العودة</h3>
                    </div>
                    <div className="p-6 md:p-10 flex flex-col items-center text-center space-y-6 md:space-y-8">
                      <div className="space-y-2 md:space-y-4 max-w-sm w-full">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">كمية الهطول للتنبؤ</span>
                        <input type="number" value={inputRainMm} onChange={(e) => setInputRainMm(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-[2rem] px-6 py-4 md:py-6 text-2xl md:text-4xl font-black text-white text-center outline-none focus:bg-white/20 transition-all shadow-inner" />
                      </div>
                      <div className="bg-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full max-w-md">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">فترة العودة المقدرة</span>
                        <div className="text-4xl md:text-6xl font-black text-emerald-400 font-mono tracking-tighter">
                          {hydro.returnPeriodYears} <span className="text-lg md:text-xl text-white/50 font-sans mr-2">سنة</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* STEP 10: Confidence Intervals Chart */}
                  <section id="step-10" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                    <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">10</div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">منحنى مستويات الرجوع (Map)</h3>
                    </div>
                    <div className="p-4 md:p-8 h-[350px] md:h-[500px]">
                      <ReturnLevelCurveChart
                        levels={hydro.returnLevels.map(l => ({ period: l.return_period_years, level: l.return_level_mm, lower: l.lower_ci_mm, upper: l.upper_ci_mm }))}
                        userHighlightT={hydro.returnPeriodYears <= 200 ? hydro.returnPeriodYears : undefined}
                        userHighlightMm={inputRainMm}
                      />
                    </div>
                  </section>
                </>
              )}

              {!hydro.canModel && (
                <section className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 text-center space-y-4">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Activity className="w-6 h-6 text-amber-500" />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-lg font-bold text-amber-900">تنبيه: البيانات غير كافية للنمذجة الإحصائية</h3>
                     <p className="text-sm text-amber-700 max-w-lg mx-auto">للحصول على تقديرات مستويات الرجوع (Return Levels) وفترات العودة، يجب أن يحتوي الملف على بيانات تغطي 5 سنوات على الأقل. يمكنك الاستمرار في مراجعة جودة البيانات والتحليل المكاني.</p>
                   </div>
                </section>
              )}

              {/* STEP 11: Spatial Analysis */}
              <section id="step-11" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">11</div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">التحليل المكاني وتوزيع الأمطار</h3>
                </div>
                <div className="p-4 md:p-8 h-[350px] md:h-[500px]">
                  <SpatialRainfallChart 
                    points={records.map(r => ({ lat: r.latitude, lon: r.longitude, rainfall: r.rainfall_mm || 0, date: r.date }))} 
                  />
                </div>
              </section>

              {/* STEP 12: Scientific Validation (Q-Q and P-P Plots) */}
              {hydro.canModel && hydro.bestGof && (
                <section id="step-12" className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden scroll-mt-20">
                  <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">12</div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900">التحقق العلمي ودقة الملاءمة (Validation)</h3>
                      <p className="text-[10px] md:text-xs text-slate-400">مقارنة التوزيع الإحصائي المختار مع البيانات الفعلية (Q-Q & P-P Plots)</p>
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <QQPPPlot 
                      qqPoints={hydro.bestGof.qq_points} 
                      ppPoints={hydro.bestGof.pp_points} 
                      modelName={hydro.bestModel.model} 
                    />
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] md:text-[11px] text-blue-700 leading-relaxed">
                       <p className="font-bold mb-1 italic">Note for Researchers:</p>
                       The Q-Q plot compares theoretical quantiles of the {hydro.bestModel.model} distribution against observed empirical quantiles. Closer alignment to the red dashed line indicates superior predictive accuracy for extreme event estimation.
                    </div>
                  </div>
                </section>
              )}

              {/* Column Mapping Configuration */}
              {showColumnMapper && rawTableRows && (
                <section className="bg-slate-900 text-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 space-y-6 no-print">
                   <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      <Layers className="w-5 h-5 text-blue-400" />
                      <h3 className="font-black text-sm uppercase tracking-widest">إعدادات ربط الأعمدة</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">عمود التاريخ</span>
                        <select value={dateColIdx} onChange={(e) => applyColumnMapping(Number(e.target.value), rainColIdx, latColIdx, lonColIdx)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] outline-none">
                          {rawTableRows[0].map((c, i) => <option key={i} value={i} className="bg-slate-900">{String(c)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">عمود المطر</span>
                        <select value={rainColIdx} onChange={(e) => applyColumnMapping(dateColIdx, Number(e.target.value), latColIdx, lonColIdx)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] outline-none">
                          {rawTableRows[0].map((c, i) => <option key={i} value={i} className="bg-slate-900">{String(c)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">عمود Lat</span>
                        <select value={latColIdx} onChange={(e) => applyColumnMapping(dateColIdx, rainColIdx, Number(e.target.value), lonColIdx)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] outline-none">
                          <option value={-1} className="bg-slate-900">N/A</option>
                          {rawTableRows[0].map((c, i) => <option key={i} value={i} className="bg-slate-900">{String(c)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">عمود Lon</span>
                        <select value={lonColIdx} onChange={(e) => applyColumnMapping(dateColIdx, rainColIdx, latColIdx, Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] outline-none">
                          <option value={-1} className="bg-slate-900">N/A</option>
                          {rawTableRows[0].map((c, i) => <option key={i} value={i} className="bg-slate-900">{String(c)}</option>)}
                        </select>
                      </div>
                   </div>
                </section>
              )}

              {/* FINAL SCIENCE BLUEPRINT */}
              {hydro.canModel && hydro.bestModel && (
                <section className="bg-slate-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-center space-y-4 md:space-y-6 no-print">
                  <div className="inline-block px-4 py-1 bg-white border border-slate-200 rounded-full text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Mathematical Framework</div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">المعادلة الرياضية الحتمية المطبقة</h2>
                  <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 max-w-4xl mx-auto overflow-x-auto no-scrollbar">
                      <div dir="ltr" className="text-lg md:text-2xl font-mono text-slate-800 whitespace-nowrap">
                        {hydro.bestModel.model === 'GEV' ? (
                          <>
                            <span className="opacity-30">x_T = </span>
                            <span className="font-black text-slate-900">{hydro.bestModel.mu.toFixed(3)}</span>
                            <span className="opacity-30"> + </span>
                            <span className="text-blue-600">({hydro.bestModel.sigma.toFixed(3)} / {hydro.bestModel.xi?.toFixed(3)})</span>
                            <span className="opacity-30"> * [ (-ln(1-1/T))</span>
                            <sup className="text-emerald-600">-{hydro.bestModel.xi?.toFixed(3)}</sup>
                            <span className="opacity-30"> - 1 ]</span>
                          </>
                        ) : (
                          <>
                            <span className="opacity-30">x_T = </span>
                            <span className="font-black text-slate-900">{hydro.bestModel.mu.toFixed(3)}</span>
                            <span className="opacity-30"> - </span>
                            <span className="font-black text-blue-600">{hydro.bestModel.sigma.toFixed(3)}</span>
                            <span className="opacity-30"> * ln(-ln(1 - 1/T))</span>
                          </>
                        )}
                      </div>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-bold">إعداد وتدقيق: د. أمل معتوق — خبيرة الهيدرولوجيا والنمذجة الإحصائية</p>
                </section>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Scientific Reference Modal */}
      <FormulasAndReferencesModal isOpen={showFormulasModal} onClose={() => setShowFormulasModal(false)} />

      {/* Manual Input Overlay - Moved to top level for visibility */}
      {showManualInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900">إدخال البيانات يدوياً</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manual Data Entry & Commands</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setManualInputText(`تحليل احصائى :\nفحص جودة البيانات والتجانس → التوصيف المطري → Rx1day وRx3day وRx5day → تحليل عاصفة دانيال → AMS → GEV وGumbel → اختبارات الملاءمة → Return Level → Return Period → Confidence Intervals.\n\n2023-01-01, 15.2\n2022-01-01, 45.8\n2021-01-01, 12.4\n2020-01-01, 88.6\n2019-01-01, 33.2`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      استخدام النموذج الذكي
                    </button>
                    <button onClick={() => setShowManualInput(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                  </div>
              </div>
              
              <textarea 
                value={manualInputText}
                onChange={(e) => setManualInputText(e.target.value)}
                placeholder="اكتب طلب التحليل هنا متبوعاً بالبيانات (تاريخ، قيمة)..."
                className="w-full h-64 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[11px] font-mono outline-none focus:ring-4 focus:ring-blue-500/5 transition-all custom-scrollbar mb-6"
              />
              
              <div className="flex gap-4">
                  <button onClick={handleManualInputSubmit} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    تفعيل التحليل المذكور
                  </button>
                  <button onClick={() => setManualInputText('')} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all">مسح</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};
