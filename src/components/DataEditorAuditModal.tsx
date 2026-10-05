/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Data Editor & Audit Trail Component with Undo (محرر البيانات مع سجل التعديلات والتراجع)
 */

import React, { useState } from 'react';
import {
  Edit3,
  X,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  History,
  AlertTriangle,
  Save,
  FileText,
  Search,
} from 'lucide-react';
import { DailyRecord, AuditTrailItem } from '../types';

interface DataEditorAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawRecords: DailyRecord[];
  onSaveCleanedData: (cleaned: DailyRecord[], auditTrail: AuditTrailItem[]) => void;
}

export const DataEditorAuditModal: React.FC<DataEditorAuditModalProps> = ({
  isOpen,
  onClose,
  rawRecords,
  onSaveCleanedData,
}) => {
  // Working cleaned records
  const [workingRecords, setWorkingRecords] = useState<DailyRecord[]>(() => [...rawRecords]);
  // Audit trail log
  const [auditLog, setAuditLog] = useState<AuditTrailItem[]>([]);
  // Search / filter within table
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Selected tab: 'editor' | 'audit'
  const [activeTab, setActiveTab] = useState<'editor' | 'audit'>('editor');
  // Reason input for edits
  const [editReason, setEditReason] = useState<string>('تصحيح إحصائي معتمد');
  // Current user label
  const [currentUser] = useState<string>('د. أمل معتوق (Lead Hydrologist)');

  if (!isOpen) return null;

  // Record an audit entry
  const recordAudit = (rowId: string | number, date: string, field: string, oldVal: any, newVal: any) => {
    const entry: AuditTrailItem = {
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      row_id: rowId,
      date,
      field,
      old_value: oldVal,
      new_value: newVal,
      user: currentUser,
      created_at: new Date().toLocaleTimeString('ar-EG'),
      reason: editReason || 'تعديل يدوي من المحرر',
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // 1. Edit a rainfall cell
  const handleRainfallChange = (index: number, newRain: number | null) => {
    const oldVal = workingRecords[index].rainfall_mm;
    const copy = [...workingRecords];
    copy[index] = {
      ...copy[index],
      rainfall_mm: newRain,
      quality_flag: newRain === null ? 'missing' : newRain >= 0 ? 'valid' : 'rejected_negative',
    };
    setWorkingRecords(copy);
    recordAudit(index, copy[index].date, 'rainfall_mm', oldVal, newRain);
  };

  // 2. Set value to Missing
  const handleSetMissing = (index: number) => {
    handleRainfallChange(index, null);
  };

  // 3. Edit date
  const handleDateChange = (index: number, newDate: string) => {
    const oldVal = workingRecords[index].date;
    const copy = [...workingRecords];
    copy[index] = { ...copy[index], date: newDate };
    setWorkingRecords(copy);
    recordAudit(index, oldVal, 'date', oldVal, newDate);
  };

  // 4. Delete row
  const handleDeleteRow = (index: number) => {
    const deleted = workingRecords[index];
    const copy = workingRecords.filter((_, i) => i !== index);
    setWorkingRecords(copy);
    recordAudit(index, deleted.date, 'row_deleted', `${deleted.date}: ${deleted.rainfall_mm}mm`, 'حذف الصف');
  };

  // 5. Add new row
  const handleAddRow = () => {
    const lastDate = workingRecords[workingRecords.length - 1]?.date || '2023-01-01';
    const d = new Date(lastDate);
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split('T')[0];

    const newRow: DailyRecord = {
      date: nextDate,
      rainfall_mm: 0,
      station_id: workingRecords[0]?.station_id || 'STN01',
      station_name: workingRecords[0]?.station_name || 'محطة رصد',
      governorate: 'مصر',
      latitude: workingRecords[0]?.latitude || 30.0,
      longitude: workingRecords[0]?.longitude || 31.0,
      quality_flag: 'valid',
      source: 'User Edited',
    };
    setWorkingRecords([...workingRecords, newRow]);
    recordAudit(workingRecords.length, nextDate, 'row_added', 'none', `${nextDate}: 0 mm`);
  };

  // 6. Undo last action
  const handleUndo = () => {
    if (auditLog.length === 0) return;
    const [lastAction, ...remainingLog] = auditLog;
    setAuditLog(remainingLog);

    // Revert the change
    const rowIdx = typeof lastAction.row_id === 'number' ? lastAction.row_id : 0;
    if (lastAction.field === 'rainfall_mm') {
      const copy = [...workingRecords];
      if (copy[rowIdx]) {
        copy[rowIdx] = {
          ...copy[rowIdx],
          rainfall_mm: lastAction.old_value,
          quality_flag: lastAction.old_value === null ? 'missing' : 'valid',
        };
        setWorkingRecords(copy);
      }
    } else if (lastAction.field === 'row_added') {
      setWorkingRecords((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // Filtered rows for viewing
  const displayedRecords = workingRecords
    .map((r, originalIdx) => ({ r, originalIdx }))
    .filter(({ r }) => !searchTerm || r.date.includes(searchTerm) || String(r.rainfall_mm).includes(searchTerm))
    .slice(0, 100);

  const handleSaveAndApply = () => {
    onSaveCleanedData(workingRecords, auditLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                محرر البيانات المتقدم وسجل التدقيق (Data Editor & Audit Trail)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                تعديل وتصحيح القيم مع تسجيل الأسباب والتراجع (Undo) دون المساس بالبيانات الخام الأصلية
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

        {/* Tab Selector & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-[#F7F3E8] px-4 py-2 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-[#0E7490] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>جدول المحرر ({workingRecords.length} صف)</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-[#0E7490] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل التدقيق (Audit Trail: {auditLog.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={auditLog.length === 0}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تراجع عن آخر تعديل"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>تراجع (Undo)</span>
            </button>
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-[#0E7490] hover:bg-[#12304A] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صف</span>
            </button>
          </div>
        </div>

        {/* Reason Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-bold text-slate-700 shrink-0">سبب التعديل المسجل:</span>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full sm:w-72 p-1.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800"
              placeholder="اكتب سبب التعديل (لتسجيله في Audit Trail)..."
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالتاريخ أو القيمة..."
                className="pr-8 pl-2 py-1 rounded-md border border-slate-300 text-xs bg-white w-44"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#F7F9FA]">
          {activeTab === 'editor' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">المطر (مم)</th>
                      <th className="p-2.5">حالة الجودة</th>
                      <th className="p-2.5 text-center">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRecords.map(({ r, originalIdx }) => (
                      <tr key={originalIdx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-400">{originalIdx + 1}</td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={r.date}
                            onChange={(e) => handleDateChange(originalIdx, e.target.value)}
                            className="p-1 border border-slate-300 rounded font-mono text-xs w-36"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={r.rainfall_mm === null ? '' : r.rainfall_mm}
                            placeholder="Missing"
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleRainfallChange(originalIdx, val);
                            }}
                            className={`p-1 border rounded font-mono font-bold text-xs w-28 ${
                              r.rainfall_mm === null
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'border-slate-300 text-[#0E7490]'
                            }`}
                          />
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.quality_flag === 'valid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.quality_flag}
                          </span>
                        </td>
                        <td className="p-2 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSetMissing(originalIdx)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            Missing
                          </button>
                          <button
                            onClick={() => handleDeleteRow(originalIdx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="حذف الصف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>معروض أول {displayedRecords.length} صفاً من إجمالي {workingRecords.length} صفاً</span>
                <span>البيانات المعروضة تُحفظ كنسخة نظيفة Clean Data</span>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0E7490]" />
                <span>سجل التعديلات والتدقيق العلمي (Audit Trail Log):</span>
              </h3>

              {auditLog.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد أي تعديلات مسجلة بعد في هذه الجلسة.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2.5">الوقت</th>
                        <th className="p-2.5">التاريخ المستهدف</th>
                        <th className="p-2.5">الحقل</th>
                        <th className="p-2.5">القيمة السابقة</th>
                        <th className="p-2.5">القيمة الجديدة</th>
                        <th className="p-2.5">المستخدم</th>
                        <th className="p-2.5">السبب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLog.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-500">{log.created_at}</td>
                          <td className="p-2.5 font-bold">{log.date}</td>
                          <td className="p-2.5 text-blue-700">{log.field}</td>
                          <td className="p-2.5 text-slate-500">{String(log.old_value)}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{String(log.new_value)}</td>
                          <td className="p-2.5 font-sans text-slate-700">{log.user}</td>
                          <td className="p-2.5 font-sans text-slate-600">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Cleaned Data Version: Clean_v{auditLog.length + 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>اعتماد البيانات المنقحة وتحديث التحليل (Save Clean Data)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
