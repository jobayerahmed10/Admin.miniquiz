import React from 'react';
import { Database, ArrowLeft } from 'lucide-react';

interface QuestionBankHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subTitle?: string;
  rightContent?: React.ReactNode;
}

export const QuestionBankHeader: React.FC<QuestionBankHeaderProps> = ({
  showBack = false,
  onBack,
  title = 'মাস্টার প্রশ্ন ব্যাংক',
  subTitle = 'QUESTION BANK',
  rightContent,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#0a111e]/90 dark:bg-[#0a111e]/90 backdrop-blur-md border border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-xl">
      <div className="flex items-center gap-3.5">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
            title="পিছনে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
            <Database className="w-6 h-6" />
          </div>
        )}

        {showBack && onBack && (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0 hidden sm:flex">
            <Database className="w-5 h-5" />
          </div>
        )}

        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase">
            {subTitle}
          </p>
        </div>
      </div>

      {rightContent && (
        <div className="flex items-center gap-3">
          {rightContent}
        </div>
      )}
    </div>
  );
};

