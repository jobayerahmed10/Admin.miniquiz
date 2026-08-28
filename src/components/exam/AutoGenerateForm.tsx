import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  Plus,
  Minus,
  Check,
  Trash2,
  Edit2,
  Inbox,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Question } from '../../types';

interface AutoGenerateFormProps {
  onAddBatchQuestions: (questions: Omit<Question, 'id'>[]) => void;
  defaultSubject?: string;
  defaultTopic?: string;
  defaultPost?: string;
  targetCount?: number;
}

export const AutoGenerateForm: React.FC<AutoGenerateFormProps> = ({
  onAddBatchQuestions,
  defaultSubject = 'বাংলা',
  defaultTopic = 'সন্ধি',
  defaultPost = 'সহকারী শিক্ষক',
  targetCount = 20,
}) => {
  const [subject, setSubject] = useState(defaultSubject || 'বাংলা');
  const [topic, setTopic] = useState(defaultTopic || 'ব্যাকরণ ও সন্ধি');
  const [post, setPost] = useState(defaultPost || 'সহকারী শিক্ষক');
  const [difficulty, setDifficulty] = useState<'সহজ' | 'মাঝারি' | 'কঠিন'>('মাঝারি');
  const [language, setLanguage] = useState('বাংলা');
  const [questionCount, setQuestionCount] = useState(Math.min(targetCount || 20, 25));
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [optionCount, setOptionCount] = useState<number>(4);

  // Additional options
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [avoidRecent, setAvoidRecent] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim()) {
      setError('বিষয় এবং টপিক উল্লেখ করা বাধ্যতামূলক');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          post: post.trim(),
          difficulty,
          language,
          count: questionCount,
          optionCount,
          includeExplanation,
          shuffleOptions,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'প্রশ্ন জেনারেট করতে সমস্যা হয়েছে');
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const mapped: Omit<Question, 'id'>[] = data.questions.map((q: any) => ({
          question: q.question,
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_answer: q.correct_answer || 'option_a',
          explanation: q.explanation || null,
          subject: subject.trim(),
          topic: topic.trim(),
          post: post.trim(),
          status: 'published',
        }));

        setGeneratedQuestions(mapped);
        setSelectedIndices(new Set(mapped.map((_, idx) => idx)));
      } else {
        setError('কোনো প্রশ্ন জেনারেট হয়নি। পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setError(err.message || 'AI সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleAddSelected = () => {
    const toAdd = generatedQuestions.filter((_, idx) => selectedIndices.has(idx));
    if (toAdd.length === 0) {
      setError('কমপক্ষে একটি প্রশ্ন নির্বাচন করুন');
      return;
    }
    onAddBatchQuestions(toAdd);
    setGeneratedQuestions([]);
    setSelectedIndices(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Top Generator Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>AI দিয়ে প্রশ্ন জেনারেট করুন</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                টপিক লিখুন, AI দিয়ে স্বয়ংক্রিয়ভাবে মানসম্মত প্রশ্ন তৈরি করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 hover:bg-indigo-100 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>AI সহায়তা টিপস</span>
          </button>
        </div>

        {/* AI Tips Modal / Card */}
        {showTips && (
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-extrabold text-indigo-950 dark:text-indigo-200">
              💡 ভালো প্রশ্ন জেনারেট করার টিপস:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-indigo-900/90 dark:text-indigo-200/90">
              <li>বিষয় এবং টপিকের নাম সুনির্দিষ্টভাবে লিখুন (যেমন: "কারক ও বিভক্তি", "ভগ্নাংশ ও শতকরা")।</li>
              <li>কঠিনতার স্তর এবং পদ নির্ধারণ করলে AI সে অনুযায়ী প্রশ্নের মান নির্ধারণ করবে।</li>
              <li>একবারে ১০-২৫টি প্রশ্ন জেনারেট করা দ্রুত এবং নিখুঁত হয়।</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Row 1: বিষয়, টপিক, পদ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              বিষয় <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="যেমন: বাংলা"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              টপিক <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="যেমন: সন্ধি ও কারক"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              পদ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="যেমন: সহকারী শিক্ষক"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>
        </div>

        {/* Row 2: প্রশ্নের ধরন, কঠিনতার স্তর, ভাষা */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              প্রশ্নের ধরন <span className="text-rose-500">*</span>
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
              কঠিনতার স্তর ⓘ
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="সহজ">সহজ</option>
              <option value="মাঝারি">মাঝারি</option>
              <option value="কঠিন">কঠিন</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              ভাষা
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="বাংলা">বাংলা</option>
              <option value="ইংরেজি">ইংরেজি</option>
              <option value="আরবি">আরবি</option>
            </select>
          </div>
        </div>

        {/* Row 3: প্রশ্ন সংখ্যা Stepper & প্রতি প্রশ্নের নম্বর Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              প্রশ্ন সংখ্যা <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuestionCount(Math.max(5, questionCount - 5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 py-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white">
                {questionCount} টি
              </div>
              <button
                type="button"
                onClick={() => setQuestionCount(Math.min(50, questionCount + 5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              প্রতি প্রশ্নের নম্বর
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMarksPerQ(Math.max(0.5, marksPerQ - 0.5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 py-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white">
                {marksPerQ} নম্বর
              </div>
              <button
                type="button"
                onClick={() => setMarksPerQ(marksPerQ + 0.5)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 4: বিকল্পসমূহের সংখ্যা */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            বিকল্পসমূহের সংখ্যা
          </label>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            {[4, 5, 6].map((num) => (
              <label key={num} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="optionCount"
                  checked={optionCount === num}
                  onChange={() => setOptionCount(num)}
                  className="w-4 h-4 text-[#5B36F5] focus:ring-[#5B36F5]"
                />
                <span>{num}টি {num === 4 ? '(সাধারণ)' : ''}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Collapsible: অতিরিক্ত অপশন (ঐচ্ছিক) */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#5B36F5]"
          >
            <span>অতিরিক্ত অপশন (ঐচ্ছিক)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExplanation}
                  onChange={(e) => setIncludeExplanation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5B36F5]"
                />
                <span>ব্যাখ্যা সহ উত্তর যুক্ত করুন</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5B36F5]"
                />
                <span>বিকল্পসমূহ এলোমেলো করুন</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidRecent}
                  onChange={(e) => setAvoidRecent(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5B36F5]"
                />
                <span>সাম্প্রতিক প্রশ্নসমূহ এড়িয়ে চলুন</span>
              </label>
            </div>
          )}
        </div>

        {/* Info Note Banner */}
        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#5B36F5] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            AI আপনার নির্বাচিত বিষয় ও টপিক অনুযায়ী সিলেবাস ও প্রশ্নের ধরন বিশ্লেষণ করে মানসম্মত প্রশ্ন তৈরি করবে।
          </p>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
          className="w-full py-3.5 bg-[#5B36F5] hover:bg-[#4E2DE3] disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'AI প্রশ্ন তৈরি করছে, অপেক্ষা করুন...' : 'প্রশ্ন জেনারেট করুন'}</span>
        </button>
      </div>

      {/* Generated Questions Preview Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              জেনারেট হওয়া প্রশ্নসমূহ
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 text-xs font-bold">
              {generatedQuestions.length} টি প্রশ্ন
            </span>
          </div>

          {generatedQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleAddSelected}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নির্বাচিত ({selectedIndices.size}) টি যুক্ত করুন</span>
            </button>
          )}
        </div>

        {generatedQuestions.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                এখনও কোনো প্রশ্ন তৈরি করা হয়নি
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                উপরের ফর্ম পূরণ করে "প্রশ্ন জেনারেট করুন" বাটনে চাপ দিন
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {generatedQuestions.map((q, idx) => {
              const isSelected = selectedIndices.has(idx);

              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#5B36F5] bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#5B36F5] border-[#5B36F5] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          <span className="text-[#5B36F5] mr-1">{idx + 1}.</span>
                          {q.question}
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs ${
                            q.correct_answer === 'option_a'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1">ক.</span> {q.option_a}
                        </div>

                        <div
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs ${
                            q.correct_answer === 'option_b'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1">খ.</span> {q.option_b}
                        </div>

                        <div
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs ${
                            q.correct_answer === 'option_c'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1">গ.</span> {q.option_c}
                        </div>

                        <div
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs ${
                            q.correct_answer === 'option_d'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1">ঘ.</span> {q.option_d}
                        </div>
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          ব্যাখ্যা: {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
