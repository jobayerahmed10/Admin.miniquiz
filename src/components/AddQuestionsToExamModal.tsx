import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Wand2,
  Database,
  ArrowRight,
  ArrowLeft,
  Eye,
  Rocket,
  PlusCircle,
  UserCheck,
  Check,
  Edit,
  FileText,
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
import { ExamStepWizardHeader } from './exam/ExamStepWizardHeader';
import { ExamQuestionPreviewCard } from './exam/ExamQuestionPreviewCard';
import { QuickAddQuestionInline } from './exam/QuickAddQuestionInline';

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
  // Step State: 1 (Info) | 2 (Add Questions) | 3 (Preview & Edit)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Exam Info Form State (Step 1)
  const [infoTitle, setInfoTitle] = useState(exam.title || '');
  const [infoBadgeType, setInfoBadgeType] = useState(exam.badge_type || 'daily');
  const [infoBadge, setInfoBadge] = useState(exam.badge || 'দৈনিক মডেল টেস্ট');
  const [infoSubject, setInfoSubject] = useState(exam.subject || 'বাংলা');
  const [infoTopic, setInfoTopic] = useState(exam.topic || '');
  const [infoPost, setInfoPost] = useState(exam.post || '');
  const [infoPassMark, setInfoPassMark] = useState(exam.pass_mark || 0);
  const [infoExamType, setInfoExamType] = useState(exam.exam_type || 'free_exams');
  const [infoCategory, setInfoCategory] = useState(exam.category || 'ফ্রি ট্রায়াল টেস্ট (Free Test)');
  const [infoQuestionCount, setInfoQuestionCount] = useState(exam.question_count || 25);
  const [infoTimeMinutes, setInfoTimeMinutes] = useState(exam.time_minutes || 20);
  const [infoNegativeMarks, setInfoNegativeMarks] = useState(exam.negative_marks || 0.25);
  const [infoTotalMarks, setInfoTotalMarks] = useState(exam.total_marks || 25);
  const [infoDescription, setInfoDescription] = useState(exam.description || '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Sub-tabs inside Step 2 ('add'): 'aitopic' | 'copypaste' | 'manual' | 'bank'
  const [addMethodTab, setAddMethodTab] = useState<'aitopic' | 'copypaste' | 'manual' | 'bank'>('aitopic');

  // Student test simulation mode inside Step 3
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string | number, string>>({});

  // Inline Quick Add toggle inside Step 3
  const [showInlineAdd, setShowInlineAdd] = useState(false);

  // Exam Publish / Status State
  const [currentExamStatus, setCurrentExamStatus] = useState<ExamStatus>(exam.status || 'active');
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Attached Questions State (Questions already in this exam)
  const [attachedQuestions, setAttachedQuestions] = useState<Question[]>([]);
  const [loadingAttached, setLoadingAttached] = useState(false);
  const [attachedSearch, setAttachedSearch] = useState('');
  const [attachedSubjectFilter, setAttachedSubjectFilter] = useState('all');

  // Question Bank List
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
  const [editingExtractedIdx, setEditingExtractedIdx] = useState<number | null>(null);

  // 3. AI Topic Generator State
  const [topic, setTopic] = useState('');
  const [topicCount, setTopicCount] = useState<number>(exam.question_count || 10);
  const [topicSubject, setTopicSubject] = useState(exam.subject && exam.subject !== 'সাধারণ' ? exam.subject : 'বাংলা');
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savingGenerated, setSavingGenerated] = useState(false);
  const [editingGeneratedIdx, setEditingGeneratedIdx] = useState<number | null>(null);

  // Subjects List
  const [subjectsList, setSubjectsList] = useState<string[]>(() =>
    getAllSubjects(exam.subject ? [exam.subject] : [])
  );

  // Toast / General message & CTA
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

      setInfoTitle(exam.title || '');
      setInfoBadgeType(exam.badge_type || 'daily');
      setInfoBadge(exam.badge || 'দৈনিক মডেল টেস্ট');
      setInfoSubject(exam.subject || 'বাংলা');
      setInfoTopic(exam.topic || '');
      setInfoPost(exam.post || '');
      setInfoPassMark(exam.pass_mark || 0);
      setInfoExamType(exam.exam_type || 'free_exams');
      setInfoCategory(exam.category || 'ফ্রি ট্রায়াল টেস্ট (Free Test)');
      setInfoQuestionCount(exam.question_count || 25);
      setInfoTimeMinutes(exam.time_minutes || 20);
      setInfoNegativeMarks(exam.negative_marks || 0.25);
      setInfoTotalMarks(exam.total_marks || 25);
      setInfoDescription(exam.description || '');

      if (exam && exam.question_count) {
        setTopicCount(exam.question_count);
      }
      setWizardStep(1);
    }
  }, [isOpen, exam]);

  const handleSaveExamInfoAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim()) {
      alert('পরীক্ষার শিরোনাম দেয়া আবশ্যক।');
      return;
    }
    setSavingInfo(true);
    const payload = {
      title: infoTitle.trim(),
      badge: infoBadge.trim() || 'মডেল টেস্ট',
      badge_type: infoBadgeType,
      subject: infoSubject,
      topic: infoTopic.trim() || null,
      post: infoPost.trim() || null,
      pass_mark: Number(infoPassMark),
      exam_type: infoExamType,
      category: infoCategory,
      question_count: Number(infoQuestionCount),
      time_minutes: Number(infoTimeMinutes),
      negative_marks: Number(infoNegativeMarks),
      total_marks: Number(infoTotalMarks),
      description: infoDescription.trim(),
    };
    const res = await updateExam(exam.id, payload);
    setSavingInfo(false);
    if (res.success) {
      setActionSuccessMsg('✓ পরীক্ষার তথ্য সফলভাবে সংরক্ষিত হয়েছে! এখন প্রশ্ন যুক্ত করুন।');
      setTimeout(() => setActionSuccessMsg(null), 2500);
      setWizardStep(2);
      onQuestionsUpdated(0);
    } else {
      alert(res.error || 'তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  if (!isOpen) return null;

  // Toggle Exam Publish / Status
  const handleChangeExamStatus = async (status: ExamStatus) => {
    setTogglingStatus(true);
    const res = await updateExam(exam.id, { status: status });
    setTogglingStatus(false);

    if (res.success) {
      setCurrentExamStatus(status);
      setActionSuccessMsg(
        status === 'active'
          ? '🎉 মডেল টেস্টটি সফলভাবে লাইভ পাবলিশ করা হয়েছে!'
          : status === 'upcoming'
          ? 'মডেল টেস্টটি আপকামিং (Upcoming) মোডে রাখা হয়েছে।'
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

    // Optimistic UI update
    setAttachedQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correct_answer: correctOption } : q))
    );

    const res = await updateQuestion(questionId, {
      correct_answer: correctOption,
    });

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

  // Update Question (from inline edit)
  const handleUpdateQuestion = async (
    questionId: string | number,
    updatedData: Partial<Question>
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await updateQuestion(questionId, updatedData);
    if (res.success && res.data) {
      const updatedItem = res.data;
      setAttachedQuestions((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, ...updatedItem } : item))
      );
      setActionSuccessMsg('প্রশ্ন ও অপশনসমূহ সফলভাবে সংশোধন ও সেভ করা হয়েছে!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      onQuestionsUpdated(0);
      return { success: true };
    }
    return { success: false, error: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।' };
  };

  // Delete Attached Question
  const handleDeleteAttachedQuestion = async (questionId: string | number) => {
    const res = await deleteQuestion(questionId);
    if (res.success) {
      setAttachedQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setActionSuccessMsg('প্রশ্নটি পরীক্ষা থেকে সফলভাবে মুছে ফেলা হয়েছে!');
      setTimeout(() => setActionSuccessMsg(null), 2500);
      onQuestionsUpdated(-1);
    } else {
      alert(res.error || 'প্রশ্ন মুছে ফেলা সম্ভব হয়নি।');
    }
  };

  // Duplicate Question
  const handleDuplicateQuestion = async (q: Question) => {
    const duplicatedData = {
      question: `${q.question} (কপি)`,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      status: 'published' as const,
      subject: q.subject || exam.subject,
      topic: q.topic || undefined,
      exam_id: exam.id,
    };

    const res = await insertQuestion(duplicatedData);
    if (res.success && res.data) {
      setAttachedQuestions((prev) => [...prev, res.data]);
      setActionSuccessMsg('প্রশ্নটি সফলভাবে ডুপ্লিকেট করা হয়েছে!');
      setTimeout(() => setActionSuccessMsg(null), 2500);
      onQuestionsUpdated(1);
    }
  };

  // 1. Manual Form Save
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
      setManualSuccess('প্রশ্নটি সফলভাবে মডেল টেস্টে যুক্ত হয়েছে!');
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

  // 2. Copy Paste AI Extract
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

      const localParsed = parseBengaliMCQsLocally(rawText);
      if (localParsed.length > 0) {
        setExtractedQuestions(localParsed);
        return;
      }

      if (data && data.error) {
        setExtractError(data.error);
      } else {
        setExtractError('টেক্সট থেকে প্রশ্ন চেনা যায়নি। প্রতিটি প্রশ্ন ও চারটি অপশন আলাদা লাইনে লিখে চেষ্টা করুন।');
      }
    } catch (err: any) {
      setExtracting(false);
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
      setActionSuccessMsg(`🎉 ${extractedQuestions.length} টি প্রশ্ন মডেল টেস্টে সফলভাবে যুক্ত হয়েছে!`);
      setExtractedQuestions([]);
      setRawText('');
      onQuestionsUpdated(extractedQuestions.length);
      await loadAttachedQuestions();
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setExtractError(res.error || 'প্রশ্নগুলো সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // 3. AI Topic Generator
  const handleGenerateTopicAI = async () => {
    setTopicError(null);
    if (!topic.trim()) {
      setTopicError('টপিকের নাম লিখুন (যেমন: ১৯৭১ সালের মুক্তিযুদ্ধ বা সূরা বাকারা)');
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
        throw new Error('সার্ভারের রেসপন্স পড়তে সমস্যা হয়েছে।');
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
      setActionSuccessMsg(`🎉 ${generatedQuestions.length} টি জেনারেটকৃত প্রশ্ন মডেল টেস্টে সফলভাবে যুক্ত হয়েছে!`);
      setGeneratedQuestions([]);
      setTopic('');
      onQuestionsUpdated(generatedQuestions.length);
      await loadAttachedQuestions();
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setTopicError(res.error || 'জেনারেটকৃত প্রশ্নগুলো সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  // 4. Question Bank Selection
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
      setActionSuccessMsg(`🎉 ${count} টি প্রশ্ন এই মডেল টেস্টে সফলভাবে যুক্ত হয়েছে!`);
      setSelectedBankIds(new Set());
      onQuestionsUpdated(count);
      await loadAttachedQuestions();
      loadQuestionBank();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('প্রশ্ন যুক্ত করতে সমস্যা হয়েছে: ' + (err?.message || 'Unknown error'));
    } finally {
      setAttachingFromBank(false);
    }
  };

  // Filtered Attached Questions for Preview Step
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

  // Filtered Bank Questions
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] relative space-y-5">
        {/* Header & Wizard Bar */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-1 -right-1 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl bg-slate-100 dark:bg-slate-800 transition-colors z-10"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <ExamStepWizardHeader
            currentStep={wizardStep}
            onStepChange={setWizardStep}
            exam={exam}
            attachedCount={attachedQuestions.length}
            targetCount={exam.question_count || 0}
            currentExamStatus={currentExamStatus}
            onChangeStatus={handleChangeExamStatus}
            togglingStatus={togglingStatus}
          />
        </div>

        {/* Global Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{actionSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: EXAM INFO & SETTINGS                                              */}
        {/* ========================================================================= */}
        {wizardStep === 1 && (
          <form onSubmit={handleSaveExamInfoAndNext} className="space-y-5 pt-1 animate-fadeIn">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-emerald-700 dark:text-emerald-300">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>ধাপ ১: পরীক্ষার সাধারণ তথ্য ও সেটিংস</span>
              </div>
              <p>
                পরীক্ষার শিরোনাম, ক্যাটাগরি, বিষয়, সময় এবং নম্বর বণ্টন নির্ধারণ করুন। "সেভ করুন ও পরবর্তী ধাপ" বাটনে ক্লিক করে প্রশ্ন যুক্ত করার ধাপে যান।
              </p>
            </div>

            {/* Exam Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                পরীক্ষার শিরোনাম (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={infoTitle}
                onChange={(e) => setInfoTitle(e.target.value)}
                placeholder='যেমন: "১৯তম NTRCA সাধারণ জ্ঞান ও বাংলা বিশেষ মডেল টেস্ট"'
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Badge Type & Badge Custom Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ব্যাজের ধরন (Badge Type) <span className="text-red-500">*</span>
                </label>
                <select
                  value={infoBadgeType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setInfoBadgeType(val);
                    if (val === 'daily') setInfoBadge('দৈনিক মডেল টেস্ট');
                    else if (val === 'weekly') setInfoBadge('সাপ্তাহিক মেগা টেস্ট');
                    else if (val === 'special') setInfoBadge('বিশেষ সাজেশন');
                    else if (val === 'job') setInfoBadge('চাকরি প্রস্তুতি');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="daily">দৈনিক মডেল টেস্ট (Daily)</option>
                  <option value="weekly">সাপ্তাহিক মেগা টেস্ট (Weekly)</option>
                  <option value="special">বিশেষ সাজেশন (Special)</option>
                  <option value="job">চাকরি প্রস্তুতি (Job Prep)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ব্যাজ লেবেল (Badge Label)
                </label>
                <input
                  type="text"
                  required
                  value={infoBadge}
                  onChange={(e) => setInfoBadge(e.target.value)}
                  placeholder="যেমন: দৈনিক মডেল টেস্ট"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                বিষয় (Subject) <span className="text-red-500">*</span>
              </label>
              <select
                value={infoSubject}
                onChange={(e) => setInfoSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic, Post, Pass mark & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  টপিক বা অধ্যায় (Topic)
                </label>
                <input
                  type="text"
                  value={infoTopic}
                  onChange={(e) => setInfoTopic(e.target.value)}
                  placeholder="যেমন: ধ্বনি ও বর্ণ, সমাস, আন্তর্জাতিক"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  পদ বা ডেজিগনেশন (Post / Designation)
                </label>
                <input
                  type="text"
                  value={infoPost}
                  onChange={(e) => setInfoPost(e.target.value)}
                  placeholder="যেমন: সহকারী শিক্ষক, বিসিএস"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  পাস মার্ক
                </label>
                <input
                  type="number"
                  min="0"
                  value={infoPassMark}
                  onChange={(e) => setInfoPassMark(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  সময় (মিনিট)
                </label>
                <input
                  type="number"
                  min="1"
                  value={infoTimeMinutes}
                  onChange={(e) => setInfoTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  মোট নম্বর
                </label>
                <input
                  type="number"
                  min="1"
                  value={infoTotalMarks}
                  onChange={(e) => setInfoTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  নেগেটিভ মার্ক
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={infoNegativeMarks}
                  onChange={(e) => setInfoNegativeMarks(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  মোট প্রশ্ন সংখ্যা
                </label>
                <input
                  type="number"
                  min="1"
                  value={infoQuestionCount}
                  onChange={(e) => setInfoQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                পরীক্ষার বিবরণ ও নির্দেশিকা (Description)
              </label>
              <textarea
                rows={3}
                value={infoDescription}
                onChange={(e) => setInfoDescription(e.target.value)}
                placeholder="পরীক্ষার নিয়মাবলী ও নির্দেশিকা লিখুন..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-2xl flex items-center gap-1.5"
              >
                <span>স্কিপ করে প্রশ্ন যোগ করুন ➜</span>
              </button>
              <button
                type="submit"
                disabled={savingInfo}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {savingInfo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>সেভ করুন ও পরবর্তী ধাপ: প্রশ্ন সংযোজন ➜</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ADD QUESTIONS WORKSPACE                                           */}
        {/* ========================================================================= */}
        {wizardStep === 2 && (
          <div className="space-y-4 pt-1">
            {/* Sub-Tabs for Add Methods */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setAddMethodTab('aitopic')}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  addMethodTab === 'aitopic'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md ring-2 ring-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">🤖 এআই জেনারেটর</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMethodTab('copypaste')}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  addMethodTab === 'copypaste'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">📋 কপি-পেস্ট এআই</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMethodTab('manual')}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  addMethodTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">➕ নতুন প্রশ্ন লিখুন</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMethodTab('bank')}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  addMethodTab === 'bank'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md ring-2 ring-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">🏦 প্রশ্ন ব্যাংক ({bankQuestions.length})</span>
              </button>
            </div>

            {/* 1. AI TOPIC GENERATOR */}
            {addMethodTab === 'aitopic' && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 p-4 rounded-2xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
                  <div className="flex items-center gap-2 font-extrabold text-purple-700 dark:text-purple-300">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                    <span>টপিক থেকে এআই প্রশ্ন জেনারেটর:</span>
                  </div>
                  <p>
                    যেকোনো বিষয়ের টপিক লিখুন। এআই নিমেষেই ৪টি বিকল্প অপশন ও ব্যাখ্যাসহ সঠিক প্রশ্ন তৈরি করে দেবে।
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
                      placeholder='যেমন: "১৯৭১ সালের মুক্তিযুদ্ধ", "কারক ও বিভক্তি", "সূরা বাকারা" বা "Algebra"'
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
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
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center text-purple-600 dark:text-purple-400 focus:outline-none"
                        />
                        <span className="text-slate-500 dark:text-slate-400">টি</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 25, 30, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTopicCount(num)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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

                {/* Generated Questions List */}
                {generatedQuestions.length > 0 && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                        জেনারেট হওয়া {generatedQuestions.length} টি প্রশ্ন পাওয়া গেছে:
                      </h3>
                      <button
                        onClick={handleSaveAllGenerated}
                        disabled={savingGenerated}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
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
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingGeneratedIdx(isEditing ? null : idx)}
                                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300 flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>{isEditing ? 'প্রিভিউ' : 'এডিট'}</span>
                              </button>
                            </div>

                            {isEditing ? (
                              <div className="space-y-2.5 pt-1">
                                <textarea
                                  rows={2}
                                  value={q.question}
                                  onChange={(e) => {
                                    const updated = [...generatedQuestions];
                                    updated[idx].question = e.target.value;
                                    setGeneratedQuestions(updated);
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-200 rounded-xl text-xs font-semibold"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {['option_a', 'option_b', 'option_c', 'option_d'].map((k) => (
                                    <input
                                      key={k}
                                      type="text"
                                      value={q[k]}
                                      onChange={(e) => {
                                        const updated = [...generatedQuestions];
                                        updated[idx][k] = e.target.value;
                                        setGeneratedQuestions(updated);
                                      }}
                                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg text-xs"
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                  {q.question}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold">ক.</span> {q.option_a}
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold">খ.</span> {q.option_b}
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold">গ.</span> {q.option_c}
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold">ঘ.</span> {q.option_d}
                                  </div>
                                </div>
                                <div className="pt-1 text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
                                  সঠিক উত্তর: {q.correct_answer === 'option_a' ? 'ক' : q.correct_answer === 'option_b' ? 'খ' : q.correct_answer === 'option_c' ? 'গ' : 'ঘ'}
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

            {/* 2. COPY PASTE AI EXTRACTION */}
            {addMethodTab === 'copypaste' && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="flex items-center gap-2 font-extrabold text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>কপি-পেস্ট স্মার্ট এক্সট্র্যাক্ট:</span>
                  </div>
                  <p>
                    যে কোনো পিডিএফ, ওয়ার্ড বা বই থেকে কপি করা টেক্সট নিচের বক্সে পেস্ট করুন। এআই স্বয়ংক্রিয়ভাবে প্রশ্ন, ৪টি অপশন ও সঠিক উত্তর আলাদা করে ফেলবে!
                  </p>
                </div>

                {extractError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}

                <div>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`১. বাংলাদেশের সংবিধানের কত অনুচ্ছেদে মৌলিক অধিকারের নিশ্চয়তা দেওয়া হয়েছে?
ক) ২৬ অনুচ্ছেদ  খ) ২৭ অনুচ্ছেদ  গ) ২৮ অনুচ্ছেদ  ঘ) ২৯ অনুচ্ছেদ
উত্তর: খ
ব্যাখ্যা: সংবিধানের ২৭ নং অনুচ্ছেদে আইনের দৃষ্টিতে সমতার কথা বলা হয়েছে।`}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
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

                {/* Extracted List */}
                {extractedQuestions.length > 0 && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ডিটেক্টকৃত {extractedQuestions.length} টি প্রশ্ন পাওয়া গেছে:
                      </h3>
                      <button
                        onClick={handleSaveAllExtracted}
                        disabled={savingExtracted}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                      >
                        {savingExtracted ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>সবগুলো সেভ করে মডেল টেস্টে যুক্ত করুন</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {extractedQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 text-xs space-y-2">
                          <div className="font-bold text-slate-900 dark:text-white">{q.question}</div>
                          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                            <div>ক: {q.option_a}</div>
                            <div>খ: {q.option_b}</div>
                            <div>গ: {q.option_c}</div>
                            <div>ঘ: {q.option_d}</div>
                          </div>
                          <div className="text-[11px] font-black text-emerald-600">
                            সঠিক উত্তর: {q.correct_answer === 'option_a' ? 'ক' : q.correct_answer === 'option_b' ? 'খ' : q.correct_answer === 'option_c' ? 'গ' : 'ঘ'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. MANUAL QUESTION ENTRY */}
            {addMethodTab === 'manual' && (
              <form onSubmit={handleSaveManual} className="space-y-4 pt-2 animate-fadeIn">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      বিষয় (Subject)
                    </label>
                    <select
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      {subjectsList.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      টপিক (Topic - ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      placeholder="টপিক..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
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
                    placeholder="প্রশ্ন লিখুন..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'option_a' as const, label: 'ক) অপশন A', val: manualOptionA, setVal: setManualOptionA },
                    { key: 'option_b' as const, label: 'খ) অপশন B', val: manualOptionB, setVal: setManualOptionB },
                    { key: 'option_c' as const, label: 'গ) অপশন C', val: manualOptionC, setVal: setManualOptionC },
                    { key: 'option_d' as const, label: 'ঘ) অপশন D', val: manualOptionD, setVal: setManualOptionD },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-2xl border transition-all ${
                        manualCorrect === opt.key
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                          {opt.label} <span className="text-red-500">*</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setManualCorrect(opt.key)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                            manualCorrect === opt.key
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                          }`}
                        >
                          {manualCorrect === opt.key ? '✓ সঠিক উত্তর' : 'সঠিক হিসেবে বাছুন'}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={opt.val}
                        onChange={(e) => opt.setVal(e.target.value)}
                        placeholder="অপশনের টেক্সট লিখুন..."
                        className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    ব্যাখ্যা (Explanation - ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="প্রশ্নের ব্যাখ্যা লিখুন..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={manualSubmitting}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-all"
                  >
                    {manualSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>প্রশ্ন সেভ করে মডেল টেস্টে যোগ করুন</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. QUESTION BANK */}
            {addMethodTab === 'bank' && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="প্রশ্ন ব্যাংকে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={bankSubjectFilter}
                      onChange={(e) => setBankSubjectFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
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
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingBank ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

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
                            className="mt-1 w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                          <div className="flex-1 text-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                {q.question}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
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
                    disabled={selectedBankIds.size === 0 || attachingFromBank}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-2xl shadow flex items-center gap-2"
                  >
                    {attachingFromBank ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>সিলেক্ট করা প্রশ্ন মডেল টেস্টে যুক্ত করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: LIVE PREVIEW & EDIT WORKSPACE                                     */}
        {/* ========================================================================= */}
        {wizardStep === 3 && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Action Bar: Search, Subject Filter, Mode Toggle & Inline Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attachedSearch}
                  onChange={(e) => setAttachedSearch(e.target.value)}
                  placeholder="সংযুক্ত প্রশ্নে বা অপশনে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
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

                {/* Student Simulation Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStudentMode(!isStudentMode);
                    setStudentAnswers({});
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    isStudentMode
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="শিক্ষার্থী ভিউ টেস্ট মোড: উত্তর নির্বাচন করে টেস্ট করুন"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isStudentMode ? 'শিক্ষার্থী মোড (চালু)' : 'টেস্ট ড্রাইভ মোড'}</span>
                </button>

                {/* Inline Add Question Button */}
                <button
                  type="button"
                  onClick={() => setShowInlineAdd(!showInlineAdd)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন প্রশ্ন</span>
                </button>

                <button
                  type="button"
                  onClick={loadAttachedQuestions}
                  disabled={loadingAttached}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAttached ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Inline Quick Question Add Form */}
            {showInlineAdd && (
              <QuickAddQuestionInline
                examId={exam.id}
                defaultSubject={exam.subject || 'বাংলা'}
                subjectsList={subjectsList}
                onAddQuestion={async (newQData) => {
                  const res = await insertQuestion(newQData);
                  if (res.success && res.data) {
                    setAttachedQuestions((prev) => [...prev, res.data]);
                    setActionSuccessMsg('নতুন প্রশ্ন সফলভাবে যুক্ত হয়েছে!');
                    setTimeout(() => setActionSuccessMsg(null), 2500);
                    onQuestionsUpdated(1);
                    return { success: true };
                  }
                  return { success: false, error: res.error };
                }}
                onClose={() => setShowInlineAdd(false)}
              />
            )}

            {/* Quick Helper Banner */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>সহজ প্রিভিউ ও এডিট:</strong> নিচের যেকোনো অপশনে (ক, খ, গ, ঘ) ক্লিক করে সরাসরি সঠিক উত্তর পরিবর্তন ও সেভ করতে পারেন। টেক্সট বদলাতে <strong>"সংশোধন"</strong> বাটনে চাপুন।
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
                <p className="text-xs font-bold">পরীক্ষার প্রশ্ন লোড হচ্ছে...</p>
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
                      ? 'উপরে "প্রশ্ন নির্বাচন ও সংযোজন" ধাপে ফিরে গিয়ে এআই দিয়ে তৈরি করুন অথবা সরাসরি প্রশ্ন লিখুন।'
                      : 'অন্য কোনো কিওয়ার্ড দিয়ে চেষ্টা করুন।'}
                  </p>
                </div>
                {attachedQuestions.length === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ প্রশ্ন যোগ করার ধাপে যান</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
                {filteredAttachedQuestions.map((q, idx) => (
                  <ExamQuestionPreviewCard
                    key={q.id}
                    question={q}
                    index={idx}
                    isStudentMode={isStudentMode}
                    studentSelectedAnswer={studentAnswers[q.id]}
                    onStudentSelectAnswer={(optKey) =>
                      setStudentAnswers({ ...studentAnswers, [q.id]: optKey })
                    }
                    onQuickSetCorrectAnswer={handleQuickSetCorrectAnswer}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteAttachedQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                    subjectsList={subjectsList}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
