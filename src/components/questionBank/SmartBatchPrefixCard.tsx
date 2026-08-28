import React from 'react';
import { Sparkles, Info, RefreshCw } from 'lucide-react';
import { formatSequentialId } from '../../lib/questionBankEngine';

interface SmartBatchPrefixCardProps {
  prefix: string;
  nextNumber: number;
  onRefresh?: () => void;
  isAutoLabel?: boolean;
}

export const SmartBatchPrefixCard: React.FC<SmartBatchPrefixCardProps> = ({
  prefix,
  nextNumber,
  onRefresh,
  isAutoLabel = false,
}) => {
  const exampleId1 = formatSequentialId(prefix, nextNumber);
  const exampleId2 = formatSequentialId(prefix, nextNumber + 1);

  return (
    <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-lg relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-black text-white">
            {isAutoLabel
              ? 'Smart Batch Prefix (স্বয়ংক্রিয়)'
              : 'স্মার্ট ব্যাচ প্রিফিক্স (Smart Batch Prefix)'}
          </h3>
          <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-pointer" />
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        বিষয় পরিবর্তন করলে প্রিফিক্স স্বয়ংক্রিয়ভাবে পরিবর্তন হবে।
      </p>

      {/* Prefix Display Box */}
      <div className="bg-[#050914] border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 grid grid-cols-2 gap-4 items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            প্রশ্ন আইডি প্রিফিক্স
          </span>
          <span className="text-emerald-400 font-mono font-black text-base sm:text-lg tracking-wider block">
            {prefix}
          </span>
        </div>

        <div className="flex items-center justify-between border-l border-slate-800/80 pl-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              পরবর্তী নম্বর
            </span>
            <span className="text-white font-mono font-black text-base sm:text-lg tracking-wider block">
              {String(nextNumber).padStart(5, '0')}
            </span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
              title="পুনরায় নম্বর গণনা করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Example */}
      <div className="mt-2.5 text-[10px] text-slate-400 font-mono flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="text-slate-400">উদাহরণ:</span>
        <span className="text-slate-300">{exampleId1},</span>
        <span className="text-slate-300">{exampleId2} ...</span>
      </div>
    </div>
  );
};
