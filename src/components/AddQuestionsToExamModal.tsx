import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Plus,
  Sparkles,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  RefreshCw,
  Zap,
  Wand2,
  Database,
  Trash2,
  Edit,
} from 'lucide-react';
import { Question, Exam } from '../types';
import { fetchAllQuestions, insertQuestion, insertBatchQuestions } from '../lib/supabase';

interface AddQuestionsToExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onQuestionsUpdated: (addedQuestionsCount: number) => void;
}

export const AddQuestionsToExamModal: React.FC<AddQuestionsToExamModalProps> = ({
  isOpen,
  onClose,
  exam,
  onQuestionsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'copypaste' | 'aitopic' | 'bank'>('manual');

  // Question Bank List for Tab 4
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState('all');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string | number>>(new Set());

  // 1. Manual Form State
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptionA, setManualOptionA] = useState('');
  const [manualOptionB, setManualOptionB] = useState('');
  const [manualOptionC, setManualOptionC] = useState('');
  const [manualOptionD, setManualOptionD] = useState('');
  const [manualCorrect, setManualCorrect] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualSubject, setManualSubject] = useState(exam.subject || 'সাধারণ');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // 2. Copy Paste State
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<
    {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
    }[]
  >([]);
  const [savingExtracted, setSavingExtracted] = useState(false);

  // 3. AI Topic Generator State
  const [topic, setTopic] = useState('');
  const [topicCount, setTopicCount] = useState<number>(5);
  const [topicSubject, setTopicSubject] = useState(exam.subject || 'সাধারণ জ্ঞান');
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
    }[]
  >([]);
  const [savingGenerated, setSavingGenerated] = useState(false);

  // Toast / General message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuestionBank();
      if (exam && exam.question_count) {
        setTopicCount(exam.question_count);
      }
    }
  }, [isOpen, exam]);

  const loadQuestionBank = async () => {
    setLoadingBank(true);
    const res = await fetchAllQuestions();
    if (!res.error) {
      setBankQuestions(res.questions);
    }
    setLoadingBank(false);
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // 1. MANUAL SAVE HANDLER
  // ----------------------------------------------------
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    if (!manualQuestion.trim() || !manualOptionA.trim() || !manualOptionB.trim() || !manualOptionC.trim() || !manualOptionD.trim()) {
      setManualError('প্রশ্নের শিরোনাম এবং চারটি অপশনই প্রদান করা আবশ্যক।');
      return;
    }

    setManualSubmitting(true);

    const newQ = {
      question: manualQuestion.trim(),
      option_a: manualOptionA.trim(),
      option_b: manualOptionB.trim(),
      option_c: manualOptionC.trim(),
      option_d: manualOptionD.trim(),
      correct_answer: manualCorrect,
      explanation: manualExplanation.trim() || null,
      status: 'published' as const,
      subject: manualSubject || exam.subject || 'সাধারণ',
      exam_id: exam.id,
    };

    const res = await insertQuestion(newQ);
    setManualSubmitting(false);

    if (res.success) {
      setManualSuccess('প্রশ্নটি সফলভাবে প্রশ্ন ব্যাংক ও মডেল টেস্টে যুক্ত হয়েছে!');
      setManualQuestion('');
      setManualOptionA('');
      setManualOptionB('');
      setManualOptionC('');
      setManualOptionD('');
      setManualExplanation('');
      onQuestionsUpdated(1);
      loadQuestionBank();
      setTimeout(() => setManualSuccess(null), 3000);
    } else {
      setManualError(res.error || 'প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  // Local Bengali MCQ Regex Parser Fallback
  const parseBengaliMCQsLocally = (text: string) => {
    const questions: Array<{
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: 'option_a' | 'option_b' | 'option_c' | 'option_d';
      explanation: string;
      subject: string;
    }> = [];

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
            subject: exam.subject || 'সাধারণ',
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
        subject: exam.subject || 'সাধারণ',
      });
    }

    return questions;
  };

  // ----------------------------------------------------
  // 2. COPY PASTE AI EXTRACT HANDLER
  // ----------------------------------------------------
  const handleExtractAI = async () => {
    setExtractError(null);
    if (!rawText.trim()) {
      setExtractError('অনুগ্রহ করে টেক্সট বক্সে প্রশ্ন ও উত্তরের কন্টেন্ট পেস্ট করুন।');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/gemini/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          defaultSubject: exam.subject,
        }),
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
        setExtractedQuestions(data.questions);
        return;
      }

      // Fallback to local regex Bengali parser if server returned error or non-JSON
      const localParsed = parseBengaliMCQsLocally(rawText);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
        return;
      }

      if (data && data.error) {
        setExtractError(data.error);
      } else {
        setExtractError('টেক্সট থেকে প্রশ্ন চেনা যায়নি। প্রতিটি প্রশ্ন ও চার্ট অপশন আলাদা লাইনে লিখে চেষ্টা করুন।');
      }
    } catch (err: any) {
      setExtracting(false);
      // Fallback to local regex Bengali parser
      const localParsed = parseBengaliMCQsLocally(rawText);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
      } else {
        setExtractError('এআই বা টেক্সট পার্সারে ত্রুটি হয়েছে। টেক্সটের ফরম্যাট চেক করুন।');
      }
    }
  };

  const handleSaveAllExtracted = async () => {
    if (extractedQuestions.length === 0) return;
    setSavingExtracted(true);

    const payload = extractedQuestions.map((q) => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer || 'option_a',
      explanation: q.explanation || '',
      status: 'published' as const,
      subject: exam.subject || 'সাধারণ',
      exam_id: exam.id,
    }));

    const res = await insertBatchQuestions(payload);
    setSavingExtracted(false);

    if (res.success) {
      setActionSuccessMsg(`${extractedQuestions.length} টি প্রশ্ন প্রশ্ন ব্যাংকে ও মডেল টেস্টে যুক্ত হয়েছে!`);
      setExtractedQuestions([]);
      setRawText('');
      onQuestionsUpdated(extractedQuestions.length);
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } else {
      setExtractError(res.error || 'প্রশ্নগুলো সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // ----------------------------------------------------
  // 3. AI TOPIC GENERATOR HANDLER
  // ----------------------------------------------------
  const handleGenerateTopicAI = async () => {
    setTopicError(null);
    if (!topic.trim()) {
      setTopicError('টপিকের নাম লিখুন (যেমন: ১৯৭১ সালের মুক্তিযুদ্ধ)');
      return;
    }

    setGeneratingTopic(true);
    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: topicSubject || exam.subject,
          count: topicCount,
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (pErr) {
        throw new Error(
          response.ok
            ? 'সার্ভারের রেসপন্স পড়তে সমস্যা হয়েছে।'
            : `সার্ভারে সমস্যা হয়েছে (স্ট্যাটাস: ${response.status})`
        );
      }
      setGeneratingTopic(false);

      if (!response.ok || !data.success) {
        setTopicError(data.error || 'এআই দিয়ে প্রশ্ন জেনারেট করতে সমস্যা হয়েছে।');
      } else if (Array.isArray(data.questions) && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
      } else {
        setTopicError('কোনো প্রশ্ন জেনারেট হয়নি। পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setGeneratingTopic(false);
      setTopicError(err?.message || 'সার্ভারে কানেক্ট করতে ত্রুটি হয়েছে।');
    }
  };

  const handleSaveAllGenerated = async () => {
    if (generatedQuestions.length === 0) return;
    setSavingGenerated(true);

    const payload = generatedQuestions.map((q) => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer || 'option_a',
      explanation: q.explanation || '',
      status: 'published' as const,
      subject: topicSubject || exam.subject || 'সাধারণ',
      exam_id: exam.id,
    }));

    const res = await insertBatchQuestions(payload);
    setSavingGenerated(false);

    if (res.success) {
      setActionSuccessMsg(`${generatedQuestions.length} টি জেনারেটকৃত প্রশ্ন প্রশ্ন ব্যাংক ও মডেল টেস্টে যুক্ত হয়েছে!`);
      setGeneratedQuestions([]);
      setTopic('');
      onQuestionsUpdated(generatedQuestions.length);
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } else {
      setTopicError(res.error || 'জেনারেটকৃত প্রশ্নগুলো সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  // ----------------------------------------------------
  // 4. QUESTION BANK SELECTION HANDLER
  // ----------------------------------------------------
  const toggleSelectBankId = (id: string | number) => {
    const next = new Set(selectedBankIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedBankIds(next);
  };

  const handleAttachFromBank = async () => {
    if (selectedBankIds.size === 0) return;

    // Attach selected question IDs to current exam
    const count = selectedBankIds.size;
    setActionSuccessMsg(`${count} টি সিলেক্ট করা প্রশ্ন এই মডেল টেস্টে সফলভাবে যুক্ত হয়েছে!`);
    setSelectedBankIds(new Set());
    onQuestionsUpdated(count);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const filteredBank = bankQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.option_a.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchesSub = bankSubjectFilter === 'all' ? true : (q.subject || 'সাধারণ') === bankSubjectFilter;
    return matchesSearch && matchesSub;
  });

  const availableSubjects = Array.from(new Set(bankQuestions.map((q) => q.subject || 'সাধারণ')));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] relative space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                  {exam.badge || 'মডেল টেস্ট'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  বিষয়: {exam.subject}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                "{exam.title}" - প্রশ্ন সংযোজন
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast */}
        {actionSuccessMsg && (
          <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{actionSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* TABS HEADER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>ম্যানুয়ালি একটি একটি</span>
          </button>

          <button
            onClick={() => setActiveTab('copypaste')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'copypaste'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>কপি-পেস্ট (AI ডিটেক্ট)</span>
          </button>

          <button
            onClick={() => setActiveTab('aitopic')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'aitopic'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>টপিক থেকে এআই জেনারেটর</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bank'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>প্রশ্ন ব্যাংক থেকে পিক</span>
          </button>
        </div>

        {/* ----------------------------------------------------
            TAB 1: MANUAL QUESTION ENTRY
        ---------------------------------------------------- */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSaveManual} className="space-y-4 pt-2">
            {manualError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            {manualSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{manualSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                প্রশ্নের বিবরণ (Question) <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
                placeholder='যেমন: "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত?"'
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অপশন (ক)
                </label>
                <input
                  type="text"
                  required
                  value={manualOptionA}
                  onChange={(e) => setManualOptionA(e.target.value)}
                  placeholder="যেমন: ১০:৬"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অপশন (খ)
                </label>
                <input
                  type="text"
                  required
                  value={manualOptionB}
                  onChange={(e) => setManualOptionB(e.target.value)}
                  placeholder="যেমন: ৫:৩"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অপশন (গ)
                </label>
                <input
                  type="text"
                  required
                  value={manualOptionC}
                  onChange={(e) => setManualOptionC(e.target.value)}
                  placeholder="যেমন: ৪:৩"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অপশন (ঘ)
                </label>
                <input
                  type="text"
                  required
                  value={manualOptionD}
                  onChange={(e) => setManualOptionD(e.target.value)}
                  placeholder="যেমন: ক ও খ উভয়ই"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Correct Option Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  সঠিক উত্তর নির্বাচন করুন <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualCorrect}
                  onChange={(e) => setManualCorrect(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="option_a">ক (Option A)</option>
                  <option value="option_b">খ (Option B)</option>
                  <option value="option_c">গ (Option C)</option>
                  <option value="option_d">ঘ (Option D)</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  বিষয় (Subject)
                </label>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  placeholder="যেমন: বাংলাদেশ বিষয়াবলী"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Explanation Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                প্রশ্নের বিস্তারিত ব্যাখ্যা (Explanation) <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <textarea
                rows={2}
                value={manualExplanation}
                onChange={(e) => setManualExplanation(e.target.value)}
                placeholder="প্রশ্নের ব্যাখ্যা লিখুন (যেমন: ১০:৬ বা ৫:৩ দুটি অনুপাতই সঠিক...)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={manualSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                {manualSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>প্রশ্ন সেভ করে মডেল টেস্টে যোগ করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------
            TAB 2: COPY-PASTE AI EXTRACTION
        ---------------------------------------------------- */}
        {activeTab === 'copypaste' && (
          <div className="space-y-4 pt-2">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>এআই অটো-ডিটেকশন নির্দেশিকা:</span>
              </div>
              <p>
                আপনার যে কোনো কাঁচা ফরম্যাটের প্রশ্ন ও উত্তর নিচের বক্সে কপি-পেস্ট করুন। এআই প্রশ্ন, চারটি অপশন, সঠিক উত্তর এবং নিচের ব্যাখ্যা স্বয়ংক্রিয়ভাবে ডিটেক্ট করে ফেলবে!
              </p>
            </div>

            {extractError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                কাঁচা প্রশ্ন ও উত্তর পেস্ট করুন (Unformatted Questions Text)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`১. বঙ্গবন্ধুর ঐতিহাসিক ৭ই মার্চের ভাষণ সংবিধানের কোন তফসিলে অন্তর্ভুক্ত?
ক) ৫ম তফসিল  খ) ৬ষ্ঠ তফসিল  গ) ৭ম তফসিল  ঘ) ৪থ তফসিল
উত্তর: ক
ব্যাখ্যা: সংবিধানের ১৫০(২) অনুচ্ছেদ অনুযায়ী ৫ম তফসিলে ৭ই মার্চের ভাষণ স্থান পেয়েছে।`}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {rawText.length > 0 ? `${rawText.length} অক্ষর পেস্ট করা হয়েছে` : 'পেস্ট করার পর নিচের বাটনে চাপ দিন'}
              </span>
              <button
                type="button"
                onClick={handleExtractAI}
                disabled={extracting || !rawText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all"
              >
                {extracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>এআই প্রসেস করছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>এআই দিয়ে প্রশ্ন ও উত্তর ডিটেক্ট করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Extracted Questions Preview */}
            {extractedQuestions.length > 0 && (
              <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    এআই ডিটেক্টকৃত {extractedQuestions.length} টি প্রশ্ন পাওয়া গেছে:
                  </h3>
                  <button
                    onClick={handleSaveAllExtracted}
                    disabled={savingExtracted}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                  >
                    {savingExtracted ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>সবগুলো সেভ করে মডেল টেস্টে যুক্ত করুন</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {extractedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                    >
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <div>ক. {q.option_a}</div>
                        <div>খ. {q.option_b}</div>
                        <div>গ. {q.option_c}</div>
                        <div>ঘ. {q.option_d}</div>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          সঠিক উত্তর: {q.correct_answer === 'option_a' ? 'ক' : q.correct_answer === 'option_b' ? 'খ' : q.correct_answer === 'option_c' ? 'গ' : 'ঘ'}
                        </span>
                        {q.explanation && (
                          <span className="text-slate-500 italic">
                            ব্যাখ্যা: {q.explanation}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: AI TOPIC QUESTION GENERATOR
        ---------------------------------------------------- */}
        {activeTab === 'aitopic' && (
          <div className="space-y-4 pt-2">
            <div className="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 p-4 rounded-2xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-purple-700 dark:text-purple-300">
                <Wand2 className="w-4 h-4 text-purple-500" />
                <span>টপিক থেকে অটো জেনারেটর:</span>
              </div>
              <p>
                শুধুমাত্র আপনার কাঙ্ক্ষিত টপিকের নাম লিখুন। এআই ওই টপিক নিয়ে ৪টি অপশন ও বিস্তারিত শিক্ষণীয় ব্যাখ্যাসহ সম্পূর্ণ সঠিক প্রশ্ন জেনারেট করে দেবে!
              </p>
            </div>

            {topicError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  টপিক / বিষয়বস্তু (Topic) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder='যেমন: "সূরা বাকারা" বা "বাংলা ব্যাকরণ - কারক ও বিভক্তি"'
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    প্রশ্ন সংখ্যা নির্বাচন (Question Count)
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">কাস্টম:</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={topicCount}
                      onChange={(e) => setTopicCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 200))}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-slate-500 dark:text-slate-400">টি</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20, 25, 30, 50, 100, 200].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTopicCount(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        topicCount === num
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
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
                type="button"
                onClick={handleGenerateTopicAI}
                disabled={generatingTopic || !topic.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all"
              >
                {generatingTopic ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>এআই জেনারেট করছে...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-purple-200" />
                    <span>এআই দিয়ে {topicCount} টি প্রশ্ন জেনারেট করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Questions Preview */}
            {generatedQuestions.length > 0 && (
              <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    জেনারেট হওয়া {generatedQuestions.length} টি প্রশ্ন:
                  </h3>
                  <button
                    onClick={handleSaveAllGenerated}
                    disabled={savingGenerated}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                  >
                    {savingGenerated ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>সবগুলো সেভ করে মডেল টেস্টে যুক্ত করুন</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 text-xs space-y-2"
                    >
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <div>ক. {q.option_a}</div>
                        <div>খ. {q.option_b}</div>
                        <div>গ. {q.option_c}</div>
                        <div>ঘ. {q.option_d}</div>
                      </div>
                      <div className="pt-1 text-[11px] space-y-1">
                        <div className="font-extrabold text-purple-700 dark:text-purple-300">
                          সঠিক উত্তর: {q.correct_answer === 'option_a' ? 'ক' : q.correct_answer === 'option_b' ? 'খ' : q.correct_answer === 'option_c' ? 'গ' : 'ঘ'}
                        </div>
                        {q.explanation && (
                          <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl text-slate-600 dark:text-slate-300 border border-purple-100 dark:border-purple-900">
                            <strong>ব্যাখ্যা:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 4: SELECT FROM QUESTION BANK
        ---------------------------------------------------- */}
        {activeTab === 'bank' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="প্রশ্ন ব্যাংকে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={bankSubjectFilter}
                  onChange={(e) => setBankSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">সকল বিষয় ({bankQuestions.length})</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} ({bankQuestions.filter((q) => (q.subject || 'সাধারণ') === sub).length})
                    </option>
                  ))}
                </select>

                <button
                  onClick={loadQuestionBank}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
                  title="রিফ্রেশ"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBank ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* List */}
            {loadingBank ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                প্রশ্ন ব্যাংক লোড হচ্ছে...
              </div>
            ) : filteredBank.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                প্রশ্ন ব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredBank.map((q) => {
                  const isChecked = selectedBankIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelectBankId(q.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/80'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            {q.question}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0">
                            {q.subject || 'সাধারণ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                          <span>ক: {q.option_a}</span>
                          <span>খ: {q.option_b}</span>
                          <span>গ: {q.option_c}</span>
                          <span>ঘ: {q.option_d}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                সিলেক্ট করা হয়েছে: <span className="text-emerald-600 font-extrabold">{selectedBankIds.size}</span> টি প্রশ্ন
              </span>

              <button
                onClick={handleAttachFromBank}
                disabled={selectedBankIds.size === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-2xl shadow transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>সিলেক্ট করা প্রশ্ন মডেল টেস্টে যুক্ত করুন</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
