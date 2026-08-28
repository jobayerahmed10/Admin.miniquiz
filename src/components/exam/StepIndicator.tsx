import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateToStep,
}) => {
  const steps = [
    { number: 1 as const, title: 'পরীক্ষার তথ্য', subtitle: 'মৌলিক সেটিংস' },
    { number: 2 as const, title: 'প্রশ্ন যুক্ত করুন', subtitle: 'প্রশ্ন যোগ ও নির্বাচন' },
    { number: 3 as const, title: 'প্রিভিউ ও প্রকাশ', subtitle: 'পরীক্ষা প্রিভিউ করে প্রকাশ' },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between gap-1 sm:gap-3 max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isClickable = canNavigateToStep ? canNavigateToStep(step.number) : isCompleted;

          return (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <button
                type="button"
                disabled={!isClickable && !isActive}
                onClick={() => isClickable && onStepClick && onStepClick(step.number)}
                className={`flex items-center gap-2 sm:gap-2.5 transition-all text-left group ${
                  isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                }`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#5B36F5] text-white shadow-md shadow-indigo-500/25 ring-4 ring-indigo-500/10'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                </div>

                {/* Step Label */}
                <div className="flex flex-col">
                  <span
                    className={`text-xs sm:text-sm font-extrabold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-[#5B36F5] dark:text-indigo-400'
                        : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {/* Subtle Subtitle on larger mobile/desktop */}
                  <span className="hidden md:inline text-[10px] text-slate-400 font-medium -mt-0.5">
                    {step.subtitle}
                  </span>
                </div>
              </button>

              {/* Connecting Divider Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1 sm:mx-2 rounded-full transition-all ${
                    currentStep > idx + 1
                      ? 'bg-[#5B36F5]'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
