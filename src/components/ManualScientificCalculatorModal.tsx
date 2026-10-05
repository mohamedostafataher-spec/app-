/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Manual Scientific Calculator Component (حاسبة الإدخال اليدوي العلمي)
 */

import React, { useState } from 'react';
import {
  Calculator,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  Copy,
  Download,
  Info,
  Sliders,
  Table,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  computeManualListCalculation,
  computeManualAMSSeriesCalculation,
  ManualListCalculationResult,
  ManualAMSCalculationResult,
} from '../utils/statisticalEngine';
import { DailyRecord } from '../types';

interface ManualScientificCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoPipeline?: (records: DailyRecord[], stationName: string, stationId: string) => void;
}

type CalculatorMode = 'list' | 'table' | 'ams';

export const ManualScientificCalculatorModal: React.FC<ManualScientificCalculatorModalProps> = ({
  isOpen,
  onClose,
  onLoadIntoPipeline,
}) => {
  const [mode, setMode] = useState<CalculatorMode>('list');

  // Mode 1: Values List State
  const [rawValuesInput, setRawValuesInput] = useState<string>('10, 25, 4, 36, 18');
  const [selectedIndex, setSelectedIndex] = useState<'Rx1day' | 'Rx3day' | 'Rx5day' | 'BasicStats'>('Rx1day');
  const [isPlanApproved, setIsPlanApproved] = useState<boolean>(false);
  const [listResult, setListResult] = useState<ManualListCalculationResult | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Mode 2: Table State
  const [tableRows, setTableRows] = useState<Array<{ date: string; rainfall_mm: number }>>([
    { date: '2023-09-08', rainfall_mm: 0 },
    { date: '2023-09-09', rainfall_mm: 46.8 },
    { date: '2023-09-10', rainfall_mm: 0 },
  ]);
  const [tableStationName, setTableStationName] = useState<string>('محطة إدخال يدوي');
  const [tableResult, setTableResult] = useState<any>(null);

  // Mode 3: AMS State
  const [amsRows, setAmsRows] = useState<Array<{ year: number; annual_max_mm: number }>>([
    { year: 2010, annual_max_mm: 32.4 },
    { year: 2011, annual_max_mm: 45.1 },
    { year: 2012, annual_max_mm: 28.0 },
    { year: 2013, annual_max_mm: 52.0 },
    { year: 2014, annual_max_mm: 39.5 },
    { year: 2015, annual_max_mm: 67.2 },
    { year: 2016, annual_max_mm: 21.0 },
  ]);
  const [amsResult, setAmsResult] = useState<ManualAMSCalculationResult | null>(null);
  const [amsError, setAmsError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  if (!isOpen) return null;

  // 1. Parse Values List
  const parseListValues = (text: string): number[] => {
    return text
      .split(/[\s,،;\n]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => parseFloat(t))
      .filter((v) => !isNaN(v));
  };

  const currentValues = parseListValues(rawValuesInput);

  // Execute List Calculation
  const handleExecuteListCalculation = () => {
    setListError(null);
    try {
      if (currentValues.length === 0) {
        throw new Error('يرجى إدخال أرقام صالحة مفصولة بفواصل.');
      }
      const res = computeManualListCalculation(currentValues, selectedIndex);
      setListResult(res);
      setIsPlanApproved(true);
    } catch (err: any) {
      setListError(err.message || 'حدث خطأ في الحساب.');
    }
  };

  // Execute Table Calculation
  const handleExecuteTableCalculation = () => {
    if (tableRows.length === 0) return;
    const sorted = [...tableRows].sort((a, b) => a.date.localeCompare(b.date));
    const rainValues = sorted.map((r) => r.rainfall_mm);
    const sum = rainValues.reduce((s, x) => s + x, 0);
    const maxDay = Math.max(...rainValues);

    let max3 = 0;
    if (rainValues.length >= 3) {
      for (let i = 0; i <= rainValues.length - 3; i++) {
        const s3 = rainValues[i] + rainValues[i + 1] + rainValues[i + 2];
        if (s3 > max3) max3 = s3;
      }
    } else {
      max3 = sum;
    }

    setTableResult({
      count: sorted.length,
      startDate: sorted[0].date,
      endDate: sorted[sorted.length - 1].date,
      totalMm: sum,
      rx1day: maxDay,
      rx3day: max3,
      source: 'Manual User Input / Source: User Provided',
    });
  };

  // Load Table into Platform Pipeline
  const handleSendTableToPipeline = () => {
    if (!onLoadIntoPipeline || tableRows.length === 0) return;
    const records: DailyRecord[] = tableRows.map((r) => ({
      date: r.date,
      rainfall_mm: r.rainfall_mm,
      station_id: 'MANUAL01',
      station_name: tableStationName || 'محطة إدخال يدوي',
      governorate: 'مصر',
      latitude: 30.05,
      longitude: 31.23,
      quality_flag: r.rainfall_mm >= 0 ? 'valid' : 'rejected_negative',
      source: 'Manual User Input',
    }));

    onLoadIntoPipeline(records, tableStationName || 'محطة إدخال يدوي', 'MANUAL01');
    onClose();
  };

  // Execute AMS Calculation
  const handleExecuteAMSCalculation = () => {
    setAmsError(null);
    try {
      const res = computeManualAMSSeriesCalculation(amsRows, 42);
      setAmsResult(res);
    } catch (err: any) {
      setAmsError(err.message || 'حدث خطأ في حساب سلسلة AMS.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  الحاسبة العلمية للإدخال اليدوي (Manual Scientific Calculator)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                  محرك حتمي 100%
                </span>
              </div>
              <p className="text-xs text-[#F4EBDD] font-medium">
                إعداد وتدقيق: د. أمل معتوق — حسابات القيم القصوى ومؤشرات Rx وAMS مباشرة بدون الحاجة لملف كامل
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

        {/* Mode Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-[#F7F3E8] px-4 pt-2 gap-2 shrink-0">
          {[
            { id: 'list', label: '1. قائمة قيم متتالية (Values List)', icon: Sliders },
            { id: 'table', label: '2. جدول يومي (Date | Rainfall)', icon: Table },
            { id: 'ams', label: '3. سلسلة AMS سنوية (Extreme Value Series)', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMode(tab.id as CalculatorMode);
                  setIsPlanApproved(false);
                }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
                  active
                    ? 'bg-white border-slate-200 text-[#0E7490] shadow-xs -mb-[1px]'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0E7490]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F7F9FA]">
          
          {/* ========================================================
              MODE 1: VALUES LIST
             ======================================================== */}
          {mode === 'list' && (
            <div className="space-y-6">
              
              {/* Input Area */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      أدخل قيم المطر اليومية المتتالية (مفصولة بفواصل أو مسافات):
                    </label>
                    <span className="text-[11px] text-slate-500">
                      الوحدة الافتراضية: مليمتر (mm) — يُشترط أن تكون القيم غير سالبة.
                    </span>
                  </div>

                  {/* Preset Examples */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">أمثلة سريعة:</span>
                    <button
                      onClick={() => {
                        setRawValuesInput('10, 25, 4, 36, 18');
                        setSelectedIndex('Rx1day');
                        setIsPlanApproved(false);
                      }}
                      className="text-[10px] px-2 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-mono font-bold cursor-pointer"
                    >
                      مثال Rx1day (36 mm)
                    </button>
                    <button
                      onClick={() => {
                        setRawValuesInput('1, 5, 8, 2, 10');
                        setSelectedIndex('Rx3day');
                        setIsPlanApproved(false);
                      }}
                      className="text-[10px] px-2 py-1 bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] rounded-md font-mono font-bold cursor-pointer"
                    >
                      مثال Rx3day (20 mm)
                    </button>
                  </div>
                </div>

                <textarea
                  value={rawValuesInput}
                  onChange={(e) => {
                    setRawValuesInput(e.target.value);
                    setIsPlanApproved(false);
                  }}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7490] text-slate-800"
                  placeholder="مثال: 10, 25, 4, 36, 18"
                />

                {/* Index Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'Rx1day', title: 'Rx1day', desc: 'أقصى هطول يومي مفرد' },
                    { id: 'Rx3day', title: 'Rx3day', desc: 'أقصى مجموع 3 أيام متتالية' },
                    { id: 'Rx5day', title: 'Rx5day', desc: 'أقصى مجموع 5 أيام متتالية' },
                    { id: 'BasicStats', title: 'إحصاءات أساسية', desc: 'المتوسط، الوسيط، الانحراف، CV' },
                  ].map((idxOption) => (
                    <button
                      key={idxOption.id}
                      onClick={() => {
                        setSelectedIndex(idxOption.id as any);
                        setIsPlanApproved(false);
                      }}
                      className={`p-3 rounded-xl text-right border transition-all cursor-pointer ${
                        selectedIndex === idxOption.id
                          ? 'bg-[#0E7490]/10 border-[#0E7490] text-[#0E7490] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-xs block">{idxOption.title}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{idxOption.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-Execution Plan Confirmation (Mandatory requirement from PDF pages 14, 55) */}
              <div className="bg-white p-5 rounded-2xl border border-[#D7B98E]/60 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1D2939]">
                  <Info className="w-4 h-4 text-[#0E7490]" />
                  <span>مخطط وخطة الحساب قبل الاعتماد والتنفيذ (Pre-execution Plan):</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F3E8] p-4 rounded-xl text-xs font-medium border border-[#D7B98E]/40">
                  <div>
                    <span className="text-slate-500 block text-[10px]">نوع البيانات:</span>
                    <span className="font-bold text-slate-900">قائمة قيم متتالية (Values List)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">عدد العينات (n):</span>
                    <span className="font-mono font-bold text-slate-900">{currentValues.length} قيمة</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">المؤشر المطلوب:</span>
                    <span className="font-bold text-[#0E7490]">{selectedIndex}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">الوحدة المعتمدة:</span>
                    <span className="font-bold text-slate-900">مليمتر (mm)</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px]">المصدر والملكية:</span>
                    <span className="font-bold text-slate-800">Manual User Input / Source: User Provided</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px]">الافتراضات العلمية:</span>
                    <span className="text-[11px] text-slate-700">تعتبر القيم قياسات متتابعة يومياً دون فجوات زمنية داخل النافذة.</span>
                  </div>
                </div>

                {listError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{listError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleExecuteListCalculation}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#0E7490] to-[#12304A] hover:from-[#12304A] hover:to-black text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>اعتماد وتنفيذ الحساب (Execute Calculation)</span>
                  </button>
                </div>
              </div>

              {/* Execution Results Area */}
              {listResult && isPlanApproved && (
                <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-md space-y-5 animate-in fade-in duration-200">
                  
                  {/* Result Header Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        النتيجة المحسوبة بدقة
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                          {listResult.index === 'BasicStats'
                            ? listResult.stats?.mean.toFixed(2)
                            : listResult.result.toFixed(1)}
                        </span>
                        <span className="text-sm font-bold text-slate-700">{listResult.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(listResult.steps.join('\n'))}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedText ? 'تم النسخ!' : 'نسخ الخطوات'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Formula and LaTeX Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">الصيغة الرياضية:</span>
                    <div className="font-mono text-xs font-bold text-blue-900" dir="ltr">
                      {listResult.formula}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500" dir="ltr">
                      LaTeX: {listResult.latexFormula}
                    </div>
                  </div>

                  {/* Sliding Windows Breakdown (If Rx3day or Rx5day) */}
                  {listResult.windows && listResult.windows.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        تفصيل النوافذ المتحركة المتتالية (Rolling Windows Breakdown):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {listResult.windows.map((w, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                              w.isMax
                                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-xs ring-1 ring-amber-400'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>نافذة {idx + 1}: {w.expression}</span>
                            {w.isMax && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                                الأقصى ★
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Calculation Steps */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      خطوات الحساب والتعويض العددي (Step-by-step Substitution):
                    </span>
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-1.5 leading-relaxed">
                      {listResult.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">[{i + 1}]</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Descriptive Stats Table */}
                  {listResult.stats && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-800 block mb-2">
                        المعالم الإحصائية للقيم المدخلة:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">المتوسط الحسابي:</span>
                          <span className="font-mono font-bold text-slate-900">{listResult.stats.mean.toFixed(2)} مم</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">الوسيط:</span>
                          <span className="font-mono font-bold text-slate-900">{listResult.stats.median.toFixed(2)} مم</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">الانحراف المعياري:</span>
                          <span className="font-mono font-bold text-slate-900">{listResult.stats.sd.toFixed(2)} مم</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">معامل الاختلاف (CV):</span>
                          <span className="font-mono font-bold text-slate-900">{listResult.stats.cv.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandatory Metadata Verification */}
                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span>المصدر: {listResult.source}</span>
                    <span>تم الحساب بمحرك إحصائي قطعي (Deterministic TS Engine)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              MODE 2: DAILY TABLE
             ======================================================== */}
          {mode === 'table' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      جدول المطر اليومي اليدوي (Date | Daily Rainfall mm)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      أدخل التواريخ بصيغة YYYY-MM-DD وقيم المطر اليومية المقاسة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const lastDate = tableRows[tableRows.length - 1]?.date || '2023-09-10';
                        const d = new Date(lastDate);
                        d.setDate(d.getDate() + 1);
                        const nextDate = d.toISOString().split('T')[0];
                        setTableRows([...tableRows, { date: nextDate, rainfall_mm: 0 }]);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      + إضافة يوم
                    </button>
                    <button
                      onClick={() => {
                        setTableRows([
                          { date: '2023-09-08', rainfall_mm: 0 },
                          { date: '2023-09-09', rainfall_mm: 46.8 },
                          { date: '2023-09-10', rainfall_mm: 0 },
                        ]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      استعادة العينة
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">اسم المحطة أو السجل اليدوي:</label>
                  <input
                    type="text"
                    value={tableStationName}
                    onChange={(e) => setTableStationName(e.target.value)}
                    className="w-full sm:w-80 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                  />
                </div>

                {/* Table Editor */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">التاريخ (YYYY-MM-DD)</th>
                        <th className="p-2.5">المطر اليومي (مم)</th>
                        <th className="p-2.5 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={r.date}
                              onChange={(e) => {
                                const copy = [...tableRows];
                                copy[idx].date = e.target.value;
                                setTableRows(copy);
                              }}
                              className="p-1.5 border border-slate-300 rounded-md font-mono text-xs w-full sm:w-44"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={r.rainfall_mm}
                              onChange={(e) => {
                                const copy = [...tableRows];
                                copy[idx].rainfall_mm = parseFloat(e.target.value) || 0;
                                setTableRows(copy);
                              }}
                              className="p-1.5 border border-slate-300 rounded-md font-mono text-xs w-full sm:w-32 font-bold text-[#0E7490]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                if (tableRows.length > 1) {
                                  setTableRows(tableRows.filter((_, i) => i !== idx));
                                }
                              }}
                              disabled={tableRows.length <= 1}
                              className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer disabled:opacity-30"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleExecuteTableCalculation}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0E7490] hover:bg-[#12304A] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>حساب مؤشرات الجدول اليدوي</span>
                  </button>

                  {onLoadIntoPipeline && (
                    <button
                      onClick={handleSendTableToPipeline}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>اعتماد وتحميل كبيانات محطة في المنصة (Load to Pipeline)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Calculation Results */}
              {tableResult && (
                <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>نتائج فحص الجدول اليومي:</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">فترة الرصد:</span>
                      <span className="font-mono font-bold text-slate-900">{tableResult.startDate} إلى {tableResult.endDate}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">المجموع التراكمي:</span>
                      <span className="font-mono font-bold text-slate-900">{tableResult.totalMm.toFixed(1)} مم</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">أقصى يوم (Rx1day):</span>
                      <span className="font-mono font-bold text-emerald-700">{tableResult.rx1day.toFixed(1)} مم</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">أقصى 3 أيام (Rx3day):</span>
                      <span className="font-mono font-bold text-emerald-700">{tableResult.rx3day.toFixed(1)} مم</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    <span>المصدر: {tableResult.source}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              MODE 3: AMS SERIES (Annual Maximum Series)
             ======================================================== */}
          {mode === 'ams' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      سلسلة القيم القصوى السنوية (Annual Maximum Series AMS)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      أدخل أعلى قراءة مطرية لكل سنة لحساب توزيعات GEV و Gumbel ومستويات الرجوع وفترات الثقة.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const lastYear = amsRows[amsRows.length - 1]?.year || 2016;
                      setAmsRows([...amsRows, { year: lastYear + 1, annual_max_mm: 35.0 }]);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    + إضافة سنة
                  </button>
                </div>

                {/* AMS Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">السنة (Year)</th>
                        <th className="p-2.5">أقصى مطر سنوي (مم)</th>
                        <th className="p-2.5 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {amsRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={r.year}
                              onChange={(e) => {
                                const copy = [...amsRows];
                                copy[idx].year = parseInt(e.target.value) || 2000;
                                setAmsRows(copy);
                              }}
                              className="p-1.5 border border-slate-300 rounded-md font-mono text-xs w-full sm:w-32"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={r.annual_max_mm}
                              onChange={(e) => {
                                const copy = [...amsRows];
                                copy[idx].annual_max_mm = parseFloat(e.target.value) || 0;
                                setAmsRows(copy);
                              }}
                              className="p-1.5 border border-slate-300 rounded-md font-mono text-xs w-full sm:w-32 font-bold text-[#0E7490]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                if (amsRows.length > 3) {
                                  setAmsRows(amsRows.filter((_, i) => i !== idx));
                                }
                              }}
                              disabled={amsRows.length <= 3}
                              className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer disabled:opacity-30"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {amsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{amsError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleExecuteAMSCalculation}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#0E7490] to-[#12304A] hover:from-[#12304A] hover:to-black text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-300" />
                    <span>حساب نماذج GEV و Gumbel ومستويات الرجوع</span>
                  </button>
                </div>
              </div>

              {/* AMS Results */}
              {amsResult && (
                <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-md space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">النموذج الأفضل ترشيحاً:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#0E7490]">{amsResult.selectedModel}</span>
                        <span className="text-xs text-slate-500 font-mono">(AIC: {amsResult.selectedModel === 'Gumbel' ? amsResult.gumbel.aic?.toFixed(1) ?? 'N/A' : amsResult.gev.aic?.toFixed(1) ?? 'N/A'})</span>
                      </div>
                    </div>
                    <div className="text-left text-xs">
                      <span className="text-[10px] text-slate-400 block">طول السجل:</span>
                      <span className="font-mono font-bold text-slate-900">{amsResult.n_years} سنوات</span>
                    </div>
                  </div>

                  {/* Warning if n < 10 */}
                  {amsResult.warnings.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>تحذير قيود السجل المحدود:</span>
                      </div>
                      <p className="text-[11px] font-normal leading-relaxed">{amsResult.warnings[0]}</p>
                    </div>
                  )}

                  {/* Parameters Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-800 block">معاملات Gumbel (L-Moments):</span>
                      <div className="font-mono text-xs text-slate-700 space-y-0.5">
                        <div>μ (الموضع): {amsResult.gumbel.mu.toFixed(3)} مم</div>
                        <div>σ (المقياس): {amsResult.gumbel.sigma.toFixed(3)} مم</div>
                        <div>AIC: {amsResult.gumbel.aic?.toFixed(2) ?? 'N/A'} | BIC: {amsResult.gumbel.bic?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-800 block">معاملات GEV (L-Moments):</span>
                      <div className="font-mono text-xs text-slate-700 space-y-0.5">
                        <div>μ: {amsResult.gev.mu.toFixed(3)} | σ: {amsResult.gev.sigma.toFixed(3)}</div>
                        <div>ξ: {amsResult.gev.xi?.toFixed(3) ?? '0.000'}</div>
                        <div>AIC: {amsResult.gev.aic?.toFixed(2) ?? 'N/A'} | BIC: {amsResult.gev.bic?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Return Levels Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      مستويات الرجوع المقدرة وفترات الثقة 95% (Bootstrap Return Levels):
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#F7F3E8] border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="p-2.5">فترة الرجوع (سنة)</th>
                            <th className="p-2.5">الاحتمال السنوي P</th>
                            <th className="p-2.5">مستوى الهطول (مم)</th>
                            <th className="p-2.5">فترة الثقة 95% [CI]</th>
                            <th className="p-2.5">ملاحظات واستقراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {amsResult.returnLevels.map((rl) => (
                            <tr key={rl.return_period_years} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-mono">T = {rl.return_period_years}</td>
                              <td className="p-2.5 font-mono text-slate-500">{(1 / rl.return_period_years).toFixed(3)}</td>
                              <td className="p-2.5 font-mono font-bold text-[#0E7490]">{rl.return_level_mm.toFixed(1)} مم</td>
                              <td className="p-2.5 font-mono text-slate-600">[{rl.lower_ci_mm.toFixed(1)} - {rl.upper_ci_mm.toFixed(1)}]</td>
                              <td className="p-2.5 text-[11px]">
                                {rl.extrapolation_warning ? (
                                  <span className="text-amber-700 font-semibold">استقراء رياضى (T &gt; 2n)</span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold">ضمن النطاق المرصود</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span>المصدر: {amsResult.source}</span>
                    <span>تم التحقق إحصائياً بمكتبة L-Moments ومحاكاة Bootstrap</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Manual Scientific Calculator — v1.0 | Deterministic Mathematical Pipeline
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
