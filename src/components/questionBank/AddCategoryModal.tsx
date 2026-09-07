import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Hash } from 'lucide-react';
import { normalizeCodeString } from '../../lib/subjectTopicManager';

export interface AddCategoryPayload {
  name: string;
  code?: string;
  parentId?: string | null;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subject' | 'topic' | 'subtopic' | 'post';
  parentContext?: {
    subjectName?: string;
    subjectCode?: string;
    parentTopicName?: string;
    parentTopicCode?: string;
    suggestedCode?: string;
  };
  onAdd: (value: string | AddCategoryPayload) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  type,
  parentContext,
  onAdd,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setCodeValue(parentContext?.suggestedCode || '');
      setError(null);
    }
  }, [isOpen, parentContext]);

  if (!isOpen) return null;

  const typeLabels = {
    subject: {
      title: 'নতুন বিষয় (Subject) যুক্ত করুন',
      nameLabel: 'বিষয়ের নাম *',
      placeholder: 'যেমন: ভূগোল ও দুর্যোগ ব্যবস্থাপনা, অর্থনীতি...',
      codeLabel: 'বিষয় কোড (Subject Code) *',
      codePlaceholder: 'যেমন: GEO, ECON, LAW...',
      helper: 'বিষয় কোডটি স্বয়ংক্রিয়ভাবে প্রশ্নের আইডি প্রিফিক্সে ব্যবহৃত হবে।',
    },
    topic: {
      title: 'নতুন মূল টপিক (Main Topic) যুক্ত করুন',
      nameLabel: 'টপিকের শিরোনাম *',
      placeholder: 'যেমন: বৈশ্বিক ইতিহাস ও সভ্যতা, ব্যাকরণ...',
      codeLabel: 'টপিক কোড (Topic Code) *',
      codePlaceholder: 'যেমন: GK-INT-01, BANGLA-01...',
      helper: `${parentContext?.subjectName ? `[${parentContext.subjectName}] বিষয়ের অধীনে মূল টপিক যুক্ত হবে।` : 'মূল টপিক যুক্ত হবে।'}`,
    },
    subtopic: {
      title: 'নতুন সাব-টপিক (Sub-Topic) যুক্ত করুন',
      nameLabel: 'সাব-টপিকের নাম *',
      placeholder: 'যেমন: প্রথম ও দ্বিতীয় বিশ্বযুদ্ধ, সন্ধি...',
      codeLabel: 'সাব-টপিক কোড (Sub-Topic Code) *',
      codePlaceholder: 'যেমন: GK-INT-01-01, BANGLA-01-01...',
      helper: `${parentContext?.parentTopicName ? `[${parentContext.parentTopicName}] টপিকের অধীনে সাব-টপিক যুক্ত হবে।` : 'সাব-টপিক যুক্ত হবে।'}`,
    },
    post: {
      title: 'নতুন পদ / পরীক্ষা যুক্ত করুন',
      nameLabel: 'পদ বা পরীক্ষার নাম *',
      placeholder: 'যেমন: সহকারী জজ, ফুড এসআই...',
      codeLabel: '',
      codePlaceholder: '',
      helper: 'পদ বা পরীক্ষার নাম ড্রপডাউনে যুক্ত হবে।',
    },
  };

  const currentMeta = typeLabels[type] || typeLabels.topic;
  const requiresCode = type === 'subject' || type === 'topic' || type === 'subtopic';

  const handleNameChange = (val: string) => {
    setInputValue(val);
    if (error) setError(null);

    // If user hasn't typed custom code or code is blank/default, auto-suggest based on type
    if (type === 'subject' && (!codeValue || codeValue === parentContext?.suggestedCode)) {
      const ascii = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (ascii.length >= 2) {
        setCodeValue(ascii.substring(0, 8));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('অনুগ্রহ করে একটি নাম লিখুন');
      return;
    }

    if (requiresCode) {
      const trimmedCode = normalizeCodeString(codeValue || parentContext?.suggestedCode || '');
      if (!trimmedCode) {
        setError('অনুগ্রহ করে একটি কোড লিখুন (যেমন: GK-INT, GK-INT-01)');
        return;
      }
      onAdd({
        name: trimmed,
        code: trimmedCode,
      });
    } else {
      onAdd(trimmed);
    }

    setInputValue('');
    setCodeValue('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-black text-white">{currentMeta.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parent Context Banner */}
        {parentContext?.subjectName && (type === 'topic' || type === 'subtopic') && (
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>মূল বিষয়:</span>
              <span className="font-bold text-emerald-400">
                {parentContext.subjectName} ({parentContext.subjectCode || 'N/A'})
              </span>
            </div>
            {parentContext.parentTopicName && type === 'subtopic' && (
              <div className="flex items-center justify-between text-slate-400">
                <span>মূল টপিক:</span>
                <span className="font-bold text-cyan-400">
                  {parentContext.parentTopicName} ({parentContext.parentTopicCode || 'N/A'})
                </span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {currentMeta.nameLabel}
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={currentMeta.placeholder}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Code Input for Subject / Topic / Subtopic */}
          {requiresCode && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {currentMeta.codeLabel}
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  স্মার্ট ব্যাচ প্রিফিক্সে ব্যবহৃত হবে
                </span>
              </div>
              <div className="relative flex items-center">
                <Hash className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={codeValue}
                  onChange={(e) => {
                    setCodeValue(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder={currentMeta.codePlaceholder}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-emerald-400 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                />
              </div>
              {codeValue && (
                <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span>প্রশ্ন প্রিফিক্স প্রিভিউ:</span>
                  <span className="font-mono font-black text-emerald-400">
                    Q-{normalizeCodeString(codeValue)}-
                  </span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
          <p className="text-[11px] text-slate-500">{currentMeta.helper}</p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>যুক্ত করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
