/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * References & Mathematical Formulation View (المراجع والمعادلات العلمية)
 */

import React from 'react';
import {
  BookOpen,
  Award,
  Layers,
  FileCode,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../../types';

interface ReferencesViewProps {
  language: Language;
}

export const ReferencesView: React.FC<ReferencesViewProps> = ({ language }) => {
  const isAr = language === 'ar';

  const formulas = [
    {
      titleAr: '1. مؤشر Rx1day ومؤشرات التراكم (Rx3day, Rx5day)',
      formula: 'Rx1day_y = \\max_{d \\in [1, N_y]} P_{d,y}, \\quad Rx3day_y = \\max_{d} (P_{d,y} + P_{d+1,y} + P_{d+2,y})',
      descriptionAr: 'حساب أقصى قيمة يومية أو تراكمية عبر نافذة زمنية متحركة لكل سنة مستوفية لشرط الاكتمال.',
    },
    {
      titleAr: '2. اختبار بيتيت للتجانس واكتشاف نقطة الانكسار (Pettitt Test)',
      formula: 'K_T = \\max_{1 \\le t < T} |U_{t,T}|, \\quad U_{t,T} = \\sum_{i=1}^t \\sum_{j=t+1}^T \\text{sgn}(X_i - X_j)',
      descriptionAr: 'اختبار غير بارامتري معتمد من المنظمة العالمية للأرصاد لاكتشاف التغيرات المفصلية في السجل المناخي.',
    },
    {
      titleAr: '3. العزوم الخطية الاحتمالية (L-Moments)',
      formula: '\\lambda_1 = \\beta_0, \\quad \\lambda_2 = 2\\beta_1 - \\beta_0, \\quad \\tau_3 = \\frac{\\lambda_3}{\\lambda_2}',
      descriptionAr: 'طريقة هوكينغ وواليس (Hosking & Wallis 1997) المقاومة للقيم الشاذة في السجلات المناخية المحدودة.',
    },
    {
      titleAr: '4. تقدير معلمات توزيع القيم القصوى المعمم (GEV)',
      formula: '\\xi \\approx 7.8590 c + 2.9554 c^2, \\quad \\sigma = \\frac{\\lambda_2 \\xi}{(1 - 2^{-\\xi})\\Gamma(1+\\xi)}, \\quad \\mu = \\lambda_1 - \\frac{\\sigma}{\\xi}[1 - \\Gamma(1+\\xi)]',
      descriptionAr: 'قوانين مغلقة دقيقة لتقدير الموقع μ والمقياس σ ومعامل الشكل ξ.',
    },
    {
      titleAr: '5. دالة مستويات الرجوع العكسية (Return Level Quantile)',
      formula: 'x_T = \\mu + \\frac{\\sigma}{\\xi} \\left[ \\left( -\\ln\\left(1 - \\frac{1}{T}\\right) \\right)^{-\\xi} - 1 \\right]',
      descriptionAr: 'تقدير كمية الهطول المتوقع تجاوزها باحتمال سنوي قدره (1/T) لفترات الرجوع 2، 5، 10، 25، 50، 100، 200 سنة.',
    },
    {
      titleAr: '6. فترات الثقة عبر محاكاة البوتستراب البارامتري (Parametric Bootstrap)',
      formula: 'CI_{1-\\alpha} = \\left[ q_{\\alpha/2}\\left(\\hat{x}_T^*\\right), \\; q_{1-\\alpha/2}\\left(\\hat{x}_T^*\\right) \\right] \\quad (B = 1000 \\text{ to } 5000)',
      descriptionAr: 'توليد عينات اصطناعية لتقدير عدم اليقين الإحصائي وتفادي تشوهات الاستقراء.',
    },
  ];

  const citations = [
    {
      title: 'Hosking, J. R. M., & Wallis, J. R. (1997)',
      detail: 'Regional Frequency Analysis: An Approach Based on L-Moments. Cambridge University Press.',
    },
    {
      title: 'Coles, S. (2001)',
      detail: 'An Introduction to Statistical Modeling of Extreme Values. Springer Series in Statistics.',
    },
    {
      title: 'World Meteorological Organization (WMO No. 168 & 500)',
      detail: 'Guide to Hydrological Practices: Data Acquisition, Quality Control, and Statistical Analysis.',
    },
    {
      title: 'Pettitt, A. N. (1979)',
      detail: 'A non-parametric approach to the change-point problem. Journal of the Royal Statistical Society.',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>إعداد وملكية علمية: د. أمل معتوق</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">
          {isAr ? 'المراجع والمعادلات الرياضية المعتمدة' : 'Scientific References & Formulas'}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr
            ? 'توثيق رياضي ومنهجي دقيق لجميع الخوارزميات والمعايير المطبقة داخل المنصة.'
            : 'Complete documentation of equations, algorithms, and peer-reviewed sources.'}
        </p>
      </div>

      {/* Equations Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span>{isAr ? 'المعادلات والقوانين المغلقة المطبقة في المنصة' : 'Mathematical Formulations'}</span>
        </h2>

        <div className="space-y-3">
          {formulas.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">{item.titleAr}</h3>
              <div dir="ltr" className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-blue-900 overflow-x-auto text-center font-bold">
                {item.formula}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.descriptionAr}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Citations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>{isAr ? 'المراجع العلمية المعتمدة (Peer-Reviewed References)' : 'Scientific References'}</span>
        </h2>

        <div className="space-y-2">
          {citations.map((cite, cIdx) => (
            <div key={cIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block">{cite.title}</span>
              <span className="text-slate-600 text-[11px] block mt-0.5">{cite.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
