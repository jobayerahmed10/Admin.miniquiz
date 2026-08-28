import React from 'react';
import { Database, Bell, ArrowLeft } from 'lucide-react';

interface QuestionBankHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subTitle?: string;
}

export const QuestionBankHeader: React.FC<QuestionBankHeaderProps> = ({
  showBack = false,
  onBack,
  title = 'মাস্টার প্রশ্ন ব্যাংক',
  subTitle = 'QUESTION BANK',
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

      <div className="flex items-center gap-3">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-all relative"
            title="বিজ্ঞপ্তি"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px] border border-[#0a111e] shadow-md">
              12
            </span>
          </button>
        </div>

        {/* User Avatar with Online Indicator */}
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Admin"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a111e] absolute -bottom-0.5 -right-0.5 shadow-sm" />
        </div>
      </div>
    </div>
  );
};
