import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  BookOpen,
  Edit3,
  Check,
  Globe,
  PlusCircle,
} from 'lucide-react';
import { insertBatchQuestions } from '../lib/supabase';
import { Question } from '../types';

// Helper to detect Arabic characters for RTL alignment.
// If text contains Bengali or English characters (mixed text), force LTR (return false)
export const isArabicText = (text?: string | null): boolean => {
  if (!text || !text.trim()) return false;
  // If Bengali characters are present, it's a Bengali sentence -> return false (LTR)
  if (/[\u0980-\u09FF]/.test(text)) return false;
  // If English letters are present, return false (LTR)
  if (/[a-zA-Z]/.test(text)) return false;
  // Only if text contains Arabic characters and no Bengali/English characters -> RTL
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

interface AddAiQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsSaved: () => void;
  availableSubjects?: string[];
}

export const AddAiQuestionsModal: React.FC<AddAiQuestionsModalProps> = ({
  isOpen,
  onClose,
  onQuestionsSaved,
  availableSubjects = [],
}) => {
  const [activeTab, setActiveTab] = useState<'copyPaste' | 'topicGen'>('copyPaste');

  // Common State
  const [subject, setSubject] = useState('সাধারণ জ্ঞান');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [subjectList, setSubjectList] = useState<string[]>(() => {
    const defaultList = [
      'সাধারণ জ্ঞান',
      'বাংলা ভাষা ও সাহিত্য',
      'ইংরেজি',
      'গণিত',
      'বাংলাদেশ বিষয়াবলী',
      'আন্তর্জাতিক বিষয়াবলী',
      'বিজ্ঞান',
      'কম্পিউটার ও তথ্যপ্রযুক্তি',
      'আল কুরআন ও হাদিস',
      'ইসলাম শিক্ষা',
    ];
    return Array.from(new Set([...defaultList, ...availableSubjects]));
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Tab 1: Copy Paste State
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);

  // Tab 2: Topic Gen State
  const [topic, setTopic] = useState('');
  const [post, setPost] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Editing state for preview cards
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddCustomSubject = () => {
    if (customSubjectInput.trim()) {
      const newSub = customSubjectInput.trim();
      if (!subjectList.includes(newSub)) {
        setSubjectList((prev) => [...prev, newSub]);
      }
      setSubject(newSub);
      setCustomSubjectInput('');
      setShowAddSubjectInput(false);
    }
  };

  // Local Regex Parser fallback if API fails
  const parseBengaliMCQsLocally = (text: string, defaultSub: string) => {
    const questions: any[] = [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentQ: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const optMatch = line.match(/^([কখগঘa-dA-D1-4])[\.\)\:-]\s*(.+)$/);
      const ansMatch =
        line.match(/^(সঠিক\s*)?উত্তর[:\s]+([কখগঘa-dA-D1-4])/i) ||
        line.match(/^Ans(wer)?[:\s]+([কখগঘa-dA-D1-4])/i);
      const expMatch = line.match(/^(ব্যাখ্যা|নোট|Explanation|Note)[:\s]+(.+)$/i);

      if (ansMatch && currentQ) {
        const char = ansMatch[ansMatch.length - 1].toLowerCase();
        if (['ক', 'a', '1'].includes(char)) currentQ.correct_answer = 'option_a';
        else if (['খ', 'b', '2'].includes(char)) currentQ.correct_answer = 'option_b';
        else if (['গ', 'c', '3'].includes(char)) currentQ.correct_answer = 'option_c';
        else if (['ঘ', 'd', '4'].includes(char)) currentQ.correct_answer = 'option_d';
        continue;
      }

      if (expMatch && currentQ) {
        currentQ.explanation = expMatch[2];
        continue;
      }

      if (optMatch && currentQ) {
        const label = optMatch[1].toLowerCase();
        const val = optMatch[2];
        if (['ক', 'a', '1'].includes(label)) currentQ.option_a = val;
        else if (['খ', 'b', '2'].includes(label)) currentQ.option_b = val;
        else if (['গ', 'c', '3'].includes(label)) currentQ.option_c = val;
        else if (['ঘ', 'd', '4'].includes(label)) currentQ.option_d = val;
        continue;
      }

      const qStart = line.match(/^([০-৯0-9]+\s*[\.\):-]|প্রশ্ন\s*[০-৯0-9]*[:\.\s]|Q[0-9]*[:\.\s])\s*(.+)$/i);
      if (qStart) {
        if (currentQ && currentQ.question && currentQ.option_a && currentQ.option_b) {
          questions.push({
            question: currentQ.question,
            option_a: currentQ.option_a || 'ক',
            option_b: currentQ.option_b || 'খ',
            option_c: currentQ.option_c || 'গ',
            option_d: currentQ.option_d || 'ঘ',
            correct_answer: currentQ.correct_answer || 'option_a',
            explanation: currentQ.explanation || '',
            subject: defaultSub,
            status: 'published',
            is_rtl: isArabicText(currentQ.question),
          });
        }
        currentQ = {
          question: qStart[2] || line,
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'option_a',
          explanation: '',
        };
        continue;
      }

      if (currentQ) {
        if (!currentQ.option_a) {
          currentQ.question += ' ' + line;
        }
      } else {
        currentQ = {
          question: line.replace(/^[০-৯0-9\.\)\s]+/, ''),
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'option_a',
          explanation: '',
        };
      }
    }

    if (currentQ && currentQ.question && currentQ.option_a && currentQ.option_b) {
      questions.push({
        question: currentQ.question,
        option_a: currentQ.option_a || 'ক',
        option_b: currentQ.option_b || 'খ',
        option_c: currentQ.option_c || 'গ',
        option_d: currentQ.option_d || 'ঘ',
        correct_answer: currentQ.correct_answer || 'option_a',
        explanation: currentQ.explanation || '',
        subject: defaultSub,
        status: 'published',
        is_rtl: isArabicText(currentQ.question),
      });
    }

    return questions;
  };

  // 1. Copy-Paste AI Handler
  const handleExtractQuestions = async () => {
    if (!rawText.trim()) {
      setExtractError('অনুগ্রহ করে পেস্ট করার ঘরে কিছু প্রশ্ন ও উত্তর লিখুন।');
      return;
    }

    setExtracting(true);
    setExtractError(null);
    setExtractedQuestions([]);

    try {
      const response = await fetch('/api/gemini/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, defaultSubject: subject }),
      });

      const resText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch (pErr) {
        data = null;
      }

      setExtracting(false);

      if (response.ok && data?.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setExtractedQuestions(
          data.questions.map((q: any) => ({
            ...q,
            subject: subject || q.subject || 'সাধারণ',
            is_rtl: isArabicText(q.question) || isArabicText(q.option_a),
          }))
        );
        return;
      }

      // Fallback parser
      const localParsed = parseBengaliMCQsLocally(rawText, subject);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
        return;
      }

      if (data && data.error) {
        setExtractError(data.error);
      } else {
        setExtractError('টেক্সট থেকে প্রশ্ন চেনা যায়নি। ফরম্যাট ঠিক করে চেষ্টা করুন।');
      }
    } catch (err: any) {
      setExtracting(false);
      const localParsed = parseBengaliMCQsLocally(rawText, subject);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
      } else {
        setExtractError('এআই সার্ভারে যুক্ত হতে সমস্যা হয়েছে। আপনার পেস্ট করা টেক্সট ফরম্যাট ঠিক আছে কিনা পরীক্ষা করুন।');
      }
    }
  };

  // 2. Topic Generator Handler
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setGenError('অনুগ্রহ করে একটি বিষয়বস্তু বা টপিক লিখুন।');
      return;
    }

    setGenerating(true);
    setGenError(null);
    setGeneratedQuestions([]);

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: subject || 'সাধারণ জ্ঞান',
          count: questionCount,
        }),
      });

      const resText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch (pErr) {
        data = null;
      }

      setGenerating(false);

      if (response.ok && data?.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setGeneratedQuestions(
          data.questions.map((q: any) => ({
            ...q,
            subject: subject || 'সাধারণ জ্ঞান',
            is_rtl: isArabicText(q.question) || isArabicText(q.option_a),
          }))
        );
      } else {
        setGenError(data?.error || 'এআই দিয়ে প্রশ্ন জেনারেট করতে ব্যর্থ হয়েছে। পরে চেষ্টা করুন।');
      }
    } catch (err: any) {
      setGenerating(false);
      setGenError(err?.message || 'এআই সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdateQuestion = (idx: number, updatedFields: Partial<any>) => {
    const updater = (prev: any[]) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updatedFields } : q));

    if (activeTab === 'copyPaste') {
      setExtractedQuestions(updater);
    } else {
      setGeneratedQuestions(updater);
    }
  };

  const handleAddManualQuestion = () => {
    const newQ = {
      question: 'নতুন প্রশ্ন লিখুন...',
      option_a: 'প্রথম অপশন',
      option_b: 'দ্বিতীয় অপশন',
      option_c: 'তৃতীয় অপশন',
      option_d: 'চতুর্থ অপশন',
      correct_answer: 'option_a',
      explanation: '',
      subject: subject || 'সাধারণ',
      is_rtl: isArabicText('নতুন প্রশ্ন লিখুন...'),
    };

    if (activeTab === 'copyPaste') {
      setExtractedQuestions((prev) => [newQ, ...prev]);
    } else {
      setGeneratedQuestions((prev) => [newQ, ...prev]);
    }
    setEditingIdx(0);
  };

  // Save previewed questions to Supabase public.questions
  const handleSaveToQuestionBank = async (questionsList: any[]) => {
    if (!questionsList || questionsList.length === 0) return;

    setSaving(true);
    setSaveSuccess(null);
    setModalError(null);

    const formattedForSave: Omit<Question, 'id' | 'created_at' | 'updated_at'>[] = questionsList.map((q) => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: (q.correct_answer as any) || 'option_a',
      explanation: q.explanation || '',
      status: 'published',
      subject: q.subject || subject || 'সাধারণ',
      topic: q.topic || topic || '',
      post: q.post || post || '',
    }));

    const { success, error } = await insertBatchQuestions(formattedForSave);

    setSaving(false);

    if (success) {
      setSaveSuccess(`সফলভাবে ${questionsList.length} টি প্রশ্ন প্রশ্ন ব্যাংকে যুক্ত করা হয়েছে!`);
      setTimeout(() => {
        onQuestionsSaved();
        onClose();
      }, 1500);
    } else {
      setModalError(error || 'প্রশ্ন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    }
  };

  const currentQuestions = activeTab === 'copyPaste' ? extractedQuestions : generatedQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                এআই প্রশ্ন মেকার (AI Question Generator)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                সহজে কপি-পেস্ট করে অথবা টপিক নাম দিয়ে প্রশ্ন ব্যাংকে প্রশ্ন যোগ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Buttons */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveTab('copyPaste');
              setSaveSuccess(null);
              setModalError(null);
            }}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 border ${
              activeTab === 'copyPaste'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Copy className="w-4 h-4" />
            কপি-পেস্ট (AI ডিটেক্ট)
          </button>

          <button
            onClick={() => {
              setActiveTab('topicGen');
              setSaveSuccess(null);
              setModalError(null);
            }}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 border ${
              activeTab === 'topicGen'
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            টপিক থেকে এআই জেনারেটর
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {modalError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Global Subject, Topic & Post Selector */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বিষয় / Subject:</label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {subjectList.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSubjectInput(!showAddSubjectInput)}
                    className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold shrink-0 transition-colors"
                    title="নতুন বিষয় যোগ করুন"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">টপিক / Topic:</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="যেমন: কারক ও বিভক্তি"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">পদ / Post (Designation):</label>
                <input
                  type="text"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  placeholder="যেমন: সহকারী শিক্ষক"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>

            {showAddSubjectInput && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  placeholder="যেমন: আল কুরআন, সূরা আল বাকারা..."
                  className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors"
                >
                  যোগ করুন
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: COPY PASTE */}
          {activeTab === 'copyPaste' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> এআই অটো-ডিটেকশন নির্দেশিকা:
                </span>
                বাংলা, ইংরেজি বা আরবি ভাষার কাঁচা প্রশ্ন ও উত্তর নিচের বক্সে পেস্ট করুন। এআই প্রশ্ন, চারটি অপশন, সঠিক উত্তর এবং ব্যাখ্যা স্বয়ংক্রিয়ভাবে ডিটেক্ট করে ফেলবে!
              </div>

              {extractError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  কাঁচা প্রশ্ন ও উত্তর পেস্ট করুন (Unformatted Text)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  placeholder={`উদাহরণ:
১. আল কুরআনের বৃহত্তম সূরার নাম কী?
ক. সূরা আল ইমরান
খ. সূরা আল বাকারা
গ. সূরা আন নিসা
ঘ. সূরা আল মায়িদাহ
উত্তর: খ
ব্যাখ্যা: সূরা আল বাকারা আল কুরআনের সবচেয়ে দীর্ঘতম সূরা।`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExtractQuestions}
                  disabled={extracting || !rawText.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      প্রশ্ন এক্সট্র্যাক্ট হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      এআই দিয়ে প্রশ্ন ও উত্তর ডিটেক্ট করুন
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TOPIC GENERATOR */}
          {activeTab === 'topicGen' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <Wand2 className="w-4 h-4 text-purple-400" /> টপিক থেকে অটো জেনারেটর:
                </span>
                শুধুমাত্র আপনার কাঙ্ক্ষিত টপিকের নাম লিখুন (বাংলা, আরবি বা ইংরেজি)। এআই ৪টি অপশন ও বিস্তারিত ব্যাখ্যাসহ সম্পূর্ণ সঠিক প্রশ্ন জেনারেট করে দেবে!
              </div>

              {genError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    টপিক / বিষয়বস্তু (Topic) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="যেমন: সূরা বাকারা, কারক ও বিভক্তি, বাংলাদেশের মুক্তিযুদ্ধ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      প্রশ্ন সংখ্যা (Count Select)
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-medium">কাস্টম সংখ্যা:</span>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 200))}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-purple-300 font-bold text-center focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-slate-400">টি</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 25, 30, 50, 100, 200].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          questionCount === num
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {num} টি
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateFromTopic}
                  disabled={generating || !topic.trim()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      এআই প্রশ্ন তৈরি করছে...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      এআই দিয়ে {questionCount} টি প্রশ্ন জেনারেট করুন
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW EXTRACTED/GENERATED QUESTIONS - INTERACTIVE APP PREVIEW WITH CLICK-TO-EDIT & RTL SUPPORT */}
          {currentQuestions.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    অ্যাপস প্রিভিউ কার্ডসমূহ ({currentQuestions.length} টি)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    যেকোনো প্রশ্ন সম্পাদনা করতে এডিট বাটন চাপুন। আরবি প্রশ্ন স্বয়ংক্রিয়ভাবে ডান দিকে (RTL) সাজানো থাকবে।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddManualQuestion}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ম্যানুয়ালি যোগ
                  </button>

                  <button
                    onClick={() => handleSaveToQuestionBank(currentQuestions)}
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        প্রশ্ন ব্যাংকে সেভ করুন
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {currentQuestions.map((q, idx) => {
                  const isEditing = editingIdx === idx;
                  const isArabic = q.is_rtl || isArabicText(q.question) || isArabicText(q.option_a);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl bg-slate-950 border transition-all ${
                        isEditing
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header Controls */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] border border-indigo-500/30">
                            প্রশ্ন #{idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(idx, { is_rtl: !isArabic })}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                              isArabic
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                            title="লেখা ডান/বাম এলাইনমেন্ট পরিবর্তন করুন"
                          >
                            <Globe className="w-3 h-3" />
                            {isArabic ? 'আরবি (RTL ডান)' : 'বাংলা/ENG (LTR বাম)'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingIdx(isEditing ? null : idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              isEditing
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isEditing ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> সম্পন্ন
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> এডিট
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (activeTab === 'copyPaste') {
                                setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx));
                              } else {
                                setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* EDIT MODE vs PREVIEW MODE */}
                      {isEditing ? (
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              প্রশ্ন:
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) =>
                                handleUpdateQuestion(idx, {
                                  question: e.target.value,
                                  is_rtl: isArabicText(e.target.value),
                                })
                              }
                              dir={isArabic ? 'rtl' : 'ltr'}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                ক. অপশন এ:
                              </label>
                              <input
                                type="text"
                                value={q.option_a}
                                onChange={(e) => handleUpdateQuestion(idx, { option_a: e.target.value })}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                খ. অপশন বি:
                              </label>
                              <input
                                type="text"
                                value={q.option_b}
                                onChange={(e) => handleUpdateQuestion(idx, { option_b: e.target.value })}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                গ. অপশন সি:
                              </label>
                              <input
                                type="text"
                                value={q.option_c}
                                onChange={(e) => handleUpdateQuestion(idx, { option_c: e.target.value })}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                ঘ. অপশন ডি:
                              </label>
                              <input
                                type="text"
                                value={q.option_d}
                                onChange={(e) => handleUpdateQuestion(idx, { option_d: e.target.value })}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-400 mb-1">
                                সঠিক উত্তর নির্বাচন করুন:
                              </label>
                              <select
                                value={q.correct_answer}
                                onChange={(e) => handleUpdateQuestion(idx, { correct_answer: e.target.value })}
                                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none"
                              >
                                <option value="option_a">ক (অপশন এ)</option>
                                <option value="option_b">খ (অপশন বি)</option>
                                <option value="option_c">গ (অপশন সি)</option>
                                <option value="option_d">ঘ (অপশন ডি)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                বিষয় / Subject:
                              </label>
                              <input
                                type="text"
                                value={q.subject || ''}
                                onChange={(e) => handleUpdateQuestion(idx, { subject: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-indigo-300 mb-1">
                              ব্যাখ্যা (Explanation):
                            </label>
                            <textarea
                              rows={2}
                              value={q.explanation || ''}
                              onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                              dir={isArabicText(q.explanation) ? 'rtl' : 'ltr'}
                              placeholder="ব্যাখ্যা লিখুন..."
                              className="w-full bg-slate-900 border border-indigo-900/60 rounded-xl p-2 text-xs text-indigo-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        /* APP-LIKE REALISTIC CARD PREVIEW */
                        <div className="space-y-3">
                          <p
                            dir={isArabic ? 'rtl' : 'ltr'}
                            className={`font-black text-sm text-slate-100 leading-relaxed ${
                              isArabic ? 'text-right font-serif' : 'text-left'
                            }`}
                          >
                            {idx + 1}. {q.question}
                          </p>

                          {/* Options Grid */}
                          <div
                            dir={isArabic ? 'rtl' : 'ltr'}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
                          >
                            {[
                              { key: 'option_a', label: isArabic ? 'أ' : 'ক', text: q.option_a },
                              { key: 'option_b', label: isArabic ? 'ب' : 'খ', text: q.option_b },
                              { key: 'option_c', label: isArabic ? 'ج' : 'গ', text: q.option_c },
                              { key: 'option_d', label: isArabic ? 'د' : 'ঘ', text: q.option_d },
                            ].map((opt) => {
                              const isCorrect = q.correct_answer === opt.key;
                              return (
                                <div
                                  key={opt.key}
                                  onClick={() => handleUpdateQuestion(idx, { correct_answer: opt.key })}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                    isArabic ? 'text-right justify-start' : 'text-left justify-start'
                                  } ${
                                    isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold ring-1 ring-emerald-500/30'
                                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="flex-1 truncate">{opt.text}</span>
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div
                              dir={isArabicText(q.explanation) ? 'rtl' : 'ltr'}
                              className={`text-[11px] text-indigo-300 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-900/40 ${
                                isArabicText(q.explanation) ? 'text-right' : 'text-left'
                              }`}
                            >
                              <span className="font-bold text-indigo-400">ব্যাখ্যা:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

