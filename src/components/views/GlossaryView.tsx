/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Scientific Hydrological Glossary View
 */

import React, { useState } from 'react';
import { BookOpen, Search, Award, HelpCircle } from 'lucide-react';
import { Language } from '../../types';

export const GlossaryView: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState<string>('');

  const glossaryTerms = [
    {
      termAr: 'فترة الرجوع (Return Period / Recurrence Interval)',
      termEn: 'Return Period (T)',
      definitionAr:
        'المتوسط الزمني الإحصائي المتوقع لتجاوز كمية مطرية معينة مرة واحدة على الأقل. فترة الرجوع 100 سنة لا تعني حدوث العاصفة مرة كل قرن بالتأكيد، بل تعني أن احتمالية تجاوز هذه الكمية في أي عام مفرد هي 1% (p = 1/T = 0.01).',
      formula: 'T = 1 / (1 - F(x))',
    },
    {
      termAr: 'مستوى الرجوع (Return Level / Design Rainfall)',
      termEn: 'Return Level (x_T)',
      definitionAr:
        'كمية المطر المتوقعة بالملليمتر التي يقابلها احتمال تجاوز سنوي قدره 1/T. تُستخدم كأساس هندسي ملزم لتصميم مخرات السيول وسدود الإعاقة وشبكات تصريف الأمطار.',
      formula: 'x_T = F^(-1)(1 - 1/T)',
    },
    {
      termAr: 'القيم الشاذة المشتبه بها (Suspected Outlier)',
      termEn: 'Suspected Outlier',
      definitionAr:
        'قيمة متطرفة جداً تتجاوز النطاق الربيعي (Q3 + 3*IQR) أو معيار Z-Score. في المنصة، لا تُحذف هذه القيم تلقائياً؛ لأن الهطولات الوميضية العنيفة في مناخ مصر الجاف تمثل ظواهر طبيعية واقعية خطيرة، وحذفها يؤدي لخفض معايير الأمان الهندسي.',
    },
    {
      termAr: 'سلسلة القمم السنوية (Annual Maximum Series - AMS)',
      termEn: 'Annual Maximum Series (AMS)',
      definitionAr:
        'سلسلة زمنية تتألف من أكبر قيمة مفردة مسجلة في كل سنة تقويمية لمؤشر هطول محدد (مثل Rx1day). تُشترط نسبة اكتمال لا تقل عن 90% لاعتماد السنة داخل السلسلة.',
    },
    {
      termAr: 'توزيع القيم القصوى المعمم (GEV Distribution)',
      termEn: 'Generalized Extreme Value (GEV)',
      definitionAr:
        'عائلة توزيعات احتمالية تضم ثلاثة أنواع تحكمها معلمات الموقع (μ) والمقياس (σ) والشكل (ξ): نوع غامبل (ξ = 0)، ونوع فريشيه للذيول الثقيلة (ξ > 0)، ونوع ويبل ذو السقف الأعلى (ξ < 0).',
      formula: 'F(x) = exp(-(1 + xi*(x - mu)/sigma)^(-1/xi))',
    },
    {
      termAr: 'توزيع غامبل (Gumbel Type I Distribution)',
      termEn: 'Gumbel Distribution',
      definitionAr:
        'حالة خاصة ومحورية من توزيع GEV عندما يقترب معامل الشكل من الصفر (ξ = 0)، حيث يفترض ذيلاً أسياً غير محدود في الطرف العلوي وله معلمتان فقط (الموقع والمقياس).',
      formula: 'F(x) = exp(-exp(-(x - mu)/sigma))',
    },
    {
      termAr: 'العزوم الخطية الاحتمالية (L-Moments)',
      termEn: 'L-Moments Estimation',
      definitionAr:
        'طريقة رياضية رصينة لتقدير معلمات التوزيعات الاحتمالية تعتمد على التركيبات الخطية لرتب العينة. تتميز بثباتها العالي في العينات الصغيرة وعدم تأثرها الشديد بالقيم المتطرفة مقارنة بالعزوم التقليدية.',
    },
    {
      termAr: 'محاكاة البوتستراب البارامترية (Parametric Bootstrap)',
      termEn: 'Parametric Bootstrap',
      definitionAr:
        'طريقة محاكاة حاسوبية تولد آلاف العينات الاصطناعية (5000 عينة) من النموذج المقدر لحساب مجالات عدم اليقين وفترات الثقة (Confidence Intervals) بدقة ودون تحيز.',
    },
    {
      termAr: 'مؤشرات ETCCDI للأمطار القصوى (Rx1day, Rx3day, Rx5day)',
      termEn: 'Extreme Precipitation Indices',
      definitionAr:
        'المعايير الدولية لمنظمة الأرصاد العالمية: Rx1day يمثل أقصى هطول خلال يوم واحد، وRx3day يمثل أقصى مجموع تراكمي لثلاثة أيام متتالية، وRx5day يمثل أقصى مجموع لخمسة أيام.',
    },
    {
      termAr: 'اختبار بتيت للتجانس (Pettitt Test)',
      termEn: "Pettitt's Homogeneity Test",
      definitionAr:
        'اختبار لا معملي يحدد وجود نقطة تحول مفاجئة (Break Point) في المتوسط الزمني للسلسلة، ويحدد العام الذي حدث عنده التغير الهيكلي مع تقييم الدلالة الإحصائية.',
    },
    {
      termAr: 'اختبار مان-كيندال وميل سن (Mann-Kendall & Sen’s Slope)',
      termEn: "Mann-Kendall Trend & Sen's Slope",
      definitionAr:
        'اختبار إحصائي غير معلمي للكشف عن وجود اتجاه رتيب صاعد أو هابط في كميات الأمطار عبر السنين، مع حساب معدل التغير السنوي (Sen\'s Slope) بالملليمتر لكل سنة.',
    },
    {
      termAr: 'الإعصار المتوسطي الشبيه بالاستوائي (Medicane)',
      termEn: 'Mediterranean Tropical-like Cyclone (Medicane)',
      definitionAr:
        'منخفض جوي عميق يتشكل فوق مياه البحر الأبيض المتوسط ويكتسب خصائص تشبه الأعاصير المدارية (عين مركزية وعواصف رعدية وهطولات طوفانية)، مثل عاصفة دانيال في سبتمبر 2023.',
    },
  ];

  const filtered = glossaryTerms.filter(
    (t) =>
      t.termAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.termEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.definitionAr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'قاموس المصطلحات والمفاهيم الهيدرولوجية والإحصائية' : 'Scientific Hydrological Glossary'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'شرح علمي دقيق ومبسط للمصطلحات الإحصائية والهيدرولوجية المستخدمة في المنصة بلغة عربية ملائمة للمجتمع الهندسي والبحثي في مصر، مع توضيح المعادلات الرياضية الأساسية والمعاني التطبيقية.'
            : 'Clear scientific definitions of statistical extreme value hydrology terms for Egyptian engineers and researchers.'}
        </p>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في المصطلحات أو المفاهيم...' : 'Search terms...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-2 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-bold text-cyan-300">{item.termAr}</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">{item.termEn}</span>

            <p className="text-xs text-slate-300 leading-relaxed text-justify">
              {item.definitionAr}
            </p>

            {item.formula && (
              <div className="font-mono text-[11px] text-amber-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                {item.formula}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
