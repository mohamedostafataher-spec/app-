/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Data Sources, Provenance Classification & Official EMA Data Request Letter View
 */

import React, { useState } from 'react';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Award,
  FileText,
  Copy,
  Printer,
  Download,
  CheckCircle,
  FileCode,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Language, PublicDataManifestItem } from '../../types';
import { PUBLIC_DATA_MANIFEST } from '../../data/demoData';

interface DataSourcesViewProps {
  language: Language;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ language }) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'manifest' | 'classification' | 'ema_letter'>('manifest');

  // Request Letter state
  const [researcherName, setResearcherName] = useState<string>('د. أمل معتوق — Dr. Amal Matouk');
  const [researcherEmail, setResearcherEmail] = useState<string>('mohamedostafataherwork@gmail.com');
  const [researcherPhone, setResearcherPhone] = useState<string>('+20 100 000 0000');
  const [targetStations, setTargetStations] = useState<string>('كافة محطات الجمهورية المتاحة (القاهرة، الإسكندرية، مطروح، أسوان، أسيوط، الغردقة، بورسعيد، سانت كاترين)');
  const [periodRequested, setPeriodRequested] = useState<string>('من 1981 حتى أحدث سنة متاحة (سجل 30–40 سنة)');
  const [copied, setCopied] = useState<boolean>(false);

  const manifest: PublicDataManifestItem[] = PUBLIC_DATA_MANIFEST;

  const letterText = `السادة/ هيئة الأرصاد الجوية المصرية الموقرين

تحية طيبة وبعد،،،

نرغب في الحصول على بيانات الأمطار التاريخية اللازمة لبناء وتغذية المنصة العلمية لتحليل الأمطار القصوى والمخاطر المطرية في جمهورية مصر العربية، تحت اسم:

منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
إعداد وملكية علمية: ${researcherName}

نرجو التكرم بالموافقة على توفير البيانات التالية، وفق ما تسمح به اللوائح وحقوق الاستخدام المعتمدة:

1. بيانات الأمطار اليومية (Daily Precipitation) للمحطات التالية:
   ${targetStations}
2. بيانات الأمطار الساعية (Hourly Rainfall) إن كانت متاحة أو عند حدوث النوات والعواصف.
3. الفترة الزمنية المطلوبة: ${periodRequested}.
4. كود واسم كل محطة ومحافظتها وإحداثياتها الجغرافية وارتفاعها عن سطح البحر.
5. تواريخ نقل أو تغيير أجهزة الرصد، وتاريخ بداية ونهاية السجل.
6. سجل الجودة (Quality Flags) وأكواد القيم المفقودة (Missing Codes).
7. الوحدة القياسية المعتمدة (مم) وطريقة تسجيل الهطول (تراكمي أو ساعي أو يومي أرصادي).

نحيط سيادتكم علماً بأن البيانات ستُستخدم حصرياً في النمذجة الإحصائية الهيدرولوجية وإعداد خرائط فترات الرجوع وحماية المدن والمشروعات القومية من مخاطر السيول، مع الالتزام التام بحفظ مصدر البيانات وحقوق الملكية الفكرية وعدم إعادة نشر السجلات الخام إلا وفق التصريح الممنوح.

وتفضلوا بقبول فائق الاحترام والتقدير،،،

مقدمته لسيادتكم:
الاسم والصفة العلمية: ${researcherName}
اسم المشروع: منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
البريد الإلكتروني: ${researcherEmail}
الهاتف: ${researcherPhone}
تاريخ الطلب: ${new Date().toLocaleDateString('ar-EG')}`;

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintLetter = () => {
    window.print();
  };

  const handleDownloadTXT = () => {
    const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'official_ema_rainfall_data_request.txt');
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
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'مصادر البيانات المعتمدة وطبقة الرسمية والتحقق' : 'Data Sources & Provenance Classification'}
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>د. أمل معتوق</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تلتزم المنصة بتصنيف مصادر البيانات بفصل قاطع: لا تُعتبر بيانات الأقمار الصناعية (CHIRPS أو NASA GPM) بديلاً صامتاً عن السجلات الرسمية لهيئة الأرصاد المصرية. كما توفر المنصة نموذجاً رسمياً معتمداً لمخاطبة هيئة الأرصاد الجوية المصرية لطلب السجلات الميدانية.'
            : 'Clear provenance classification separating official station measurements from satellite/gridded benchmarks, plus a formal request letter tool to the Egyptian Meteorological Authority.'}
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'manifest'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'بيان الملفات المفتوحة (Public Data Manifest)' : 'Data Manifest'}
          </button>
          <button
            onClick={() => setActiveTab('classification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'classification'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'مستويات الرسمية وتصنيف المصادر (5 مستويات)' : 'Provenance Classification'}
          </button>
          <button
            onClick={() => setActiveTab('ema_letter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ema_letter'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'نموذج طلب بيانات هيئة الأرصاد المصرية' : 'Official EMA Request Letter'}
          </button>
        </div>
      </div>

      {/* 1. Public Data Manifest Tab */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'سجل ملفات البيانات والبرمجيات المعتمدة في المنظومة:' : 'Public Data Manifest:'}</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {manifest.length} {isAr ? 'ملفات وقواعد بيانات موثقة' : 'Verified Datasets'}
              </span>
            </div>

            <div className="space-y-3">
              {manifest.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-750 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300 text-xs">{item.file_name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.classification === 'Public Station Archive'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.classification === 'Satellite/Grid Dataset'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {item.classification}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{item.title_ar}</h4>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs flex items-center gap-1 self-start sm:self-center transition-colors"
                    >
                      <span>المصدر الأصلي</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-slate-500 block">الجهة المزودة:</span>
                      <span className="truncate block font-semibold">{item.provider}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">الفترة الزمنية:</span>
                      <span className="font-mono">{item.temporal_coverage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">الدقة:</span>
                      <span>{item.resolution}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">المتغيرات:</span>
                      <span className="font-mono text-slate-400">{item.variables.slice(0, 3).join(', ')}...</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 leading-relaxed">
                    <strong>تنبيه علمي:</strong> {item.official_warning_ar}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Provenance Classification Tab */}
      {activeTab === 'classification' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Official Egyptian Station Data</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                بيانات رسمية مباشرة من هيئة الأرصاد الجوية المصرية أو وزارة الموارد المائية مصحوبة بتصريح استخدام موثق. تمثل أعلى درجات الموثوقية الهندسية.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-cyan-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>2. Public Station Archive (GHCN)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                أرشيف محطات عالمي مفتوح للرصد التاريخي (NOAA NCEI). مناسب للتحليل البحثي مع وجوب فحص اكتمال كل سنة وفصل المفقود عن الصفر.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-purple-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>3. Satellite / Gridded Products</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                بيانات CHIRPS أو NASA GPM أو ERA5. تُصنف كبيانات شبكية للمقارنة والتحقق المكاني، ولا يجوز اعتبارها قياساً لمحطة أرضية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Official EMA Data Request Letter Generator Tab */}
      {activeTab === 'ema_letter' && (
        <div className="space-y-4">
          {/* Controls Bar (no print) */}
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'تخصيص بيانات خطاب طلب البيانات الرسمي:' : 'Customize Official Request Letter:'}</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLetter}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copied ? (isAr ? 'تم النسخ بنجاح ✓' : 'Copied!') : (isAr ? 'نسخ الخطاب' : 'Copy')}</span>
                </button>
                <button
                  onClick={handleDownloadTXT}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>تنزيل TXT</span>
                </button>
                <button
                  onClick={handlePrintLetter}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الخطاب</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">اسم الباحثة والمالكة:</label>
                <input
                  type="text"
                  value={researcherName}
                  onChange={(e) => setResearcherName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">البريد الإلكتروني للتواصل:</label>
                <input
                  type="text"
                  value={researcherEmail}
                  onChange={(e) => setResearcherEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">رقم الهاتف الرسمي:</label>
                <input
                  type="text"
                  value={researcherPhone}
                  onChange={(e) => setResearcherPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Printable Letter Form */}
          <div className="bg-white text-slate-950 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-3xl mx-auto space-y-4 print-page font-sans">
            <div className="text-center border-b pb-3 border-slate-300">
              <h2 className="text-base font-extrabold text-slate-900">
                جمهورية مصر العربية — طلب رسمي للحصول على سجلات أرصاد جوية
              </h2>
              <p className="text-xs text-slate-600">
                منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية — إعداد وملكية علمية: {researcherName}
              </p>
            </div>

            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed text-justify">
              {letterText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
