import React from 'react';
import {
  Sparkles,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Award,
  Layers,
  Clock,
  HelpCircle,
  FileText,
  PlusCircle,
  Calendar,
  Save
} from 'lucide-react';
import { Exam, ExamStatus } from '../../types';

interface ExamStepWizardHeaderProps {
  currentStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
  exam: Exam;
  attachedCount: number;
  targetCount: number;
  currentExamStatus: ExamStatus;
  onChangeStatus: (status: ExamStatus) => void;
  togglingStatus: boolean;
}

export const ExamStepWizardHeader: React.FC<ExamStepWizardHeaderProps> = ({
  currentStep,
  onStepChange,
  exam,
  attachedCount,
  targetCount,
  currentExamStatus,
  onChangeStatus,
  togglingStatus,
}) => {
  return (
    <div className="space-y-3">
      {/* 2-STEPPER WIZARD HEADER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 bg-slate-900/90 dark:bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
        {/* Step 1 Tab */}
        <button
          type="button"
          onClick={() => onStepChange(1)}
          className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between transition-all ${
            currentStep === 1
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              currentStep === 1 ? 'bg-white text-emerald-700' : 'bg-slate-700 text-slate-300'
            }`}>
              ১
            </span>
            <span className="truncate">১. পরীক্ষার তথ্য ও প্রশ্ন নির্বাচন</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            currentStep === 1 ? 'bg-emerald-700/80 text-white' : 'bg-slate-700 text-emerald-400'
          }`}>
            {attachedCount}টি
          </span>
        </button>

        {/* Step 2 Tab */}
        <button
          type="button"
          onClick={() => onStepChange(2)}
          className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between transition-all ${
            currentStep === 2
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              currentStep === 2 ? 'bg-white text-emerald-700' : 'bg-slate-700 text-slate-300'
            }`}>
              ২
            </span>
            <span className="truncate">২. প্রিভিউ, এডিট ও প্রকাশ</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            currentStep === 2 ? 'bg-emerald-700/80 text-white' : 'bg-slate-700 text-amber-300'
          }`}>
            যাচাই
          </span>
        </button>
      </div>
    </div>
  );
};
