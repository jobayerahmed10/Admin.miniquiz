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
} from 'lucide-react';
import { Exam, ExamStatus } from '../../types';

interface ExamStepWizardHeaderProps {
  currentStep: 'add' | 'preview';
  onStepChange: (step: 'add' | 'preview') => void;
  exam: Exam;
  attachedCount: number;
  targetCount: number;
  currentExamStatus: ExamStatus;
  onTogglePublish: () => void;
  togglingStatus: boolean;
}

export const ExamStepWizardHeader: React.FC<ExamStepWizardHeaderProps> = ({
  currentStep,
  onStepChange,
  exam,
  attachedCount,
  targetCount,
  currentExamStatus,
  onTogglePublish,
  togglingStatus,
}) => {
  const percentComplete = targetCount > 0 ? Math.min(Math.round((attachedCount / targetCount) * 100), 100) : 100;

  return (
    <div className="space-y-4">
      {/* Top Banner with Exam Info & Publish Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-slate-700/60">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" />
              {exam.badge || 'মডেল টেস্ট'}
            </span>
            <span className="text-xs text-slate-300 font-bold">
              বিষয়: <strong className="text-white">{exam.subject}</strong>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700">
              সময়: {exam.time_minutes || 15} মিনিট
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700">
              নেগেটিভ মার্ক: {exam.negative_marks || 0.25}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            {exam.title}
          </h2>
        </div>

        {/* Live Status Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={togglingStatus}
            onClick={onTogglePublish}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg ${
              currentExamStatus === 'active'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/30'
                : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white animate-pulse'
            }`}
          >
            {currentExamStatus === 'active' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>✓ লাইভ পাবলিশড (অনলাইন)</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-amber-200" />
                <span>🚀 এখনই লাইভ পাবলিশ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP PROGRESS NAVIGATION BAR */}
      <div className="bg-slate-50 dark:bg-slate-800/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Step Tabs */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          {/* Step 1 Tab Button */}
          <button
            type="button"
            onClick={() => onStepChange('add')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center sm:justify-start gap-2 transition-all ${
              currentStep === 'add'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              ১
            </span>
            <span>প্রশ্ন নির্বাচন ও সংযোজন</span>
          </button>

          {/* Step 2 Tab Button (Preview) */}
          <button
            type="button"
            onClick={() => onStepChange('preview')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center sm:justify-start gap-2 transition-all ${
              currentStep === 'preview'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'preview' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              ২
            </span>
            <span className="flex items-center gap-1">
              লাইভ প্রিভিউ ও সম্পাদনা
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                {attachedCount}
              </span>
            </span>
          </button>
        </div>

        {/* Target Progress & Next Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-right">
            <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>সংযুক্ত:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-xs">
                {attachedCount} টি
              </strong>
              {targetCount > 0 && (
                <span className="text-slate-400 text-[10px]">
                  / লক্ষ্য {targetCount} টি ({percentComplete}%)
                </span>
              )}
            </div>
            {targetCount > 0 && (
              <div className="w-28 sm:w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            )}
          </div>

          {/* NEXT / PREV BUTTON */}
          {currentStep === 'add' ? (
            <button
              type="button"
              onClick={() => onStepChange('preview')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all group"
            >
              <span>পরবর্তী: লাইভ প্রিভিউ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange('add')}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>+ আরও প্রশ্ন যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
