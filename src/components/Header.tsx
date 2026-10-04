/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Main Header Component — 4 Core Navigation Tabs
 */

import React from 'react';
import {
  CloudRain,
  Award,
  Globe,
  Database,
  Menu,
  Zap,
  Sparkles,
  TrendingUp,
  FileText,
  MapPin,
} from 'lucide-react';
import { Language, StationMetadata } from '../types';
import { NavTab } from './Sidebar';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  stations: StationMetadata[];
  selectedStation: StationMetadata;
  setSelectedStation: (stn: StationMetadata) => void;
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  stations,
  selectedStation,
  setSelectedStation,
  currentTab,
  setCurrentTab,
  onToggleSidebar,
}) => {
  const isAr = language === 'ar';

  const fourTabs = [
    {
      id: 'pipeline' as NavTab,
      labelAr: 'التحليل الفوري (10 خطوات)',
      labelEn: 'Direct Analysis (10 Steps)',
      icon: Zap,
    },
    {
      id: 'smart_analyst' as NavTab,
      labelAr: 'المحلل باللغة العربية',
      labelEn: 'Smart Hydro Analyst',
      icon: Sparkles,
    },
    {
      id: 'return_calculator' as NavTab,
      labelAr: 'حاسبة ومنحنيات العودة',
      labelEn: 'Return Levels & Risk',
      icon: TrendingUp,
    },
    {
      id: 'reports' as NavTab,
      labelAr: 'التقرير العلمي والمشاريع',
      labelEn: 'Report & Export',
      icon: FileText,
    },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-2.5 space-y-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white flex-shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-wide leading-tight truncate">
              {isAr
                ? 'منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'
                : 'Egypt Rainfall Extremes & Storm Analytics'}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-400 font-medium">
              <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>
                {isAr
                  ? 'إعداد وملكية علمية: د. أمل معتوق'
                  : 'Scientific Lead: Dr. Amal Matouk'}
              </span>
            </div>
          </div>
        </div>

        {/* Station Selector & Language Switcher */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Station dropdown */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              value={selectedStation.station_id}
              onChange={(e) => {
                const found = stations.find((s) => s.station_id === e.target.value);
                if (found) setSelectedStation(found);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate text-xs font-semibold"
            >
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id} className="bg-slate-900 text-slate-100">
                  {s.station_name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{isAr ? 'En' : 'عربي'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Tabs Horizontal Bar (Visible on Desktop & Tablet) */}
      <div className="max-w-7xl mx-auto flex items-center justify-between border-t border-slate-800/80 pt-2 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {fourTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center text-[11px] text-slate-500 font-mono">
          {isAr ? 'حساب هيدرولوجي فوري بالمتصفح' : 'Instant In-Browser Hydro Engine'}
        </div>
      </div>
    </header>
  );
};
