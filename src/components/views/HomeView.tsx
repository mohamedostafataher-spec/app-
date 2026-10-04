/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Home Page (الرئيسية: رفع الملف وشرح بسيط)
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
  HelpCircle,
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
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Hero Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAr
              ? 'منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'
              : 'Egypt Rainfall Extremes & Storm Analytics Platform'}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {isAr
              ? 'ارفع بيانات المطر اليومية لمحطتك، وابدأ التحليل الهيدرولوجي المتكامل (جودة، تجانس، مؤشرات قصوى، ملاءمة GEV/Gumbel، وفترات الرجوع) في شاشة تفاعلية مبسطة مستوحاة من بيئة RStudio بدون كود.'
              : 'Upload your daily rainfall records and perform complete extreme value analysis (GEV/Gumbel, GoF, Return Levels) in an intuitive RStudio-like workspace with zero code.'}
          </p>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>{isAr ? 'ارفع بيانات المطر اليومية' : 'Upload Daily Rainfall Data'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'يدعم ملفات Excel (.xlsx, .xls) و CSV بعمودين: التاريخ وكمية المطر اليومي (مم)'
              : 'Supports Excel (.xlsx, .xls) and CSV with 2 columns: Date and Daily Rainfall (mm)'}
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-8 text-center cursor-pointer transition-all block group">
          <Upload className="w-10 h-10 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-slate-700 block">
            {isAr ? 'اضغط هنا لاختيار ملف Excel أو CSV من جهازك' : 'Click to select Excel or CSV file'}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {isAr ? 'تتم المعالجة فورياً داخل متصفحك وبأمان تام دون إرسال البيانات لأي سيرفر' : 'Processed securely in-browser'}
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
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-xs text-slate-500">{isAr ? 'أو يمكنك التجربة فوراً:' : 'Or test immediately:'}</span>
          <button
            onClick={handleUseDemo}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'استخدام بيانات تجريبية (محطة الإسكندرية 30 سنة)' : 'Use Alexandria Demo Dataset'}</span>
          </button>
        </div>
      </div>

      {/* 3 Steps Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-1">
            1
          </div>
          <h3 className="font-bold text-slate-800 text-xs">{isAr ? 'رفع وتدقيق البيانات' : 'Upload & Quality Check'}</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            {isAr ? 'فحص السجلات الناقصة، القيم السالبة، واختبار تجانس Pettitt.' : 'Missing values, negative checks, and Pettitt test.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-1">
            2
          </div>
          <h3 className="font-bold text-slate-800 text-xs">{isAr ? 'نمذجة القيم القصوى' : 'Extreme Value Modeling'}</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            {isAr ? 'ملاءمة GEV وGumbel بحسابات L-Moments واختبار جودة الملاءمة KS.' : 'GEV & Gumbel fitting via L-Moments.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-1">
            3
          </div>
          <h3 className="font-bold text-slate-800 text-xs">{isAr ? 'فترات الرجوع والتقارير' : 'Return Levels & Reports'}</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            {isAr ? 'حساب مطر الـ 100 سنة وفترات الثقة 95% وتصدير التقرير PDF.' : '100-yr return level, 95% CI, and PDF export.'}
          </p>
        </div>
      </div>
    </div>
  );
};
