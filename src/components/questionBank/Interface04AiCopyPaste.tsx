import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Info,
  FileText,
  UploadCloud,
  Trash2,
  ArrowRight,
  Plus,
  Globe,
  AlignRight,
  FileCode,
} from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { SmartBatchPrefixCard } from './SmartBatchPrefixCard';
import { AddCategoryModal } from './AddCategoryModal';
import {
  lookupSubjectPrefixAndSequence,
  isArabicText,
  parsePastedQuestionsText,
  PrefixLookupResult,
} from '../../lib/questionBankEngine';
import { Question } from '../../types';
import { BASE_SUBJECTS, getCustomSubjects, addCustomSubject, getAllSubjects, sanitizeSubjectName } from '../../lib/subjectManager';
import { BASE_POSTS, getCustomPosts, addCustomPost } from '../../lib/postManager';

interface Interface04AiCopyPasteProps {
  existingQuestions: Question[];
  onBack: () => void;
  onProceedToPreview: (parsedQuestions: WorkingQuestion[], meta: any) => void;
}

const SAMPLE_PASTE_TEXT = `১. বাংলাদেশের জাতীয় ফুল কোনটি?
A. জবা
B. শাপলা
C. পদ্ম
D. গোলাপ
উত্তর: B
ব্যাখ্যা: বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা।

২. 'পদ্মা নদীর মাঝি' উপন্যাসের রচয়িতা কে?
A. মানিক বন্দ্যোপাধ্যায়
B. শরৎচন্দ্র চট্টোপাধ্যায়
C. বিভূতিভূষণ বন্দ্যোপাধ্যায়
D. তারাশঙ্কর বন্দ্যোপাধ্যায়
উত্তর: A
ব্যাখ্যা: এটি মানিক বন্দ্যোপাধ্যায়ের একটি বিখ্যাত সামাজিক উপন্যাস।

৩. ما هي عاصمة جمهورية بنغلاديش الشعبية؟
A. دكا
B. شيتاغونغ
C. سلهت
D. خولنا
উত্তর: A
ব্যাখ্যা: دكا هي عاصمة بنغلاديش.`;

export const Interface04AiCopyPaste: React.FC<Interface04AiCopyPasteProps> = ({
  existingQuestions,
  onBack,
  onProceedToPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState(SAMPLE_PASTE_TEXT);
  const [isRtlManual, setIsRtlManual] = useState<boolean | null>(null);

  // Metadata
  const [subject, setSubject] = useState('বাংলা');
  const [topic, setTopic] = useState('সাধারণ জ্ঞান ও সাহিত্য');
  const [post, setPost] = useState('বিসিএস ক্যাডার (BCS)');
  const [language, setLanguage] = useState<'বাংলা' | 'English' | 'العربية'>('বাংলা');
  const [questionType, setQuestionType] = useState('MCQ (একটি সঠিক উত্তর)');
  const [difficulty, setDifficulty] = useState<'সহজ' | 'মাঝারি' | 'কঠিন'>('মাঝারি');

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

  useEffect(() => {
    setAllSubjects(getAllSubjects());
    const customPosts = getCustomPosts();
    setAllPosts(Array.from(new Set([...BASE_POSTS, ...customPosts])));
  }, []);

  const isArabicDetected = isArabicText(pastedText);
  const isRtl = isRtlManual !== null ? isRtlManual : isArabicDetected;

  const handleAddNewCategoryItem = (name: string) => {
    if (addModalType === 'subject') {
      const clean = sanitizeSubjectName(name);
      if (clean) {
        addCustomSubject(clean);
        setAllSubjects(getAllSubjects([clean]));
        setSubject(clean);
      }
    } else if (addModalType === 'topic') {
      const cleanName = (name || '').replace(/\s+/g, ' ').trim();
      setTopic(cleanName);
    } else if (addModalType === 'post') {
      const cleanName = (name || '').replace(/\s+/g, ' ').trim();
      addCustomPost(cleanName);
      setAllPosts((prev) => Array.from(new Set([...prev, cleanName])));
      setPost(cleanName);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        setActiveTab('text');
      }
    };
    reader.readAsText(file);
  };

  const handleParseAndProceed = () => {
    if (!pastedText.trim()) return;

    const cleanSub = sanitizeSubjectName(subject);
    const cleanTopic = (topic || '').replace(/\s+/g, ' ').trim();
    const cleanPost = (post || '').replace(/\s+/g, ' ').trim();

    const parsed = parsePastedQuestionsText(pastedText, {
      subject: cleanSub,
      topic: cleanTopic,
      post: cleanPost,
      language,
      questionType,
      difficulty,
    });

    onProceedToPreview(parsed, {
      subject: cleanSub,
      topic: cleanTopic,
      post: cleanPost,
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
        step1Label="কপি-পেস্ট করুন"
        step2Label="প্রিভিউ ও যুক্ত করুন"
      />

      {/* 3. Basic Information Card */}
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

      {/* 4. Smart Batch Prefix Card */}
      <SmartBatchPrefixCard
        prefix={prefix}
        nextNumber={nextNumber}
        lookupInfo={lookupInfo}
        subjectName={subject}
        onPrefixChange={(newP) => setPrefix(newP)}
        onNextNumberChange={(newN) => setNextNumber(newN)}
        onRefresh={() => refreshPrefixLookup(subject)}
      />

      {/* 5. AI Copy-Paste Section (Screenshot 4) */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">AI কপি-পেস্ট (Copy-Paste)</h3>
              <p className="text-xs text-slate-400">আপনার প্রশ্ন/অপশন এখানে পেস্ট করুন</p>
            </div>
          </div>

          {/* Tabs & RTL Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#050914] p-1 rounded-2xl border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'text'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                টেক্সট পেস্ট করুন
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'file'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ফাইল আপলোড করুন
              </button>
            </div>

            {/* RTL Button */}
            <button
              type="button"
              onClick={() => setIsRtlManual(isRtl ? false : true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isRtl
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Arabic RTL Toggle"
            >
              <AlignRight className="w-3.5 h-3.5" />
              <span>{isRtl ? 'RTL Auto ✓' : 'RTL LTR'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Text Area */}
        {activeTab === 'text' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>যেকোনো ফরম্যাটের প্রশ্ন পেস্ট করুন</span>
              <span>{pastedText.length}/50000 অক্ষর</span>
            </div>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="এখানে আপনার প্রশ্ন ও অপশন পেস্ট করুন..."
              rows={12}
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono leading-relaxed ${
                isRtl ? 'font-amiri text-sm leading-relaxed text-right' : ''
              }`}
            />
          </div>
        ) : (
          /* Tab 2: File Upload */
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-3xl p-8 text-center bg-[#050914] space-y-3 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                ফাইল টেনে আনুন অথবা ক্লিক করে আপলোড করুন
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                সমর্থিত ফাইল: .txt, .csv, .docx, .json
              </p>
            </div>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept=".txt,.csv,.json,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 inline-flex items-center gap-1.5 transition-all">
                <FileText className="w-3.5 h-3.5" />
                <span>ফাইল সিলেক্ট করুন</span>
              </span>
            </label>
          </div>
        )}

        {/* Formatting Guide Box (Screenshot 4) */}
        <div className="bg-[#050914] border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
          <span className="font-bold text-white block">পেস্ট করার নিয়মাবলী:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>প্রতিটি প্রশ্ন নতুন নম্বরে বা লাইনে লিখুন</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>অপশনগুলো A, B, C, D বা ক, খ, গ, ঘ ফরম্যাটে দিন</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>সঠিক উত্তর চিহ্নিত করুন (যেমন: Ans: A বা উত্তর: ক)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>ব্যাখ্যা থাকলে আলাদা লাইনে দিন (যেমন: ব্যাখ্যা: ...)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPastedText('')}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>ক্লিয়ার করুন</span>
          </button>

          <button
            type="button"
            onClick={handleParseAndProceed}
            disabled={!pastedText.trim()}
            className="w-full sm:w-auto flex-1 py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>AI পার্স করুন (পরবর্তী ধাপ)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
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
