/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * PDF Table Extractor & Reviewer Component (استخراج ومراجعة جداول ملفات PDF)
 */

import React, { useState } from 'react';
import {
  FileText,
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { extractTablesFromPDF, PDFExtractedTable } from '../utils/pdfTableExtractor';
import { DailyRecord } from '../types';

interface PDFTableExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExtractedData: (records: DailyRecord[], stationName: string, stationId: string, sourceLabel: string, fileName: string) => void;
}

export const PDFTableExtractorModal: React.FC<PDFTableExtractorModalProps> = ({
  isOpen,
  onClose,
  onImportExtractedData,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResults, setExtractionResults] = useState<PDFExtractedTable[]>([]);
  const [combinedRecords, setCombinedRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'raw_text'>('upload');
  const [customStationName, setCustomStationName] = useState<string>('محطة مستخرجة من وثيقة PDF');
  const [customStationId, setCustomStationId] = useState<string>('STN_PDF_01');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).slice(0, 2); // support up to 2 PDFs
    setSelectedFiles(files);
    setIsExtracting(true);

    try {
      const results: PDFExtractedTable[] = [];
      const allExtracted: DailyRecord[] = [];

      for (const file of files) {
        const res = await extractTablesFromPDF(file);
        results.push(res);
        allExtracted.push(...res.extractedRecords);
      }

      setExtractionResults(results);

      // De-duplicate records by date
      const uniqueMap = new Map<string, DailyRecord>();
      allExtracted.forEach((r) => {
        if (!uniqueMap.has(r.date)) {
          uniqueMap.set(r.date, r);
        }
      });
      const finalCombined = Array.from(uniqueMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setCombinedRecords(finalCombined);

      if (results[0]?.stationDetected) {
        setCustomStationName(results[0].stationDetected);
        setCustomStationId(results[0].extractedRecords[0]?.station_id || 'STN_PDF_01');
      }

      setActiveTab('review');
    } catch (err: any) {
      console.error('PDF Extraction Error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmImport = () => {
    if (combinedRecords.length === 0) return;
    const fileName = selectedFiles.map((f) => f.name).join(' + ');
    const sourceLabel = `مستخرج من وثيقة PDF (${fileName})`;

    // Attach chosen station name/id to all records
    const finalRecords = combinedRecords.map((r) => ({
      ...r,
      station_name: customStationName,
      station_id: customStationId,
    }));

    onImportExtractedData(finalRecords, customStationName, customStationId, sourceLabel, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                استخراج ومراجعة جداول ملفات PDF (PDF Table Extractor & Reviewer)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                دعم رفع ملف أو ملفين PDF واستخراج الجداول المطرية ومراجعتها قبل إدراجها في المسار العلمي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center border-b border-slate-200 bg-[#F7F3E8] px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'upload'
                ? 'bg-white border-slate-200 text-[#0E7490] shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>رفع ملفات PDF (حتى ملفين)</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            disabled={combinedRecords.length === 0}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x disabled:opacity-40 ${
              activeTab === 'review'
                ? 'bg-white border-slate-200 text-[#0E7490] shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>مراجعة الجداول المستخرجة ({combinedRecords.length} سجل)</span>
          </button>
          <button
            onClick={() => setActiveTab('raw_text')}
            disabled={extractionResults.length === 0}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x disabled:opacity-40 ${
              activeTab === 'raw_text'
                ? 'bg-white border-slate-200 text-[#0E7490] shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>النص الخام لصفحات PDF</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F7F9FA]">
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div className="p-8 border-2 border-dashed border-[#0E7490]/40 rounded-3xl bg-white hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0E7490] flex items-center justify-center">
                  {isExtracting ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    اختر ملف أو ملفين PDF لاستخراج الجداول المطرية
                  </h3>
                  <p className="text-xs text-slate-500">
                    يقوم النظام بقراءة الجداول المطرية وصفحات الرصد واستخراج التواريخ وكميات المطر بدقة
                  </p>
                </div>
                <label className="px-5 py-2.5 bg-[#0E7490] hover:bg-[#12304A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>تحديد ملفات PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Extraction Specs */}
              <div className="p-4 bg-[#F7F3E8] border border-[#D7B98E] rounded-2xl text-xs text-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1D2939]">
                  <Sparkles className="w-4 h-4 text-[#0E7490]" />
                  <span>القدرات المدعومة في مستخرج جداول PDF:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>استخراج التواريخ بصيغ ISO (`YYYY-MM-DD`) أو الصيغة الميدانية (`DD/MM/YYYY`).</li>
                  <li>تجميع الأسطر ومطابقة كميات الهطول اليومي أو التراكمي (مم).</li>
                  <li>التعرف التلقائي على اسم المحطة من الترويسات (القاهرة، الإسكندرية، أسوان، إلخ).</li>
                  <li>إتاحة المراجعة والتعديل قبل تفعيل وضع الإنتاج والبدء في التحليل الإحصائي.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-5">
              {/* Station Config Banner */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">اسم المحطة المعين:</label>
                  <input
                    type="text"
                    value={customStationName}
                    onChange={(e) => setCustomStationName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">معرف المحطة (Station ID):</label>
                  <input
                    type="text"
                    value={customStationId}
                    onChange={(e) => setCustomStationId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="bg-white rounded-2xl border border-[#D7B98E] shadow-sm overflow-hidden">
                <div className="p-3 bg-[#F7F3E8] border-b border-[#D7B98E]/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    السجلات المستخرجة بنجاح ({combinedRecords.length} يوماً مقاساً):
                  </span>
                  <span className="text-[11px] text-slate-600">
                    النطاق: {combinedRecords[0]?.date} إلى {combinedRecords[combinedRecords.length - 1]?.date}
                  </span>
                </div>

                <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">الهطول (مم)</th>
                        <th className="p-2.5">حالة الجودة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {combinedRecords.slice(0, 100).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{r.date}</td>
                          <td className="p-2.5 font-bold text-[#0E7490]">{r.rainfall_mm} مم</td>
                          <td className="p-2.5 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {r.quality_flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {combinedRecords.length > 100 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
                    معروض أول 100 سجل للمعاينة السريعة من إجمالي {combinedRecords.length} سجل.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'raw_text' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">النص المستخرج من صفحات PDF:</span>
              <div className="p-4 bg-slate-900 text-cyan-300 rounded-2xl font-mono text-xs max-h-[50vh] overflow-y-auto custom-scrollbar leading-relaxed">
                {extractionResults.map((res, idx) => (
                  <div key={idx} className="space-y-2 mb-4 pb-4 border-b border-slate-800">
                    <div className="text-amber-400 font-bold">
                      ملف: {res.fileName} (عدد الصفحات: {res.pageCount}, الأسطر: {res.totalTextLines})
                    </div>
                    {res.rawTextPreview.map((line, lIdx) => (
                      <div key={lIdx} className="text-slate-300">
                        {line}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            {combinedRecords.length > 0 ? `Ready to import ${combinedRecords.length} records` : 'No records extracted yet'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={combinedRecords.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وتمرير البيانات المستخرجة إلى التحليل (Import Records)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
