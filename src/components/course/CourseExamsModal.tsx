import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit,
  CheckCircle,
  HelpCircle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Sparkles,
  Copy,
  Wand2,
  Database,
  Loader2,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  Globe,
  PlusCircle,
  Edit3,
  ArrowLeft,
} from 'lucide-react';
import { Course, CourseExam, CourseExamQuestion, Question } from '../../types';
import { fetchAllQuestions } from '../../lib/supabase';
import { isArabicText } from '../AddAiQuestionsModal';

interface CourseExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  exams: CourseExam[];
  loading: boolean;
  onAddExam: (examData: Omit<CourseExam, 'id' | 'created_at'>) => Promise<void>;
  onUpdateExam: (id: string, updatedFields: Partial<CourseExam>) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onToggleLock: (exam: CourseExam) => Promise<void>;
}

export const CourseExamsModal: React.FC<CourseExamsModalProps> = ({
  isOpen,
  onClose,
  course,
  exams,
  loading,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onToggleLock,
}) => {
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<CourseExam | null>(null);

  // Active question adding tab inside an exam
  const [questionTab, setQuestionTab] = useState<'manual' | 'copypaste' | 'aitopic' | 'bank'>('copypaste');

  // Exam Form State (for creating/editing an exam)
  const [examForm, setExamForm] = useState({
    title: '',
    subject: course.category || 'আরবি',
    topic: '',
    question_count: 20,
    time_minutes: 15,
    total_marks: 20,
    pass_marks: 10,
    negative_marks: 0.25,
    is_locked: false,
    instructions: 'প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হবে।',
  });

  // 1. Manual Question Form State
  const [questionForm, setQuestionForm] = useState<{
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
  }>({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'option_a',
    explanation: '',
  });

  // 2. Copy-Paste AI Extraction State
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<CourseExamQuestion[]>([]);
  const [editingExtractedIdx, setEditingExtractedIdx] = useState<number | null>(null);

  // 3. AI Topic Generator State
  const [topicInput, setTopicInput] = useState('');
  const [topicSubject, setTopicSubject] = useState('');
  const [topicQuestionCount, setTopicQuestionCount] = useState<number>(10);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicGenError, setTopicGenError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<CourseExamQuestion[]>([]);
  const [editingGeneratedIdx, setEditingGeneratedIdx] = useState<number | null>(null);

  // 4. Master Question Bank State
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState('all');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string | number>>(new Set());

  // Inline editing for existing exam questions
  const [editingExamQuestionIdx, setEditingExamQuestionIdx] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeExamForQuestions) {
      const refreshed = exams.find((e) => e.id === activeExamForQuestions.id);
      if (refreshed) {
        setActiveExamForQuestions(refreshed);
      }
      setTopicInput(activeExamForQuestions.topic || activeExamForQuestions.title || '');
      setTopicSubject(activeExamForQuestions.subject || course.category || 'আরবি');
      if (activeExamForQuestions.question_count) {
        setTopicQuestionCount(activeExamForQuestions.question_count);
      }
    }
  }, [exams]);

  // Load question bank when opening bank tab
  useEffect(() => {
    if (activeExamForQuestions && questionTab === 'bank' && bankQuestions.length === 0) {
      loadQuestionBank();
    }
  }, [activeExamForQuestions, questionTab]);

  const loadQuestionBank = async () => {
    setLoadingBank(true);
    const res = await fetchAllQuestions();
    if (!res.error && res.questions) {
      setBankQuestions(res.questions);
    }
    setLoadingBank(false);
  };

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // EXAM CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim()) return;

    if (editingExamId) {
      await onUpdateExam(editingExamId, {
        title: examForm.title.trim(),
        subject: examForm.subject,
        topic: examForm.topic,
        question_count: Number(examForm.question_count || 20),
        time_minutes: Number(examForm.time_minutes || 15),
        total_marks: Number(examForm.total_marks || 20),
        pass_marks: Number(examForm.pass_marks || 10),
        negative_marks: Number(examForm.negative_marks || 0.25),
        is_locked: examForm.is_locked,
        instructions: examForm.instructions,
      });
      setEditingExamId(null);
    } else {
      await onAddExam({
        course_id: course.id,
        title: examForm.title.trim(),
        subject: examForm.subject,
        topic: examForm.topic,
        question_count: Number(examForm.question_count || 20),
        time_minutes: Number(examForm.time_minutes || 15),
        total_marks: Number(examForm.total_marks || 20),
        pass_marks: Number(examForm.pass_marks || 10),
        negative_marks: Number(examForm.negative_marks || 0.25),
        is_locked: examForm.is_locked,
        position: exams.length + 1,
        instructions: examForm.instructions,
        questions: [],
      });
    }

    setExamForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      question_count: 20,
      time_minutes: 15,
      total_marks: 20,
      pass_marks: 10,
      negative_marks: 0.25,
      is_locked: false,
      instructions: 'প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হবে।',
    });
  };

  const handleStartEditExam = (exam: CourseExam) => {
    setEditingExamId(exam.id);
    setExamForm({
      title: exam.title,
      subject: exam.subject || 'আরবি',
      topic: exam.topic || '',
      question_count: exam.question_count,
      time_minutes: exam.time_minutes,
      total_marks: exam.total_marks,
      pass_marks: exam.pass_marks || 10,
      negative_marks: exam.negative_marks,
      is_locked: exam.is_locked,
      instructions: exam.instructions || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setExamForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      question_count: 20,
      time_minutes: 15,
      total_marks: 20,
      pass_marks: 10,
      negative_marks: 0.25,
      is_locked: false,
      instructions: '',
    });
  };

  // --------------------------------------------------------------------------
  // 1. MANUAL QUESTION ADD HANDLER
  // --------------------------------------------------------------------------
  const handleAddManualQuestionToExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExamForQuestions || !questionForm.question.trim()) return;

    const newQuestion: CourseExamQuestion = {
      id: `q-${Date.now()}`,
      question: questionForm.question.trim(),
      option_a: questionForm.option_a.trim() || 'ক. অপশন ১',
      option_b: questionForm.option_b.trim() || 'খ. অপশন ২',
      option_c: questionForm.option_c.trim() || 'গ. অপশন ৩',
      option_d: questionForm.option_d.trim() || 'ঘ. অপশন ৪',
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation.trim() || undefined,
      subject: activeExamForQuestions.subject,
      topic: activeExamForQuestions.topic,
    };

    const currentQuestions = activeExamForQuestions.questions || [];
    const updatedQuestions = [...currentQuestions, newQuestion];

    await onUpdateExam(activeExamForQuestions.id, {
      questions: updatedQuestions,
      question_count: updatedQuestions.length,
      total_marks: updatedQuestions.length,
    });

    setQuestionForm({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'option_a',
      explanation: '',
    });

    showSuccessBanner('প্রশ্নটি পরীক্ষায় সফলভাবে যুক্ত করা হয়েছে!');
  };

  // --------------------------------------------------------------------------
  // 2. COPY-PASTE AI EXTRACTION & LOCAL FALLBACK PARSER
  // --------------------------------------------------------------------------
  const parseBengaliMCQsLocally = (text: string, defaultSub: string) => {
    const questions: CourseExamQuestion[] = [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentQ: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const optMatch = line.match(/^([কখগঘa-dA-D1-4أبجد])[\.\)\:-]\s*(.+)$/);
      const ansMatch =
        line.match(/^(সঠিক\s*)?উত্তর[:\s]+([কখগঘa-dA-D1-4أبجد])/i) ||
        line.match(/^Ans(wer)?[:\s]+([কখগঘa-dA-D1-4أبجد])/i) ||
        line.match(/^(الإجابة\s*الصحيحة|الجواب|الإجابة)[:\s]+([কখগঘa-dA-D1-4أبجد])/i);
      const expMatch = line.match(/^(ব্যাখ্যা|নোট|Explanation|Note|الشرح|التوضيح)[:\s]+(.+)$/i);

      if (ansMatch && currentQ) {
        const char = ansMatch[ansMatch.length - 1].toLowerCase();
        if (['ক', 'a', '1', 'أ'].includes(char)) currentQ.correct_answer = 'option_a';
        else if (['খ', 'b', '2', 'ب'].includes(char)) currentQ.correct_answer = 'option_b';
        else if (['গ', 'c', '3', 'ج'].includes(char)) currentQ.correct_answer = 'option_c';
        else if (['ঘ', 'd', '4', 'د'].includes(char)) currentQ.correct_answer = 'option_d';
        continue;
      }

      if (expMatch && currentQ) {
        currentQ.explanation = expMatch[2];
        continue;
      }

      if (optMatch && currentQ) {
        const label = optMatch[1].toLowerCase();
        const val = optMatch[2];
        if (['ক', 'a', '1', 'أ'].includes(label)) currentQ.option_a = val;
        else if (['খ', 'b', '2', 'ب'].includes(label)) currentQ.option_b = val;
        else if (['গ', 'c', '3', 'ج'].includes(label)) currentQ.option_c = val;
        else if (['ঘ', 'd', '4', 'د'].includes(label)) currentQ.option_d = val;
        continue;
      }

      const qStart = line.match(/^([০-৯0-9\u0660-\u0669\u06f0-\u06f9]+\s*[\.\):-]|প্রশ্ন\s*[০-৯0-9]*[:\.\s]|Q[0-9]*[:\.\s]|السؤال\s*[\u0660-\u0669\u06f0-\u06f90-9]*[:\.\s]|س\s*[\u0660-\u0669\u06f0-\u06f90-9]*[:\.\s])\s*(.+)$/i);
      if (qStart) {
        if (currentQ && currentQ.question && currentQ.option_a && currentQ.option_b) {
          questions.push({
            id: `q-${Date.now()}-${questions.length}`,
            question: currentQ.question,
            option_a: currentQ.option_a || 'ক',
            option_b: currentQ.option_b || 'খ',
            option_c: currentQ.option_c || 'গ',
            option_d: currentQ.option_d || 'ঘ',
            correct_answer: currentQ.correct_answer || 'option_a',
            explanation: currentQ.explanation || '',
            subject: defaultSub,
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
          question: line.replace(/^[০-৯0-9\u0660-\u0669\u06f0-\u06f9\.\)\s]+/, ''),
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
        id: `q-${Date.now()}-${questions.length}`,
        question: currentQ.question,
        option_a: currentQ.option_a || 'ক',
        option_b: currentQ.option_b || 'খ',
        option_c: currentQ.option_c || 'গ',
        option_d: currentQ.option_d || 'ঘ',
        correct_answer: currentQ.correct_answer || 'option_a',
        explanation: currentQ.explanation || '',
        subject: defaultSub,
      });
    }

    return questions;
  };

  const handleExtractQuestions = async () => {
    if (!rawText.trim()) {
      setExtractError('অনুগ্রহ করে পেস্ট করার ঘরে কিছু প্রশ্ন ও উত্তর লিখুন।');
      return;
    }

    setExtracting(true);
    setExtractError(null);
    setExtractedQuestions([]);

    const subjectToUse = activeExamForQuestions?.subject || course.category || 'আরবি';

    try {
      const response = await fetch('/api/gemini/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, defaultSubject: subjectToUse }),
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
          data.questions.map((q: any, i: number) => ({
            id: `q-${Date.now()}-${i}`,
            question: q.question,
            option_a: q.option_a || 'ক',
            option_b: q.option_b || 'খ',
            option_c: q.option_c || 'গ',
            option_d: q.option_d || 'ঘ',
            correct_answer: q.correct_answer || 'option_a',
            explanation: q.explanation || '',
            subject: subjectToUse,
            topic: activeExamForQuestions?.topic || '',
          }))
        );
        return;
      }

      // Local Regex Fallback
      const localParsed = parseBengaliMCQsLocally(rawText, subjectToUse);
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
      const localParsed = parseBengaliMCQsLocally(rawText, subjectToUse);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
      } else {
        setExtractError('এআই সার্ভারে যুক্ত হতে সমস্যা হয়েছে। পেস্ট করা টেক্সট ফরম্যাট ঠিক আছে কিনা পরীক্ষা করুন।');
      }
    }
  };

  // --------------------------------------------------------------------------
  // 3. AI TOPIC GENERATOR HANDLER
  // --------------------------------------------------------------------------
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setTopicGenError('অনুগ্রহ করে একটি বিষয়বস্তু বা টপিক লিখুন।');
      return;
    }

    setGeneratingTopic(true);
    setTopicGenError(null);
    setGeneratedQuestions([]);

    const subjectToUse = topicSubject.trim() || activeExamForQuestions?.subject || course.category || 'আরবি';

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          subject: subjectToUse,
          count: topicQuestionCount,
        }),
      });

      const resText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch (pErr) {
        data = null;
      }

      setGeneratingTopic(false);

      if (response.ok && data?.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setGeneratedQuestions(
          data.questions.map((q: any, i: number) => ({
            id: `q-${Date.now()}-${i}`,
            question: q.question,
            option_a: q.option_a || 'ক',
            option_b: q.option_b || 'খ',
            option_c: q.option_c || 'গ',
            option_d: q.option_d || 'ঘ',
            correct_answer: q.correct_answer || 'option_a',
            explanation: q.explanation || '',
            subject: subjectToUse,
            topic: topicInput.trim(),
          }))
        );
      } else {
        setTopicGenError(data?.error || 'এআই দিয়ে প্রশ্ন জেনারেট করতে ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      setGeneratingTopic(false);
      setTopicGenError(err?.message || 'এআই সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
    }
  };

  // --------------------------------------------------------------------------
  // BATCH ADD TO ACTIVE EXAM (FOR EXTRACTED / GENERATED / BANK)
  // --------------------------------------------------------------------------
  const handleBatchAddQuestionsToActiveExam = async (questionsToAdd: CourseExamQuestion[]) => {
    if (!activeExamForQuestions || questionsToAdd.length === 0) return;

    const currentQuestions = activeExamForQuestions.questions || [];
    const updated = [...currentQuestions, ...questionsToAdd];

    await onUpdateExam(activeExamForQuestions.id, {
      questions: updated,
      question_count: updated.length,
      total_marks: updated.length,
    });

    showSuccessBanner(`সফলভাবে ${questionsToAdd.length} টি প্রশ্ন এই মডেল টেস্টে যুক্ত হয়েছে!`);
  };

  // 4. Bank Import Handler
  const handleImportSelectedFromBank = async () => {
    if (!activeExamForQuestions || selectedBankIds.size === 0) return;

    const selectedList = bankQuestions.filter((q) => selectedBankIds.has(q.id));
    const formatted: CourseExamQuestion[] = selectedList.map((q, i) => ({
      id: `q-${Date.now()}-${i}`,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      subject: q.subject || activeExamForQuestions.subject,
      topic: q.topic || activeExamForQuestions.topic,
    }));

    await handleBatchAddQuestionsToActiveExam(formatted);
    setSelectedBankIds(new Set());
  };

  // --------------------------------------------------------------------------
  // DELETE & EDIT QUESTIONS INSIDE ACTIVE EXAM
  // --------------------------------------------------------------------------
  const handleDeleteQuestionFromExam = async (questionId?: string, idx?: number) => {
    if (!activeExamForQuestions) return;
    const current = activeExamForQuestions.questions || [];
    const filtered = current.filter((q, i) => (q.id ? q.id !== questionId : i !== idx));
    await onUpdateExam(activeExamForQuestions.id, {
      questions: filtered,
      question_count: filtered.length,
      total_marks: filtered.length,
    });
    showSuccessBanner('প্রশ্নটি মুছে ফেলা হয়েছে।');
  };

  const handleUpdateExamQuestion = async (idx: number, updatedFields: Partial<CourseExamQuestion>) => {
    if (!activeExamForQuestions) return;
    const current = activeExamForQuestions.questions || [];
    const updated = current.map((q, i) => (i === idx ? { ...q, ...updatedFields } : q));
    await onUpdateExam(activeExamForQuestions.id, {
      questions: updated,
    });
  };

  // Filter bank questions
  const filteredBankQuestions = bankQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchesSubject = bankSubjectFilter === 'all' || q.subject === bankSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const uniqueBankSubjects = Array.from(new Set(bankQuestions.map((q) => q.subject).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  মডেল টেস্ট ও এআই প্রশ্ন নির্মাতা: {course.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {course.badge}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium mt-0.5">
                কোর্সের পরীক্ষা ও প্রশ্ন স্বয়ংক্রিয় এআই দ্বারা যুক্ত করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Toast Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* ACTIVE EXAM QUESTION BUILDER VIEW (WITH ALL 4 METHODS INCLUDING AI) */}
          {/* ========================================================================= */}
          {activeExamForQuestions ? (
            <div className="space-y-6">
              {/* Active Exam Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 p-4 sm:p-5 rounded-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      প্রশ্ন ব্যবস্থাপনা মোড
                    </span>
                    <span className="text-xs text-slate-400">
                      বিষয়: <b className="text-slate-200">{activeExamForQuestions.subject}</b>
                    </span>
                    {activeExamForQuestions.topic && (
                      <span className="text-xs text-slate-400">
                        &bull; টপিক: <b className="text-amber-300">{activeExamForQuestions.topic}</b>
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    {activeExamForQuestions.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <span>
                      মোট প্রশ্ন: <b className="text-amber-400">{activeExamForQuestions.questions?.length || 0} টি</b>
                    </span>
                    <span>
                      সময়: <b className="text-slate-200">{activeExamForQuestions.time_minutes} মিনিট</b>
                    </span>
                    <span>
                      মোট নম্বর: <b className="text-slate-200">{activeExamForQuestions.total_marks || activeExamForQuestions.questions?.length || 0}</b>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveExamForQuestions(null);
                    setExtractedQuestions([]);
                    setGeneratedQuestions([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors self-start sm:self-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  পরীক্ষার তালিকায় ফিরুন
                </button>
              </div>

              {/* 4 Question Creation Tabs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-5">
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setQuestionTab('copypaste')}
                    className={`flex-1 min-w-[150px] py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      questionTab === 'copypaste'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    কপি-পেস্ট (AI ডিটেক্ট)
                  </button>

                  <button
                    onClick={() => setQuestionTab('aitopic')}
                    className={`flex-1 min-w-[150px] py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      questionTab === 'aitopic'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    টপিক থেকে এআই জেনারেটর
                  </button>

                  <button
                    onClick={() => setQuestionTab('bank')}
                    className={`flex-1 min-w-[150px] py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      questionTab === 'bank'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    মাস্টার প্রশ্ন ব্যাংক থেকে নির্বাচন
                  </button>

                  <button
                    onClick={() => setQuestionTab('manual')}
                    className={`flex-1 min-w-[150px] py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      questionTab === 'manual'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    ম্যানুয়ালি একটি একটি করে
                  </button>
                </div>

                {/* TAB 1: COPY-PASTE AI EXTRACTION */}
                {questionTab === 'copypaste' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
                      <span className="font-bold flex items-center gap-1.5 mb-1 text-indigo-200">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> এআই কপি-পেস্ট নির্দেশিকা:
                      </span>
                      পিডিএফ, ওয়ার্ড ফাইল, ফেসবুক পোস্ট বা বই থেকে যেকোনো প্রশ্ন ও উত্তর নিচের ঘরে পেস্ট করুন। এআই স্বয়ংক্রিয়ভাবে প্রশ্ন, ৪টি অপশন ও সঠিক উত্তর সাজিয়ে দেবে!
                    </div>

                    {extractError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{extractError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        কাঁচা প্রশ্ন ও উত্তর পেস্ট করুন (বাংলা, আরবি বা ইংরেজি):
                      </label>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        rows={7}
                        placeholder={`উদাহরণ:
১. আল কুরআনের সর্বপ্রথম নাজিলকৃত সূরার নাম কী?
ক. সূরা আল বাকারা
খ. সূরা আল আলাক
গ. সূরা আল ফাতিহা
ঘ. সূরা আল ইখলাস
উত্তর: খ
ব্যাখ্যা: জিব্রাইল (আ.) হেরা গুহায় রাসূলুল্লাহ (সা.) এর ওপর সূরা আলাকের প্রথম ৫টি আয়াত নাজিল করেন।`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleExtractQuestions}
                        disabled={extracting || !rawText.trim()}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            এআই প্রশ্ন এক্সট্র্যাক্ট করছে...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            এআই দিয়ে প্রশ্ন ও উত্তর ডিটেক্ট করুন
                          </>
                        )}
                      </button>
                    </div>

                    {/* Preview Extracted Questions */}
                    {extractedQuestions.length > 0 && (
                      <div className="pt-4 border-t border-slate-800 space-y-4">
                        <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30">
                          <div>
                            <h5 className="text-xs font-black text-indigo-300 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ডিটেক্ট হওয়া প্রশ্নসমূহ ({extractedQuestions.length} টি)
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              নিচের বাটনে চাপ দিয়ে সরাসরি এই মডেল টেস্টে যুক্ত করে নিন।
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleBatchAddQuestionsToActiveExam(extractedQuestions);
                              setExtractedQuestions([]);
                              setRawText('');
                            }}
                            className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                          >
                            <Plus className="w-4 h-4" />
                            সবগুলো ({extractedQuestions.length} টি) এই পরীক্ষায় যুক্ত করুন
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {extractedQuestions.map((q, idx) => {
                            const isEditing = editingExtractedIdx === idx;
                            const isArabic = isArabicText(q.question) || isArabicText(q.option_a);

                            return (
                              <div
                                key={q.id || idx}
                                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                                      #{idx + 1}
                                    </span>
                                    {isArabic && (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                        আরবি
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingExtractedIdx(isEditing ? null : idx)}
                                      className="p-1 text-slate-400 hover:text-white"
                                    >
                                      {isEditing ? <Check className="w-4 h-4 text-emerald-400" /> : <Edit className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx))
                                      }
                                      className="p-1 text-slate-400 hover:text-rose-400"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={q.question}
                                      onChange={(e) =>
                                        setExtractedQuestions((prev) =>
                                          prev.map((item, i) => (i === idx ? { ...item, question: e.target.value } : item))
                                        )
                                      }
                                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      {['option_a', 'option_b', 'option_c', 'option_d'].map((k) => (
                                        <input
                                          key={k}
                                          type="text"
                                          value={(q as any)[k]}
                                          onChange={(e) =>
                                            setExtractedQuestions((prev) =>
                                              prev.map((item, i) =>
                                                i === idx ? { ...item, [k]: e.target.value } : item
                                              )
                                            )
                                          }
                                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className={`font-bold text-white ${isArabic ? 'text-right font-serif' : ''}`}>
                                      {q.question}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      {[
                                        { key: 'option_a', text: q.option_a, label: 'ক.' },
                                        { key: 'option_b', text: q.option_b, label: 'খ.' },
                                        { key: 'option_c', text: q.option_c, label: 'গ.' },
                                        { key: 'option_d', text: q.option_d, label: 'ঘ.' },
                                      ].map((item) => (
                                        <div
                                          key={item.key}
                                          className={`p-2 rounded-xl border text-[11px] ${
                                            q.correct_answer === item.key
                                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                                          }`}
                                        >
                                          <span className="mr-1 opacity-70">{item.label}</span>
                                          {item.text}
                                        </div>
                                      ))}
                                    </div>
                                    {q.explanation && (
                                      <p className="text-[10px] text-slate-400 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60">
                                        💡 <span className="font-bold text-slate-300">ব্যাখ্যা:</span> {q.explanation}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: AI TOPIC GENERATOR */}
                {questionTab === 'aitopic' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed">
                      <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-200">
                        <Wand2 className="w-4 h-4 text-purple-400" /> টপিক থেকে এআই অটো জেনারেটর:
                      </span>
                      যে বিষয়টি থেকে প্রশ্ন তৈরি করতে চান তার নাম বা অধ্যায় লিখুন (যেমন: <i>উলুমুল কুরআন, সূরা আল বাকারা, কারক ও বিভক্তি, মুক্তিযুদ্ধ ১৯৭১</i>)। এআই নিখুঁত প্রশ্নমালা তৈরি করে দেবে!
                    </div>

                    {topicGenError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{topicGenError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          টপিক / অধ্যায়ের নাম <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          placeholder="যেমন: সূরা বাকারা শানে নুযূল ও আয়াত ব্যাখ্যা"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          বিষয় (Subject)
                        </label>
                        <input
                          type="text"
                          value={topicSubject}
                          onChange={(e) => setTopicSubject(e.target.value)}
                          placeholder="যেমন: আরবি প্রভাষক / আল কুরআন"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          প্রশ্ন সংখ্যা নির্বাচন করুন:
                        </label>
                        <span className="text-xs text-purple-400 font-bold">
                          {topicQuestionCount} টি প্রশ্ন জেনারেট হবে
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[5, 10, 15, 20, 25, 30, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setTopicQuestionCount(num)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              topicQuestionCount === num
                                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {num} টি
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateFromTopic}
                        disabled={generatingTopic || !topicInput.trim()}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                      >
                        {generatingTopic ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            এআই প্রশ্ন তৈরি করছে...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            এআই দিয়ে {topicQuestionCount} টি প্রশ্ন জেনারেট করুন
                          </>
                        )}
                      </button>
                    </div>

                    {/* Preview Generated Questions */}
                    {generatedQuestions.length > 0 && (
                      <div className="pt-4 border-t border-slate-800 space-y-4">
                        <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30">
                          <div>
                            <h5 className="text-xs font-black text-purple-300 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              এআই জেনারেটকৃত প্রশ্নসমূহ ({generatedQuestions.length} টি)
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              এক ক্লিকেই নিচের বাটন দিয়ে এই মডেল টেস্টে যুক্ত করুন।
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleBatchAddQuestionsToActiveExam(generatedQuestions);
                              setGeneratedQuestions([]);
                            }}
                            className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                          >
                            <Plus className="w-4 h-4" />
                            সবগুলো ({generatedQuestions.length} টি) এই পরীক্ষায় যুক্ত করুন
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {generatedQuestions.map((q, idx) => {
                            const isArabic = isArabicText(q.question) || isArabicText(q.option_a);

                            return (
                              <div
                                key={q.id || idx}
                                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                                    #{idx + 1}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    className="p-1 text-slate-400 hover:text-rose-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className={`font-bold text-white ${isArabic ? 'text-right font-serif' : ''}`}>
                                  {q.question}
                                </p>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  {[
                                    { key: 'option_a', text: q.option_a, label: 'ক.' },
                                    { key: 'option_b', text: q.option_b, label: 'খ.' },
                                    { key: 'option_c', text: q.option_c, label: 'গ.' },
                                    { key: 'option_d', text: q.option_d, label: 'ঘ.' },
                                  ].map((item) => (
                                    <div
                                      key={item.key}
                                      className={`p-2 rounded-xl border text-[11px] ${
                                        q.correct_answer === item.key
                                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <span className="mr-1 opacity-70">{item.label}</span>
                                      {item.text}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <p className="text-[10px] text-slate-400 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60">
                                    💡 <span className="font-bold text-slate-300">ব্যাখ্যা:</span> {q.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: MASTER QUESTION BANK SELECTOR */}
                {questionTab === 'bank' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="text"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="প্রশ্ন ব্যাংকে খুঁজুন..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <select
                          value={bankSubjectFilter}
                          onChange={(e) => setBankSubjectFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="all">সকল বিষয়</option>
                          {uniqueBankSubjects.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedBankIds.size === filteredBankQuestions.length) {
                              setSelectedBankIds(new Set());
                            } else {
                              setSelectedBankIds(new Set(filteredBankQuestions.map((q) => q.id)));
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                        >
                          {selectedBankIds.size === filteredBankQuestions.length
                            ? 'সব বাতিল করুন'
                            : 'সব নির্বাচন করুন'}
                        </button>

                        <button
                          type="button"
                          disabled={selectedBankIds.size === 0}
                          onClick={handleImportSelectedFromBank}
                          className="px-4 py-2 rounded-xl bg-emerald-600 disabled:opacity-40 text-white text-xs font-black hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                        >
                          যুক্ত করুন ({selectedBankIds.size} টি)
                        </button>
                      </div>
                    </div>

                    {loadingBank ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        প্রশ্ন ব্যাংক লোড হচ্ছে...
                      </div>
                    ) : filteredBankQuestions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                        প্রশ্ন ব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি।
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {filteredBankQuestions.map((q) => {
                          const isSelected = selectedBankIds.has(q.id);
                          return (
                            <div
                              key={q.id}
                              onClick={() => {
                                const next = new Set(selectedBankIds);
                                if (next.has(q.id)) next.delete(q.id);
                                else next.add(q.id);
                                setSelectedBankIds(next);
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                                isSelected
                                  ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                              />
                              <div className="flex-1 text-xs space-y-1">
                                <p className="font-bold text-white">{q.question}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {q.subject}
                                  </span>
                                  {q.topic && <span>টপিক: {q.topic}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: MANUAL SINGLE QUESTION ADD */}
                {questionTab === 'manual' && (
                  <form
                    onSubmit={handleAddManualQuestionToExam}
                    className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in"
                  >
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4" /> প্রশ্ন ও উত্তরের বিবরণ লিখুন
                    </h5>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        প্রশ্নের মূল টেক্সট <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="প্রশ্ন লিখুন (যেমন: সূরা ফাতিহার অপর নাম কী?)"
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, question: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'option_a', label: 'ক (Option A)' },
                        { key: 'option_b', label: 'খ (Option B)' },
                        { key: 'option_c', label: 'গ (Option C)' },
                        { key: 'option_d', label: 'ঘ (Option D)' },
                      ].map((opt) => (
                        <div key={opt.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>{opt.label}</span>
                            <label className="flex items-center gap-1 cursor-pointer text-emerald-400">
                              <input
                                type="radio"
                                name="correct_answer"
                                checked={questionForm.correct_answer === opt.key}
                                onChange={() =>
                                  setQuestionForm({
                                    ...questionForm,
                                    correct_answer: opt.key,
                                  })
                                }
                                className="text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>সঠিক উত্তর</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder={`${opt.label} লিখুন...`}
                            value={(questionForm as any)[opt.key]}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                [opt.key]: e.target.value,
                              })
                            }
                            className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                              questionForm.correct_answer === opt.key
                                ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-emerald-950/20'
                                : 'border-slate-700 focus:border-amber-500'
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ব্যাখ্যা (Explanation - ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="সঠিক উত্তরের তথ্যসূত্র বা ব্যাখ্যা লিখুন..."
                        value={questionForm.explanation}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, explanation: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        প্রশ্ন যুক্ত করুন
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Current Exam Questions Listing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <span>এই মডেল টেস্টে মোট সংযুক্ত প্রশ্ন:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {activeExamForQuestions.questions?.length || 0} টি
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    শিক্ষার্থীরা পরীক্ষা চলাকালীন এই প্রশ্নগুলো দেখতে পাবে
                  </span>
                </div>

                {(!activeExamForQuestions.questions || activeExamForQuestions.questions.length === 0) ? (
                  <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-xs text-slate-500 space-y-2">
                    <HelpCircle className="w-6 h-6 mx-auto text-slate-600" />
                    <p>এখনও এই পরীক্ষায় কোনো প্রশ্ন যুক্ত করা হয়নি।</p>
                    <p className="text-[11px] text-slate-400">
                      উপরের "কপি-পেস্ট (AI)", "টপিক থেকে এআই" অথবা "মাস্টার প্রশ্ন ব্যাংক" ট্যাব থেকে সহজে প্রশ্ন যোগ করুন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeExamForQuestions.questions.map((q, idx) => {
                      const isEditing = editingExamQuestionIdx === idx;
                      const isArabic = isArabicText(q.question) || isArabicText(q.option_a);

                      return (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2.5 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    value={q.question}
                                    onChange={(e) => handleUpdateExamQuestion(idx, { question: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                                  />
                                ) : (
                                  <span
                                    className={`font-bold text-white text-sm block ${
                                      isArabic ? 'text-right font-serif' : ''
                                    }`}
                                  >
                                    {q.question}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingExamQuestionIdx(isEditing ? null : idx)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                                title={isEditing ? 'সম্পন্ন' : 'এডিট'}
                              >
                                {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestionFromExam(q.id, idx)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {[
                              { key: 'option_a', text: q.option_a, label: 'ক.' },
                              { key: 'option_b', text: q.option_b, label: 'খ.' },
                              { key: 'option_c', text: q.option_c, label: 'গ.' },
                              { key: 'option_d', text: q.option_d, label: 'ঘ.' },
                            ].map((item) => (
                              <div
                                key={item.key}
                                className={`p-2 rounded-xl border text-[11px] ${
                                  q.correct_answer === item.key
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span className="mr-1 opacity-70">{item.label}</span>
                                {item.text}
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                              💡 <span className="font-bold text-slate-300">ব্যাখ্যা:</span> {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* EXAM LIST & CREATION FORM VIEW */
            /* ========================================================================= */
            <>
              {/* Exam Creation / Edit Form */}
              <form
                onSubmit={handleSaveExam}
                className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    {editingExamId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingExamId ? 'পরীক্ষা সম্পাদনা করুন' : 'নতুন মডেল টেস্ট তৈরি করুন'}
                  </h4>
                  {editingExamId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      সম্পাদনা বাতিল
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">
                      পরীক্ষার শিরোনাম <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মডেল টেস্ট ০১: উলুমুল কুরআন ও তাফসির বিশেষ পরীক্ষা"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">বিষয় (Subject)</label>
                    <input
                      type="text"
                      placeholder="যেমন: আরবি / আল কুরআন"
                      value={examForm.subject}
                      onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">টপিক / অধ্যায় (Topic)</label>
                    <input
                      type="text"
                      placeholder="যেমন: উলুমুল কুরআন ও শানে নুযূল"
                      value={examForm.topic}
                      onChange={(e) => setExamForm({ ...examForm, topic: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">প্রশ্ন সংখ্যা</label>
                    <input
                      type="number"
                      value={examForm.question_count}
                      onChange={(e) =>
                        setExamForm({ ...examForm, question_count: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">সময় (মিনিট)</label>
                    <input
                      type="number"
                      value={examForm.time_minutes}
                      onChange={(e) =>
                        setExamForm({ ...examForm, time_minutes: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট নম্বর</label>
                    <input
                      type="number"
                      value={examForm.total_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">পাস মার্ক</label>
                    <input
                      type="number"
                      value={examForm.pass_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, pass_marks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">নেগেটিভ মার্কিং</label>
                    <select
                      value={examForm.negative_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, negative_marks: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    >
                      <option value={0.25}>০.২৫ নম্বর (প্রতি ৪ ভুলে ১ নম্বর কর্তন)</option>
                      <option value={0.5}>০.৫০ নম্বর (প্রতি ২ ভুলে ১ নম্বর কর্তন)</option>
                      <option value={0}>০.০০ (কোনো নেগেটিভ মার্কিং নেই)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.is_locked}
                      onChange={(e) => setExamForm({ ...examForm, is_locked: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                    />
                    <span>🔒 পরীক্ষাটি লক্ড (পেইড ক্লায়েন্টদের জন্য সংরক্ষিত)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    {editingExamId ? 'আপডেট সম্পন্ন করুন' : 'মডেল টেস্ট যুক্ত করুন'}
                  </button>
                </div>
              </form>

              {/* List of Exams */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>এই কোর্সে যুক্ত মডেল টেস্ট তালিকা ({exams.length} টি):</span>
                  <span className="text-[11px] text-amber-400 font-bold">
                    "প্রশ্ন যোগ / AI মেকার" বাটনে ক্লিক করে AI বা ম্যানুয়ালি প্রশ্ন তৈরি করুন
                  </span>
                </h4>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">পরীক্ষা লোড হচ্ছে...</div>
                ) : exams.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                    এখনও কোনো পরীক্ষা যুক্ত করা হয়নি।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exams.map((exam, index) => (
                      <div
                        key={exam.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 font-black text-center leading-7 shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white text-sm">{exam.title}</h5>
                              {exam.topic && (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                  {exam.topic}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              বিষয়: {exam.subject} &bull; সময়: {exam.time_minutes} মি. &bull; মোট নম্বর: {exam.total_marks} &bull; প্রশ্ন: {exam.questions?.length || exam.question_count}টি
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveExamForQuestions(exam)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-amber-500 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            প্রশ্ন ও AI মেকার ({exam.questions?.length || 0})
                          </button>

                          <button
                            onClick={() => onToggleLock(exam)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              exam.is_locked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {exam.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {exam.is_locked ? 'লকড' : 'মুক্ত'}
                          </button>

                          <button
                            onClick={() => handleStartEditExam(exam)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                            title="এডিট"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteExam(exam.id)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
