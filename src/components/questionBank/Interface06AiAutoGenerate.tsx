import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Info,
  Bot,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { WorkingQuestion, AiAutoGenerateConfig } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal } from './AddCategoryModal';
import {
  lookupSubjectPrefixAndSequence,
  generateAiQuestions,
  isArabicText,
  PrefixLookupResult,
} from '../../lib/questionBankEngine';
import { Question } from '../../types';
import { BASE_SUBJECTS, getCustomSubjects, addCustomSubject, getAllSubjects, sanitizeSubjectName } from '../../lib/subjectManager';
import { BASE_POSTS, getCustomPosts, addCustomPost } from '../../lib/postManager';

interface Interface06AiAutoGenerateProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (generatedQuestions: WorkingQuestion[], config: AiAutoGenerateConfig) => void;
}

export const Interface06AiAutoGenerate: React.FC<Interface06AiAutoGenerateProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
}) => {
  // Metadata state
  const [subject, setSubject] = useState('বাংলা');
  const [topic, setTopic] = useState('সাহিত্য ও ব্যাকরণ');
  const [post, setPost] = useState('বিসিএস ক্যাডার (BCS)');
  const [language, setLanguage] = useState<'বাংলা' | 'English' | 'العربية'>('বাংলা');
  const [questionType, setQuestionType] = useState('MCQ (একটি সঠিক উত্তর)');
  const [difficulty, setDifficulty] = useState<'সহজ' | 'মাঝারি' | 'কঠিন'>('মাঝারি');

  // AI Config
  const [questionCount, setQuestionCount] = useState(20);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(10);
  const [features, setFeatures] = useState({
    generalKnowledge: true,
    conceptual: true,
    analytical: false,
    applied: false,
  });
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom categories
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<string[]>([]);
  const [addModalType, setAddModalType] = useState<'subject' | 'topic' | 'post' | null>(null);

  // Dynamic Prefix Lookup
  const [prefix, setPrefix] = useState('Q-BANGLA-');
  const [nextNumber, setNextNumber] = useState(1246);
  const [lookupInfo, setLookupInfo] = useState<PrefixLookupResult | undefined>(undefined);

  const refreshPrefixLookup = useCallback((subj: string) => {
    const result = lookupSubjectPrefixAndSequence(subj, existingQuestions);
    setLookupInfo(result);
    setPrefix(result.prefix);
    setNextNumber(result.nextNumber);
  }, [existingQuestions]);

  useEffect(() => {
    refreshPrefixLookup(subject);
  }, [subject, refreshPrefixLookup]);

  // Example Carousel
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    setAllSubjects(getAllSubjects());
    const customPosts = getCustomPosts();
    setAllPosts(Array.from(new Set([...BASE_POSTS, ...customPosts])));
  }, []);

  useEffect(() => {
    if (subject.includes('আরবি') || subject.includes('العربية')) {
      setLanguage('العربية');
    }
  }, [subject]);

  const handleAddNewCategoryItem = (name: string) => {
    if (addModalType === 'subject') {
      const clean = sanitizeSubjectName(name);
      if (clean) {
        addCustomSubject(clean);
        setAllSubjects(getAllSubjects([clean]));
        setSubject(clean);
      }
    } else if (addModalType === 'topic') {
      setTopic(name.replace(/\s+/g, ' ').trim());
    } else if (addModalType === 'post') {
      addCustomPost(name.replace(/\s+/g, ' ').trim());
      setAllPosts((prev) => Array.from(new Set([...prev, name.replace(/\s+/g, ' ').trim()])));
      setPost(name.replace(/\s+/g, ' ').trim());
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    const cleanSub = sanitizeSubjectName(subject);
    const cleanTopic = topic.replace(/\s+/g, ' ').trim();
    const cleanPost = post.replace(/\s+/g, ' ').trim();

    const config: AiAutoGenerateConfig = {
      subject: cleanSub,
      topic: cleanTopic,
      post: cleanPost,
      language,
      questionType,
      difficulty,
      questionCount,
      questionsPerTopic,
      features,
      additionalInstructions,
      prefix,
      startNumber: nextNumber,
    };

    setTimeout(() => {
      const generated = generateAiQuestions(config, questionCount);
      setIsGenerating(false);
      onProceedToPreview(generated, config);
    }, 1000);
  };

  const sampleExamples = [
    {
      q: 'বাংলাদেশের সংবিধানের কোন অনুচ্ছেদে বাক স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে?',
      a: '৩৯(২) অনুচ্ছেদ',
      opts: ['৩৯(১) অনুচ্ছেদ', '৩৯(২) অনুচ্ছেদ', '২৭ অনুচ্ছেদ', '৩১ অনুচ্ছেদ'],
      exp: '৩৯(২) অনুচ্ছেদে বাক-স্বাধীনতা ও ভাব প্রকাশের স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে।',
    },
    {
      q: 'কোনটি রবীন্দ্রনাথ ঠাকুরের রচিত নাটক নয়?',
      a: 'কবর',
      opts: ['রক্তকরবী', 'ডাকঘর', 'কবর', 'বিসর্জন'],
      exp: "'কবর' নাটকটি মুনীর চৌধুরী রচিত একটি বিখ্যাত নাটক।",
    },
    {
      q: 'ما هي عاصمة جمهورية بنغلاديش الشعبية؟',
      a: 'دكا',
      opts: ['دكا', 'شيتاغونغ', 'سلهت', 'خولنا'],
      exp: 'دكا هي العاصمة الوطنية والمركز الثقافي لبنغلاديش.',
    },
  ];

  const currentSample = sampleExamples[exampleIndex % sampleExamples.length];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 1. Header */}
      <QuestionBankHeader
        showBack
        onBack={onBack}
        title="মাস্টার প্রশ্ন ব্যাংক"
        subTitle="QUESTION BANK"
      />

      {/* 2. Step Indicator */}
      <StepIndicator
        currentStep={1}
        step1Label="AI দিয়ে প্রশ্ন জেনারেট"
        step2Label="প্রিভিউ ও প্রকাশ করুন"
      />

      {/* 3. Two-Column Layout (Screenshot 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Basic Information Card */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">প্রশ্নের মৌলিক তথ্য</h2>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">বিষয় *</label>
                  <button
                    type="button"
                    onClick={() => setAddModalType('subject')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>নতুন</span>
                  </button>
                </div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {allSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">টপিক *</label>
                  <button
                    type="button"
                    onClick={() => setAddModalType('topic')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>নতুন</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="যেমন: ব্যাকরণ, মুক্তিযুদ্ধ..."
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Post */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">পদ / পরীক্ষা *</label>
                  <button
                    type="button"
                    onClick={() => setAddModalType('post')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>নতুন</span>
                  </button>
                </div>
                <select
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {allPosts.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ভাষা *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="বাংলা">বাংলা</option>
                  <option value="English">English</option>
                  <option value="العربية">العربية (Arabic RTL)</option>
                </select>
              </div>

              {/* Question Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">প্রশ্নের ধরন *</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MCQ (একটি সঠিক উত্তর)">MCQ (একটি সঠিক উত্তর)</option>
                  <option value="বহুপদী সমাপ্তিসূচক">বহুপদী সমাপ্তিসূচক</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">কঠিনতা</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="সহজ">সহজ (Easy)</option>
                  <option value="মাঝারি">মাঝারি (Medium)</option>
                  <option value="কঠিন">কঠিন (Hard)</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Generation Settings Card (Screenshot 6) */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI জেনারেট সেটিংস</span>
            </h3>

            {/* Question Count Counter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">প্রশ্ন সংখ্যা *</label>
                <div className="flex items-center gap-3 bg-[#050914] border border-slate-700/80 rounded-2xl p-1.5 w-fit">
                  <button
                    type="button"
                    onClick={() => setQuestionCount(Math.max(5, questionCount - 5))}
                    className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-white font-mono px-3">
                    {questionCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestionCount(Math.min(100, questionCount + 5))}
                    className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Questions per Topic */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">প্রতি টপিকে প্রশ্ন</label>
                <select
                  value={questionsPerTopic}
                  onChange={(e) => setQuestionsPerTopic(Number(e.target.value))}
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>৫ টি করে</option>
                  <option value={10}>১০ টি করে</option>
                  <option value={15}>১৫ টি করে</option>
                  <option value={20}>২০ টি করে</option>
                </select>
              </div>
            </div>

            {/* Question Features (Checkboxes) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 block">প্রশ্নের বৈশিষ্ট্য:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={features.generalKnowledge}
                    onChange={(e) =>
                      setFeatures({ ...features, generalKnowledge: e.target.checked })
                    }
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>সাধারণ জ্ঞান ভিত্তিক</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={features.conceptual}
                    onChange={(e) =>
                      setFeatures({ ...features, conceptual: e.target.checked })
                    }
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>ধারণাগত (Conceptual)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={features.analytical}
                    onChange={(e) =>
                      setFeatures({ ...features, analytical: e.target.checked })
                    }
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>বিশ্লেষণধর্মী</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={features.applied}
                    onChange={(e) =>
                      setFeatures({ ...features, applied: e.target.checked })
                    }
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>প্রয়োগধর্মী (Applied)</span>
                </label>
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  অতিরিক্ত নির্দেশনা (ঐচ্ছিক)
                </label>
                <span className="text-[10px] text-slate-400">
                  {additionalInstructions.length}/500
                </span>
              </div>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="যেমন: সাম্প্রতিক প্রশ্নের ধারা ও বিগত ১০ বছরের বিসিএস প্যাটার্ন অনুযায়ী প্রশ্ন তৈরি করুন..."
                rows={2}
                className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Smart Batch Prefix Card */}
          <SmartBatchPrefixCard
            prefix={prefix}
            nextNumber={nextNumber}
            lookupInfo={lookupInfo}
            subjectName={subject}
            onPrefixChange={(newP) => setPrefix(newP)}
            onNextNumberChange={(newN) => setNextNumber(newN)}
            onRefresh={() => refreshPrefixLookup(subject)}
            isAutoLabel
          />

          {/* Notice Box */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>দ্রষ্টব্য:</strong> AI আপনার নির্বাচিত বিষয়, টপিক ও সেটিংস অনুযায়ী প্রশ্ন
              তৈরি করবে। প্রয়োজনে প্রিভিউ থেকে প্রশ্ন বাদ/সম্পাদনা করতে পারবেন।
            </p>
          </div>

          {/* Big Neon CTA Button (Screenshot 6) */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              )}
              <span>
                {isGenerating ? 'প্রশ্ন তৈরি করা হচ্ছে...' : 'AI দিয়ে প্রশ্ন জেনারেট করুন'}
              </span>
            </div>
            <span className="text-[11px] font-medium opacity-90">
              প্রায় ১০-১৫ সেকেন্ড সময় লাগতে পারে
            </span>
          </button>
        </div>

        {/* Right Column: AI Info & Live Preview (5 cols, Screenshot 6) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Info Card */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">AI অটো জেনারেট</h3>
                <p className="text-[11px] text-slate-400">
                  AI আপনার দেওয়া তথ্যের ভিত্তিতে প্রশ্ন তৈরি করবে
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  জেনারেট হবে
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {questionCount} টি
                </span>
              </div>

              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  প্রত্যাশিত সময়
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">~১৫ সেকেন্ড</span>
              </div>

              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  টোকেন ব্যবহার
                </span>
                <span className="text-sm font-black text-sky-400 font-mono">১২০</span>
              </div>

              <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  ক্রেডিট লাগবে
                </span>
                <span className="text-sm font-black text-purple-400 font-mono">২০</span>
              </div>
            </div>
          </div>

          {/* Generated Question Preview (Empty State) */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-6 shadow-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">জেনারেট হওয়া প্রশ্ন (Preview)</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                এখনো প্রশ্ন জেনারেট করা হয়নি। বাম পাশের সেটিংস দিয়ে AI দিয়ে প্রশ্ন জেনারেট করুন।
              </p>
            </div>
          </div>

          {/* AI How It Works Card (Screenshot 6) */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI কীভাবে কাজ করে?</span>
            </h4>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>আপনার দেওয়া তথ্য বিশ্লেষণ করে প্রাসঙ্গিক প্রশ্ন তৈরি করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>সঠিক উত্তর, বিভ্রান্তিকর অপশন ও ব্যাখ্যা সহ তৈরি করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>ডুপ্লিকেট চেক করে ইউনিক প্রশ্ন জেনারেট করে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>সাম্প্রতিক প্রশ্নের ধারা ও স্ট্যান্ডার্ড অনুসরণ করে</span>
              </div>
            </div>
          </div>

          {/* Sample Carousel Card (Screenshot 6) */}
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3 relative">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white">জেনারেটেড প্রশ্নের উদাহরণ</h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExampleIndex((prev) => (prev > 0 ? prev - 1 : sampleExamples.length - 1))}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setExampleIndex((prev) => prev + 1)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <p className="font-bold text-white leading-relaxed">{currentSample.q}</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                {currentSample.opts.map((opt, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded-lg border ${
                      opt === currentSample.a
                        ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
                <strong className="text-emerald-400">ব্যাখ্যা:</strong> {currentSample.exp}
              </p>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {sampleExamples.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === exampleIndex % sampleExamples.length
                      ? 'w-4 bg-emerald-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-[#050914] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
            <span className="text-base">🔮</span>
            <span>
              <strong>জেনারেশন টিপস:</strong> যত নির্দিষ্ট তথ্য ও টপিক দেবেন, তত ভালো ও নির্ভুল
              প্রশ্ন পাবেন।
            </span>
          </div>
        </div>
      </div>

      {addModalType && (
        <AddCategoryModal
          isOpen={Boolean(addModalType)}
          type={addModalType}
          onClose={() => setAddModalType(null)}
          onAdd={handleAddNewCategoryItem}
        />
      )}
    </div>
  );
};
