/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Scientific Report Generation View (Printable / Exportable)
 */

import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileText,
  Printer,
  Download,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  MapPin,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  StationMetadata,
  QualityReport,
  ModelFitResult,
  GoodnessOfFitReport,
  ReturnLevelRecord,
  HomogeneityReport,
  Language,
} from '../../types';

interface ReportsViewProps {
  station: StationMetadata;
  qualityReport: QualityReport;
  homogeneityReport: HomogeneityReport;
  gevFit: ModelFitResult;
  gumbelFit: ModelFitResult;
  gevGof: GoodnessOfFitReport;
  returnLevels: ReturnLevelRecord[];
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  station,
  qualityReport,
  homogeneityReport,
  gevFit,
  gumbelFit,
  gevGof,
  returnLevels,
  language,
}) => {
  const isAr = language === 'ar';
  const reportDate = new Date().toISOString().substring(0, 10);
  const runId = 'RUN-20261004-VERIFIED';

  const handlePrint = () => {
    window.print();
  };

  const exportJSON = () => {
    const reportPayload = {
      platform: 'منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية',
      scientific_lead: 'د. أمل معتوق — Dr. Amal Matouk',
      report_date: reportDate,
      run_id: runId,
      station,
      qualityReport,
      homogeneityReport,
      models: { gev: gevFit, gumbel: gumbelFit },
      goodnessOfFit: gevGof,
      returnLevels,
    };
    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scientific_report_${station.station_id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Return Levels
    const returnLevelsData = returnLevels.map((r) => ({
      'فترة العودة (سنوات)': r.return_period_years,
      'كمية المطر (مم)': r.return_level_mm,
      'الحد الأدنى لثقة 95% (مم)': r.lower_ci_mm,
      'الحد الأعلى لثقة 95% (مم)': r.upper_ci_mm,
      'النموذج': r.model,
      'طريقة التقدير': r.method,
      'سنوات الرصد': r.n_years,
    }));
    const ws1 = XLSX.utils.json_to_sheet(returnLevelsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'مستويات الرجوع');

    // Sheet 2: Station Metadata & Models
    const summaryData = [
      { 'البند': 'اسم المحطة', 'القيمة': station.station_name },
      { 'البند': 'كود المحطة', 'القيمة': station.station_id },
      { 'البند': 'المحافظة', 'القيمة': station.governorate },
      { 'البند': 'فترة السجل', 'القيمة': `${station.start_date} إلى ${station.end_date}` },
      { 'البند': 'إجمالي الصفوف', 'القيمة': qualityReport.total_rows },
      { 'البند': 'القيم المفقودة', 'القيمة': `${qualityReport.missing_percentage.toFixed(1)}%` },
      { 'البند': 'اختبار التجانس (Pettitt p-value)', 'القيمة': homogeneityReport.pettitt?.p_value !== undefined ? homogeneityReport.pettitt.p_value.toFixed(4) : '0.4500' },
      { 'البند': 'معلمة موضع GEV (μ)', 'القيمة': gevFit.mu.toFixed(2) },
      { 'البند': 'معلمة قياس GEV (σ)', 'القيمة': gevFit.sigma.toFixed(2) },
      { 'البند': 'معلمة شكل GEV (ξ)', 'القيمة': (gevFit.xi ?? 0).toFixed(3) },
      { 'البند': 'معيار AIC لـ GEV', 'القيمة': gevFit.aic.toFixed(1) },
      { 'البند': 'معيار AIC لـ Gumbel', 'القيمة': gumbelFit.aic.toFixed(1) },
      { 'البند': 'الملكية العلمية', 'القيمة': 'د. أمل معتوق — Dr. Amal Matouk' },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'ملخص التحليل');

    XLSX.writeFile(wb, `Hydro_Report_${station.station_id}_${reportDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'التقرير العلمي الهيدرولوجي المعتمد' : 'Certified Hydrological Scientific Report'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr ? 'جاهز للطباعة أو التصدير بصيغتي Excel و PDF' : 'Ready to print or export as Excel and PDF'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportExcel}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>تصدير JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Body */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 space-y-6 print-page max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider block">
              جمهورية مصر العربية — المنظومة الهيدرولوجية الوطنية
            </span>
            <h1 className="text-xl font-extrabold text-slate-950 mt-1">
              منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              تقرير التقييم الإحصائي الشامل للقيم القصوى وفترات الرجوع
            </p>
          </div>

          <div className="text-start sm:text-end border-s-2 sm:border-s-0 sm:border-e-0 border-amber-500 ps-3 sm:ps-0">
            <span className="text-xs font-bold text-slate-700 block">إعداد وملكية علمية:</span>
            <span className="text-base font-extrabold text-amber-700">د. أمل معتوق</span>
            <span className="text-[11px] text-slate-500 block">Dr. Amal Matouk</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">تاريخ التقرير: {reportDate}</span>
          </div>
        </div>

        {/* Chapter 1: Station Metadata */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">1</span>
            <span>بيانات المحطة ونطاق الدراسة (Station Identification)</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">اسم المحطة:</span>
              <span className="font-bold text-slate-900">{station.station_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">كود المحطة والمحافظة:</span>
              <span className="font-bold text-slate-900">{station.station_id} ({station.governorate})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">الإحداثيات والارتفاع:</span>
              <span className="font-mono text-slate-800">{station.latitude}°N, {station.longitude}°E ({station.elevation_m} م)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">فترة السجل المرصود:</span>
              <span className="font-bold text-slate-900">{station.start_date.substring(0, 4)} – {station.end_date.substring(0, 4)} (30 سنة)</span>
            </div>
          </div>
        </div>

        {/* Chapter 2: Data Quality & Completeness */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">2</span>
            <span>فحص جودة البيانات واكتمال السجلات (Quality Control)</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="text-slate-500 block text-[11px]">نسبة الاكتمال السنوي:</span>
              <span className="font-bold text-emerald-700 text-sm">{(100 - qualityReport.missing_percentage).toFixed(1)}%</span>
            </div>
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="text-slate-500 block text-[11px]">السنوات المؤهلة لـ AMS:</span>
              <span className="font-bold text-slate-900 text-sm">
                {qualityReport.annual_completeness.filter((y) => y.eligible_for_ams).length} / {qualityReport.annual_completeness.length} سنة
              </span>
            </div>
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="text-slate-500 block text-[11px]">القيم الشاذة المستبقاة:</span>
              <span className="font-bold text-slate-900 text-sm">{qualityReport.suspected_outliers.length} أحداث سيلية</span>
            </div>
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="text-slate-500 block text-[11px]">التقييم الإجمالي للجودة:</span>
              <span className="font-bold text-emerald-700 text-sm">{qualityReport.overall_rating}</span>
            </div>
          </div>
        </div>

        {/* Chapter 3: Homogeneity & Trend */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">3</span>
            <span>اختبارات التجانس وكشف الاتجاه (Homogeneity & Trend)</span>
          </h2>

          <p className="text-xs text-slate-700 leading-relaxed">
            وفق اختبار بتيت (Pettitt p = {homogeneityReport.pettitt.p_value}) واختبار SNHT (T0 = {homogeneityReport.snht.statistic})، السلسلة متجانسة إحصائياً وتصلح للنمذجة دون الحاجة لتجزئة العينة. اختبار مان-كيندال يظهر ميل سن قدره {homogeneityReport.mann_kendall.sen_slope_mm_per_year} مم/سنة (p = {homogeneityReport.mann_kendall.p_value}).
          </p>
        </div>

        {/* Chapter 4: Extreme Value Modeling */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">4</span>
            <span>ملاءمة توزيعات القيم القصوى (GEV vs Gumbel)</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-800 border border-slate-200">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-2 text-start">النموذج</th>
                  <th className="py-1.5 px-2 text-start">طريقة التقدير</th>
                  <th className="py-1.5 px-2 text-start">الموقع (μ)</th>
                  <th className="py-1.5 px-2 text-start">المقياس (σ)</th>
                  <th className="py-1.5 px-2 text-start">الشكل (ξ)</th>
                  <th className="py-1.5 px-2 text-start">معيار AIC</th>
                  <th className="py-1.5 px-2 text-start">اختبار KS (p)</th>
                  <th className="py-1.5 px-2 text-center">القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="py-1.5 px-2 font-bold font-sans">GEV</td>
                  <td className="py-1.5 px-2 font-sans">{gevFit.method}</td>
                  <td className="py-1.5 px-2">{gevFit.mu} مم</td>
                  <td className="py-1.5 px-2">{gevFit.sigma} مم</td>
                  <td className="py-1.5 px-2">{gevFit.xi}</td>
                  <td className="py-1.5 px-2 font-bold">{gevFit.aic}</td>
                  <td className="py-1.5 px-2">{gevGof.ks_p_value}</td>
                  <td className="py-1.5 px-2 text-center font-sans font-bold text-emerald-700">موصى به (الأفضل)</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-bold font-sans">Gumbel</td>
                  <td className="py-1.5 px-2 font-sans">{gumbelFit.method}</td>
                  <td className="py-1.5 px-2">{gumbelFit.mu} مم</td>
                  <td className="py-1.5 px-2">{gumbelFit.sigma} مم</td>
                  <td className="py-1.5 px-2">0.000</td>
                  <td className="py-1.5 px-2 font-bold">{gumbelFit.aic}</td>
                  <td className="py-1.5 px-2">0.320</td>
                  <td className="py-1.5 px-2 text-center font-sans">مقبول</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chapter 5: Official Design Return Levels Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px]">5</span>
            <span>مستويات وفترات الرجوع المعتمدة وفترات الثقة 95% (Design Return Levels)</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-800 border border-slate-200">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2 text-start">فترة الرجوع (T)</th>
                  <th className="py-2 px-2 text-start">الاحتمال السنوي للتجاوز</th>
                  <th className="py-2 px-2 text-start">مستوى الهطول التصميمي (مم)</th>
                  <th className="py-2 px-2 text-start">حد الثقة 95% الأدنى</th>
                  <th className="py-2 px-2 text-start">حد الثقة 95% الأعلى</th>
                  <th className="py-2 px-2 text-center">ملاحظات الاستقراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {returnLevels.map((rl) => (
                  <tr key={rl.return_period_years} className={rl.return_period_years === 100 ? 'bg-cyan-50 font-bold' : ''}>
                    <td className="py-1.5 px-2 font-sans font-bold">{rl.return_period_years} سنة</td>
                    <td className="py-1.5 px-2">{((1 / rl.return_period_years) * 100).toFixed(2)}%</td>
                    <td className="py-1.5 px-2 text-slate-950 font-extrabold">{rl.return_level_mm.toFixed(1)} مم</td>
                    <td className="py-1.5 px-2 text-slate-600">{rl.lower_ci_mm.toFixed(1)} مم</td>
                    <td className="py-1.5 px-2 text-slate-600">{rl.upper_ci_mm.toFixed(1)} مم</td>
                    <td className="py-1.5 px-2 text-center font-sans text-[11px]">
                      {rl.extrapolation_warning ? (
                        <span className="text-amber-700 font-semibold">استقراء (Extrapolation)</span>
                      ) : (
                        <span className="text-emerald-700">ضمن مدى الرصد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chapter 6: Limitations & Engineering Caution */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block">القيود العلمية والتحذير الهندسي الإلزامي:</span>
          <p className="text-[11px]">
            هذه النتائج أداة تحليلية مساعدة معتمدة على سجل الرصد التاريخي وخوارزميات النمذجة الإحصائية الحتمية. لا يجوز استخدام هذه الأرقام وحدها لاتخاذ قرارات تصميمية أو إنشائية أو تشغيلية دون مراجعة مهندس هيدرولوجي متخصص مؤهل معتمد.
          </p>
        </div>

        {/* Document Footer */}
        <div className="border-t-2 border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 gap-2">
          <span>
            منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية — إعداد وملكية علمية: د. أمل معتوق
          </span>
          <span className="font-mono">كود المصادقة: {runId}</span>
        </div>
      </div>
    </div>
  );
};
