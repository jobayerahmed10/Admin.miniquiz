import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  RefreshCw,
  Edit3,
  Check,
  Database,
  Layers,
  HelpCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { formatSequentialId } from '../../lib/questionBankEngine';
import { PrefixLookupResult } from '../../lib/subjectPrefixManager';

interface SmartBatchPrefixCardProps {
  prefix: string;
  nextNumber: number;
  lookupInfo?: PrefixLookupResult;
  onPrefixChange?: (newPrefix: string) => void;
  onNextNumberChange?: (newNumber: number) => void;
  onRefresh?: () => void;
  isAutoLabel?: boolean;
  subjectName?: string;
}

export const SmartBatchPrefixCard: React.FC<SmartBatchPrefixCardProps> = ({
  prefix,
  nextNumber,
  lookupInfo,
  onPrefixChange,
  onNextNumberChange,
  onRefresh,
  isAutoLabel = false,
  subjectName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  const isExisting = lookupInfo?.isExisting ?? (lookupInfo?.source === 'database' || lookupInfo?.source === 'saved_map');
  const source = lookupInfo?.source || (isExisting ? 'database' : 'proposed');

  const exampleId1 = formatSequentialId(prefix, nextNumber);
  const exampleId2 = formatSequentialId(prefix, nextNumber + 1);

  const handlePrefixInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (onPrefixChange) {
      onPrefixChange(val);
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed >= 1 && onNextNumberChange) {
      onNextNumberChange(parsed);
    }
  };

  return (
    <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-black text-white">
            {isAutoLabel
              ? 'Smart Batch Prefix (স্বয়ংক্রিয় ম্যাপিং)'
              : 'স্মার্ট ব্যাচ প্রিফিক্স (Smart Batch Prefix)'}
          </h3>
          <button
            type="button"
            onClick={() => setShowHelpTooltip(!showHelpTooltip)}
            className="text-slate-400 hover:text-emerald-400 transition-colors"
            title="সহায়িকা দেখুন"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Source & Status Badge */}
        <div className="flex items-center gap-2">
          {source === 'database' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Database className="w-3 h-3" />
              <span>ডাটাবেজ ম্যাচ (পূর্বে ব্যবহৃত)</span>
            </span>
          ) : source === 'saved_map' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">
              <Layers className="w-3 h-3" />
              <span>সংরক্ষিত প্রেফিক্স ম্যাপিং</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>নতুন বিষয় (প্রস্তাবিত - এডিটযোগ্য)</span>
            </span>
          )}

          {/* Edit/Customize Toggle Button */}
          {onPrefixChange && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all ${
                isEditing
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
              title={isEditing ? 'এডিট সম্পন্ন' : 'প্রেফিক্স ও নম্বর কাস্টমাইজ করুন'}
            >
              {isEditing ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>সম্পন্ন</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  <span>কাস্টমাইজ</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info Notice or Help Tooltip */}
      {showHelpTooltip ? (
        <div className="mb-3.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 space-y-1 animate-in fade-in duration-150">
          <p className="font-bold text-white flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            ডায়নামিক প্রিফিক্স ও সিকুয়েন্সিং পলিসি:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
            <li>
              <strong>পূর্বের বিষয়:</strong> ডাটাবেজে আগে সেভ করা প্রশ্ন থাকলে সিস্টেম স্বয়ংক্রিয়ভাবে আগের প্রিফিক্স ও সর্বশেষ নম্বরের পরের সিকুয়েন্স লোড করবে।
            </li>
            <li>
              <strong>নতুন বিষয়:</strong> বিষয়ের নামের সাথে মিলিয়ে একটি প্রিফিক্স প্রস্তাব করবে এবং নম্বর 0001 সেট করবে।
            </li>
            <li>
              <strong>কাস্টম ওভাররাইড:</strong> আপনি চাইলে 'কাস্টমাইজ' বাটনে ক্লিক করে প্রিফিক্স ও স্টার্টিং নম্বর পরিবর্তন করতে পারবেন। প্রথমবার সেভ হলেই এটি স্থায়ী হয়ে যাবে।
            </li>
          </ul>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 mb-3">
          {source === 'database'
            ? `ডাটাবেজ থেকে "${subjectName || 'বর্তমান বিষয়'}'-এর জন্য সংরক্ষিত প্রিফিক্স ও পরবর্তী সিকুয়েন্স নম্বর স্বয়ংক্রিয়ভাবে নির্ধারণ করা হয়েছে।`
            : `নতুন বিষয়ের জন্য সিস্টেম প্রস্তাবিত প্রিফিক্স। প্রয়োজনে 'কাস্টমাইজ' বাটনে ক্লিক করে পরিবর্তন করতে পারেন।`}
        </p>
      )}

      {/* Prefix Display / Edit Box */}
      <div className="bg-[#050914] border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Left: Prefix Input / Display */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              প্রশ্ন আইডি প্রিফিক্স
            </span>
            {isEditing ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Unlock className="w-2.5 h-2.5" /> এডিটেবল
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> লকড
              </span>
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={prefix}
              onChange={handlePrefixInput}
              placeholder="e.g. Q-BANGLA-, Q-INT-"
              className="w-full bg-[#0a111e] border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-3 py-1.5 text-emerald-400 font-mono font-black text-base sm:text-lg tracking-wider focus:outline-none"
            />
          ) : (
            <span className="text-emerald-400 font-mono font-black text-base sm:text-lg tracking-wider block py-0.5">
              {prefix}
            </span>
          )}
        </div>

        {/* Right: Next Sequence Number */}
        <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
          <div className="flex-1 mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              পরবর্তী নম্বর (Sequence)
            </span>
            {isEditing ? (
              <input
                type="number"
                min={1}
                value={nextNumber}
                onChange={handleNumberInput}
                className="w-full bg-[#0a111e] border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-3 py-1.5 text-white font-mono font-black text-base sm:text-lg tracking-wider focus:outline-none"
              />
            ) : (
              <span className="text-white font-mono font-black text-base sm:text-lg tracking-wider block py-0.5">
                {String(nextNumber).padStart(5, '0')}
              </span>
            )}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
              title="ডাটাবেজ থেকে পুনরায় নম্বর ও প্রেফিক্স গণনা করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Live Preview Example */}
      <div className="mt-2.5 text-[10px] text-slate-400 font-mono flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="text-slate-400 font-bold">লাইভ আইডি প্রিভিউ:</span>
        <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          {exampleId1}
        </span>
        <span className="text-slate-500">,</span>
        <span className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
          {exampleId2}
        </span>
        <span className="text-slate-500">...</span>
      </div>
    </div>
  );
};
