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
        className={`fixed md:sticky top-0 h-screen z-50 md:z-10 w-72 bg-white border-l border-[#D7B98E]/50 flex flex-col transition-transform duration-200 ease-in-out shadow-lg ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#D7B98E]/30 flex items-center justify-between bg-[#F7F3E8]/85">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E7490] to-[#12304A] flex items-center justify-center text-white font-bold text-sm shadow-md border border-[#D7B98E]/40">
              م
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D2939] leading-tight">
                {isAr ? 'منصة مصر الهيدرولوجية' : 'Egypt Hydro Analytics'}
              </h2>
              <p className="text-[10px] text-[#0E7490] font-semibold">
                {isAr ? 'الأقسام والمحاور الرئيسية' : 'Core Analytics Modules'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-[#F4EBDD]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List — Exactly 4 items */}
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-[#F7F9FA]">
          <div className="px-2 py-1 text-[11px] font-bold text-[#667085] uppercase tracking-wider">
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
                    ? 'bg-gradient-to-r from-[#0E7490]/10 to-[#12304A]/10 border-[#0E7490] shadow-md shadow-[#0E7490]/10 text-[#1D2939]'
                    : 'bg-white hover:bg-[#F7F3E8]/50 border-slate-200 text-[#1D2939] hover:text-black'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-[#0E7490] text-white font-bold shadow-xs'
                      : 'bg-[#F7F3E8] text-[#0E7490]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-[#0E7490]' : 'text-slate-900'
                      }`}
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] line-clamp-2 leading-relaxed">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scientific Ownership & Branding Footer */}
        <div className="p-3.5 border-t border-[#D7B98E]/40 bg-[#F7F3E8]">
          <div className="bg-white border border-[#D7B98E]/60 rounded-xl p-3 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[#C8943E] text-xs font-bold">
              <Award className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{isAr ? 'الملكية والمنهجية العلمية' : 'Scientific Pedigree'}</span>
            </div>
            <p className="text-xs font-bold text-[#1D2939]">
              {isAr ? 'إعداد وتدقيق: د. أمل معتوق' : 'Dr. Amal Matouk'}
            </p>
            <p className="text-[10px] text-[#667085] leading-tight">
              {isAr
                ? 'تقرأ المطر فوق خريطة مصر، وتحول البيانات المناخية إلى معرفة وقرار.'
                : 'Transforming climate data into actionable decisions.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
