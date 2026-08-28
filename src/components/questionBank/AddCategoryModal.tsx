import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subject' | 'topic' | 'post';
  onAdd: (value: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  type,
  onAdd,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeLabels = {
    subject: {
      title: 'নতুন বিষয় যুক্ত করুন',
      placeholder: 'যেমন: ভূগোল ও পরিবেশ, অর্থনীতি...',
      helper: 'নতুন যুক্ত করা বিষয় স্বয়ংক্রিয়ভাবে ড্রপডাউনে পাওয়া যাবে।',
    },
    topic: {
      title: 'নতুন টপিক যুক্ত করুন',
      placeholder: 'যেমন: মুক্তিযুদ্ধ ও বঙ্গবন্ধু, ব্যাকরণ...',
      helper: 'বিষয়টির অধীনে টপিক যুক্ত হবে।',
    },
    post: {
      title: 'নতুন পদ / পরীক্ষা যুক্ত করুন',
      placeholder: 'যেমন: সহকারী জজ, ফুড এসআই...',
      helper: 'পদ বা পরীক্ষার নাম ড্রপডাউনে যুক্ত হবে।',
    },
  };

  const currentMeta = typeLabels[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('অনুগ্রহ করে একটি নাম লিখুন');
      return;
    }
    onAdd(trimmed);
    setInputValue('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">{currentMeta.title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              নাম লিখুন *
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder={currentMeta.placeholder}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
            <p className="text-[11px] text-slate-500 mt-1">{currentMeta.helper}</p>
          </div>

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
