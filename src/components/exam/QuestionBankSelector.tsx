import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  Eye,
  Layers,
  Sparkles,
  AlertCircle,
  CheckSquare,
  Square,
  BookOpen,
} from 'lucide-react';
import { Question } from '../../types';
import { QuestionDetailModal } from './QuestionDetailModal';
import { fetchAllQuestions } from '../../lib/supabase';

interface QuestionBankSelectorProps {
  currentSelectedQuestions: Question[];
  onToggleQuestion: (question: Question) => void;
  onBatchSelect: (questions: Question[]) => void;
  targetCount: number;
  initialSubject?: string;
  initialTopic?: string;
  initialPost?: string;
}

export const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  currentSelectedQuestions,
  onToggleQuestion,
  onBatchSelect,
  targetCount,
  initialSubject = '',
  initialTopic = '',
  initialPost = '',
}) => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState(initialSubject || '');
  const [topicFilter, setTopicFilter] = useState(initialTopic || '');
  const [postFilter, setPostFilter] = useState(initialPost || '');
  const [difficultyFilter, setDifficultyFilter] = useState('সকল স্তর');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  const [onlyShowSelected, setOnlyShowSelected] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load questions on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchAllQuestions();
        setAllQuestions(res.questions || []);
      } catch (e) {
        console.error('Failed to fetch questions:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute unique subject, topic, post list for dropdowns
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    if (initialSubject) set.add(initialSubject);
    return Array.from(set);
  }, [allQuestions, initialSubject]);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      if ((!subjectFilter || q.subject === subjectFilter) && q.topic) {
        set.add(q.topic);
      }
    });
    if (initialTopic) set.add(initialTopic);
    return Array.from(set);
  }, [allQuestions, subjectFilter, initialTopic]);

  const availablePosts = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.post) set.add(q.post);
    });
    if (initialPost) set.add(initialPost);
    return Array.from(set);
  }, [allQuestions, initialPost]);

  const selectedIdsSet = useMemo(() => {
    return new Set(currentSelectedQuestions.map((q) => String(q.id)));
  }, [currentSelectedQuestions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (onlyShowSelected && !selectedIdsSet.has(String(q.id))) return false;

      if (subjectFilter && q.subject && !q.subject.toLowerCase().includes(subjectFilter.toLowerCase())) {
        return false;
      }
      if (topicFilter && q.topic && !q.topic.toLowerCase().includes(topicFilter.toLowerCase())) {
        return false;
      }
      if (postFilter && q.post && !q.post.toLowerCase().includes(postFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQ = q.question.toLowerCase().includes(query);
        const matchesOpts =
          q.option_a?.toLowerCase().includes(query) ||
          q.option_b?.toLowerCase().includes(query) ||
          q.option_c?.toLowerCase().includes(query) ||
          q.option_d?.toLowerCase().includes(query);
        const matchesId = String(q.id).toLowerCase().includes(query);
        if (!matchesQ && !matchesOpts && !matchesId) return false;
      }
      return true;
    });
  }, [allQuestions, onlyShowSelected, selectedIdsSet, subjectFilter, topicFilter, postFilter, searchQuery]);

  const handleToggle = (q: Question) => {
    const isAlreadySelected = selectedIdsSet.has(String(q.id));
    if (!isAlreadySelected && currentSelectedQuestions.length >= targetCount) {
      setErrorNotice(`STEP 1-এ নির্ধারিত ${targetCount}টি প্রশ্নের বেশি নির্বাচন করা যাবে না।`);
      setTimeout(() => setErrorNotice(null), 4000);
      return;
    }
    setErrorNotice(null);
    onToggleQuestion(q);
  };

  const handleSelectAllFiltered = () => {
    const unselected = filteredQuestions.filter((q) => !selectedIdsSet.has(String(q.id)));
    const spaceLeft = targetCount - currentSelectedQuestions.length;

    if (spaceLeft <= 0) {
      setErrorNotice(`সর্বোচ্চ ${targetCount}টি প্রশ্ন নির্বাচন সীমা পূর্ণ হয়েছে।`);
      setTimeout(() => setErrorNotice(null), 4000);
      return;
    }

    const toSelect = unselected.slice(0, spaceLeft);
    onBatchSelect([...currentSelectedQuestions, ...toSelect]);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="pb-1 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            প্রশ্ন ব্যাংক থেকে যুক্ত করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            বিষয়, টপিক ও পদ সিলেক্ট করে প্রশ্ন নির্বাচন করুন
          </p>
        </div>

        {/* 3-col / 2-col Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* বিষয় */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              বিষয় <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setTopicFilter('');
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="">সকল বিষয়</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* টপিক */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              টপিক <span className="text-rose-500">*</span>
            </label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="">সকল টপিক</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* পদ */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              পদ <span className="text-rose-500">*</span>
            </label>
            <select
              value={postFilter}
              onChange={(e) => setPostFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="">সকল পদ</option>
              {availablePosts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: প্রশ্নের ধরন, কঠিনতার স্তর, সার্চ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              প্রশ্নের ধরন
            </label>
            <select
              disabled
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              <option>MCQ (বহুনির্বাচনি)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              কঠিনতার স্তর <span className="text-rose-500">*</span>
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="সকল স্তর">সকল স্তর</option>
              <option value="সহজ">সহজ</option>
              <option value="মধ্যম">মধ্যম</option>
              <option value="কঠিন">কঠিন</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              প্রশ্ন খুঁজুন
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="প্রশ্ন খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error notice banner */}
      {errorNotice && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Filter Stats Bar (Lavender Container) */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-6 text-xs font-bold">
          <span className="text-slate-700 dark:text-slate-300">
            মোট প্রশ্ন পাওয়া গেছে:{' '}
            <strong className="text-[#5B36F5] dark:text-indigo-400 text-sm">
              {filteredQuestions.length} টি
            </strong>
          </span>

          <span className="text-slate-700 dark:text-slate-300">
            নির্বাচিত:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
              {currentSelectedQuestions.length} / {targetCount} টি
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            disabled={currentSelectedQuestions.length >= targetCount}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            সব নির্বাচন করুন
          </button>

          <button
            type="button"
            onClick={() => setOnlyShowSelected(!onlyShowSelected)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              onlyShowSelected
                ? 'bg-[#5B36F5] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#5B36F5] dark:text-indigo-300'
            }`}
          >
            {onlyShowSelected ? 'সকল প্রশ্ন দেখুন' : `নির্বাচিত দেখুন (${currentSelectedQuestions.length})`}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500">
            প্রশ্নসমূহ লোড হচ্ছে...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-slate-500">
            কোনো প্রশ্ন পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSelected = selectedIdsSet.has(String(q.id));

            return (
              <div
                key={q.id}
                onClick={() => handleToggle(q)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#5B36F5] bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-[#5B36F5] border-[#5B36F5] text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Serial Number Circle */}
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {q.question}
                    </p>

                    {/* Short options preview */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">ক)</strong> {q.option_a || '-'}
                      </span>
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">খ)</strong> {q.option_b || '-'}
                      </span>
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">গ)</strong> {q.option_c || '-'}
                      </span>
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">ঘ)</strong> {q.option_d || '-'}
                      </span>
                    </div>

                    {/* Badges & Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] rounded-md">
                        MCQ
                      </span>
                      {q.subject && (
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 font-bold text-[10px] rounded-md">
                          {q.subject}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-md">
                        সহজ
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] rounded-md">
                        ID: {q.id}
                      </span>
                    </div>
                  </div>

                  {/* Eye View Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewQuestion(q);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>দেখুন</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Question Details View Modal */}
      {viewQuestion && (
        <QuestionDetailModal
          question={viewQuestion}
          onClose={() => setViewQuestion(null)}
        />
      )}
    </div>
  );
};
