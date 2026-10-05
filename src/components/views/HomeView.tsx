/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Home Page (الرئيسية: الهوية البصرية والترحيبية ورفع الملفات)
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Award,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Calendar,
  Compass,
} from 'lucide-react';
import { DailyRecord, Language, StationMetadata } from '../../types';
import { DEMO_DAILY_RECORDS, DEMO_STATIONS } from '../../data/demoData';

interface HomeViewProps {
  onDataLoaded: (records: DailyRecord[], stationMeta: StationMetadata) => void;
  onGoToAnalysis: () => void;
  language: Language;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onDataLoaded,
  onGoToAnalysis,
  language,
}) => {
  const isAr = language === 'ar';
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);

    const fileName = file.name;
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let rows: any[][] = [];
        if (isExcel) {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        } else {
          const text = evt.target?.result as string;
          rows = text
            .split(/\r?\n/)
            .map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
        }

        if (rows.length < 2) {
          throw new Error(isAr ? 'الملف فارغ أو لا يحتوي على صفوف بيانات.' : 'File is empty.');
        }

        let dateIdx = 0;
        let rainIdx = 1;
        const header = rows[0].map((h) => String(h).toLowerCase());
        header.forEach((h, idx) => {
          if (h.includes('date') || h.includes('تاريخ') || h.includes('time') || h.includes('day')) {
            dateIdx = idx;
          }
          if (
            h.includes('rain') ||
            h.includes('precip') ||
            h.includes('مطر') ||
            h.includes('value') ||
            h.includes('mm')
          ) {
            rainIdx = idx;
          }
        });

        const parsed: DailyRecord[] = [];
        const cleanName = fileName.replace(/\.[^/.]+$/, '').slice(0, 30);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length <= Math.max(dateIdx, rainIdx)) continue;

          let rawDate = String(row[dateIdx]).trim();
          let rawRain = row[rainIdx];

          if (typeof row[dateIdx] === 'number' && row[dateIdx] > 20000) {
            const d = new Date(Math.round((row[dateIdx] - 25569) * 86400 * 1000));
            rawDate = d.toISOString().split('T')[0];
          }

          if (!rawDate || rawDate.length < 4) continue;

          let val: number | null = null;
          let q: DailyRecord['quality_flag'] = 'valid';

          if (rawRain !== undefined && rawRain !== null && String(rawRain).trim() !== '') {
            const p = parseFloat(String(rawRain));
            if (isNaN(p)) {
              val = null;
              q = 'missing';
            } else if (p < 0) {
              val = null;
              q = 'rejected_negative';
            } else {
              val = p;
              q = 'valid';
            }
          } else {
            val = null;
            q = 'missing';
          }

          parsed.push({
            date: rawDate,
            station_id: 'CUSTOM_STN',
            station_name: cleanName,
            governorate: 'مصر',
            latitude: 31.0,
            longitude: 30.0,
            rainfall_mm: val,
            quality_flag: q,
            source: fileName,
          });
        }

        if (parsed.length === 0) {
          throw new Error(isAr ? 'لم يتم العثور على قياسات صالحة.' : 'No valid records found.');
        }

        const newStation: StationMetadata = {
          station_id: 'CUSTOM_STN',
          station_name: cleanName,
          governorate: 'مصر',
          latitude: 31.2,
          longitude: 29.9,
          elevation_m: 10,
          start_date: parsed[0]?.date || '1994-01-01',
          end_date: parsed[parsed.length - 1]?.date || '2023-12-31',
          instrument_type: 'سجل رصد مستورد',
          station_status: 'active',
          data_owner: 'المستخدم',
          data_source: fileName,
          notes: 'تم الرفع عبر الصفحة الرئيسية',
          is_gridded: false,
        };

        onDataLoaded(parsed, newStation);
        setIsUploading(false);
        onGoToAnalysis();
      } catch (err: any) {
        setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء قراءة الملف.' : 'Error reading file.'));
        setIsUploading(false);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleUseDemo = () => {
    const demoStation = DEMO_STATIONS[0]; // Alexandria
    const demoRecs = DEMO_DAILY_RECORDS.filter((r) => r.station_id === demoStation.station_id);
    onDataLoaded(demoRecs, demoStation);
    onGoToAnalysis();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-3 sm:px-0">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-[#12304A] via-[#0E7490] to-[#168A8A] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-[#D7B98E]/30">
        {/* Background abstract water lines / contour effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B98E_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#D7B98E]/20 text-[#D7B98E] border border-[#D7B98E]/40 backdrop-blur-xs">
            <Award className="w-4 h-4 text-[#C8943E]" />
            <span>{isAr ? 'إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk' : 'Scientific Lead: Dr. Amal Matouk'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {isAr
              ? 'منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'
              : 'Egypt Rainfall Extremes Platform'}
          </h1>

          <p className="text-sm sm:text-base text-[#F4EBDD] font-medium leading-relaxed">
            {isAr
              ? '«تقرأ المطر فوق خريطة مصر، وتحول البيانات المناخية إلى معرفة وقرار.»'
              : '“Reading rainfall across Egypt’s geography, turning climate data into knowledge and decisions.”'}
          </p>

          <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed">
            {isAr
              ? 'منصة علمية بيئية جغرافية متكاملة لتحليل السجلات اليومية، فحص التجانس (Pettitt)، نمذجة القيم القصوى (GEV/Gumbel)، وتقييم مخاطر السيول وحماية البنية التحتية.'
              : 'Integrated hydrological platform for daily records, Pettitt homogeneity, GEV/Gumbel extreme value modeling, and flash flood risk assessment.'}
          </p>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white border border-[#D7B98E]/50 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F3E8] border border-[#D7B98E]/60 text-[#0E7490] flex items-center justify-center mx-auto shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1D2939]">
            {isAr ? 'ارفع بيانات المطر اليومية لمحطتك' : 'Upload Station Rainfall Data'}
          </h2>
          <p className="text-xs text-[#667085]">
            {isAr
              ? 'يدعم ملفات Excel (.xlsx, .xls) و CSV بعمودين رئيسيين: التاريخ (YYYY-MM-DD) وكمية المطر اليومي (مم)'
              : 'Supports Excel (.xlsx, .xls) and CSV with Date and Rainfall (mm)'}
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <label className="border-2 border-dashed border-[#D7B98E] hover:border-[#0E7490] bg-[#F7F3E8]/40 hover:bg-[#F7F3E8]/80 rounded-2xl p-8 text-center cursor-pointer transition-all block group">
          <Upload className="w-10 h-10 text-[#0E7490] mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-[#1D2939] block">
            {isAr ? 'اضغط هنا لاختيار ملف البيانات (Excel أو CSV)' : 'Click to select data file (Excel or CSV)'}
          </span>
          <span className="text-xs text-[#667085] block mt-1">
            {isAr ? 'تتم المعالجة آمنة ومحلية 100% داخل المتصفح' : 'Processed securely 100% in-browser'}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Demo Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-100">
          <span className="text-xs text-[#667085]">{isAr ? 'أو ابدأ مباشرة بالبيانات المرجعية المدمجة:' : 'Or start instantly with built-in reference data:'}</span>
          <button
            onClick={handleUseDemo}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] rounded-xl text-xs font-bold border border-[#D7B98E] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0E7490]" />
            <span>{isAr ? 'تحميل محطة الإسكندرية النموذجية (1957 - 2023)' : 'Load Alexandria Reference Station'}</span>
          </button>
        </div>
      </div>

      {/* 3 Steps Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D7B98E]/40 text-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#0E7490]/10 text-[#0E7490] font-extrabold text-sm flex items-center justify-center mx-auto border border-[#0E7490]/20">
            1
          </div>
          <h3 className="font-bold text-[#1D2939] text-xs sm:text-sm">
            {isAr ? 'فحص الجودة والتجانس' : 'Quality & Homogeneity'}
          </h3>
          <p className="text-[11px] text-[#667085] leading-relaxed">
            {isAr ? 'كشف الفجوات الزمنية، القيم السالبة، واختبار Pettitt للتجانس المناخي.' : 'Gap inspection, negative check, and Pettitt test.'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7B98E]/40 text-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#0E7490]/10 text-[#0E7490] font-extrabold text-sm flex items-center justify-center mx-auto border border-[#0E7490]/20">
            2
          </div>
          <h3 className="font-bold text-[#1D2939] text-xs sm:text-sm">
            {isAr ? 'نمذجة القيم القصوى' : 'Extreme Value Modeling'}
          </h3>
          <p className="text-[11px] text-[#667085] leading-relaxed">
            {isAr ? 'حساب مؤشرات Rx وتوزيعات GEV و Gumbel مع اختبارات جودة الملاءمة KS و AD.' : 'Rx indices and GEV/Gumbel goodness-of-fit.'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7B98E]/40 text-center space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#0E7490]/10 text-[#0E7490] font-extrabold text-sm flex items-center justify-center mx-auto border border-[#0E7490]/20">
            3
          </div>
          <h3 className="font-bold text-[#1D2939] text-xs sm:text-sm">
            {isAr ? 'فترات الرجوع وتصدير PDF' : 'Return Levels & Reports'}
          </h3>
          <p className="text-[11px] text-[#667085] leading-relaxed">
            {isAr ? 'حساب مطر 100 سنة، فترات الثقة 95% بـ Bootstrap، وتصدير التقارير المعتمدة.' : '100-yr return levels, 95% CI, and PDF export.'}
          </p>
        </div>
      </div>
    </div>
  );
};
