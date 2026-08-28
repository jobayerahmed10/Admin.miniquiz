import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { DuplicateCheckResult } from '../../types/questionBank';

interface DuplicateValidationCardProps {
  summary: DuplicateCheckResult;
  title?: string;
  totalQuestions: number;
}

export const DuplicateValidationCard: React.FC<DuplicateValidationCardProps> = ({
  summary,
  title = 'ডুপ্লিকেট ও মান যাচাই',
  totalQuestions,
}) => {
  return (
    <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
      <h3 className="text-sm font-black text-white flex items-center gap-2">
        <span>{title}</span>
      </h3>

      <div className="space-y-2.5 pt-1">
        {/* Duplicate Check Row */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {summary.duplicateCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">ডুপ্লিকেট প্রশ্ন</span>
          </div>
          <span
            className={`font-bold ${
              summary.duplicateCount === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.duplicateCount === 0
              ? '০ টি পাওয়া যায়নি'
              : `${summary.duplicateCount} টি পাওয়া গেছে`}
          </span>
        </div>

        {/* Exact Match */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {summary.exactMatchCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">একই প্রশ্ন (সম্পূর্ণ মিল)</span>
          </div>
          <span
            className={`font-bold ${
              summary.exactMatchCount === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.exactMatchCount === 0
              ? '০ টি পাওয়া যায়নি'
              : `${summary.exactMatchCount} টি পাওয়া গেছে`}
          </span>
        </div>

        {/* Similar / Semantic Match */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {summary.similarMatchCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">একই প্রশ্ন (আংশিক মিল)</span>
          </div>
          <span
            className={`font-bold ${
              summary.similarMatchCount === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {summary.similarMatchCount === 0
              ? '০ টি পাওয়া যায়নি'
              : `${summary.similarMatchCount} টি পাওয়া গেছে`}
          </span>
        </div>

        {/* Empty Question or Options */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {summary.emptyQuestionCount === 0 && summary.missingOptionCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">খালি প্রশ্ন / বিকল্প</span>
          </div>
          <span
            className={`font-bold ${
              summary.emptyQuestionCount === 0 && summary.missingOptionCount === 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {summary.emptyQuestionCount === 0 && summary.missingOptionCount === 0
              ? '০ টি সমস্যা নেই'
              : `${summary.emptyQuestionCount + summary.missingOptionCount} টি সমস্যা`}
          </span>
        </div>

        {/* Correct Answer Set */}
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {summary.missingAnswerCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="text-slate-300 font-medium">সঠিক উত্তর সেট</span>
          </div>
          <span
            className={`font-bold ${
              summary.missingAnswerCount === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {summary.missingAnswerCount === 0
              ? `${totalQuestions} টি ঠিক আছে`
              : `${totalQuestions - summary.missingAnswerCount} / ${totalQuestions} টি ঠিক আছে`}
          </span>
        </div>

        {/* Explanation check */}
        <div className="flex items-center justify-between text-xs py-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">ব্যাখ্যা দেওয়া হয়েছে</span>
          </div>
          <span className="font-bold text-emerald-400">
            {totalQuestions - summary.noExplanationCount} / {totalQuestions} টি সম্পন্ন
          </span>
        </div>
      </div>
    </div>
  );
};
