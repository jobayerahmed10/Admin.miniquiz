import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2;
  step1Label: string;
  step2Label: string;
  onStepClick?: (step: 1 | 2) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  step1Label,
  step2Label,
  onStepClick,
}) => {
  return (
    <div className="flex items-center justify-between max-w-md mx-auto px-4 py-3 bg-[#0a111e]/80 border border-slate-800/80 rounded-2xl shadow-md">
      {/* Step 1 */}
      <button
        onClick={() => onStepClick?.(1)}
        disabled={!onStepClick || currentStep === 1}
        className={`flex items-center gap-2.5 transition-all text-left ${
          currentStep === 1
            ? 'cursor-default'
            : onStepClick
            ? 'cursor-pointer hover:opacity-80'
            : 'cursor-default'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
            currentStep === 1
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-4 ring-emerald-500/20'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}
        >
          {currentStep === 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
        </div>
        <span
          className={`text-xs font-bold transition-all ${
            currentStep === 1 ? 'text-emerald-400 font-black' : 'text-slate-400'
          }`}
        >
          {step1Label}
        </span>
      </button>

      {/* Connecting Line */}
      <div className="flex-1 mx-4 h-0.5 bg-slate-800 relative overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-300 ${
            currentStep === 2 ? 'w-full bg-emerald-500' : 'w-0 bg-transparent'
          }`}
        />
      </div>

      {/* Step 2 */}
      <button
        onClick={() => onStepClick?.(2)}
        disabled={!onStepClick || currentStep === 2}
        className={`flex items-center gap-2.5 transition-all text-left ${
          currentStep === 2
            ? 'cursor-default'
            : onStepClick
            ? 'cursor-pointer hover:opacity-80'
            : 'cursor-default'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
            currentStep === 2
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-4 ring-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          2
        </div>
        <span
          className={`text-xs font-bold transition-all ${
            currentStep === 2 ? 'text-emerald-400 font-black' : 'text-slate-400'
          }`}
        >
          {step2Label}
        </span>
      </button>
    </div>
  );
};
