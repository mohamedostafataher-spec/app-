/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Data Quality Control (QC) View
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Award,
  Filter,
  Download,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { QualityReport, Language } from '../../types';

interface DataQualityViewProps {
  qualityReport: QualityReport;
  completenessThreshold: number;
  setCompletenessThreshold: (thresh: number) => void;
  language: Language;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  qualityReport,
  completenessThreshold,
  setCompletenessThreshold,
  language,
}) => {
  const isAr = language === 'ar';
  const [filterEligible, setFilterEligible] = useState<'all' | 'eligible' | 'ineligible'>('all');

  const filteredYears = qualityReport.annual_completeness.filter((y) => {
    if (filterEligible === 'eligible') return y.eligible_for_ams;
    if (filterEligible === 'ineligible') return !y.eligible_for_ams;
    return true;
  });

  const exportQCtoCSV = () => {
    let csv = 'year,expected_records,actual_records,missing_records,completeness_percentage,eligible_for_ams,warning\n';
    qualityReport.annual_completeness.forEach((y) => {
      csv += `${y.year},${y.expected_records},${y.actual_records},${y.missing_records},${y.completeness_percentage},${y.eligible_for_ams},"${y.warning || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quality_report_${qualityReport.station_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'تقرير ضبط الجودة واكتمال السجلات (Data Quality Control)' : 'Data Quality Control (QC)'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'يقوم هذا القسم بفحص اكتمال كل سنة رصدية وتحديد أطول انقطاع، مع عزل القيم المفقودة عن الأصفار الحقيقية. السنة التي تقل نسبة اكتمالها عن الحد المحدد تُستبعد من بناء سلسلة القمم السنوية (AMS) مع تسجيل سبب الاستبعاد. القيم القصوى الشديدة تُسمى "Suspected Outlier" وتُحفظ دون حذف تلقائي.'
            : 'Audits record completeness per year, flags missing vs zero, and qualifies years for AMS. Suspected outliers are never auto-deleted.'}
        </p>

        {/* Threshold Adjustment Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">
              {isAr ? 'حد اكتمال السنة المؤهلة لـ AMS:' : 'AMS Completeness Threshold:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {[80, 90, 95].map((thresh) => (
                <button
                  key={thresh}
                  onClick={() => setCompletenessThreshold(thresh)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    completenessThreshold === thresh
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {thresh}% {thresh === 90 ? (isAr ? '(الافتراضي)' : '(Default)') : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {isAr ? 'التقييم الإجمالي للجودة:' : 'Quality Rating:'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {isAr ? qualityReport.overall_rating : qualityReport.overall_rating_en}
            </span>
          </div>
        </div>
      </div>

      {/* QC Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'إجمالي الأيام' : 'Total Days'}</span>
          <span className="text-lg font-bold text-white">{qualityReport.total_rows}</span>
          <span className="text-[11px] text-slate-400">
            {qualityReport.start_date.substring(0, 4)} – {qualityReport.end_date.substring(0, 4)}
          </span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'القيم المفقودة' : 'Missing Days'}</span>
          <span className="text-lg font-bold text-amber-300">{qualityReport.total_missing}</span>
          <span className="text-[11px] text-amber-400 font-semibold">{qualityReport.missing_percentage}%</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'السنوات المؤهلة لـ AMS' : 'Eligible Years'}</span>
          <span className="text-lg font-bold text-emerald-400">
            {qualityReport.annual_completeness.filter((y) => y.eligible_for_ams).length} / {qualityReport.annual_completeness.length}
          </span>
          <span className="text-[11px] text-slate-400">≥ {completenessThreshold}%</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'أطول انقطاع مفقود' : 'Longest Missing'}</span>
          <span className="text-lg font-bold text-purple-300">{qualityReport.longest_missing_gap_days} {isAr ? 'يوم' : 'days'}</span>
          <span className="text-[11px] text-slate-400">{isAr ? 'انقطاع متصل' : 'Continuous gap'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'القيم السالبة المرفوضة' : 'Negative Values'}</span>
          <span className="text-lg font-bold text-rose-400">{qualityReport.negative_count}</span>
          <span className="text-[11px] text-slate-400">{isAr ? 'مرفوضة آلياً' : 'Rejected'}</span>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-400 text-xs block">{isAr ? 'التواريخ المكررة' : 'Duplicate Dates'}</span>
          <span className="text-lg font-bold text-slate-200">{qualityReport.duplicate_count}</span>
          <span className="text-[11px] text-emerald-400">{isAr ? 'تم التدقيق' : 'Verified'}</span>
        </div>
      </div>

      {/* Annual Completeness Table */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white">
              {isAr ? 'جدول اكتمال السنوات وأهليتها لنمذجة AMS:' : 'Annual Completeness & AMS Eligibility Table:'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg text-[11px] border border-slate-700">
              <Filter className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setFilterEligible('all')}
                className={`px-2 py-0.5 rounded ${filterEligible === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setFilterEligible('eligible')}
                className={`px-2 py-0.5 rounded ${filterEligible === 'eligible' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
              >
                {isAr ? 'المؤهلة فقط' : 'Eligible'}
              </button>
              <button
                onClick={() => setFilterEligible('ineligible')}
                className={`px-2 py-0.5 rounded ${filterEligible === 'ineligible' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
              >
                {isAr ? 'المستبعدة' : 'Excluded'}
              </button>
            </div>

            <button
              onClick={exportQCtoCSV}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold">
              <tr>
                <th className="py-2 px-3 text-start">{isAr ? 'السنة' : 'Year'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الأيام المتوقعة' : 'Expected'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الأيام المرصودة' : 'Actual'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الأيام المفقودة' : 'Missing'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'نسبة الاكتمال' : 'Completeness'}</th>
                <th className="py-2 px-3 text-center">{isAr ? 'مؤهلة لـ AMS؟' : 'Eligible for AMS?'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'التحذيرات وملاحظات القرار' : 'Warnings / Decision Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredYears.map((row) => (
                <tr key={row.year} className="hover:bg-slate-750/50">
                  <td className="py-2 px-3 font-bold text-white">{row.year}</td>
                  <td className="py-2 px-3 text-slate-400">{row.expected_records}</td>
                  <td className="py-2 px-3 text-slate-300">{row.actual_records}</td>
                  <td className="py-2 px-3 text-amber-400">{row.missing_records}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${row.completeness_percentage >= completenessThreshold ? 'bg-emerald-400' : 'bg-rose-400'}`}
                          style={{ width: `${row.completeness_percentage}%` }}
                        />
                      </div>
                      <span className="font-semibold">{row.completeness_percentage}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {row.eligible_for_ams ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isAr ? 'نعم (مؤهلة)' : 'Eligible'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {isAr ? 'مستبعدة' : 'Excluded'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    {row.warning ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>{row.warning}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">{isAr ? 'مستوفية لكافة المعايير' : 'Criteria Met'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspected Outliers Section (Never auto-deleted!) */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">
              {isAr ? 'القيم القصوى الشاذة المشتبه بها (Suspected Outliers) — لا تحذف تلقائياً:' : 'Suspected Outliers (Retained, Not Auto-Deleted):'}
            </h3>
          </div>
          <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            {qualityReport.suspected_outliers.length} {isAr ? 'قيمة مشتبه بها' : 'Flagged Values'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isAr
            ? 'تطبيقاً للمبدأ العلمي الصارم: لا تُحذف القيم الشديدة لأنها كبيرة فقط. في المناخ الجاف في مصر، تُعد الهطولات الوميضية الشديدة أحداثاً مناخية واقعية حقيقية (مثل سيول 2015 و2020) وليست أخطاء قياس بالضرورة.'
            : 'Crucial rule: In arid Egyptian hydrology, extreme convective flash floods are authentic physical extremes, not measurement errors. They are flagged for review and retained.'}
        </p>

        {qualityReport.suspected_outliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                  <th className="py-2 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'القيمة المرصودة' : 'Observed Value'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'معيار الاشتباه' : 'Detection Criterion'}</th>
                  <th className="py-2 px-3 text-start">{isAr ? 'Z-Score' : 'Z-Score'}</th>
                  <th className="py-2 px-3 text-center">{isAr ? 'قرار المعالجة' : 'Decision'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {qualityReport.suspected_outliers.slice(0, 10).map((outlier, idx) => (
                  <tr key={idx} className="hover:bg-slate-750/50">
                    <td className="py-2 px-3 font-mono font-bold text-cyan-300">{outlier.date}</td>
                    <td className="py-2 px-3 font-bold text-rose-300">{outlier.value.toFixed(1)} مم</td>
                    <td className="py-2 px-3 text-slate-300">{outlier.method}</td>
                    <td className="py-2 px-3 font-mono text-slate-300">{outlier.z_score || '—'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {isAr ? 'محتفظ بها (Suspected Extreme)' : 'Retained (Suspected)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 rounded-lg text-center text-xs text-slate-400">
            {isAr ? 'لم تسجل السلسلة أي قيم خارج النطاق الإحصائي المسموح به.' : 'No outliers flagged.'}
          </div>
        )}
      </div>
    </div>
  );
};
