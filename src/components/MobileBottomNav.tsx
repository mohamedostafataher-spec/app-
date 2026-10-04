/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Mobile Bottom Navigation Bar — 4 قوائم رئيسية فقط
 */

import React from 'react';
import {
  Zap,
  Sparkles,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Language } from '../types';

interface MobileBottomNavProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  language: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  language,
}) => {
  const isAr = language === 'ar';

  const items = [
    {
      id: 'pipeline' as NavTab,
      labelAr: 'التحليل الفوري',
      labelEn: 'Pipeline',
      icon: Zap,
    },
    {
      id: 'smart_analyst' as NavTab,
      labelAr: 'المحلل بالعربي',
      labelEn: 'AI Analyst',
      icon: Sparkles,
    },
    {
      id: 'return_calculator' as NavTab,
      labelAr: 'حاسبة العودة',
      labelEn: 'Return Calc',
      icon: TrendingUp,
    },
    {
      id: 'reports' as NavTab,
      labelAr: 'التقرير',
      labelEn: 'Report',
      icon: FileText,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1.5 shadow-2xl safe-area-bottom no-print">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span className="truncate max-w-[70px]">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
