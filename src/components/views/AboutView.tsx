/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * About & Scientific Ownership View
 */

import React from 'react';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  FileText,
  Mail,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types';

export const AboutView: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Ownership Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
            {isAr ? 'الإعداد والملكية العلمية الحصرية' : 'Exclusive Scientific Ownership'}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {isAr ? 'د. أمل معتوق — Dr. Amal Matouk' : 'Dr. Amal Matouk'}
          </h1>
          <p className="text-sm text-cyan-300 font-medium">
            {isAr
              ? 'مؤسسة ومطورة منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'
              : 'Founder & Principal Scientific Investigator of Egypt Rainfall Extremes Platform'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto text-xs text-slate-300 leading-relaxed text-center pt-2">
          {isAr
            ? 'تم بناء وتصميم هذه المنصة العلمية كمشروع وطني مستقل متقدم لتوفير نظام حتمي عالي الدقة لتحليل الأمطار القصوى والعواصف المطرية ومخاطر السيول في جمهورية مصر العربية، بالاعتماد على المنهجيات الإحصائية العالمية القياسية واختبارات التجانس وملاءمة GEV/Gumbel وفترات الثقة.'
            : 'Dedicated national scientific platform for extreme rainfall and storm analytics in Egypt, featuring deterministic extreme value modeling, homogeneity auditing, and uncertainty quantification.'}
        </div>
      </div>

      {/* Mandatory Engineering & Legal Disclaimer */}
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 space-y-3 text-amber-200">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{isAr ? 'التحذير العلمي والهندسي الإلزامي (Scientific Disclaimer):' : 'Mandatory Scientific & Engineering Disclaimer:'}</span>
        </div>

        <blockquote className="text-xs text-slate-200 leading-relaxed ps-3 border-s-2 border-amber-400 italic">
          {isAr
            ? '«هذه المنصة أداة تحليلية مساعدة. تعتمد النتائج على جودة البيانات وطول السجل ومصدر البيانات والافتراضات والنموذج الإحصائي. لا تستخدم النتائج وحدها لاتخاذ قرارات هندسية أو قانونية أو تشغيلية دون مراجعة متخصص مؤهل.»'
            : '"This platform is an analytical decision-support tool. Results depend on data quality, record length, and statistical assumptions. Results must not be used alone for final engineering design or operational decisions without review by a qualified professional hydrologist."'}
        </blockquote>
      </div>

      {/* Pillars of Integrity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'الحسابات الحتمية (Deterministic Math)' : 'Deterministic Mathematics'}</span>
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            كافة المعادلات الرياضية (GEV, Gumbel, L-Moments, MLE, Pettitt, Mann-Kendall, Bootstrap) تنفذها خوارزميات حتمية مدققة في الكود الرياضي. الذكاء الاصطناعي لا يحسب أي رقم ولا يخترع أي قيمة.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'عزل المصادر والشفافية (Data Provenance)' : 'Transparent Data Provenance'}</span>
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            لا خلط صامت بين محطة أرضية وبيانات الأقمار الصناعية (CHIRPS أو GPM). كل نتيجة مسجلة باسم المصدر وفترة السجل ووحدة القياس وعلم الجودة.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span>{isAr ? 'قابلة لإعادة الإنتاج (100% Reproducible)' : '100% Reproducible Runs'}</span>
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            لكل تحليل يتم حفظ Run ID وبصمة التجزئة الرقمية SHA-256 للمدخلات والبذرة العشوائية، مما يتيح لأي باحث أو جهة تدقيق إعادة تشغيل الحسابات والحصول على النتيجة المطابقة.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'احترام الخصائص المصرية (Egyptian Arid Hydrology)' : 'Egyptian Arid Hydrology'}</span>
          </h3>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            معاملة خاصة للهيدرولوجيا المصرية: عدم حذف السيول الوميضية كأخطاء، وفصل الصفر الحقيقي عن القيم المفقودة، ودراسة الأعاصير المتوسطية (Medicanes) مثل عاصفة دانيال.
          </p>
        </div>
      </div>

      {/* Legal & Attribution Footer */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">
          منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
        </p>
        <p className="text-[11px] text-amber-400">
          إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
        </p>
        <p className="text-[10px] text-slate-400 pt-1">
          كافة حقوق الملكية الفكرية والمنهجية العلمية والبرمجية محفوظة للمالكة © 2026
        </p>
      </div>
    </div>
  );
};
