import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Exam, Question, ExamStatus } from '../../types';
import { StepIndicator } from './StepIndicator';
import { Step1ExamInfo, ExamInfoFormData } from './Step1ExamInfo';
import { Step2AddQuestions } from './Step2AddQuestions';
import { Step3PreviewPublish } from './Step3PreviewPublish';
import { QuestionDetailModal } from './QuestionDetailModal';
import {
  insertExam,
  updateExam,
  insertBatchQuestions,
  fetchQuestionsByExamId,
  generateSequentialQuestionId,
  generateQuestionSlug,
} from '../../lib/supabase';

interface CreateExamWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exam: Exam) => void;
  examToEdit?: Exam | null; // If editing an existing exam
}

export const CreateExamWizard: React.FC<CreateExamWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  examToEdit,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Form State
  const [examInfo, setExamInfo] = useState<ExamInfoFormData>({
    title: '',
    subject: 'বাংলা',
    topic: 'কারক ও বিভক্তি',
    post: 'সহকারী শিক্ষক',
    exam_format: 'MCQ (বহুনির্বাচনি)',
    question_count: 50,
    total_marks: 50,
    marks_per_question: 1,
    time_minutes: 30,
    has_negative_marking: true,
    negative_marks: 0.25,
    start_date: '',
    end_date: '',
    max_attempts: 1,
    instructions: '',
    custom_id_pattern: '',
  });

  const [attachedQuestions, setAttachedQuestions] = useState<Question[]>([]);

  // Initialize or reset data when modal opens / examToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (examToEdit) {
      setExamInfo({
        title: examToEdit.title || '',
        subject: examToEdit.subject || 'বাংলা',
        topic: examToEdit.topic || '',
        post: examToEdit.post || '',
        exam_format: examToEdit.exam_format || 'MCQ (বহুনির্বাচনি)',
        question_count: examToEdit.question_count || 50,
        total_marks: examToEdit.total_marks || 50,
        marks_per_question: examToEdit.marks_per_question || 1,
        time_minutes: examToEdit.time_minutes || 30,
        has_negative_marking: examToEdit.has_negative_marking !== undefined
          ? examToEdit.has_negative_marking
          : (examToEdit.negative_marks || 0) > 0,
        negative_marks: examToEdit.negative_marks || 0.25,
        start_date: examToEdit.start_date || '',
        end_date: examToEdit.end_date || '',
        max_attempts: examToEdit.max_attempts || 1,
        instructions: examToEdit.instructions || '',
        custom_id: examToEdit.id || '',
        custom_id_pattern: examToEdit.id_pattern || '',
      });

      // Fetch existing questions
      const loadQuestions = async () => {
        if (examToEdit.questions && examToEdit.questions.length > 0) {
          setAttachedQuestions(examToEdit.questions);
        } else {
          const res = await fetchQuestionsByExamId(examToEdit.id);
          setAttachedQuestions(res.questions || []);
        }
      };
      loadQuestions();
    } else {
      // Reset for new creation
      setExamInfo({
        title: '',
        subject: 'বাংলা',
        topic: 'কারক ও বিভক্তি',
        post: 'সহকারী শিক্ষক',
        exam_format: 'MCQ (বহুনির্বাচনি)',
        question_count: 50,
        total_marks: 50,
        marks_per_question: 1,
        time_minutes: 30,
        has_negative_marking: true,
        negative_marks: 0.25,
        start_date: '',
        end_date: '',
        max_attempts: 1,
        instructions: '',
        custom_id_pattern: '',
      });
      setAttachedQuestions([]);
    }
    setCurrentStep(1);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  }, [isOpen, examToEdit]);

  if (!isOpen) return null;

  // Step validation
  const canNavigateToStep = (targetStep: 1 | 2 | 3): boolean => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return Boolean(examInfo.title && examInfo.subject && examInfo.topic);
    if (targetStep === 3) return Boolean(examInfo.title && attachedQuestions.length > 0);
    return false;
  };

  const handleStep1Next = (data: ExamInfoFormData) => {
    setExamInfo(data);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Next = () => {
    if (attachedQuestions.length === 0) {
      setSaveErrorMessage('পরবর্তী ধাপে যেতে কমপক্ষে ১টি প্রশ্ন যুক্ত করুন');
      setTimeout(() => setSaveErrorMessage(null), 4000);
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishExam = async (finalStatus: ExamStatus) => {
    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const examId = examInfo.custom_id?.trim() || (examToEdit ? examToEdit.id : `exam_${Date.now()}`);

      // 1. Prepare Question IDs & update sequential IDs if pattern is given
      const pattern = examInfo.custom_id_pattern?.trim();
      const updatedQuestions: Question[] = attachedQuestions.map((q, idx) => {
        let qId = q.id;
        if (pattern && (!String(qId).startsWith(pattern) || typeof qId === 'number')) {
          qId = generateSequentialQuestionId(pattern, attachedQuestions, idx);
        }
        const qCode = q.question_code || (typeof qId === 'string' ? qId : `q_${qId}`);
        return {
          ...q,
          id: qId,
          question_code: qCode,
          exam_id: examId,
          subject: q.subject || examInfo.subject,
          topic: q.topic || examInfo.topic,
          post: q.post || examInfo.post,
          slug: q.slug || generateQuestionSlug(q.question, pattern),
          status: 'published',
        };
      });

      // Strict Selected Question Codes / IDs
      const selectedCodes = Array.from(
        new Set(updatedQuestions.map((q) => String(q.question_code || q.id)).filter(Boolean))
      );

      const examPayload: Omit<Exam, 'created_at' | 'updated_at'> = {
        id: examId,
        title: examInfo.title.trim(),
        badge: examToEdit?.badge || (examInfo.exam_format.includes('ফ্রি') ? 'ফ্রি পরীক্ষা' : 'মডেল টেস্ট'),
        badge_type: (examToEdit?.badge_type || (examInfo.exam_format.includes('ফ্রি') ? 'free' : 'daily')) as any,
        subject: examInfo.subject.trim(),
        topic: examInfo.topic.trim(),
        post: examInfo.post.trim(),
        exam_type: examToEdit?.exam_type || 'free',
        exam_format: examInfo.exam_format,
        question_count: updatedQuestions.length || examInfo.question_count,
        total_marks: examInfo.total_marks,
        marks_per_question: examInfo.marks_per_question,
        time_minutes: examInfo.time_minutes,
        has_negative_marking: examInfo.has_negative_marking,
        negative_marks: examInfo.has_negative_marking ? examInfo.negative_marks : 0,
        start_date: examInfo.start_date || null,
        end_date: examInfo.end_date || null,
        max_attempts: examInfo.max_attempts,
        instructions: examInfo.instructions || null,
        id_pattern: examInfo.custom_id_pattern || null,
        status: finalStatus,
        selected_question_codes: selectedCodes,
        question_ids: selectedCodes,
        questions: updatedQuestions,
      };

      // 2. Save Exam
      let savedExam: Exam | null = null;
      if (examToEdit) {
        const updateRes = await updateExam(examToEdit.id, examPayload);
        if (!updateRes.success) {
          throw new Error(updateRes.error || 'পরীক্ষা আপডেট করতে ব্যর্থ হয়েছে');
        }
        savedExam = (updateRes.data as Exam) || { ...examPayload, id: examToEdit.id };
      } else {
        const insertRes = await insertExam(examPayload);
        if (!insertRes.success) {
          throw new Error(insertRes.error || 'নতুন পরীক্ষা তৈরি করতে ব্যর্থ হয়েছে');
        }
        savedExam = (insertRes.data as Exam) || { ...examPayload };
      }

      const targetExamId = String(savedExam?.id || examId);

      // 3. Batch Save / Sync Questions linked to the Exam ID
      if (updatedQuestions.length > 0) {
        const questionsPayload = updatedQuestions.map((q, idx) => {
          const customQuestionId = String(q.id || `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`);
          return {
            id: customQuestionId,
            question_code: q.question_code || customQuestionId,
            exam_id: targetExamId,
            subject: examInfo.subject || q.subject || 'সাধারণ',
            question_text: q.question,
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            status: 'published',
            slug: q.slug || generateQuestionSlug(q.question),
            topic: q.topic || examInfo.topic || '',
            post: q.post || examInfo.post || '',
          };
        });

        console.log(`Saving ${questionsPayload.length} questions for Exam ID (${targetExamId}):`, questionsPayload);

        const qRes = await insertBatchQuestions(questionsPayload as any);

        if (!qRes.success) {
          const qErr = qRes.error || 'প্রশ্নগুলো টেবিলে সেভ করতে সমস্যা হয়েছে।';
          console.error(`Questions Insert Error: ${qErr}`);
          alert(`Questions Insert Error: ${qErr}`);
          throw new Error(`Questions Insert Error: ${qErr}`);
        }
      }

      setSaveSuccessMessage('পরীক্ষা ও প্রশ্ন সফলভাবে সংরক্ষিত হয়েছে!');

      setTimeout(() => {
        if (savedExam) {
          onSuccess(savedExam);
        }
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Save exam failed:', err);
      const errMsg = err.message || 'সংরক্ষণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।';
      setSaveErrorMessage(errMsg);
      alert(`সুপাবেসে সংরক্ষণ করতে ব্যর্থ হয়েছে:\n${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getStepSubtitle = () => {
    if (currentStep === 1) return 'পরীক্ষার তথ্য দিন';
    if (currentStep === 2) return 'প্রশ্ন যুক্ত করুন';
    return 'প্রিভিউ ও প্রকাশ';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex flex-col justify-start items-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto min-h-[90vh]">
        {/* ================= MODAL TOP HEADER ================= */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          {/* Left: Back Arrow + Title & Subtitle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep((currentStep - 1) as 1 | 2 | 3);
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="পূর্ববর্তী"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {examToEdit ? 'পরীক্ষা সম্পাদনা করুন' : 'নতুন পরীক্ষা তৈরি করুন'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {getStepSubtitle()}
              </p>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            {currentStep === 2 && attachedQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-indigo-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>প্রিভিউ দেখুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">বাতিল করুন</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* 3-Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
            canNavigateToStep={canNavigateToStep}
          />

          {/* Toast / Alert Messages */}
          {saveSuccessMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 font-bold text-xs sm:text-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {saveErrorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-2xl flex items-center gap-2.5 text-rose-800 dark:text-rose-200 font-bold text-xs sm:text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
          )}

          {/* Step 1: Exam Info */}
          {currentStep === 1 && (
            <Step1ExamInfo
              initialData={examInfo}
              onNext={handleStep1Next}
              onCancel={onClose}
            />
          )}

          {/* Step 2: Add Questions */}
          {currentStep === 2 && (
            <Step2AddQuestions
              examInfo={examInfo}
              attachedQuestions={attachedQuestions}
              onUpdateQuestions={setAttachedQuestions}
              onPrev={() => setCurrentStep(1)}
              onNext={handleStep2Next}
              onPreviewQuick={() => setCurrentStep(3)}
            />
          )}

          {/* Step 3: Preview & Publish */}
          {currentStep === 3 && (
            <Step3PreviewPublish
              examInfo={examInfo}
              questions={attachedQuestions}
              initialStatus={examToEdit?.status || 'active'}
              isSaving={isSaving}
              onEditInfo={() => setCurrentStep(1)}
              onEditQuestions={() => setCurrentStep(2)}
              onPrev={() => setCurrentStep(2)}
              onPublish={handlePublishExam}
            />
          )}
        </div>
      </div>
    </div>
  );
};
