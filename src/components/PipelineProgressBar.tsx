/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * 10-Step Sequential Hydrological Pipeline Bar
 */

import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Zap,
  Flame,
  CalendarDays,
  Activity,
  Layers,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Language } from '../types';

interface PipelineProgressBarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  language: Language;
}

export const PipelineProgressBar: React.FC<PipelineProgressBarProps> = ({
  currentTab,
  setCurrentTab,
  language,
}) => {
  const isAr = language === 'ar';

  const pipelineSteps: Array<{
    id: NavTab;
    num: number;
    titleAr: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'quality', num: 1, titleAr: 'جودة البيانات', titleEn: 'Data Quality', icon: CheckCircle2 },
    { id: 'homogeneity', num: 2, titleAr: 'التجانس والاتجاه', titleEn: 'Homogeneity', icon: TrendingUp },
    { id: 'characterization', num: 3, titleAr: 'التوصيف المطري', titleEn: 'Climatology', icon: BarChart3 },
    { id: 'extreme_indices', num: 4, titleAr: 'Rx1/Rx3/Rx5', titleEn: 'Rx Indices', icon: Zap },
    { id: 'storm_events', num: 5, titleAr: 'عاصفة دانيال', titleEn: 'Storm Daniel', icon: Flame },
    { id: 'ams', num: 6, titleAr: 'سلسلة AMS', titleEn: 'AMS Series', icon: CalendarDays },
    { id: 'gev_gumbel', num: 7, titleAr: 'GEV وGumbel', titleEn: 'GEV / Gumbel', icon: Activity },
    { id: 'goodness_of_fit', num: 8, titleAr: 'اختبارات الملاءمة', titleEn: 'Goodness of Fit', icon: Layers },
    { id: 'return_levels', num: 9, titleAr: 'مستويات الرجوع', titleEn: 'Return Levels', icon: Clock },
    { id: 'confidence_intervals', num: 10, titleAr: 'فترات الثقة', titleEn: 'Confidence Int.', icon: HelpCircle },
  ];

  const currentStepIdx = pipelineSteps.findIndex((s) => s.id === currentTab);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 overflow-x-auto no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-[780px]">
        {/* Pipeline Title */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-bold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{isAr ? 'مسار التحليل المتسلسل (10 خطوات):' : 'Analysis Pipeline:'}</span>
        </div>

        {/* Steps List */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentTab === step.id;
            const isPassed = currentStepIdx > idx;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentTab(step.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950 scale-105'
                      : isPassed
                      ? 'bg-slate-800/90 text-emerald-400 hover:bg-slate-750'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${step.num}. ${isAr ? step.titleAr : step.titleEn}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? 'bg-white text-cyan-900 font-extrabold'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-750 text-slate-400'
                    }`}
                  >
                    {step.num}
                  </span>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap hidden lg:inline">{isAr ? step.titleAr : step.titleEn}</span>
                </button>

                {idx < pipelineSteps.length - 1 && (
                  <span className="text-slate-700 text-xs px-0.5 select-none">
                    {isAr ? '←' : '→'}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick Prev / Next Step Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            disabled={currentStepIdx <= 0}
            onClick={() => {
              if (currentStepIdx > 0) setCurrentTab(pipelineSteps[currentStepIdx - 1].id);
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              currentStepIdx <= 0
                ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isAr ? 'الخطوة السابقة' : 'Previous Step'}
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            disabled={currentStepIdx < 0 || currentStepIdx >= pipelineSteps.length - 1}
            onClick={() => {
              if (currentStepIdx >= 0 && currentStepIdx < pipelineSteps.length - 1) {
                setCurrentTab(pipelineSteps[currentStepIdx + 1].id);
              } else if (currentStepIdx < 0) {
                setCurrentTab('quality');
              }
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              currentStepIdx >= pipelineSteps.length - 1
                ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                : 'border-cyan-600 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600 hover:text-white'
            }`}
            title={isAr ? 'الخطوة التالية' : 'Next Step'}
          >
            {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
