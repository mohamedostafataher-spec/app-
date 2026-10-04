/**
 * منصة تحليل الأمطار القصوى
 * صفحة المعادلات الرياضية والمراجع العلمية الهيدرولوجية المعتمدة
 */

import React from 'react';
import { BookOpen, X, Award, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

interface FormulasAndReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulasAndReferencesModal: React.FC<FormulasAndReferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const references = [
    {
      author: 'Coles, S.',
      year: '2001',
      title: 'An Introduction to Statistical Modeling of Extreme Values',
      publisher: 'Springer-Verlag, London',
      notes: 'المرجع الأساسي لنظرية القيم القصوى (EVT) وتوزيع GEV ومستويات الرجوع.',
    },
    {
      author: 'Hosking, J. R. M., & Wallis, J. R.',
      year: '1997',
      title: 'Regional Frequency Analysis: An Approach Based on L-Moments',
      publisher: 'Cambridge University Press',
      notes: 'الأساس الرياضي لحساب معلمات L-moments المغلقة بدقة تفوق طريقة العزوم التقليدية.',
    },
    {
      author: 'Pettitt, A. N.',
      year: '1979',
      title: 'A non-parametric approach to the change-point problem',
      publisher: 'Applied Statistics, 28(2), 126–135',
      notes: 'اختبار بتيت غير المعلمي لاكتشاف نقطة الانكسار والتغير المفاجئ في السلاسل الهيدرولوجية.',
    },
    {
      author: 'Alexandersson, H.',
      year: '1986',
      title: 'A homogeneity test applied to precipitation data',
      publisher: 'Journal of Climatology, 6(6), 661–675',
      notes: 'اختبار التجانس المعياري الطبيعي (SNHT) الحساس لتغيرات بداية ونهاية السلسلة.',
    },
    {
      author: 'Buishand, T. A.',
      year: '1982',
      title: 'Some methods for testing the homogeneity of rainfall records',
      publisher: 'Journal of Hydrology, 58(1-2), 11–27',
      notes: 'اختبار مدى بويشاند التراكمي لكشف عدم التجانس في منتصف السجلات المطرية.',
    },
    {
      author: 'von Neumann, J.',
      year: '1941',
      title: 'Distribution of the ratio of the mean square successive difference to the variance',
      publisher: 'The Annals of Mathematical Statistics, 12(4), 367–395',
      notes: 'اختبار نسبة فون نيومان للتحقق من استقلالية وعشوائية السلسلة الزمنية وعدم وجود ارتباط تسلسلي.',
    },
    {
      author: 'WMO (World Meteorological Organization)',
      year: '2009',
      title: 'Guide to Hydrological Practices (WMO-No. 168), Volume II: Management of Water Resources and Applications',
      publisher: 'Geneva, Switzerland',
      notes: 'دليل المنظمة العالمية للأرصاد الجوية لضبط جودة القياسات وفحص التجانس وحساب فترات الثقة.',
    },
  ];

  const formulas = [
    {
      title: '1. دالة التوزيع التراكمي لـ GEV (Generalized Extreme Value CDF)',
      formula: 'F(x) = \\exp\\left( -\\left[ 1 + \\xi \\left( \\frac{x - \\mu}{\\sigma} \\right) \\right]^{-1/\\xi} \\right)',
      desc: 'حيث μ هو معامل الموضع (Location)، و σ معامل القياس (Scale > 0)، و ξ معامل الشكل (Shape). إذا كان ξ = 0 يؤول التوزيع لتوزيع غامبل.',
    },
    {
      title: '2. دالة التوزيع التراكمي لغامبل (Gumbel CDF)',
      formula: 'F(x) = \\exp\\left( -\\exp\\left( -\\frac{x - \\mu}{\\sigma} \\right) \\right)',
      desc: 'توزيع القيم القصوى من النوع الأول (Type I)، ذو ذيل أسي خفيف.',
    },
    {
      title: '3. مستويات الرجوع (Return Level Quantile x_T)',
      formula: 'x_T = \\begin{cases} \\mu - \\sigma \\ln\\left(-\\ln(1 - 1/T)\\right) & \\text{for Gumbel (}\\xi = 0\\text{)} \\\\[6pt] \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left(-\\ln(1 - 1/T)\\right)^{-\\xi} - 1 \\right] & \\text{for GEV (}\\xi \\neq 0\\text{)} \\end{cases}',
      desc: 'حيث T هي فترة العودة بالسنوات (مثلاً 2، 5، 10، 25، 50، 100 سنة)، واحتمال التجاوز السنوي هو P = 1/T.',
    },
    {
      title: '4. حساب المعلمات بواسطة L-Moments',
      formula: '\\lambda_1 = l_1, \\quad \\lambda_2 = 2 l_2 - l_1, \\quad \\tau_3 = \\frac{\\lambda_3}{\\lambda_2} \\approx 3 - \\frac{2 \\ln 2}{\\ln 3} \\text{ (تقدير مغلق)}',
      desc: 'طريقة L-moments المغلقة توفر تقديرات غير متحيزة ومستقرة جداً حتى مع العينات الصغيرة (N < 50 سنة).',
    },
    {
      title: '5. اختبار بتيت للتجانس (Pettitt Test Statistic)',
      formula: 'U_{t,T} = \\sum_{i=1}^t \\sum_{j=t+1}^T \\text{sgn}(x_i - x_j), \\quad K_T = \\max_{1 \\le t < T} |U_{t,T}|, \\quad p \\approx 2 \\exp\\left( \\frac{-6 K_T^2}{T^3 + T^2} \\right)',
      desc: 'يحدد سنة حدوث الانكسار الهيكلي الأرجح في السلسلة الزمنية الهيدرولوجية.',
    },
    {
      title: '6. اختبار نسبة فون نيومان (von Neumann Ratio)',
      formula: 'N = \\frac{\\sum_{i=1}^{n-1} (y_i - y_{i+1})^2}{\\sum_{i=1}^n (y_i - \\bar{y})^2}, \\quad E(N) = 2',
      desc: 'تحت فرضية العدم (العشوائية والتجانس)، القيمة المتوقعة تساوي 2. القيم الأقل بكثير من 2 تشير لارتباط تسلسلي أو تغير في المتوسط.',
    },
    {
      title: '7. فترات الثقة 95% بطريقة Bootstrap',
      formula: 'CI_{95\\%} = \\left[ q_{0.025}^*, \\, q_{0.975}^* \\right] \\quad \\text{من } B = 1000 \\text{ إعادة عينة بارامترية}',
      desc: 'إعادة محاكاة 1000 عينة صناعية بحجم السلسلة الفعلي، وإعادة ضبط النموذج لكل منها لاستخراج المئينين 2.5% و 97.5%.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                المعادلات الإحصائية والمراجع العلمية المعتمدة
              </h2>
              <p className="text-xs text-slate-400">
                توثيق كامل لكافة الصيغ الرياضية والمراجع الأكاديمية المستخدمة في الحساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Scientific Disclaimer */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-emerald-300">
                حساب رياضي حتمي 100% داخل المتصفح (Zero-AI Calculations)
              </div>
              <p className="text-slate-300 leading-relaxed">
                جميع النتائج والأرقام ومستويات وفترات العودة واختبارات الملاءمة تُحسب باستخدام معادلات إحصائية صريحة ومغلقة تم تطبيقها بلغة JavaScript داخل المتصفح، ولا تعتمد على أي نموذج ذكاء اصطناعي أو تخمين احتمالي، مع مطابقة كاملة لمعايير WMO ودليل Coles (2001).
              </p>
            </div>
          </div>

          {/* Formulas Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-r-4 border-emerald-400 pr-2">
              المعادلات الرياضية المنفذة في المنصة
            </h3>
            <div className="space-y-3">
              {formulas.map((item, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-300">{item.title}</div>
                  <div
                    dir="ltr"
                    className="p-2.5 bg-slate-900/90 rounded-lg text-emerald-400 font-mono text-xs sm:text-sm text-center border border-slate-800/80 overflow-x-auto"
                  >
                    {item.formula}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic References Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-white border-r-4 border-emerald-400 pr-2">
              المراجع الأكاديمية المعتمدة عالمياً
            </h3>
            <div className="space-y-2.5">
              {references.map((ref, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-200">
                    <span className="text-emerald-400 font-bold">{ref.author}</span> ({ref.year}).{' '}
                    <span className="italic">{ref.title}</span>. {ref.publisher}.
                  </div>
                  <div className="text-[11px] text-slate-400">{ref.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>منصة تحليل الأمطار القصوى — المنهجية العلمية</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
