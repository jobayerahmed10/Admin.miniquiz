import React, { useState } from 'react';
import {
  Edit3,
  FileText,
  Database,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  Trash2,
  AlertCircle,
  ClipboardList,
  Layers,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { Question } from '../../types';
import { ExamInfoFormData } from './Step1ExamInfo';
import { ManualQuestionForm } from './ManualQuestionForm';
import { CopyPasteQuestionForm } from './CopyPasteQuestionForm';
import { QuestionBankSelector } from './QuestionBankSelector';
import { AutoGenerateForm } from './AutoGenerateForm';

export type QuestionAddMethod = 'manual' | 'copy_paste' | 'bank' | 'auto_generate';

interface Step2AddQuestionsProps {
  examInfo: ExamInfoFormData;
  attachedQuestions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onPreviewQuick: () => void;
}

export const Step2AddQuestions: React.FC<Step2AddQuestionsProps> = ({
  examInfo,
  attachedQuestions,
  onUpdateQuestions,
  onPrev,
  onNext,
  onPreviewQuick,
}) => {
  const [activeMethod, setActiveMethod] = useState<QuestionAddMethod>('manual');
  const [validationError, setValidationError] = useState<string | null>(null);

  const targetCount = examInfo.question_count || 50;

  // Helper to append a single new question (with generated id/slug)
  const handleAddSingleQuestion = (newQ: Omit<Question, 'id'>) => {
    if (attachedQuestions.length >= targetCount) {
      setValidationError(`STEP 1-এ নির্ধারিত সর্বোচ্চ ${targetCount}টি প্রশ্ন ইতিমধ্যে যুক্ত হয়েছে।`);
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    const created: Question = {
      ...newQ,
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      subject: newQ.subject || examInfo.subject,
      topic: newQ.topic || examInfo.topic,
      post: newQ.post || examInfo.post,
      status: 'published',
    };

    onUpdateQuestions([...attachedQuestions, created]);
    setValidationError(null);
  };

  // Helper to append multiple questions
  const handleAddBatchQuestions = (newQuestions: Omit<Question, 'id'>[]) => {
    const spaceLeft = targetCount - attachedQuestions.length;
    if (spaceLeft <= 0) {
      setValidationError(`STEP 1-এ নির্ধারিত সর্বোচ্চ ${targetCount}টি প্রশ্ন ইতিমধ্যে যুক্ত হয়েছে।`);
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    const sliceToAdd = newQuestions.slice(0, spaceLeft);
    const mapped: Question[] = sliceToAdd.map((q, idx) => ({
      ...q,
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      subject: q.subject || examInfo.subject,
      topic: q.topic || examInfo.topic,
      post: q.post || examInfo.post,
      status: 'published',
    }));

    onUpdateQuestions([...attachedQuestions, ...mapped]);
    if (newQuestions.length > spaceLeft) {
      setValidationError(`সীমা অতিক্রম করায় কেবল ${spaceLeft}টি প্রশ্ন যুক্ত করা সম্ভব হয়েছে।`);
      setTimeout(() => setValidationError(null), 4000);
    } else {
      setValidationError(null);
    }
  };

  // Helper for bank selection toggle
  const handleToggleBankQuestion = (q: Question) => {
    const exists = attachedQuestions.some((item) => String(item.id) === String(q.id));
    if (exists) {
      onUpdateQuestions(attachedQuestions.filter((item) => String(item.id) !== String(q.id)));
    } else {
      if (attachedQuestions.length >= targetCount) {
        setValidationError(`STEP 1-এ নির্ধারিত সর্বোচ্চ ${targetCount}টি প্রশ্নের বেশি নির্বাচন করা যাবে না।`);
        setTimeout(() => setValidationError(null), 4000);
        return;
      }
      onUpdateQuestions([...attachedQuestions, q]);
    }
  };

  const handleRemoveQuestion = (idxToRemove: number) => {
    onUpdateQuestions(attachedQuestions.filter((_, idx) => idx !== idxToRemove));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= attachedQuestions.length) return;
    const next = [...attachedQuestions];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateQuestions(next);
  };

  const handleClearAllQuestions = () => {
    if (window.confirm('আপনি কি সত্যিই সকল যুক্তকৃত প্রশ্ন মুছে ফেলতে চান?')) {
      onUpdateQuestions([]);
    }
  };

  const handleProceedNext = () => {
    if (attachedQuestions.length === 0) {
      setValidationError('পরবর্তী ধাপে যেতে কমপক্ষে ১টি প্রশ্ন যুক্ত করুন');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* 4 Method Selector Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
          প্রশ্ন যুক্ত করার উপায়
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. ম্যানুয়ালি */}
          <button
            type="button"
            onClick={() => setActiveMethod('manual')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              activeMethod === 'manual'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-1 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeMethod === 'manual'
                    ? 'bg-[#5B36F5] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">১</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                ম্যানুয়ালি
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                নিজে লিখে প্রশ্ন যোগ করুন
              </p>
            </div>
          </button>

          {/* 2. কপি-পেস্ট */}
          <button
            type="button"
            onClick={() => setActiveMethod('copy_paste')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              activeMethod === 'copy_paste'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-1 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeMethod === 'copy_paste'
                    ? 'bg-[#5B36F5] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">২</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                কপি-পেস্ট
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                AI বা সোর্স থেকে পেস্ট করুন
              </p>
            </div>
          </button>

          {/* 3. প্রশ্ন ব্যাংক থেকে */}
          <button
            type="button"
            onClick={() => setActiveMethod('bank')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              activeMethod === 'bank'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-1 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeMethod === 'bank'
                    ? 'bg-[#5B36F5] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Database className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">৩</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                প্রশ্ন ব্যাংক থেকে
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                ভান্ডার থেকে নির্বাচন করুন
              </p>
            </div>
          </button>

          {/* 4. অটো জেনারেট */}
          <button
            type="button"
            onClick={() => setActiveMethod('auto_generate')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              activeMethod === 'auto_generate'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-1 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeMethod === 'auto_generate'
                    ? 'bg-[#5B36F5] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">৪</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                অটো জেনারেট
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                AI দিয়ে স্বয়ংক্রিয়ভাবে তৈরি
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Active Method Content */}
      <div>
        {activeMethod === 'manual' && (
          <ManualQuestionForm
            defaultSubject={examInfo.subject}
            defaultTopic={examInfo.topic}
            defaultPost={examInfo.post}
            marksPerQuestion={examInfo.marks_per_question}
            onAddQuestion={handleAddSingleQuestion}
          />
        )}

        {activeMethod === 'copy_paste' && (
          <CopyPasteQuestionForm
            defaultSubject={examInfo.subject}
            defaultTopic={examInfo.topic}
            defaultPost={examInfo.post}
            onAddBatchQuestions={handleAddBatchQuestions}
          />
        )}

        {activeMethod === 'bank' && (
          <QuestionBankSelector
            currentSelectedQuestions={attachedQuestions}
            targetCount={targetCount}
            initialSubject={examInfo.subject}
            initialTopic={examInfo.topic}
            initialPost={examInfo.post}
            onToggleQuestion={handleToggleBankQuestion}
            onBatchSelect={onUpdateQuestions}
            onSwitchMethod={(method) => setActiveMethod(method)}
          />
        )}

        {activeMethod === 'auto_generate' && (
          <AutoGenerateForm
            defaultSubject={examInfo.subject}
            defaultTopic={examInfo.topic}
            defaultPost={examInfo.post}
            targetCount={targetCount - attachedQuestions.length}
            onAddBatchQuestions={handleAddBatchQuestions}
          />
        )}
      </div>

      {/* Attached Questions List / Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                যুক্তকৃত প্রশ্নসমূহ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                পরীক্ষার জন্য চূড়ান্ত নির্বাচিত প্রশ্ন তালিকা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                attachedQuestions.length === targetCount
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300'
              }`}
            >
              {attachedQuestions.length} / {targetCount} টি
            </span>

            {attachedQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllQuestions}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="সব মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {attachedQuestions.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <ClipboardList className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                এখনো কোনো প্রশ্ন যোগ করা হয়নি
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                উপরের ৪টি পদ্ধতির যেকোনো একটি নির্বাচন করে প্রশ্ন যোগ করুন
              </p>
            </div>
          </div>
        ) : (
          /* Attached Question Cards */
          <div className="space-y-3">
            {attachedQuestions.map((q, idx) => {
              const isOptionCorrect = (optKey: string) => {
                return (
                  q.correct_answer === optKey ||
                  q.correct_answer?.toLowerCase() === optKey.replace('option_', '').toLowerCase()
                );
              };

              return (
                <div
                  key={q.id || idx}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {q.question}
                      </p>
                    </div>

                    {/* Reorder and Delete actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="উপরে নিন"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === attachedQuestions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="নিচে নিন"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pl-8">
                    {[
                      { key: 'option_a', prefix: 'ক', text: q.option_a },
                      { key: 'option_b', prefix: 'খ', text: q.option_b },
                      { key: 'option_c', prefix: 'গ', text: q.option_c },
                      { key: 'option_d', prefix: 'ঘ', text: q.option_d },
                    ].map((opt) => {
                      const isCorrect = isOptionCorrect(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold dark:bg-emerald-950/60 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold">{opt.prefix}.</span>
                            <span className="truncate">{opt.text || '-'}</span>
                          </div>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="pl-8 pt-0.5">
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        ব্যাখ্যা: {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>পূর্ববর্তী ধাপ</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            নির্বাচিত প্রশ্ন:{' '}
            <strong className="text-[#5B36F5] dark:text-indigo-400 text-sm">
              {attachedQuestions.length} / {targetCount}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleProceedNext}
          className="px-6 py-3.5 bg-[#5B36F5] hover:bg-[#4E2DE3] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>পরবর্তী ধাপ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
