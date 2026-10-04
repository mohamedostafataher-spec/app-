/**
 * منصة تحليل الأمطار القصوى
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Main Application Component
 */

import React from 'react';
import { ExtremeRainfallPlatformView } from './components/views/ExtremeRainfallPlatformView';

export const App: React.FC = () => {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 p-2 sm:p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        <ExtremeRainfallPlatformView />
      </div>
    </div>
  );
};

export default App;
