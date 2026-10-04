/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Data Dictionary & Authorized Data Sources View
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Award,
  Layers,
  FileCode,
} from 'lucide-react';
import { Language } from '../../types';

export const DataDictionaryView: React.FC<{ language: Language }> = ({ language }) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'fields' | 'sources'>('fields');

  const fieldsDictionary = [
    { field: 'date', type: 'date', unit: 'ISO-8601', required: 'نعم', rule: 'تاريخ صحيح بصيغة YYYY-MM-DD وغير مكرر دون قرار موثق.' },
    { field: 'datetime', type: 'datetime', unit: 'ISO-8601', required: 'للساعي', rule: 'طابع زمني متكامل مع حفظ المنطقة الزمنية (Africa/Cairo).' },
    { field: 'station_id', type: 'string', unit: '—', required: 'نعم', rule: 'كود ثابت وفريد وغير فارغ للمحطة (مثل CAI01, ALX01).' },
    { field: 'station_name', type: 'string', unit: '—', required: 'نعم', rule: 'اسم المحطة الجغرافي المعترف به.' },
    { field: 'governorate', type: 'string', unit: '—', required: 'مستحسن', rule: 'المحافظة المصرية التي تقع بها المحطة.' },
    { field: 'latitude', type: 'float', unit: 'degree', required: 'نعم', rule: 'خط العرض من -90 إلى 90 درجة.' },
    { field: 'longitude', type: 'float', unit: 'degree', required: 'نعم', rule: 'خط الطول من -180 إلى 180 درجة.' },
    { field: 'elevation_m', type: 'float', unit: 'متر', required: 'اختياري', rule: 'ارتفاع المحطة عن منسوب سطح البحر، غير سالب.' },
    { field: 'rainfall_mm', type: 'float', unit: 'مم', required: 'نعم', rule: 'كمية الهطول. الصفر مسموح، القيم السالبة غير صالحة وتُرفض.' },
    { field: 'quality_flag', type: 'string', unit: '—', required: 'مستحسن', rule: 'علم الجودة: valid / missing / suspect / estimated.' },
    { field: 'source', type: 'string', unit: '—', required: 'نعم', rule: 'رابط المصدر أو اسم مالك البيانات الموثق.' },
    { field: 'start_date', type: 'date', unit: 'ISO-8601', required: 'مستحسن', rule: 'تاريخ بداية السجل التاريخي للمحطة.' },
    { field: 'end_date', type: 'date', unit: 'ISO-8601', required: 'مستحسن', rule: 'تاريخ نهاية السجل المتاح.' },
    { field: 'relocation_date', type: 'date', unit: 'ISO-8601', required: 'اختياري', rule: 'تاريخ نقل موقع المحطة أو تغيير الارتفاع إن وجد.' },
  ];

  const dataSources = [
    {
      name: 'هيئة الأرصاد الجوية المصرية (Egyptian Meteorological Authority)',
      category: 'محطة أرضية رسمية (Official Ground Station)',
      coverage: 'المحطات الوطنية في مصر',
      resolution: 'يومي / ساعي',
      egyptUse: 'المصدر المرجعي الأوثق للقياس الميداني',
      limitations: 'يتطلب ترخيصاً أو تصريح استخدام رسمي للسجلات التاريخية الكاملة.',
      url: 'https://egyptianprmet.wixsite.com/ema2018/about?lang=en',
    },
    {
      name: 'NOAA Climate Data Online (CDO)',
      category: 'أرشيف محطات عالمي مفتوح (Station Archive)',
      coverage: 'تاريخي عالمي يشمل محطات مصرية',
      resolution: 'يومي / شهري',
      egyptUse: 'بديل عام مجاني للمحطات المصرية التاريخية (القاهرة، الإسكندرية، أسوان)',
      limitations: 'تفاوت في درجة اكتمال السجلات ووجود بعض الفجوات.',
      url: 'https://www.ncei.noaa.gov/cdo-web/',
    },
    {
      name: 'CHIRPS (Climate Hazards Center)',
      category: 'بيانات شبكية دمج أقمار صناعية + محطات (Gridded Satellite+Gauge)',
      coverage: '1981 حتى الآن (شبه فوري)',
      resolution: '0.05 درجة (حوالي 5.3 كم) يومي',
      egyptUse: 'تغطية مكانية ومقارنة توأمية (Twin Comparison) وسد فجوات الحوض',
      limitations: 'التقديرات المساحية قد تخفض ذروة الهطولات الحادة مقارنة بالقياس النقطي للمحطة. ملحوظة: v2 سينتهي ديسمبر 2026 تمهيداً لـ v3.',
      url: 'https://www.chc.ucsb.edu/data/chirps',
    },
    {
      name: 'NASA GPM / IMERG (Global Precipitation Measurement)',
      category: 'بيانات أقمار صناعية متقدمة (Satellite Precipitation)',
      coverage: '1998 حتى الآن',
      resolution: '0.1 درجة، نصف ساعي وساعي',
      egyptUse: 'تحليل شدة العواصف وتوزيعها الزمني (مثل عاصفة دانيال)',
      limitations: 'حساسية خوارزميات الاسترجاع الرادارية فوق الأسطح الصحراوية الجافة.',
      url: 'https://gpm.nasa.gov/data',
    },
    {
      name: 'HDX Egypt Rainfall Indicators (OCHA)',
      category: 'مؤشرات إدارية مجمعة (Subnational Admin Aggregates)',
      coverage: 'سلسلة زمنية ممتدة على مستوى المحافظات والمراكز',
      resolution: 'عشرية (Dekadal) وشهرية',
      egyptUse: 'مؤشرات عامة ورصد الإنذار المبكر على المستوى الإداري',
      limitations: 'ليست بيانات يومية نقطية للمحطة، ولا تصلح لبناء سلاسل AMS ونمذجة GEV.',
      url: 'https://data.humdata.org/dataset/egy-rainfall-subnational',
    },
    {
      name: 'ERA5 (ECMWF Reanalysis)',
      category: 'إعادة تحليل مناخي (Reanalysis Data)',
      coverage: '1940 حتى الآن',
      resolution: '0.25 درجة، ساعي ويومي',
      egyptUse: 'المقارنة المناخية وسياق الغلاف الجوي وسرعة الرياح والرطوبة',
      limitations: 'بيانات نموذج محاكاة وليست قياس محطة أرضية مباشر.',
      url: 'https://climate.copernicus.eu/climate-reanalysis',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'قاموس البيانات ومصادر الرصد المعتمدة' : 'Data Dictionary & Authorized Sources'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'المواصفات القياسية لحقول البيانات وقواعد التدقيق والحدود المسموح بها، مع قائمة المصادر المعتمدة دولياً ومحلياً والقيود العلمية لكل مصدر، تفادياً للخلط بين قياس المحطة الأرضية والبيانات الشبكية التقديرية.'
            : 'Standard specifications for data fields, units, and validation rules, along with authorized international and local data sources and limitations.'}
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fields'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'قاموس الحقول والتحقق (14 حقل)' : 'Fields Dictionary (14)'}
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sources'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'مصادر البيانات والقيود (6 مصادر)' : 'Authorized Data Sources (6)'}
          </button>
        </div>
      </div>

      {activeTab === 'fields' ? (
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'جدول توصيف الحقول وقواعد التحقق الإلزامية:' : 'Data Dictionary Table:'}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {isAr ? '14 حقلاً قياسياً مدعوماً' : '14 Standard Fields'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الحقل' : 'Field'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الوحدة' : 'Unit'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'مطلوب؟' : 'Required?'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'القاعدة وقيد التحقق' : 'Validation Rule'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fieldsDictionary.map((f) => (
                  <tr key={f.field} className="hover:bg-slate-750/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{f.field}</td>
                    <td className="py-2.5 px-3 text-purple-300 font-mono text-[11px]">{f.type}</td>
                    <td className="py-2.5 px-3 text-slate-300">{f.unit}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.required === 'نعم'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {f.required}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 leading-relaxed">{f.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>
              {isAr
                ? 'قاعدة صارمة للمنصة: لا تخلط قياسات محطة أرضية مع بيانات شبكية (CHIRPS أو GPM أو ERA5) في سلسلة زمنية واحدة دون اختبار انحياز وتوثيق كامل. تُحفظ البيانات الشبكية كتوأم مقارن منفصل.'
                : 'Strict rule: Never merge ground station records with gridded products into a single series without explicit bias correction.'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((src, idx) => (
              <div
                key={idx}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-white flex-1">{src.name}</h4>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 p-1"
                    title={src.url}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-[11px] font-mono text-cyan-300 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                  {src.category}
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400">{isAr ? 'الدقة: ' : 'Resolution: '}</span>
                    <span>{src.resolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isAr ? 'الاستخدام في مصر: ' : 'Usage in Egypt: '}</span>
                    <span>{src.egyptUse}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] bg-slate-900/40 p-2 rounded border border-slate-800/80">
                    <span className="text-amber-400 font-semibold">{isAr ? 'القيود العلمية: ' : 'Limitations: '}</span>
                    {src.limitations}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
