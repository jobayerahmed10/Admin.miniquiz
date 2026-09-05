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
  RotateCcw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { Question } from '../../types';
import { QuestionDetailModal } from './QuestionDetailModal';
import { fetchAllQuestions } from '../../lib/supabase';
import { sanitizeSubjectName, isSameSubject, getAllSubjects } from '../../lib/subjectManager';

interface QuestionBankSelectorProps {
  currentSelectedQuestions: Question[];
  onToggleQuestion: (question: Question) => void;
  onBatchSelect: (questions: Question[]) => void;
  targetCount: number;
  initialSubject?: string;
  initialTopic?: string;
  initialPost?: string;
  onSwitchMethod?: (method: 'manual' | 'copy_paste' | 'bank' | 'auto_generate') => void;
}

const isAllPosts = (p?: string | null): boolean => {
  if (!p) return true;
  const clean = p.replace(/\s+/g, ' ').trim().toLowerCase();
  return clean === '' || clean === 'সকল পদ' || clean === 'সকল' || clean === 'all' || clean === 'all posts' || clean === 'সাধারণ';
};

const isAllTopics = (t?: string | null): boolean => {
  if (!t) return true;
  const clean = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return clean === '' || clean === 'সকল টপিক' || clean === 'সকল' || clean === 'all' || clean === 'all topics';
};

const SUBJECT_DEFAULT_TOPICS_MAP: Record<string, string[]> = {
  'কারেন্ট অ্যাফেয়ার্স': [
    'সাম্প্রতিক বাংলাদেশ ও অর্থনৈতিক সমীক্ষা',
    'সাম্প্রতিক আন্তর্জাতিক ঘটনাবলি',
    'জলবায়ু, নোবেল ও পুরস্কার',
    'ক্রীড়া ও জাতীয় অর্জন',
  ],
  'বাংলা সাহিত্য': [
    'প্রাচীন ও মধ্যযুগ',
    'আধুনিক যুগের প্রসূতি ও রচয়িতা',
    'রবীন্দ্র ও নজরুল সাহিত্য',
    'বিখ্যাত নাটক, উপন্যাস ও পত্রিকা',
  ],
  'বাংলা ভাষা ও ব্যাকরণ': [
    'ধ্বনিতত্ত্ব ও ভাষা',
    'শব্দ ও সমাস',
    'কারক, বিভক্তি ও পদ',
    'শব্দার্থ ও বাগধারা',
    'বানান ও বাক্য শুদ্ধি',
  ],
  'English Literature': [
    'Old & Middle English to Renaissance',
    'Romantic & Victorian Era',
    'Modern & Post-Modern Literature',
    'Literary Terms, Quotations & Characters',
  ],
  'English Language': [
    'Parts of Speech & Determiners',
    'Tense, Voice & Narration',
    'Preposition, Idioms & Phrases',
    'Vocabulary & Sentence Correction',
  ],
  'গাণিতিক যুক্তি': [
    'পাটিগণিত (সংখ্যা, শতকরা, লাভ-ক্ষতি)',
    'বীজগণিত (মান নির্ণয়, সূচক ও লগ)',
    'জ্যামিতি ও পরিমিতি',
    'বিন্যাস, সমাবেশ ও সম্ভাবনা',
  ],
  'সাধারণ বিজ্ঞান': [
    'ভৌত বিজ্ঞান ও পদার্থ',
    'রসায়ন ও আধুনিক বিজ্ঞান',
    'জীববিজ্ঞান ও উদ্ভিদবিজ্ঞান',
    'চিকিৎসাবিজ্ঞান, খাদ্য ও পুষ্টি',
  ],
  'বাংলাদেশ বিষয়াবলি': [
    'প্রাচীনকাল থেকে ভাষা আন্দোলন ও মুক্তিযুদ্ধ',
    'বাংলাদেশের সংবিধান ও সরকার ব্যবস্থা',
    'অর্থনীতি, সম্পদ ও বাজেট',
    'ভৌগোলিক অবস্থান, পরিবেশ ও উপজাতি',
  ],
  'আন্তর্জাতিক বিষয়াবলি': [
    'জাতিসংঘ ও আন্তর্জাতিক সংস্থাসমূহ',
    'আঞ্চলিক ও অর্থনৈতিক জোট',
    'আন্তর্জাতিক পরিবেশ, নিরাপত্তা ও চুক্তি',
    'বিশ্ব ইতিহাস ও সাম্প্রতিক ভূ-রাজনীতি',
  ],
  'ভূগোল ও দুর্যোগ ব্যবস্থাপনা': [
    'বাংলাদেশ ও বিশ্বের ভৌগোলিক অবস্থান',
    'জলবায়ু পরিবর্তন ও বায়ুমণ্ডল',
    'প্রাকৃতিক দুর্যোগ ও ঝুঁকি হ্রাস',
    'দুর্যোগ ব্যবস্থাপনা নীতি ও সম্পদ',
  ],
  'নৈতিকতা, মূল্যবোধ ও সুশাসন': [
    'মূল্যবোধের ধারণা ও উপাদান',
    'সুশাসনের ধারণা ও প্রধান স্তম্ভ',
    'ই-গভর্নেন্স ও তথ্য অধিকার',
    'নাগরিক দায়িত্ব ও সামাজিক ন্যায়বিচার',
  ],
  'কম্পিউটার ও তথ্যপ্রযুক্তি': [
    'কম্পিউটার হার্ডওয়্যার ও অঙ্গসংস্থান',
    'সফটওয়্যার, ওএস ও ডাটাবেজ',
    'ইন্টারনেট, নেটওয়ার্ক ও ক্লাউড',
    'সাইবার নিরাপত্তা ও ই-কমার্স',
  ],
  'মানসিক দক্ষতা': [
    'ভাষাগত যৌক্তিক বিচার ও বানান',
    'সংখ্যার সিরিজ ও গাণিতিক ধাঁধা',
    'দিক নির্ণয়, সময় ও অবস্থান',
    'কোডিং-ডিকোডিং ও চিত্র বিশ্লেষণ',
  ],
};

export const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  currentSelectedQuestions,
  onToggleQuestion,
  onBatchSelect,
  targetCount,
  initialSubject = '',
  initialTopic = '',
  initialPost = '',
  onSwitchMethod,
}) => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState(initialSubject || '');
  const [topicFilter, setTopicFilter] = useState(isAllTopics(initialTopic) ? '' : (initialTopic || ''));
  const [postFilter, setPostFilter] = useState(isAllPosts(initialPost) ? '' : (initialPost || ''));
  const [difficultyFilter, setDifficultyFilter] = useState('সকল স্তর');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  const [onlyShowSelected, setOnlyShowSelected] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync state if incoming props from Step 1 change
  useEffect(() => {
    if (initialSubject) setSubjectFilter(initialSubject);
    if (initialTopic) setTopicFilter(isAllTopics(initialTopic) ? '' : initialTopic);
    if (initialPost) setPostFilter(isAllPosts(initialPost) ? '' : initialPost);
  }, [initialSubject, initialTopic, initialPost]);

  // Load questions on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchAllQuestions();
        const loaded = res.questions || [];
        setAllQuestions(loaded);
      } catch (e) {
        console.error('Failed to fetch questions:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute unique subject with question count
  const availableSubjects = useMemo(() => {
    const rawSubs = allQuestions.map((q) => q.subject).filter((s): s is string => Boolean(s));
    if (initialSubject) rawSubs.push(initialSubject);
    const uniqueSubs = getAllSubjects(rawSubs);

    return uniqueSubs.map((subj) => {
      const count = allQuestions.filter((q) => isSameSubject(q.subject, subj)).length;
      return { name: subj, count };
    });
  }, [allQuestions, initialSubject]);

  // Compute unique topic list with question count (dynamically scoped to currently selected subject)
  const availableTopics = useMemo(() => {
    const topicCountMap = new Map<string, number>();

    // 1. Gather all topics that actually have questions in the database under current subject
    allQuestions.forEach((q) => {
      if (!subjectFilter || isSameSubject(q.subject, subjectFilter)) {
        if (q.topic && q.topic.trim()) {
          const clean = q.topic.replace(/\s+/g, ' ').trim();
          topicCountMap.set(clean, (topicCountMap.get(clean) || 0) + 1);
        }
      }
    });

    // 2. Ensure initialTopic (from Step 1) is included in the list
    if (initialTopic && !isAllTopics(initialTopic)) {
      const cleanInitial = initialTopic.replace(/\s+/g, ' ').trim();
      const existingKey = Array.from(topicCountMap.keys()).find(
        (k) => k.toLowerCase() === cleanInitial.toLowerCase()
      );
      if (!existingKey) {
        topicCountMap.set(cleanInitial, 0);
      }
    }

    // 3. Ensure currently selected topicFilter is in the list
    if (topicFilter && !isAllTopics(topicFilter)) {
      const cleanSelected = topicFilter.replace(/\s+/g, ' ').trim();
      const existingKey = Array.from(topicCountMap.keys()).find(
        (k) => k.toLowerCase() === cleanSelected.toLowerCase()
      );
      if (!existingKey) {
        topicCountMap.set(cleanSelected, 0);
      }
    }

    // 4. Also add standard known topics for the selected subject
    const cleanSubj = sanitizeSubjectName(subjectFilter);
    const defaultTopics = SUBJECT_DEFAULT_TOPICS_MAP[cleanSubj] || [];
    defaultTopics.forEach((defTop) => {
      const cleanDef = defTop.replace(/\s+/g, ' ').trim();
      const existingKey = Array.from(topicCountMap.keys()).find(
        (k) => k.toLowerCase() === cleanDef.toLowerCase()
      );
      if (!existingKey) {
        topicCountMap.set(cleanDef, 0);
      }
    });

    // Sort: topics with existing questions (>0) first, then zero-count topics
    return Array.from(topicCountMap.entries())
      .map(([topic, count]) => ({
        name: topic,
        count,
      }))
      .sort((a, b) => {
        if (a.count > 0 && b.count === 0) return -1;
        if (a.count === 0 && b.count > 0) return 1;
        return a.name.localeCompare(b.name, 'bn');
      });
  }, [allQuestions, subjectFilter, initialTopic, topicFilter]);

  // Compute available posts with question count
  const availablePosts = useMemo(() => {
    const postMap = new Map<string, number>();

    allQuestions.forEach((q) => {
      if (q.post && q.post.trim() && !isAllPosts(q.post)) {
        const clean = q.post.replace(/\s+/g, ' ').trim();
        postMap.set(clean, (postMap.get(clean) || 0) + 1);
      }
    });

    if (initialPost && !isAllPosts(initialPost)) {
      const cleanInitial = initialPost.replace(/\s+/g, ' ').trim();
      if (!postMap.has(cleanInitial)) {
        postMap.set(cleanInitial, 0);
      }
    }

    return Array.from(postMap.entries()).map(([post, count]) => ({
      name: post,
      count,
    }));
  }, [allQuestions, initialPost]);

  const selectedIdsSet = useMemo(() => {
    return new Set(currentSelectedQuestions.map((q) => String(q.id)));
  }, [currentSelectedQuestions]);

  // Count total questions for current subject regardless of topic/post
  const subjectTotalQuestionsCount = useMemo(() => {
    if (!subjectFilter) return allQuestions.length;
    return allQuestions.filter((q) => isSameSubject(q.subject, subjectFilter)).length;
  }, [allQuestions, subjectFilter]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (onlyShowSelected && !selectedIdsSet.has(String(q.id))) return false;

      // Subject Filter
      if (subjectFilter && subjectFilter !== 'সকল বিষয়' && !isSameSubject(q.subject, subjectFilter)) {
        return false;
      }

      // Topic Filter
      if (topicFilter && !isAllTopics(topicFilter)) {
        const qTop = (q.topic || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const fTop = topicFilter.replace(/\s+/g, ' ').trim().toLowerCase();
        const matchesTopic =
          qTop === fTop ||
          (qTop.length > 3 && fTop.length > 3 && (qTop.includes(fTop) || fTop.includes(qTop)));
        if (!matchesTopic) return false;
      }

      // Post Filter
      if (postFilter && !isAllPosts(postFilter)) {
        const qPost = (q.post || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const fPost = postFilter.replace(/\s+/g, ' ').trim().toLowerCase();
        const isUniversal = isAllPosts(qPost);
        const matchesPost = isUniversal || qPost === fPost || qPost.includes(fPost) || fPost.includes(qPost);
        if (!matchesPost) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQ = (q.question || '').toLowerCase().includes(query);
        const matchesOpts =
          q.option_a?.toLowerCase().includes(query) ||
          q.option_b?.toLowerCase().includes(query) ||
          q.option_c?.toLowerCase().includes(query) ||
          q.option_d?.toLowerCase().includes(query);
        const matchesId =
          String(q.id).toLowerCase().includes(query) ||
          (q.question_code && String(q.question_code).toLowerCase().includes(query));
        const matchesTopic = (q.topic || '').toLowerCase().includes(query);
        if (!matchesQ && !matchesOpts && !matchesId && !matchesTopic) return false;
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

  const handleResetFilters = () => {
    setSubjectFilter(initialSubject || '');
    setTopicFilter('');
    setPostFilter('');
    setDifficultyFilter('সকল স্তর');
    setSearchQuery('');
    setOnlyShowSelected(false);
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubjectFilter(newSubject);
    // When changing subject, reset topic to all topics under the new subject
    setTopicFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              প্রশ্ন ব্যাংক থেকে যুক্ত করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              বিষয়, টপিক ও পদ সিলেক্ট করে প্রশ্ন নির্বাচন করুন (মোট ডাটাবেসে {allQuestions.length} টি প্রশ্ন আছে)
            </p>
          </div>
          {(subjectFilter || topicFilter || postFilter || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-[11px] font-bold text-[#5B36F5] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ফিল্টার রিসেট</span>
            </button>
          )}
        </div>

        {/* 3-col Filter Grid */}
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
              <option value="">সকল বিষয় ({allQuestions.length} টি)</option>
              {availableSubjects.map((subj) => (
                <option key={subj.name} value={subj.name}>
                  {subj.name} ({subj.count} টি)
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
              <option value="">সকল টপিক ({subjectTotalQuestionsCount} টি)</option>
              {availableTopics.map((top) => (
                <option key={top.name} value={top.name}>
                  {top.name} ({top.count} টি)
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
              <option value="">সকল পদ ({subjectTotalQuestionsCount} টি)</option>
              {availablePosts.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.count} টি)
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
            disabled={filteredQuestions.length === 0 || currentSelectedQuestions.length >= targetCount}
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
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {topicFilter ? (
                  <>
                    <strong className="text-slate-700 dark:text-slate-300">"{subjectFilter || 'নির্বাচিত বিষয়'}"</strong> বিষয়ের{' '}
                    <strong className="text-amber-600 dark:text-amber-400">"{topicFilter}"</strong> টপিকের অধীনে বর্তমানে কোনো প্রশ্ন প্রশ্ন ব্যাংকে সংরক্ষিত নেই।
                  </>
                ) : subjectFilter ? (
                  <>
                    <strong className="text-slate-700 dark:text-slate-300">"{subjectFilter}"</strong> বিষয়ের অধীনে বর্তমানে প্রশ্ন ব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি।
                  </>
                ) : (
                  'আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো প্রশ্ন ডাটাবেসে নেই।'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {topicFilter && (
                <button
                  type="button"
                  onClick={() => setTopicFilter('')}
                  className="px-4 py-2 bg-[#5B36F5] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#4a2cd0] transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{subjectFilter || 'এই বিষয়'}-এর সকল টপিকের প্রশ্ন দেখুন ({subjectTotalQuestionsCount} টি)</span>
                </button>
              )}

              {onSwitchMethod && topicFilter && (
                <button
                  type="button"
                  onClick={() => onSwitchMethod('auto_generate')}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI দিয়ে '{topicFilter}' টপিকের প্রশ্ন তৈরি করুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সকল ফিল্টার রিসেট করুন ({allQuestions.length} টি)</span>
              </button>
            </div>
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
                      {q.topic && (
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] rounded-md">
                          {q.topic}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-md">
                        সহজ
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] rounded-md">
                        ID: {q.question_code || q.id}
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

