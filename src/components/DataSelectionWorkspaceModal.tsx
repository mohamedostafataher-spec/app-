/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Data Selection Workspace Modal (مساحة اختيار وتصفية جزء محدد من الملف)
 */

import React, { useState, useMemo } from 'react';
import {
  Filter,
  X,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Layers,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Database,
  Hash,
  Sliders,
} from 'lucide-react';
import { DailyRecord } from '../types';

interface DataSelectionWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: DailyRecord[];
  onApplyFilter: (filtered: DailyRecord[], filterSummary: any) => void;
  onResetFilter: () => void;
  currentFilterFingerprint?: string;
}

export const DataSelectionWorkspaceModal: React.FC<DataSelectionWorkspaceModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  onApplyFilter,
  onResetFilter,
  currentFilterFingerprint,
}) => {
  // Extract unique stations, governorates, and date limits
  const stationsList = useMemo(() => {
    const map = new Map<string, string>();
    allRecords.forEach((r) => {
      if (r.station_id) map.set(r.station_id, r.station_name || r.station_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allRecords]);

  const dateMinMax = useMemo(() => {
    if (allRecords.length === 0) return { min: '', max: '' };
    const dates = allRecords.map((r) => r.date).filter(Boolean).sort();
    return { min: dates[0] || '', max: dates[dates.length - 1] || '' };
  }, [allRecords]);

  // Filter States
  const [selectedStationId, setSelectedStationId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(dateMinMax.min);
  const [endDate, setEndDate] = useState<string>(dateMinMax.max);
  const [qualityFilter, setQualityFilter] = useState<'all' | 'valid_only'>('all');
  const [analysisType, setAnalysisType] = useState<'daily' | 'hourly' | 'ams' | 'storm'>('daily');

  // Compute filtered subset
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Station
      if (selectedStationId !== 'ALL' && r.station_id !== selectedStationId) {
        return false;
      }
      // 2. Date
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      // 3. Quality
      if (qualityFilter === 'valid_only' && r.quality_flag !== 'valid') {
        return false;
      }
      return true;
    });
  }, [allRecords, selectedStationId, startDate, endDate, qualityFilter]);

  // Missing days count in filtered set
  const missingCount = useMemo(() => {
    return filteredRecords.filter((r) => r.rainfall_mm === null || r.rainfall_mm === undefined).length;
  }, [filteredRecords]);

  // Generate Filter Fingerprint
  const generatedFingerprint = useMemo(() => {
    return `FP_${selectedStationId}_${startDate}_${endDate}_${qualityFilter}_${analysisType}_${filteredRecords.length}`;
  }, [selectedStationId, startDate, endDate, qualityFilter, analysisType, filteredRecords.length]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilter(filteredRecords, {
      selectedStationId,
      startDate,
      endDate,
      qualityFilter,
      analysisType,
      fingerprint: generatedFingerprint,
      rowsBefore: allRecords.length,
      rowsAfter: filteredRecords.length,
      missingDays: missingCount,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedStationId('ALL');
    setStartDate(dateMinMax.min);
    setEndDate(dateMinMax.max);
    setQualityFilter('all');
    setAnalysisType('daily');
    onResetFilter();
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                مساحة اختيار وتصفية جزء محدد من الملف (Data Selection Workspace)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                تطبيق فلاتر دقيقة على المحطات والسنوات دون المساس بالملف الأصلي المحفوظ
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F7F9FA]">
          
          {/* Filter Controls Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            
            {/* 1. Station Filter */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#0E7490]" />
                <span>اختيار المحطة:</span>
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              >
                <option value="ALL">كل المحطات في الملف ({stationsList.length} محطة)</option>
                {stationsList.map((stn) => (
                  <option key={stn.id} value={stn.id}>
                    {stn.name} [{stn.id}]
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Date Range Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-[#0E7490]" />
                  <span>من تاريخ (Start Date):</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={dateMinMax.min}
                  max={endDate || dateMinMax.max}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-[#0E7490]" />
                  <span>إلى تاريخ (End Date):</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || dateMinMax.min}
                  max={dateMinMax.max}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                />
              </div>
            </div>

            {/* 3. Quality and Type Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#0E7490]" />
                  <span>جودة السجل (Quality Flag):</span>
                </label>
                <select
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                >
                  <option value="all">كل السجلات (Valid + Flagged)</option>
                  <option value="valid_only">القيم الصالحة فقط (Valid Records Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Sliders className="w-3.5 h-3.5 text-[#0E7490]" />
                  <span>نوع التحليل المستهدف:</span>
                </label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                >
                  <option value="daily">هطول يومي (Daily Rainfall)</option>
                  <option value="hourly">هطول ساعي (Hourly Rainfall)</option>
                  <option value="ams">سلسلة قيم قصوى سنوية (AMS)</option>
                  <option value="storm">تحليل عاصفة محددة (Storm Event)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Real-time Filter Impact Metrics Card (Mandatory from PDF pages 8, 56) */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0E7490]" />
              <span>مؤشرات التصفية الناتجة في الوقت الفعلي:</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">قبل التصفية:</span>
                <span className="font-mono font-bold text-slate-700">{allRecords.length} صفاً</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">بعد التصفية:</span>
                <span className="font-mono font-bold text-emerald-700">{filteredRecords.length} صفاً</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">الأيام المفقودة:</span>
                <span className="font-mono font-bold text-amber-700">{missingCount} يوم</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">الفترة الزمنية:</span>
                <span className="font-mono font-bold text-blue-900 truncate block">
                  {startDate} إلى {endDate}
                </span>
              </div>
            </div>

            {/* Filter Fingerprint */}
            <div className="p-3 bg-slate-900 text-cyan-300 rounded-xl font-mono text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Filter Fingerprint:</span>
                <span className="font-bold truncate">{generatedFingerprint}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * ملاحظة أمان علمي: لا يتم حذف أو تعديل السجل الخام الأصلي. تُطبّق التصفية على مسار الحساب الحالي فقط.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعيين التصفية</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleApply}
              disabled={filteredRecords.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0E7490] to-[#12304A] hover:from-[#12304A] hover:to-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تطبيق التصفية المحددة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
