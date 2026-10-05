import React from 'react';
import { theme } from '../../lib/theme';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const AnalysisStepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between w-full p-4 bg-white border-b border-amber-100 no-print">
      {steps.map((step, index) => (
        <div key={step} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
            index <= currentStep ? `${theme.nileBlue} text-white` : 'bg-slate-200 text-slate-500'
          }`}>
            {index + 1}
          </div>
          <span className={`mr-2 text-[10px] font-bold ${index <= currentStep ? theme.text.accent : 'text-slate-400'}`}>
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? theme.nileBlue : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};
