/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Navigation Sidebar — مبسطة بأربع قوائم فقط
 */

import React from 'react';
import {
  Zap,
  Sparkles,
  TrendingUp,
  FileText,
  Award,
  ChevronRight,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types';

export type NavTab =
  | 'pipeline'
  | 'smart_analyst'
  | 'return_calculator'
  | 'reports'
  | (string & {});

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  language: Language;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  isOpen,
  setIsOpen,
  stationsCount,
}) => {
  const isAr = language === 'ar';

  const navItems = [
    {
      id: 'pipeline' as NavTab,
      labelAr: 'التحليل الفوري (10 خطوات)',
      labelEn: 'Direct Analysis (10 Steps)',
      descAr: 'رفع ملف Excel/CSV وحساب كل شيء متسلسل في المتصفح',
      descEn: 'File upload, QC, Pettitt, Rx1/3/5, AMS, GEV, CI',
      icon: Zap,
      badge: isAr ? 'الرئيسية ⚡' : 'Main',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'smart_analyst' as NavTab,
      labelAr: 'المحلل باللغة العربية',
      labelEn: 'Smart Hydro Analyst',
      descAr: 'اكتب أي طلب بالعربي واحسب النتيجة والمعادلة فورياً',
      descEn: 'Instant hydro inquiry in natural Arabic',
      icon: Sparkles,
      badge: isAr ? 'اسأل واحسب' : 'Ask AI',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'return_calculator' as NavTab,
      labelAr: 'حاسبة ومنحنيات العودة',
      labelEn: 'Return Levels & Risk',
      descAr: 'حساب كمية المطر لفترة عودة T، أو حساب فترة العودة ومخاطر التصميم',
      descEn: 'Bidirectional T vs mm & engineering lifespan risk',
      icon: TrendingUp,
      badge: isAr ? 'حاسبة حية' : 'Calculator',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'reports' as NavTab,
      labelAr: 'التقرير العلمي والمشاريع',
      labelEn: 'Report & Export',
      descAr: 'تصدير PDF و Excel، حفظ المشاريع، والتوثيق العلمي',
      descEn: 'Certified print/PDF, Excel export & project save',
      icon: FileText,
      badge: isAr ? 'تصدير' : 'Export',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 md:z-10 w-72 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              م
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {isAr ? 'منصة مصر الهيدرولوجية' : 'Egypt Hydro Analytics'}
              </h2>
              <p className="text-[10px] text-cyan-400 font-medium">
                {isAr ? '4 أقسام رئيسية مبسطة' : '4 Main Core Modules'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List — Exactly 4 items */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'القوائم الأربعة الأساسية' : 'Core Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-3 border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30 text-white'
                    : 'bg-slate-850/50 hover:bg-slate-800/70 border-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full border font-semibold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scientific Ownership & Branding Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{isAr ? 'الملكية والمنهجية العلمية' : 'Scientific Pedigree'}</span>
            </div>
            <p className="text-xs font-semibold text-slate-200">
              {isAr ? 'د. أمل معتوق' : 'Dr. Amal Matouk'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isAr
                ? 'تحليل إحصائي دقيق بدون كود وبطريقة L-moments و Bootstrap المعتمدة عالمياً.'
                : 'Hydrological extremes analysis without code.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
