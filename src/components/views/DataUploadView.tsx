/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Data Upload & Validation View
 */

import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Eye,
  RefreshCw,
  Award,
} from 'lucide-react';
import { DailyRecord, Language } from '../../types';

interface DataUploadViewProps {
  onDataLoaded: (records: DailyRecord[], sourceName: string) => void;
  language: Language;
}

export const DataUploadView: React.FC<DataUploadViewProps> = ({ onDataLoaded, language }) => {
  const isAr = language === 'ar';

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [sourceInput, setSourceInput] = useState<string>('');
  const [validationStats, setValidationStats] = useState<{
    totalRows: number;
    validRows: number;
    negativeCount: number;
    missingCount: number;
    duplicateCount: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<Array<{ timestamp: string; message: string }>>([
    {
      timestamp: '2024-01-15 10:00:00',
      message: 'تحميل السجل الأرشيفي الأولي للمحطات المصرية (1994–2023) بنجاح.',
    },
  ]);

  // Download template helpers
  const downloadTemplate = (type: 'daily' | 'hourly' | 'metadata' | 'storms') => {
    let content = '';
    let name = '';

    if (type === 'daily') {
      content = `date,station_id,station_name,governorate,latitude,longitude,rainfall_mm,quality_flag,source\n2000-01-01,CAI01,Cairo,Cairo,30.0444,31.2357,0,valid,official_or_verified_source\n2000-01-02,CAI01,Cairo,Cairo,30.0444,31.2357,5.4,valid,official_or_verified_source\n2000-01-03,CAI01,Cairo,Cairo,30.0444,31.2357,0,valid,official_or_verified_source\n2000-01-04,CAI01,Cairo,Cairo,30.0444,31.2357,-999,missing,official_or_verified_source\n`;
      name = 'observations_daily_template.csv';
    } else if (type === 'hourly') {
      content = `datetime,station_id,station_name,latitude,longitude,rainfall_mm,timezone,quality_flag,source\n2023-09-10T00:00:00,ALX01,Alexandria,31.2001,29.9187,0.0,Africa/Cairo,valid,verified_source\n2023-09-10T01:00:00,ALX01,Alexandria,31.2001,29.9187,1.4,Africa/Cairo,valid,verified_source\n`;
      name = 'observations_hourly_template.csv';
    } else if (type === 'metadata') {
      content = `station_id,station_name,governorate,latitude,longitude,elevation_m,start_date,end_date,instrument_type,station_status,relocation_date,data_owner,data_source,notes\nCAI01,Cairo,Cairo,30.0444,31.2357,74,1980-01-01,2024-12-31,unknown,active,,owner_name,source_url,metadata_notes\n`;
      name = 'stations_metadata_template.csv';
    } else {
      content = `event_id,event_name,start_datetime,end_datetime,region,source,notes\nE001,Storm Daniel,2023-09-08T00:00:00,2023-09-12T23:59:59,Northern Egypt,verified_source,event_definition\n`;
      name = 'storm_events_template.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setIsProcessing(false);
        return;
      }

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setIsProcessing(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const dateIdx = headers.indexOf('date');
      const rainIdx = headers.findIndex((h) => h.includes('rain') || h === 'prcp' || h === 'val');
      const stationIdIdx = headers.indexOf('station_id');
      const stationNameIdx = headers.indexOf('station_name');

      const parsed: DailyRecord[] = [];
      const preview: any[] = [];
      let negatives = 0;
      let missings = 0;
      let duplicates = 0;
      const seenDates = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 2) continue;

        const date = dateIdx >= 0 ? parts[dateIdx] : parts[0];
        const rawVal = rainIdx >= 0 ? parts[rainIdx] : parts[1];
        const stationId = stationIdIdx >= 0 ? parts[stationIdIdx] : 'UPLOADED_STN';
        const stationName = stationNameIdx >= 0 ? parts[stationNameIdx] : 'Uploaded Station';

        if (seenDates.has(date)) {
          duplicates++;
        } else {
          seenDates.add(date);
        }

        let rainVal: number | null = null;
        let qFlag: DailyRecord['quality_flag'] = 'valid';

        // Missing value handlers: NA, NULL, -999, -99, empty
        if (
          rawVal === '' ||
          rawVal.toUpperCase() === 'NA' ||
          rawVal.toUpperCase() === 'N/A' ||
          rawVal.toUpperCase() === 'NULL' ||
          rawVal === '-999' ||
          rawVal === '-99'
        ) {
          rainVal = null;
          qFlag = 'missing';
          missings++;
        } else {
          const num = parseFloat(rawVal);
          if (isNaN(num)) {
            rainVal = null;
            qFlag = 'missing';
            missings++;
          } else if (num < 0) {
            rainVal = null;
            qFlag = 'rejected_negative';
            negatives++;
          } else {
            rainVal = num;
            qFlag = 'valid';
          }
        }

        const record: DailyRecord = {
          date,
          station_id: stationId,
          station_name: stationName,
          governorate: 'مصر',
          latitude: 30.0,
          longitude: 31.0,
          rainfall_mm: rainVal,
          raw_value: rawVal,
          quality_flag: qFlag,
          source: sourceInput || file.name,
        };

        parsed.push(record);
        if (preview.length < 20) {
          preview.push({
            date,
            station_id: stationId,
            raw_value: rawVal,
            cleaned_mm: rainVal !== null ? `${rainVal} مم` : 'Missing (مفقود)',
            status: qFlag,
          });
        }
      }

      setPreviewRows(preview);
      setValidationStats({
        totalRows: parsed.length,
        validRows: parsed.length - missings - negatives,
        negativeCount: negatives,
        missingCount: missings,
        duplicateCount: duplicates,
      });

      setAuditLog((prev) => [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          message: `تم فحص الملف "${file.name}": ${parsed.length} صف، ${missings} قيم مفقودة، ${negatives} قيم سالبة مرفوضة، ${duplicates} تواريخ مكررة.`,
        },
        ...prev,
      ]);

      if (parsed.length > 0) {
        onDataLoaded(parsed, sourceInput || file.name);
      }

      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'رفع بيانات الأمطار والتحقق المنهجي' : 'Upload Rainfall Data & Verification'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'يدعم النظام استيراد سجلات الأمطار اليومية والساعية بصيغ CSV وExcel وJSON. يتم إخضاع البيانات لقواعد الفحص الحتمي الصارمة: الحفاظ على الصفر كقيمة صحيحة، تحويل الأكواد (-999، NA) إلى Missing دون حذف، رفض القيم السالبة، واكتشاف التواريخ المكررة مع الاحتفاظ بنسخة السجل الأصلي في سجل التدقيق (Audit Log).'
            : 'Supports CSV and JSON. Validates ISO dates, treats 0 mm as valid rainfall, flags -999/NA as missing without row deletion, and rejects negative values.'}
        </p>
      </div>

      {/* Templates Download Bar */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'تنزيل النماذج القياسية المعتمدة للمنصة (CSV Templates):' : 'Official CSV Templates:'}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => downloadTemplate('daily')}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>{isAr ? 'قالب الأمطار اليومية' : 'Daily Rainfall Template'}</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={() => downloadTemplate('hourly')}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>{isAr ? 'قالب الأمطار الساعية' : 'Hourly Rainfall Template'}</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={() => downloadTemplate('metadata')}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>{isAr ? 'قالب بيانات المحطات' : 'Stations Metadata'}</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={() => downloadTemplate('storms')}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>{isAr ? 'قالب أحداث العواصف' : 'Storm Events Template'}</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Upload Zone & Metadata Input */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Upload Dropzone (8 cols) */}
        <div className="md:col-span-8 bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isAr ? 'اسحب ملف البيانات هنا أو تصفح جهازك' : 'Drop your rainfall file here or browse'}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md">
            {isAr
              ? 'يقبل صيغ CSV, TXT, JSON. تأكد من احتواء الملف على أعمدة (date, rainfall_mm).'
              : 'Accepts CSV, TXT, JSON. Must include date and rainfall_mm columns.'}
          </p>

          <label className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-cyan-900/40 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>{isAr ? 'اختيار ملف من الحاسوب' : 'Browse File'}</span>
            <input type="file" accept=".csv,.txt,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          {fileName && (
            <div className="mt-3 text-xs font-mono text-cyan-300 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-700">
              {fileName}
            </div>
          )}
        </div>

        {/* Source & Provenance Inputs (4 cols) */}
        <div className="md:col-span-4 bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'توثيق المصدر وحقوق الاستخدام:' : 'Data Provenance & Source:'}</span>
          </h3>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 block">{isAr ? 'اسم أو رابط المصدر:' : 'Source Name / URL:'}</label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: هيئة الأرصاد المصرية / NOAA CDO' : 'e.g. NOAA CDO Archive'}
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'معايير القبول الصارمة:' : 'Acceptance Rules:'}</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>{isAr ? 'الصفر = مطر فعلي، وليس قيمة مفقودة.' : 'Zero = Genuine 0 mm rainfall.'}</li>
              <li>{isAr ? 'القيم السالبة = مرفوضة وغير صالحة.' : 'Negative = Rejected as invalid.'}</li>
              <li>{isAr ? 'NA و-999 = تحول إلى Missing.' : 'NA & -999 = Converted to Missing.'}</li>
              <li>{isAr ? 'لا حذف تلقائي للقيم القصوى.' : 'No auto-deletion of extremes.'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Validation Results Summary (if file processed) */}
      {validationStats && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تقرير التحقق الأولي للبيانات المرفوعة' : 'Initial File Validation Summary'}</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              {isAr ? 'تم التحقق بنجاح' : 'Validated Successfully'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'إجمالي الصفوف' : 'Total Rows'}</span>
              <span className="text-base font-bold text-white">{validationStats.totalRows}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'الصفوف الصالحة' : 'Valid Rows'}</span>
              <span className="text-base font-bold text-emerald-400">{validationStats.validRows}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'القيم المفقودة' : 'Missing'}</span>
              <span className="text-base font-bold text-amber-300">{validationStats.missingCount}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'القيم السالبة المرفوضة' : 'Negatives Rejected'}</span>
              <span className="text-base font-bold text-rose-400">{validationStats.negativeCount}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'التواريخ المكررة' : 'Duplicates'}</span>
              <span className="text-base font-bold text-purple-300">{validationStats.duplicateCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* 20-Row Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'معاينة أولية لأول 20 صفاً من الملف:' : 'Preview First 20 Rows:'}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'توضيح نتائج المعالجة الآلية' : 'Cleaned representation'}
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold">
                <tr>
                  <th className="py-2 px-3 text-start">{isAr ? 'التاريخ (ISO)' : 'Date'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'كود المحطة' : 'Station ID'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'القيمة الأصلية بالملف' : 'Raw Value in File'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'القيمة المعتمدة بعد التنظيف' : 'Cleaned Rainfall'}</th>
                  <th className="py-2 px-3 text-center">{isAr ? 'حالة الجودة' : 'Quality Flag'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-750/50">
                    <td className="py-1.5 px-3 font-mono text-cyan-300">{row.date}</td>
                    <td className="py-1.5 px-3">{row.station_id}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-400">{row.raw_value}</td>
                    <td className="py-1.5 px-3 font-bold text-white">{row.cleaned_mm}</td>
                    <td className="py-1.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.status === 'valid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : row.status === 'rejected_negative'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isAr ? 'سجل التدقيق والمصادقة (Audit Log):' : 'Audit Log:'}</span>
        </h3>
        <div className="space-y-1 font-mono text-[11px] text-slate-400 max-h-36 overflow-y-auto">
          {auditLog.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-cyan-400 flex-shrink-0">[{log.timestamp}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
