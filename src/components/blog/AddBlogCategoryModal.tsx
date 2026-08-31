import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Sparkles, Check, AlertCircle, Layers, ChevronRight, BookOpen, Bookmark } from 'lucide-react';
import { createBlogCategory, generateBlogSlug } from '../../lib/supabase';
import { BlogCategory } from '../../types';

interface AddBlogCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: BlogCategory, level: 'main' | 'sub' | 'topic') => void;
  categories: BlogCategory[];
  initialLevel?: 'main' | 'sub' | 'topic';
  initialParentId?: string;
}

export const AddBlogCategoryModal: React.FC<AddBlogCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  categories,
  initialLevel = 'main',
  initialParentId,
}) => {
  const [level, setLevel] = useState<'main' | 'sub' | 'topic'>(initialLevel);
  const [parentId, setParentId] = useState<string>(initialParentId || '');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened with different props
  useEffect(() => {
    if (isOpen) {
      setLevel(initialLevel);
      setParentId(initialParentId || '');
      setName('');
      setSlug('');
      setDescription('');
      setIsCustomSlug(false);
      setError(null);
    }
  }, [isOpen, initialLevel, initialParentId]);

  if (!isOpen) return null;

  // Filter main categories
  const mainCategories = categories.filter((c) => c.level === 'main' || !c.parent_id);

  // Filter sub-categories (Level 2)
  const subCategories = categories.filter((c) => c.level === 'sub' || (c.parent_id && !categories.some(other => other.parent_id === c.id && other.level === 'sub')));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isCustomSlug) {
      setSlug(generateBlogSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustomSlug(true);
    setSlug(e.target.value);
  };

  const handleLevelTabChange = (newLevel: 'main' | 'sub' | 'topic') => {
    setLevel(newLevel);
    setError(null);
    if (newLevel === 'main') {
      setParentId('');
    } else if (newLevel === 'sub') {
      if (!parentId || !mainCategories.some(m => m.id === parentId)) {
        setParentId(mainCategories[0]?.id || '');
      }
    } else if (newLevel === 'topic') {
      if (!parentId || !subCategories.some(s => s.id === parentId)) {
        setParentId(subCategories[0]?.id || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('নাম দেওয়া আবশ্যক');
      return;
    }

    if (level === 'sub' && !parentId) {
      setError('অনুগ্রহ করে প্যারেন্ট মূল ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (level === 'topic' && !parentId) {
      setError('অনুগ্রহ করে প্যারেন্ট সাব-ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { category, error: createError } = await createBlogCategory(
        trimmedName,
        description.trim(),
        slug.trim(),
        parentId || null,
        level
      );

      if (createError) {
        setError(createError);
        setLoading(false);
        return;
      }

      if (category) {
        onCategoryCreated(category, level);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              {level === 'main' && <Layers className="w-5 h-5" />}
              {level === 'sub' && <FolderPlus className="w-5 h-5" />}
              {level === 'topic' && <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {level === 'main' && '১. নতুন মূল ক্যাটাগরি (Main Category)'}
                {level === 'sub' && '২. নতুন সাব-ক্যাটাগরি (Sub-Category)'}
                {level === 'topic' && '৩. নতুন বিষয় / টপিক (Subject / Topic)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ৩-স্তরের নেস্টেড ক্যাটাগরি স্ট্রাকচার
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Switcher Tabs */}
        <div className="p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleLevelTabChange('main')}
            className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              level === 'main'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>১. মূল ক্যাটাগরি</span>
          </button>

          <button
            type="button"
            onClick={() => handleLevelTabChange('sub')}
            className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              level === 'sub'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 shrink-0" />
            <span>২. সাব-ক্যাটাগরি</span>
          </button>

          <button
            type="button"
            onClick={() => handleLevelTabChange('topic')}
            className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              level === 'topic'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>৩. বিষয় / টপিক</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Level 2: Select Parent Main Category */}
          {level === 'sub' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>প্যারেন্ট মূল ক্যাটাগরি (Parent Main Category) *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">লেভেল ১</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="" disabled>মূল ক্যাটাগরি নির্বাচন করুন</option>
                {mainCategories.map((main) => (
                  <option key={main.id} value={main.id}>
                    📁 {main.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level 3: Select Parent Sub-Category */}
          {level === 'topic' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>প্যারেন্ট সাব-ক্যাটাগরি (Parent Sub-Category) *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">লেভেল ২</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="" disabled>সাব-ক্যাটাগরি নির্বাচন করুন</option>
                {subCategories.map((sub) => {
                  const parentMain = categories.find((c) => c.id === sub.parent_id);
                  return (
                    <option key={sub.id} value={sub.id}>
                      {parentMain ? `${parentMain.name} › ${sub.name}` : sub.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {level === 'main' && 'মূল ক্যাটাগরির নাম (Main Category Name) *'}
              {level === 'sub' && 'সাব-ক্যাটাগরির নাম (Sub-Category Name) *'}
              {level === 'topic' && 'বিষয় বা টপিকের নাম (Subject / Topic Name) *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder={
                level === 'main'
                  ? 'যেমন: ১৮তম শিক্ষক নিবন্ধন প্রস্তুতি'
                  : level === 'sub'
                  ? 'যেমন: সহকারী মৌলভী'
                  : 'যেমন: আল-কুরআন ও তাফসীর'
              }
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                SEO স্লাগ (Slug)
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" /> স্বয়ংক্রিয় জেনারেটেড
              </span>
            </div>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="category-slug-name"
              className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              সংক্ষিপ্ত বিবরণ (Optional Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="এই ক্যাটাগরি বা বিষয়ের সংক্ষিপ্ত বিবরণ..."
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {level === 'main' && 'মূল ক্যাটাগরি সংরক্ষণ করুন'}
                {level === 'sub' && 'সাব-ক্যাটাগরি সংরক্ষণ করুন'}
                {level === 'topic' && 'বিষয়/টপিক সংরক্ষণ করুন'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
