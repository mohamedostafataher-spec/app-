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
    <header className="bg-white/95 backdrop-blur border-b border-[#D7B98E]/40 sticky top-0 z-40 px-3 sm:px-6 py-2.5 space-y-2 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E7490] via-[#12304A] to-[#168A8A] flex items-center justify-center shadow-lg shadow-[#0E7490]/30 text-white flex-shrink-0 border border-[#D7B98E]/30">
            <CloudRain className="w-5 h-5 text-[#D7B98E]" />
          </div>

          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-wide leading-tight truncate">
              {isAr
                ? 'منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية'
                : 'Egypt Rainfall Extremes Platform'}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#C8943E] font-semibold">
              <Award className="w-3 h-3 text-[#C8943E] flex-shrink-0" />
              <span>
                {isAr
                  ? 'إعداد وتدقيق: د. أمل معتوق'
                  : 'Scientific Lead: Dr. Amal Matouk'}
              </span>
            </div>
          </div>
        </div>

        {/* Station Selector & Language Switcher */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Station dropdown */}
          <div className="flex items-center gap-1 bg-[#F7F3E8] border border-[#D7B98E] rounded-lg px-2.5 py-1 text-xs shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#0E7490] flex-shrink-0" />
            <select
              value={selectedStation.station_id}
              onChange={(e) => {
                const found = stations.find((s) => s.station_id === e.target.value);
                if (found) setSelectedStation(found);
              }}
              className="bg-transparent text-[#1D2939] focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate text-xs font-semibold"
            >
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id} className="bg-white text-[#1D2939]">
                  {s.station_name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F7F3E8] hover:bg-[#F4EBDD] text-[#1D2939] border border-[#D7B98E] transition-colors cursor-pointer shadow-xs"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3 h-3 text-[#0E7490]" />
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
