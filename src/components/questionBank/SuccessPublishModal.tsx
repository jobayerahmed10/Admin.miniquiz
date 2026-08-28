import React from 'react';
import { CheckCircle2, ArrowRight, Database, Sparkles } from 'lucide-react';

interface SuccessPublishModalProps {
  isOpen: boolean;
  count: number;
  subject: string;
  onGoToBank: () => void;
  onAddNew: () => void;
}

export const SuccessPublishModal: React.FC<SuccessPublishModalProps> = ({
  isOpen,
  count,
  subject,
  onGoToBank,
  onAddNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border border-emerald-500/40 w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/10 space-y-5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-500/10">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white">অভিনন্দন! সফলভাবে প্রকাশিত</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            <span className="text-emerald-400 font-bold">{count} টি প্রশ্ন</span> বিষয়{' '}
            <span className="text-white font-bold">{subject}</span>-এর অধীনে সরাসরি মাস্টার
            প্রশ্ন ব্যাংকে যুক্ত হয়েছে।
          </p>
        </div>

        <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center justify-between">
          <span>স্থিতি:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            ✓ প্রকাশিত (Live)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onGoToBank}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
          >
            <Database className="w-4 h-4" />
            <span>মাস্টার প্রশ্ন ব্যাংক দেখুন</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onAddNew}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>আরও প্রশ্ন যুক্ত করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
