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
  Globe,
  PlusCircle,
  Layers,
  Save,
  CheckSquare,
  ArrowRight,
  Filter,
  Eye,
  Rocket,
  ToggleLeft,
  ToggleRight,
  Award,
} from 'lucide-react';
import { Question, Exam, ExamStatus, DEFAULT_TOPICS, DEFAULT_POSTS } from '../types';
import {
  fetchAllQuestions,
  fetchQuestionsByExamId,
  insertQuestion,
  insertBatchQuestions,
  updateQuestion,
  deleteQuestion,
  updateExam,
} from '../lib/supabase';
import { isArabicText } from './AddAiQuestionsModal';
import { getAllSubjects, addCustomSubject } from '../lib/subjectManager';

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
  // Tab State: 'current' (view & edit attached questions), 'manual', 'copypaste', 'aitopic', 'bank'
  const [activeTab, setActiveTab] = useState<'current' | 'manual' | 'copypaste' | 'aitopic' | 'bank'>('current');

  // Exam Publish / Status State
  const [currentExamStatus, setCurrentExamStatus] = useState<ExamStatus>(exam.status || 'active');
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Attached Questions State (Questions already in this exam)
  const [attachedQuestions, setAttachedQuestions] = useState<Question[]>([]);
  const [loadingAttached, setLoadingAttached] = useState(false);
  const [attachedSearch, setAttachedSearch] = useState('');
  const [attachedSubjectFilter, setAttachedSubjectFilter] = useState('all');
  const [settingCorrectAnswerId, setSettingCorrectAnswerId] = useState<string | number | null>(null);

  // Inline Question Editing State
  const [editingQuestionId, setEditingQuestionId] = useState<string | number | null>(null);
  const [editingQuestionState, setEditingQuestionState] = useState<{
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'option_a' | 'option_b' | 'option_c' | 'option_d';
    explanation: string;
    subject: string;
    topic: string;
  } | null>(null);
  const [savingQuestionEdit, setSavingQuestionEdit] = useState(false);
  const [editQuestionError, setEditQuestionError] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | number | null>(null);

  // Question Bank List for Tab 5
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState('all');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string | number>>(new Set());
  const [attachingFromBank, setAttachingFromBank] = useState(false);

  // 1. Manual Form State
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptionA, setManualOptionA] = useState('');
  const [manualOptionB, setManualOptionB] = useState('');
  const [manualOptionC, setManualOptionC] = useState('');
  const [manualOptionD, setManualOptionD] = useState('');
  const [manualCorrect, setManualCorrect] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualSubject, setManualSubject] = useState(exam.subject && exam.subject !== 'সাধারণ' ? exam.subject : 'বাংলা');
  const [manualCustomSubject, setManualCustomSubject] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualCustomTopic, setManualCustomTopic] = useState('');
  const [showManualCustomTopic, setShowManualCustomTopic] = useState(false);
  const [manualPost, setManualPost] = useState('');
  const [manualCustomPost, setManualCustomPost] = useState('');
  const [showManualCustomPost, setShowManualCustomPost] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // 2. Copy Paste State
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [savingExtracted, setSavingExtracted] = useState(false);

  // 3. AI Topic Generator State
  const [topic, setTopic] = useState('');
  const [topicCount, setTopicCount] = useState<number>(5);
  const [topicSubject, setTopicSubject] = useState(exam.subject && exam.subject !== 'সাধারণ' ? exam.subject : 'বাংলা');
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savingGenerated, setSavingGenerated] = useState(false);

  // Edit Card Indices for preview lists
  const [editingExtractedIdx, setEditingExtractedIdx] = useState<number | null>(null);
  const [editingGeneratedIdx, setEditingGeneratedIdx] = useState<number | null>(null);

  // Custom Subject input
  const [customSubInput, setCustomSubInput] = useState('');
  const [showCustomSubInput, setShowCustomSubInput] = useState(false);
  const [subjectsList, setSubjectsList] = useState<string[]>(() =>
    getAllSubjects(exam.subject ? [exam.subject] : [])
  );

  // Toast / General message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadAttachedQuestions = async () => {
    setLoadingAttached(true);
    const res = await fetchQuestionsByExamId(exam.id);
    if (!res.error) {
      setAttachedQuestions(res.questions);
    }
    setLoadingAttached(false);
  };

  const loadQuestionBank = async () => {
    setLoadingBank(true);
    const res = await fetchAllQuestions();
    if (!res.error) {
      setBankQuestions(res.questions);
    }
    setLoadingBank(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentExamStatus(exam.status || 'active');
      loadAttachedQuestions();
      loadQuestionBank();
      setSubjectsList(getAllSubjects(exam.subject ? [exam.subject] : []));
      if (exam && exam.question_count) {
        setTopicCount(exam.question_count);
      }
    }
  }, [isOpen, exam]);

  if (!isOpen) return null;

  // Toggle Exam Publish / Status
  const handleToggleExamPublish = async () => {
    setTogglingStatus(true);
    const nextStatus: ExamStatus = currentExamStatus === 'active' ? 'draft' : 'active';
    const res = await updateExam(exam.id, { status: nextStatus });
    setTogglingStatus(false);

    if (res.success) {
      setCurrentExamStatus(nextStatus);
      setActionSuccessMsg(
        nextStatus === 'active'
          ? '🎉 মডেল টেস্টটি সফলভাবে লাইভ পাবলিশ করা হয়েছে!'
          : 'মডেল টেস্টটি ড্রাফট (Draft) মোডে রাখা হয়েছে।'
      );
      setTimeout(() => setActionSuccessMsg(null), 3500);
      onQuestionsUpdated(0);
    } else {
      alert(res.error || 'স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
  };

  // Instant 1-Click Set Correct Answer
  const handleQuickSetCorrectAnswer = async (
    questionId: string | number,
    correctOption: 'option_a' | 'option_b' | 'option_c' | 'option_d'
  ) => {
    const current = attachedQuestions.find((q) => q.id === questionId);
    if (!current || current.correct_answer === correctOption) return;

    setSettingCorrectAnswerId(questionId);
    // Optimistic UI update
    setAttachedQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correct_answer: correctOption } : q))
    );

    const res = await updateQuestion(questionId, {
      correct_answer: correctOption,
    });
    setSettingCorrectAnswerId(null);

    if (res.success) {
      const optLabel =
        correctOption === 'option_a'
          ? 'ক'
          : correctOption === 'option_b'
          ? 'খ'
          : correctOption === 'option_c'
          ? 'গ'
          : 'ঘ';
      setActionSuccessMsg(`✓ অপশন (${optLabel}) সঠিক উত্তর হিসেবে সেট ও সেভ করা হয়েছে!`);
      setTimeout(() => setActionSuccessMsg(null), 2500);
      onQuestionsUpdated(0);
    } else {
      // Revert if error
      setAttachedQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, correct_answer: current.correct_answer } : q))
      );
      alert(res.error || 'সঠিক উত্তর পরিবর্তন করা যায়নি।');
    }
  };

  // ----------------------------------------------------
  // ATTACHED QUESTIONS EDIT & DELETE HANDLERS
  // ----------------------------------------------------
  const handleStartEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditingQuestionState({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: (q.correct_answer as any) || 'option_a',
      explanation: q.explanation || '',
      subject: q.subject || exam.subject || 'বাংলা',
      topic: q.topic || '',
    });
    setEditQuestionError(null);
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestionState(null);
    setEditQuestionError(null);
  };

  const handleSaveQuestionEdit = async (questionId: string | number) => {
    if (!editingQuestionState) return;

    if (
      !editingQuestionState.question.trim() ||
      !editingQuestionState.option_a.trim() ||
      !editingQuestionState.option_b.trim() ||
      !editingQuestionState.option_c.trim() ||
      !editingQuestionState.option_d.trim()
    ) {
      setEditQuestionError('প্রশ্নের শিরোনাম এবং চারটি অপশনই পূরণ করা আবশ্যক।');
      return;
    }

    setSavingQuestionEdit(true);
    setEditQuestionError(null);

    const res = await updateQuestion(questionId, {
      question: editingQuestionState.question.trim(),
      option_a: editingQuestionState.option_a.trim(),
      option_b: editingQuestionState.option_b.trim(),
      option_c: editingQuestionState.option_c.trim(),
      option_d: editingQuestionState.option_d.trim(),
      correct_answer: editingQuestionState.correct_answer,
      explanation: editingQuestionState.explanation.trim() || null,
      subject: editingQuestionState.subject.trim(),
      topic: editingQuestionState.topic.trim() || undefined,
    });

    setSavingQuestionEdit(false);

    if (res.success && res.data) {
      const updatedItem = res.data;
      setAttachedQuestions((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, ...updatedItem } : item))
      );
      setEditingQuestionId(null);
      setEditingQuestionState(null);
      setActionSuccessMsg('প্রশ্ন ও অপশনসমূহ সফলভাবে সংশোধন ও সেভ করা হয়েছে!');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      onQuestionsUpdated(0);
    } else {
      setEditQuestionError(res.error || 'প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  const handleDeleteAttachedQuestion = async (questionId: string | number) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই প্রশ্নটি পরীক্ষা থেকে বাদ বা মুছে ফেলতে চান?')) {
      return;
    }

    setDeletingQuestionId(questionId);
    const res = await deleteQuestion(questionId);
    setDeletingQuestionId(null);

    if (res.success) {
      setAttachedQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setActionSuccessMsg('প্রশ্নটি পরীক্ষা থেকে সফলভাবে মুছে ফেলা হয়েছে!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      onQuestionsUpdated(-1);
    } else {
      alert(res.error || 'প্রশ্ন মুছে ফেলা সম্ভব হয়নি।');
    }
  };

  // Filtered Attached Questions
  const filteredAttachedQuestions = attachedQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(attachedSearch.toLowerCase()) ||
      q.option_a.toLowerCase().includes(attachedSearch.toLowerCase()) ||
      q.option_b.toLowerCase().includes(attachedSearch.toLowerCase()) ||
      q.option_c.toLowerCase().includes(attachedSearch.toLowerCase()) ||
      q.option_d.toLowerCase().includes(attachedSearch.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(attachedSearch.toLowerCase()));
    const matchesSub =
      attachedSubjectFilter === 'all' ? true : (q.subject || 'সাধারণ') === attachedSubjectFilter;
    return matchesSearch && matchesSub;
  });

  const attachedAvailableSubjects = getAllSubjects(attachedQuestions.map((q) => q.subject || ''));

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

    let finalSubject = manualSubject;
    if (manualSubject === 'অন্যান্য') {
      const trimmed = manualCustomSubject.trim();
      if (trimmed) {
        addCustomSubject(trimmed);
        finalSubject = trimmed;
      } else {
        finalSubject = exam.subject && exam.subject !== 'সাধারণ' ? exam.subject : 'বাংলা';
      }
    }
    const finalTopic = showManualCustomTopic ? manualCustomTopic.trim() : (manualTopic === 'অন্যান্য' ? manualCustomTopic.trim() : manualTopic.trim());
    const finalPost = showManualCustomPost ? manualCustomPost.trim() : (manualPost === 'অন্যান্য' ? manualCustomPost.trim() : manualPost.trim());

    const newQ = {
      question: manualQuestion.trim(),
      option_a: manualOptionA.trim(),
      option_b: manualOptionB.trim(),
      option_c: manualOptionC.trim(),
      option_d: manualOptionD.trim(),
      correct_answer: manualCorrect,
      explanation: manualExplanation.trim() || null,
      status: 'published' as const,
      subject: finalSubject,
      topic: finalTopic,
      post: finalPost,
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
      loadAttachedQuestions();
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
      loadAttachedQuestions();
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
      loadAttachedQuestions();
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

    setAttachingFromBank(true);
    const ids: (string | number)[] = Array.from(selectedBankIds);
    try {
      await Promise.all(
        ids.map((id: string | number) =>
          updateQuestion(id, {
            exam_id: exam.id,
          })
        )
      );
      const count = ids.length;
      setActionSuccessMsg(`${count} টি প্রশ্ন এই মডেল টেস্টে সফলভাবে যুক্ত হয়েছে!`);
      setSelectedBankIds(new Set());
      onQuestionsUpdated(count);
      loadAttachedQuestions();
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('প্রশ্ন যুক্ত করতে সমস্যা হয়েছে: ' + (err?.message || 'Unknown error'));
    } finally {
      setAttachingFromBank(false);
    }
  };

  const filteredBank = bankQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.option_a.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchesSub = bankSubjectFilter === 'all' ? true : (q.subject || 'বাংলা') === bankSubjectFilter;
    return matchesSearch && matchesSub;
  });

  const availableSubjects = getAllSubjects(bankQuestions.map((q) => q.subject || ''));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] relative space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0 mt-0.5">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                  {exam.badge || 'মডেল টেস্ট'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  বিষয়: <strong className="text-slate-800 dark:text-slate-200">{exam.subject}</strong>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  মোট প্রশ্ন: <strong className="text-emerald-600 dark:text-emerald-400">{attachedQuestions.length}</strong> {exam.question_count ? `/ ${exam.question_count} টি` : 'টি'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                  সময়: {exam.time_minutes || 20} মিনিট
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                "{exam.title}" - পূর্ণাঙ্গ মডেল টেস্ট প্রিভিউ ও এডিটর
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Live Publish Status Button */}
            <button
              type="button"
              disabled={togglingStatus}
              onClick={handleToggleExamPublish}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
                currentExamStatus === 'active'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white animate-pulse'
              }`}
              title="মডেল টেস্টের লাইভ পাবলিশ স্ট্যাটাস পরিবর্তন করুন"
            >
              {togglingStatus ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>আপডেট হচ্ছে...</span>
                </>
              ) : currentExamStatus === 'active' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ পাবলিশড (অনলাইন)</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>🚀 এখনই পাবলিশ করুন</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl bg-slate-100 dark:bg-slate-800 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{actionSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* TABS HEADER */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2.5 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'current'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">📋 টেস্ট প্রিভিউ ও এডিট ({attachedQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">➕ নতুন প্রশ্ন লিখুন</span>
          </button>

          <button
            onClick={() => setActiveTab('copypaste')}
            className={`py-2.5 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'copypaste'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">📋 কপি-পেস্ট AI</span>
          </button>

          <button
            onClick={() => setActiveTab('aitopic')}
            className={`py-2.5 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'aitopic'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">🤖 এআই জেনারেটর</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2.5 px-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'bank'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">🏦 প্রশ্ন ব্যাংক ({bankQuestions.length})</span>
          </button>
        </div>

        {/* ----------------------------------------------------
            TAB 0: CURRENT ATTACHED QUESTIONS (VIEW & EDIT)
        ---------------------------------------------------- */}
        {activeTab === 'current' && (
          <div className="space-y-4 pt-1">
            {/* Top Bar: Search, Subject Filter & Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attachedSearch}
                  onChange={(e) => setAttachedSearch(e.target.value)}
                  placeholder="সংযুক্ত প্রশ্ন বা অপশনে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={attachedSubjectFilter}
                  onChange={(e) => setAttachedSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">সকল বিষয় ({attachedQuestions.length})</option>
                  {attachedAvailableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} ({attachedQuestions.filter((q) => (q.subject || 'সাধারণ') === sub).length})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={loadAttachedQuestions}
                  disabled={loadingAttached}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAttached ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>সহজ প্রিভিউ ও এডিট:</strong> নিচের যেকোনো অপশনে (ক, খ, গ, ঘ) ক্লিক করে সরাসরি সঠিক উত্তর পরিবর্তন করতে পারেন। টেক্সট বদলাতে <strong>"সংশোধন"</strong> বাটনে ক্লিক করুন।
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2.5 py-1 rounded-lg shrink-0">
                ⚡ ১-ক্লিক অপশন নির্বাচন
              </span>
            </div>

            {/* Questions List */}
            {loadingAttached ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-bold">পরীক্ষার সংযুক্ত প্রশ্নসমূহ লোড হচ্ছে...</p>
              </div>
            ) : filteredAttachedQuestions.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {attachedQuestions.length === 0
                      ? 'এই পরীক্ষায় এখনও কোনো প্রশ্ন যুক্ত করা হয়নি'
                      : 'অনুসন্ধানের সাথে কোনো প্রশ্ন মেলেনি'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {attachedQuestions.length === 0
                      ? 'উপরের ট্যাব থেকে নতুন প্রশ্ন লিখুন, টেক্সট কপি-পেস্ট করুন, এআই দিয়ে তৈরি করুন অথবা প্রশ্ন ব্যাংক থেকে সিলেক্ট করে যুক্ত করুন।'
                      : 'অন্য কোনো কিওয়ার্ড বা বিষয় দিয়ে চেষ্টা করুন।'}
                  </p>
                </div>
                {attachedQuestions.length === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ম্যানুয়ালি যোগ করুন
                    </button>
                    <button
                      onClick={() => setActiveTab('bank')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Database className="w-3.5 h-3.5" />
                      প্রশ্ন ব্যাংক থেকে নির্বাচন করুন
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
                {filteredAttachedQuestions.map((q, idx) => {
                  const isEditingThis = editingQuestionId === q.id;

                  if (isEditingThis && editingQuestionState) {
                    return (
                      <div
                        key={q.id}
                        className="bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md animate-fadeIn"
                      >
                        <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs rounded-lg">
                              প্রশ্ন #{idx + 1} সম্পাদনা
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              (যেকোনো প্রশ্ন ও বিকল্প অপশন সংশোধন করে সেভ করুন)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelEditQuestion}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            বাতিল
                          </button>
                        </div>

                        {editQuestionError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span>{editQuestionError}</span>
                          </div>
                        )}

                        {/* Subject & Topic Inputs in Edit Mode */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              বিষয়:
                            </label>
                            <select
                              value={editingQuestionState.subject}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, subject: e.target.value } : null
                                )
                              }
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                              {subjectsList.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              টপিক (ঐচ্ছিক):
                            </label>
                            <input
                              type="text"
                              value={editingQuestionState.topic}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, topic: e.target.value } : null
                                )
                              }
                              placeholder="টপিক..."
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">
                            প্রশ্নের শিরোনাম:
                          </label>
                          <textarea
                            value={editingQuestionState.question}
                            onChange={(e) =>
                              setEditingQuestionState((prev) =>
                                prev ? { ...prev, question: e.target.value } : null
                              )
                            }
                            rows={2}
                            dir={isArabicText(editingQuestionState.question) ? 'rtl' : 'ltr'}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="সংশোধিত প্রশ্ন লিখুন..."
                          />
                        </div>

                        {/* 4 Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Option A */}
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            editingQuestionState.correct_answer === 'option_a'
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                ক) অপশন A:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingQuestionState((prev) =>
                                    prev ? { ...prev, correct_answer: 'option_a' } : null
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 transition-all ${
                                  editingQuestionState.correct_answer === 'option_a'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-200'
                                }`}
                              >
                                {editingQuestionState.correct_answer === 'option_a' && <Check className="w-3 h-3" />}
                                সঠিক উত্তর
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingQuestionState.option_a}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, option_a: e.target.value } : null
                                )
                              }
                              dir={isArabicText(editingQuestionState.option_a) ? 'rtl' : 'ltr'}
                              className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Option B */}
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            editingQuestionState.correct_answer === 'option_b'
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                খ) অপশন B:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingQuestionState((prev) =>
                                    prev ? { ...prev, correct_answer: 'option_b' } : null
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 transition-all ${
                                  editingQuestionState.correct_answer === 'option_b'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-200'
                                }`}
                              >
                                {editingQuestionState.correct_answer === 'option_b' && <Check className="w-3 h-3" />}
                                সঠিক উত্তর
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingQuestionState.option_b}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, option_b: e.target.value } : null
                                )
                              }
                              dir={isArabicText(editingQuestionState.option_b) ? 'rtl' : 'ltr'}
                              className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Option C */}
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            editingQuestionState.correct_answer === 'option_c'
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                গ) অপশন C:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingQuestionState((prev) =>
                                    prev ? { ...prev, correct_answer: 'option_c' } : null
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 transition-all ${
                                  editingQuestionState.correct_answer === 'option_c'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-200'
                                }`}
                              >
                                {editingQuestionState.correct_answer === 'option_c' && <Check className="w-3 h-3" />}
                                সঠিক উত্তর
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingQuestionState.option_c}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, option_c: e.target.value } : null
                                )
                              }
                              dir={isArabicText(editingQuestionState.option_c) ? 'rtl' : 'ltr'}
                              className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Option D */}
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            editingQuestionState.correct_answer === 'option_d'
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                ঘ) অপশন D:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingQuestionState((prev) =>
                                    prev ? { ...prev, correct_answer: 'option_d' } : null
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 transition-all ${
                                  editingQuestionState.correct_answer === 'option_d'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-200'
                                }`}
                              >
                                {editingQuestionState.correct_answer === 'option_d' && <Check className="w-3 h-3" />}
                                সঠিক উত্তর
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingQuestionState.option_d}
                              onChange={(e) =>
                                setEditingQuestionState((prev) =>
                                  prev ? { ...prev, option_d: e.target.value } : null
                                )
                              }
                              dir={isArabicText(editingQuestionState.option_d) ? 'rtl' : 'ltr'}
                              className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            ব্যাখ্যা / নোট (ঐচ্ছিক):
                          </label>
                          <textarea
                            value={editingQuestionState.explanation}
                            onChange={(e) =>
                              setEditingQuestionState((prev) =>
                                prev ? { ...prev, explanation: e.target.value } : null
                              )
                            }
                            rows={2}
                            dir={isArabicText(editingQuestionState.explanation) ? 'rtl' : 'ltr'}
                            placeholder="সঠিক উত্তরের ব্যাখ্যা লিখুন..."
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Save / Cancel Footer Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                          <button
                            type="button"
                            onClick={handleCancelEditQuestion}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-300 transition-colors"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            disabled={savingQuestionEdit}
                            onClick={() => handleSaveQuestionEdit(q.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
                          >
                            {savingQuestionEdit ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>সংরক্ষণ হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>সংশোধন সেভ করুন</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                            প্রশ্ন #{idx + 1}
                          </span>
                          {q.subject && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">
                              {q.subject}
                            </span>
                          )}
                          {q.topic && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                              {q.topic}
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditQuestion(q)}
                            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-sm"
                            title="প্রশ্ন ও বিকল্প অপশন সংশোধন করুন"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>সংশোধন / অপশন ঠিক করুন</span>
                          </button>

                          <button
                            type="button"
                            disabled={deletingQuestionId === q.id}
                            onClick={() => handleDeleteAttachedQuestion(q.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl transition-all"
                            title="এই পরীক্ষা থেকে প্রশ্নটি বাদ দিন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <p
                        className="text-sm font-black text-slate-900 dark:text-white leading-relaxed"
                        dir={isArabicText(q.question) ? 'rtl' : 'ltr'}
                      >
                        {q.question}
                      </p>

                      {/* 4 Options Grid with Instant 1-Click Correct Answer Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {[
                          { key: 'option_a' as const, label: 'ক', text: q.option_a },
                          { key: 'option_b' as const, label: 'খ', text: q.option_b },
                          { key: 'option_c' as const, label: 'গ', text: q.option_c },
                          { key: 'option_d' as const, label: 'ঘ', text: q.option_d },
                        ].map((opt) => {
                          const isCorrect = q.correct_answer === opt.key;
                          const isBeingSet = settingCorrectAnswerId === q.id;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              disabled={isBeingSet}
                              onClick={() => handleQuickSetCorrectAnswer(q.id, opt.key)}
                              title={
                                isCorrect
                                  ? 'এটি বর্তমান সঠিক উত্তর'
                                  : 'ক্লিক করে এই অপশনটিকে সঠিক উত্তর বানান'
                              }
                              className={`group/opt px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between text-left transition-all duration-150 cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/40 shadow-sm'
                                  : 'bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 pr-2"
                                dir={isArabicText(opt.text) ? 'rtl' : 'ltr'}
                              >
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover/opt:bg-emerald-100 dark:group-hover/opt:bg-emerald-950 group-hover/opt:text-emerald-700'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>

                              <div className="shrink-0">
                                {isCorrect ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                                    <Check className="w-3.5 h-3.5" /> সঠিক উত্তর
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 group-hover/opt:text-emerald-600 opacity-60 sm:opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                    সঠিক করতে ক্লিক
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/40"
                          dir={isArabicText(q.explanation) ? 'rtl' : 'ltr'}
                        >
                          <strong className="text-slate-700 dark:text-slate-300">ব্যাখ্যা: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

            {/* Subject, Topic & Post (বিষয়, টপিক ও পদ) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  বিষয় (Subject)
                </label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {subjectsList.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="অন্যান্য">অন্যান্য (ম্যানুয়াল)</option>
                </select>

                {manualSubject === 'অন্যান্য' && (
                  <input
                    type="text"
                    value={manualCustomSubject}
                    onChange={(e) => setManualCustomSubject(e.target.value)}
                    placeholder="নতুন বিষয় ম্যানুয়ালি লিখুন..."
                    className="w-full mt-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-indigo-500 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                )}
              </div>

              {/* Topic */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    টপিক (Topic)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualCustomTopic(!showManualCustomTopic)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {showManualCustomTopic ? 'লিস্ট থেকে বাছুন' : '+ নতুন ম্যানুয়াল'}
                  </button>
                </div>

                {showManualCustomTopic ? (
                  <input
                    type="text"
                    value={manualCustomTopic}
                    onChange={(e) => setManualCustomTopic(e.target.value)}
                    placeholder="নতুন টপিক ম্যানুয়ালি লিখুন..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-indigo-500 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                ) : (
                  <select
                    value={manualTopic}
                    onChange={(e) => {
                      if (e.target.value === 'অন্যান্য') {
                        setShowManualCustomTopic(true);
                      } else {
                        setManualTopic(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">-- টপিক নির্বাচন করুন --</option>
                    {DEFAULT_TOPICS.map((top) => (
                      <option key={top} value={top}>{top}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Post */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    পদ (Post)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualCustomPost(!showManualCustomPost)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {showManualCustomPost ? 'লিস্ট থেকে বাছুন' : '+ নতুন ম্যানুয়াল'}
                  </button>
                </div>

                {showManualCustomPost ? (
                  <input
                    type="text"
                    value={manualCustomPost}
                    onChange={(e) => setManualCustomPost(e.target.value)}
                    placeholder="নতুন পদের নাম ম্যানুয়ালি লিখুন..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-indigo-500 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                ) : (
                  <select
                    value={manualPost}
                    onChange={(e) => {
                      if (e.target.value === 'অন্যান্য') {
                        setShowManualCustomPost(true);
                      } else {
                        setManualPost(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">-- পদ নির্বাচন করুন --</option>
                    {DEFAULT_POSTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                প্রশ্নের বিবরণ (Question) <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
                dir={isArabicText(manualQuestion) ? 'rtl' : 'ltr'}
                placeholder='যেমন: "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত?" বা আরবি প্রশ্ন'
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
                  dir={isArabicText(manualOptionA) ? 'rtl' : 'ltr'}
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
                  dir={isArabicText(manualOptionB) ? 'rtl' : 'ltr'}
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
                  dir={isArabicText(manualOptionC) ? 'rtl' : 'ltr'}
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
                  dir={isArabicText(manualOptionD) ? 'rtl' : 'ltr'}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    বিষয় (Subject)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomSubInput(!showCustomSubInput)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{showCustomSubInput} {showCustomSubInput ? 'লিস্ট থেকে বাছুন' : 'নতুন বিষয় যোগ করুন'}</span>
                  </button>
                </div>

                {showCustomSubInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSubInput}
                      onChange={(e) => setCustomSubInput(e.target.value)}
                      placeholder="নতুন বিষয়ের নাম..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-emerald-500 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customSubInput.trim()) {
                          const newSub = customSubInput.trim();
                          if (!subjectsList.includes(newSub)) {
                            setSubjectsList([...subjectsList, newSub]);
                          }
                          setManualSubject(newSub);
                          setCustomSubInput('');
                          setShowCustomSubInput(false);
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                    >
                      যোগ করুন
                    </button>
                  </div>
                ) : (
                  <select
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
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
                dir={isArabicText(manualExplanation) ? 'rtl' : 'ltr'}
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

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {extractedQuestions.map((q, idx) => {
                    const isAr = isArabicText(q.question) || isArabicText(q.option_a);
                    const isEditing = editingExtractedIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-3 transition-all"
                        dir={isAr ? 'rtl' : 'ltr'}
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <span className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                            প্রশ্ন #{idx + 1}
                            {isAr && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 rounded font-bold">
                                আরবি / Arabic
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingExtractedIdx(isEditing ? null : idx)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{isEditing} {isEditing ? 'প্রিভিউ দেখুন' : 'এডিট করুন'}</span>
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                প্রশ্ন (Question)
                              </label>
                              <textarea
                                rows={2}
                                value={q.question}
                                onChange={(e) => {
                                  const updated = [...extractedQuestions];
                                  updated[idx].question = e.target.value;
                                  setExtractedQuestions(updated);
                                }}
                                dir={isArabicText(q.question) ? 'rtl' : 'ltr'}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ক. অপশন A</label>
                                <input
                                  type="text"
                                  value={q.option_a}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].option_a = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_a) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">খ. অপশন B</label>
                                <input
                                  type="text"
                                  value={q.option_b}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].option_b = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_b) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">গ. অপশন C</label>
                                <input
                                  type="text"
                                  value={q.option_c}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].option_c = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_c) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ঘ. অপশন D</label>
                                <input
                                  type="text"
                                  value={q.option_d}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].option_d = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_d) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">সঠিক উত্তর</label>
                                <select
                                  value={q.correct_answer}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].correct_answer = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                                >
                                  <option value="option_a">ক (Option A)</option>
                                  <option value="option_b">খ (Option B)</option>
                                  <option value="option_c">গ (Option C)</option>
                                  <option value="option_d">ঘ (Option D)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ব্যাখ্যা (Explanation)</label>
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={(e) => {
                                    const updated = [...extractedQuestions];
                                    updated[idx].explanation = e.target.value;
                                    setExtractedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.explanation || '') ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {q.question}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_a' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'border-slate-200 dark:border-slate-700'}`}>
                                <span className="font-bold text-slate-500 ml-1">ক.</span> {q.option_a}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_b' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'border-slate-200 dark:border-slate-700'}`}>
                                <span className="font-bold text-slate-500 ml-1">খ.</span> {q.option_b}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_c' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'border-slate-200 dark:border-slate-700'}`}>
                                <span className="font-bold text-slate-500 ml-1">গ.</span> {q.option_c}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_d' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'border-slate-200 dark:border-slate-700'}`}>
                                <span className="font-bold text-slate-500 ml-1">ঘ.</span> {q.option_d}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                সঠিক উত্তর: {q.correct_answer === 'option_a' ? 'ক' : q.correct_answer === 'option_b' ? 'খ' : q.correct_answer === 'option_c' ? 'গ' : 'ঘ'}
                              </span>
                              {q.explanation && (
                                <span className="text-slate-500 dark:text-slate-400 italic">
                                  ব্যাখ্যা: {q.explanation}
                                </span>
                              )}
                            </div>
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
                  dir={isArabicText(topic) ? 'rtl' : 'ltr'}
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

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {generatedQuestions.map((q, idx) => {
                    const isAr = isArabicText(q.question) || isArabicText(q.option_a);
                    const isEditing = editingGeneratedIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 text-xs space-y-3 transition-all"
                        dir={isAr ? 'rtl' : 'ltr'}
                      >
                        <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                          <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px] flex items-center gap-1">
                            প্রশ্ন #{idx + 1}
                            {isAr && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 rounded font-bold">
                                আরবি / Arabic
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingGeneratedIdx(isEditing ? null : idx)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg text-purple-700 dark:text-purple-300 flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5 text-purple-500" />
                            <span>{isEditing ? 'প্রিভিউ দেখুন' : 'এডিট করুন'}</span>
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 mb-0.5">
                                প্রশ্ন (Question)
                              </label>
                              <textarea
                                rows={2}
                                value={q.question}
                                onChange={(e) => {
                                  const updated = [...generatedQuestions];
                                  updated[idx].question = e.target.value;
                                  setGeneratedQuestions(updated);
                                }}
                                dir={isArabicText(q.question) ? 'rtl' : 'ltr'}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ক. অপশন A</label>
                                <input
                                  type="text"
                                  value={q.option_a}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].option_a = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_a) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">খ. অপশন B</label>
                                <input
                                  type="text"
                                  value={q.option_b}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].option_b = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_b) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">গ. অপশন C</label>
                                <input
                                  type="text"
                                  value={q.option_c}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].option_c = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_c) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ঘ. অপশন D</label>
                                <input
                                  type="text"
                                  value={q.option_d}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].option_d = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.option_d) ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">সঠিক উত্তর</label>
                                <select
                                  value={q.correct_answer}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].correct_answer = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold"
                                >
                                  <option value="option_a">ক (Option A)</option>
                                  <option value="option_b">খ (Option B)</option>
                                  <option value="option_c">গ (Option C)</option>
                                  <option value="option_d">ঘ (Option D)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ব্যাখ্যা (Explanation)</label>
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].explanation = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  dir={isArabicText(q.explanation || '') ? 'rtl' : 'ltr'}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {q.question}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_a' ? 'border-purple-500 bg-purple-50/50 text-purple-900 dark:text-purple-300 font-bold' : 'border-purple-100 dark:border-purple-900/50'}`}>
                                <span className="font-bold text-slate-500 ml-1">ক.</span> {q.option_a}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_b' ? 'border-purple-500 bg-purple-50/50 text-purple-900 dark:text-purple-300 font-bold' : 'border-purple-100 dark:border-purple-900/50'}`}>
                                <span className="font-bold text-slate-500 ml-1">খ.</span> {q.option_b}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_c' ? 'border-purple-500 bg-purple-50/50 text-purple-900 dark:text-purple-300 font-bold' : 'border-purple-100 dark:border-purple-900/50'}`}>
                                <span className="font-bold text-slate-500 ml-1">গ.</span> {q.option_c}
                              </div>
                              <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border ${q.correct_answer === 'option_d' ? 'border-purple-500 bg-purple-50/50 text-purple-900 dark:text-purple-300 font-bold' : 'border-purple-100 dark:border-purple-900/50'}`}>
                                <span className="font-bold text-slate-500 ml-1">ঘ.</span> {q.option_d}
                              </div>
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

        {/* STICKY FOOTER WITH PUBLISH & QUICK STATUS BAR */}
        <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              মোট সংযুক্ত প্রশ্ন: <span className="text-emerald-600 dark:text-emerald-400 font-black">{attachedQuestions.length} টি</span>
              {exam.question_count ? ` / ${exam.question_count} টি` : ''}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                currentExamStatus === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {currentExamStatus === 'active' ? '● লাইভ পাবলিশড (Online)' : '○ ড্রাফট মোড (Draft)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={togglingStatus}
              onClick={handleToggleExamPublish}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                currentExamStatus === 'active'
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {currentExamStatus === 'active' ? (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-500" />
                  <span>ড্রাফট মোডে রাখুন</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>🚀 মডেল টেস্ট পাবলিশ করুন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black rounded-xl transition-colors shadow"
            >
              সম্পন্ন / বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
