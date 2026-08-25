import React, { useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Tag, Plus, X, Check, Briefcase } from 'lucide-react';
import { BASE_POSTS, getAllPosts, parsePosts, addCustomPost } from '../lib/postManager';

interface MultiPostSelectorProps {
  selectedPosts: string[];
  onChange: (posts: string[]) => void;
  label?: string;
  placeholder?: string;
  availablePosts?: string[];
  compact?: boolean;
  className?: string;
}

export const MultiPostSelector: React.FC<MultiPostSelectorProps> = ({
  selectedPosts,
  onChange,
  label = 'পদ / পদের নাম (Post / Designation)',
  placeholder = 'কমা (,) দিয়ে একাধিক পদ লিখুন...',
  availablePosts = [],
  compact = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [allPostsList, setAllPostsList] = useState<string[]>(() =>
    getAllPosts(availablePosts)
  );

  useEffect(() => {
    setAllPostsList(getAllPosts(availablePosts));
  }, [availablePosts]);

  // Add one or multiple posts (handles comma-separated input)
  const handleAddPosts = (rawInput: string) => {
    const parsed = parsePosts(rawInput);
    if (parsed.length === 0) return;

    // Register any new custom posts
    parsed.forEach((p) => {
      addCustomPost(p);
    });

    const updated = Array.from(new Set([...selectedPosts, ...parsed]));
    onChange(updated);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPosts(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedPosts.length > 0) {
      // Remove last tag on backspace if input is empty
      handleRemovePost(selectedPosts[selectedPosts.length - 1]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes(',') || pastedText.includes('،') || pastedText.includes('\n')) {
      e.preventDefault();
      handleAddPosts(pastedText);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      handleAddPosts(inputValue);
    }
  };

  const handleTogglePost = (post: string) => {
    const trimmed = post.trim();
    if (!trimmed) return;

    if (selectedPosts.includes(trimmed)) {
      onChange(selectedPosts.filter((p) => p !== trimmed));
    } else {
      onChange([...selectedPosts, trimmed]);
    }
  };

  const handleRemovePost = (postToRemove: string) => {
    onChange(selectedPosts.filter((p) => p !== postToRemove));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Selected Count */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{label}</span>
          {selectedPosts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[10px]">
              {selectedPosts.length} টি নির্বাচিত
            </span>
          )}
        </label>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          কমা (,) দিয়ে আলাদা করুন
        </span>
      </div>

      {/* Input box with Embedded Tags */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500 transition-all">
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedPosts.map((post) => (
            <span
              key={post}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold animate-fadeIn"
            >
              <span>{post}</span>
              <button
                type="button"
                onClick={() => handleRemovePost(post)}
                className="p-0.5 text-amber-700 dark:text-amber-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-amber-500/20 transition-colors"
                title="মুছে ফেলুন"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={selectedPosts.length === 0 ? placeholder : 'আরও পদ যুক্ত করুন...'}
            className="flex-1 min-w-[140px] bg-transparent border-none px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
          />

          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => handleAddPosts(inputValue)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3 h-3" />
              যোগ করুন
            </button>
          )}
        </div>
      </div>

      {/* Predefined Quick-Select Post Chips */}
      {!compact && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              দ্রুত সিলেক্ট করুন (ক্লিক করে নির্বাচন/বাতিল করুন):
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {allPostsList.map((p) => {
              const isSelected = selectedPosts.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleTogglePost(p)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/5'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{p}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
