import React, { useState, useEffect, useCallback } from 'react';
import {
  Info,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  Layers,
  GraduationCap,
  Globe,
  Check,
} from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal } from './AddCategoryModal';
import {
  lookupSubjectPrefixAndSequence,
  isArabicText,
  getQuestionBankDirectionality,
  PrefixLookupResult,
} from '../../lib/questionBankEngine';
import { Question } from '../../types';
import { BASE_SUBJECTS, getCustomSubjects, addCustomSubject } from '../../lib/subjectManager';
import { BASE_POSTS, getCustomPosts, addCustomPost } from '../../lib/postManager';

interface Interface02ManualEntryProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (questions: WorkingQuestion[], meta: any) => void;
  initialQuestions?: WorkingQuestion[];
}

export const Interface02ManualEntry: React.FC<Interface02ManualEntryProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
  initialQuestions,
}) => {
  // Metadata state
  const [subject, setSubject] = useState('বাংলা');
  const [topic, setTopic] = useState('সাহিত্য');
  const [post, setPost] = useState('বিসিএস ক্যাডার (BCS)');
  const [language, setLanguage] = useState<'বাংলা' | 'English' | 'العربية'>('বাংলা');
  const [questionType, setQuestionType] = useState('MCQ (একটি সঠিক উত্তর)');
  const [difficulty, setDifficulty] = useState<'সহজ' | 'মাঝারি' | 'কঠিন'>('মাঝারি');

  // Custom subjects and posts
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<string[]>([]);

  // Modal for adding new subject, topic, post
  const [addModalType, setAddModalType] = useState<'subject' | 'topic' | 'post' | null>(null);

  // Dynamic Prefix Lookup State
  const [prefix, setPrefix] = useState('Q-BANGLA-');
  const [nextNumber, setNextNumber] = useState(1246);
  const [lookupInfo, setLookupInfo] = useState<PrefixLookupResult | undefined>(undefined);
  const [hasManuallyEditedPrefix, setHasManuallyEditedPrefix] = useState(false);

  // Re-calculate prefix and next number whenever subject or existing questions change
  const refreshPrefixLookup = useCallback((subj: string) => {
    const result = lookupSubjectPrefixAndSequence(subj, existingQuestions);
    setLookupInfo(result);
    setPrefix(result.prefix);
    setNextNumber(result.nextNumber);
    setHasManuallyEditedPrefix(false);
  }, [existingQuestions]);

  useEffect(() => {
    refreshPrefixLookup(subject);
  }, [subject, refreshPrefixLookup]);

  // Working questions state
  const [questionsList, setQuestionsList] = useState<WorkingQuestion[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions;
    }
    return [
      {
        tempId: `manual_${Date.now()}_0`,
        question: 'বাংলাদেশের জাতীয় ফুল কোনটি?',
        options: {
          A: 'জবা',
          B: 'শাপলা',
          C: 'পদ্ম',
          D: 'গোলাপ',
        },
        correctAnswer: 'B',
        explanation: 'বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা।',
        reference: 'বাংলাদেশ সংবিধান ও সাধারণ জ্ঞান',
        subject: 'বাংলা',
        topic: 'সাধারণ জ্ঞান',
        post: 'বিসিএস ক্যাডার (BCS)',
        language: 'বাংলা',
        questionType: 'MCQ (একটি সঠিক উত্তর)',
        difficulty: 'মাঝারি',
        status: 'published',
      },
    ];
  });

  // Load subjects & posts on mount
  useEffect(() => {
    const customSubs = getCustomSubjects();
    const mergedSubs = Array.from(new Set([...BASE_SUBJECTS, ...customSubs]));
    setAllSubjects(mergedSubs);

    const customPosts = getCustomPosts();
    const mergedPosts = Array.from(new Set([...BASE_POSTS, ...customPosts]));
    setAllPosts(mergedPosts);
  }, []);

  // Update language automatically when Arabic is selected
  useEffect(() => {
    if (subject.includes('আরবি') || subject.includes('العربية')) {
      setLanguage('العربية');
    }
  }, [subject]);

  const handleAddQuestionCard = () => {
    const newQ: WorkingQuestion = {
      tempId: `manual_${Date.now()}_${questionsList.length}`,
      question: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: '',
      },
      correctAnswer: 'A',
      explanation: '',
      reference: '',
      subject,
      topic,
      post,
      language,
      questionType,
      difficulty,
      status: 'published',
    };
    setQuestionsList([...questionsList, newQ]);
  };

  const handleRemoveQuestionCard = (index: number) => {
    if (questionsList.length <= 1) return;
    const updated = questionsList.filter((_, idx) => idx !== index);
    setQuestionsList(updated);
  };

  const handleQuestionChange = (index: number, field: keyof WorkingQuestion, value: any) => {
    const updated = [...questionsList];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionsList(updated);
  };

  const handleOptionChange = (qIndex: number, optKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F', val: string) => {
    const updated = [...questionsList];
    updated[qIndex] = {
      ...updated[qIndex],
      options: {
        ...updated[qIndex].options,
        [optKey]: val,
      },
    };
    setQuestionsList(updated);
  };

  const handleAddNewCategoryItem = (name: string) => {
    if (addModalType === 'subject') {
      addCustomSubject(name);
      setAllSubjects((prev) => Array.from(new Set([...prev, name])));
      setSubject(name);
    } else if (addModalType === 'topic') {
      setTopic(name);
    } else if (addModalType === 'post') {
      addCustomPost(name);
      setAllPosts((prev) => Array.from(new Set([...prev, name])));
      setPost(name);
    }
  };

  const handleNext = () => {
    // Inject current metadata & computed directionality into working questions
    const finalPrepared = questionsList.map((q) => {
      const dirInfo = getQuestionBankDirectionality({
        question: q.question,
        options: q.options,
        explanation: q.explanation,
        language,
      });

      return {
        ...q,
        subject,
        topic,
        post,
        language,
        questionType,
        difficulty,
        isArabic: dirInfo.isQuestionArabic,
        questionDir: dirInfo.questionDir,
        optionsDir: dirInfo.optionsDir,
        explanationDir: dirInfo.explanationDir,
      };
    });

    onProceedToPreview(finalPrepared, {
      subject,
      topic,
      post,
      language,
      questionType,
      difficulty,
      prefix,
      nextNumber,
      lookupInfo,
    });
  };

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
        step1Label="প্রশ্ন যোগ করুন"
        step2Label="প্রিভিউ ও প্রকাশ করুন"
      />

      {/* 3. Basic Information Card (Screenshot 2) */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white">প্রশ্নের মৌলিক তথ্য</h2>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          প্রশ্নের সঠিক ক্যাটাগরি নির্বাচন করুন
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
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
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="যেমন: ব্যাকরণ, মুক্তিযুদ্ধ..."
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Post / Exam */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">পদ / পরীক্ষা *</label>
              <button
                type="button"
                onClick={() => setAddModalType('post')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন যুক্ত</span>
              </button>
            </div>
            <select
              value={post}
              onChange={(e) => setPost(e.target.value)}
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="সহজ">সহজ (Easy)</option>
              <option value="মাঝারি">মাঝারি (Medium)</option>
              <option value="কঠিন">কঠিন (Hard)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Smart Batch Prefix Card (Screenshot 2) */}
      <SmartBatchPrefixCard
        prefix={prefix}
        nextNumber={nextNumber}
        lookupInfo={lookupInfo}
        subjectName={subject}
        onPrefixChange={(newP) => {
          setPrefix(newP);
          setHasManuallyEditedPrefix(true);
        }}
        onNextNumberChange={(newN) => {
          setNextNumber(newN);
        }}
        onRefresh={() => refreshPrefixLookup(subject)}
      />

      {/* 5. Dynamic MCQ Question Input Cards */}
      <div className="space-y-4">
        {questionsList.map((q, qIndex) => {
          const dirInfo = getQuestionBankDirectionality({
            question: q.question,
            options: q.options,
            explanation: q.explanation,
            language,
          });
          const isArabic = dirInfo.isQuestionArabic;
          const qDir = dirInfo.questionDir;
          const optDir = dirInfo.optionsDir;
          const expDir = dirInfo.explanationDir;

          const qChars = (q.question || '').length;
          const expChars = (q.explanation || '').length;
          const refChars = (q.reference || '').length;

          const arabicOptionLabels: Record<string, string> = {
            A: 'أ',
            B: 'ب',
            C: 'ج',
            D: 'د',
          };

          return (
            <div
              key={q.tempId}
              className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative"
            >
              {/* Question Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                    {String(qIndex + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm font-black text-white">
                    প্রশ্ন {String(qIndex + 1).padStart(2, '0')}
                  </h3>
                  {isArabic ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      عربي (RTL)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                      LTR
                    </span>
                  )}
                  {optDir === 'rtl' && !isArabic && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                      বিকল্প: RTL
                    </span>
                  )}
                </div>

                {questionsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestionCard(qIndex)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-xl hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                )}
              </div>

              {/* Question Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">প্রশ্ন লিখুন *</label>
                  <span className="text-[10px] text-slate-400">{qChars}/500</span>
                </div>
                <textarea
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  placeholder="এখানে আপনার প্রশ্ন লিখুন..."
                  rows={2}
                  dir={qDir}
                  className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                    qDir === 'rtl' ? 'font-amiri text-sm leading-relaxed text-right' : 'text-left'
                  }`}
                  required
                />
              </div>

              {/* Options Section (A, B, C, D) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">বিকল্প (অপশন) *</label>
                  <span className="text-[10px] text-slate-500">
                    {optDir === 'rtl' ? 'বিন্যাস: ডান দিক (RTL)' : 'বিন্যাস: বাম দিক (LTR)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir={optDir}>
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const isSelected = q.correctAnswer === optKey;
                    const optLabel = optDir === 'rtl' ? arabicOptionLabels[optKey] || optKey : optKey;
                    return (
                      <div
                        key={optKey}
                        className={`flex items-center gap-2.5 bg-[#050914] border ${
                          isSelected ? 'border-emerald-500/80 ring-1 ring-emerald-500/40' : 'border-slate-800'
                        } rounded-2xl p-2.5 transition-all`}
                      >
                        {/* Radio Check Circle */}
                        <button
                          type="button"
                          onClick={() => handleQuestionChange(qIndex, 'correctAnswer', optKey)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                          title={`বিকল্প ${optKey} সঠিক উত্তর হিসেবে চিহ্নিত করুন`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : optLabel}
                        </button>

                        {/* Input */}
                        <input
                          type="text"
                          value={q.options[optKey] || ''}
                          onChange={(e) => handleOptionChange(qIndex, optKey, e.target.value)}
                          placeholder={`অপশন ${optLabel}`}
                          dir={optDir}
                          className={`flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none ${
                            optDir === 'rtl' ? 'font-amiri text-right' : 'text-left'
                          }`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Correct Answer Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">সঠিক উত্তর *</label>
                <div className="grid grid-cols-4 gap-2" dir={optDir}>
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleQuestionChange(qIndex, 'correctAnswer', opt)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          q.correctAnswer === opt
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span dir={optDir} className={optDir === 'rtl' ? 'font-amiri' : ''}>
                          {optLabel}. {q.options[opt] ? q.options[opt].substring(0, 10) : `বিকল্প ${optLabel}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">ব্যাখ্যা (ঐচ্ছিক)</label>
                  <span className="text-[10px] text-slate-400">{expChars}/1000</span>
                </div>
                <textarea
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  placeholder="প্রশ্নের ব্যাখ্যা বা সমাধান লিখুন..."
                  rows={2}
                  dir={expDir}
                  className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                    expDir === 'rtl' ? 'font-amiri text-sm leading-relaxed text-right' : 'text-left'
                  }`}
                />
              </div>

              {/* Reference (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">রেফারেন্স (ঐচ্ছিক)</label>
                  <span className="text-[10px] text-slate-400">{refChars}/200</span>
                </div>
                <input
                  type="text"
                  value={q.reference || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'reference', e.target.value)}
                  placeholder="যেমন: ৩৮তম বিসিএস, এনটিআরসিএ ২০২০..."
                  className="w-full bg-[#050914] border border-slate-700/80 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Add Another Question Button & Big Next CTA */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleAddQuestionCard}
          className="w-full py-3 px-4 rounded-2xl bg-[#0b1322] hover:bg-[#121c2d] border border-dashed border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ আরো একটি প্রশ্ন যুক্ত করুন</span>
        </button>

        {/* Big Neon Green Button for Step 2 (Screenshot 2) */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99]"
        >
          <span>পরবর্তী (প্রিভিউ দেখুন)</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Summary Info Pill */}
        <div className="text-center text-[11px] text-slate-400">
          মোট প্রশ্ন: <strong className="text-emerald-400">{questionsList.length} টি</strong> | ✓
          সঠিক উত্তর সেট | ✏️ ব্যাখ্যা সহ
        </div>
      </div>

      {/* Add Custom Subject/Topic/Post Modal */}
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
