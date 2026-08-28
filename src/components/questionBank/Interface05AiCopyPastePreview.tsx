import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit,
  Trash2,
  Rocket,
  Info,
  Check,
  ChevronDown,
  Layers,
  Filter,
} from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { DuplicateValidationCard } from './DuplicateValidationCard';
import { EditQuestionModal } from './EditQuestionModal';
import { SuccessPublishModal } from './SuccessPublishModal';
import { validateAndCheckDuplicates, isArabicText } from '../../lib/questionBankEngine';
import { Question } from '../../types';

interface Interface05AiCopyPastePreviewProps {
  parsedQuestions: WorkingQuestion[];
  existingQuestions: Question[];
  meta: any;
  onBackToStep1: () => void;
  onPublish: (finalQuestions: WorkingQuestion[]) => Promise<void>;
  onGoToBank: () => void;
}

export const Interface05AiCopyPastePreview: React.FC<Interface05AiCopyPastePreviewProps> = ({
  parsedQuestions,
  existingQuestions,
  meta,
  onBackToStep1,
  onPublish,
  onGoToBank,
}) => {
  const [workingList, setWorkingList] = useState<WorkingQuestion[]>(parsedQuestions);
  const [editingQuestion, setEditingQuestion] = useState<WorkingQuestion | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'error' | 'duplicate'>('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Run duplicate and validation engine
  const { checkedQuestions, summary } = useMemo(() => {
    return validateAndCheckDuplicates(workingList, existingQuestions);
  }, [workingList, existingQuestions]);

  const handleDelete = (index: number) => {
    if (workingList.length <= 1) return;
    setWorkingList(workingList.filter((_, idx) => idx !== index));
  };

  const handleSaveEdited = (updated: WorkingQuestion) => {
    setWorkingList(
      workingList.map((q) => (q.tempId === updated.tempId ? updated : q))
    );
  };

  const totalOptionsCount = useMemo(() => {
    return checkedQuestions.reduce((acc, q) => {
      let count = 0;
      if (q.options.A) count++;
      if (q.options.B) count++;
      if (q.options.C) count++;
      if (q.options.D) count++;
      return acc + count;
    }, 0);
  }, [checkedQuestions]);

  const filteredQuestions = useMemo(() => {
    if (filterView === 'valid') return checkedQuestions.filter((q) => !q.hasErrors && !q.isDuplicate);
    if (filterView === 'error') return checkedQuestions.filter((q) => q.hasErrors);
    if (filterView === 'duplicate') return checkedQuestions.filter((q) => q.isDuplicate);
    return checkedQuestions;
  }, [checkedQuestions, filterView]);

  const handleFinalPublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(checkedQuestions);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 1. Header */}
      <QuestionBankHeader
        showBack
        onBack={onBackToStep1}
        title="মাস্টার প্রশ্ন ব্যাংক"
        subTitle="QUESTION BANK"
      />

      {/* 2. Step Indicator */}
      <StepIndicator
        currentStep={2}
        step1Label="কপি-পেস্ট করুন"
        step2Label="প্রিভিউ ও যুক্ত করুন"
        onStepClick={(step) => {
          if (step === 1) onBackToStep1();
        }}
      />

      {/* 3. AI Parsing Summary Card (Screenshot 5) */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">AI পার্সিং প্রিভিউ</h2>
            <p className="text-xs text-slate-400">
              AI আপনার পেস্ট করা প্রশ্নগুলো বিশ্লেষণ করেছে
            </p>
          </div>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-[#050914] border border-indigo-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">মোট প্রশ্ন</span>
            <span className="text-base font-black text-indigo-400 font-mono">
              {checkedQuestions.length}
            </span>
          </div>

          <div className="bg-[#050914] border border-emerald-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">সফলভাবে পার্স</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {summary.validCount}
            </span>
          </div>

          <div className="bg-[#050914] border border-amber-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">পার্সিং সমস্যা</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {checkedQuestions.length - summary.validCount}
            </span>
          </div>

          <div className="bg-[#050914] border border-sky-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">মোট অপশন</span>
            <span className="text-base font-black text-sky-400 font-mono">
              {totalOptionsCount}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Controls Header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <select
            value={filterView}
            onChange={(e) => setFilterView(e.target.value as any)}
            className="bg-[#0b1322] border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সব প্রশ্ন দেখুন ({checkedQuestions.length})</option>
            <option value="valid">সফল প্রশ্ন ({summary.validCount})</option>
            <option value="error">সমস্যাযুক্ত ({checkedQuestions.length - summary.validCount})</option>
            <option value="duplicate">ডুপ্লিকেট ({summary.duplicateCount})</option>
          </select>
        </div>

        <button
          onClick={() => {
            if (checkedQuestions[0]) setEditingQuestion(checkedQuestions[0]);
          }}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-[#0b1322] border border-slate-800 px-3 py-2 rounded-2xl"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>এডিট করুন</span>
        </button>
      </div>

      {/* 5. Question Cards List (Screenshot 5) */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const isArabic = isArabicText(q.question) || q.language === 'العربية';
          const isProblem = q.hasErrors || !q.correctAnswer;

          return (
            <div
              key={q.tempId}
              className={`bg-[#0b1322] border ${
                isProblem
                  ? 'border-amber-500/70 shadow-amber-950/20'
                  : q.isDuplicate
                  ? 'border-rose-500/70 shadow-rose-950/20'
                  : 'border-slate-800/90'
              } rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    {isProblem ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        সমস্যা আছে
                      </span>
                    ) : q.isDuplicate ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                        ডুপ্লিকেট
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        সফল
                      </span>
                    )}

                    {q.subject && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {q.subject}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-bold text-white leading-relaxed ${
                      isArabic ? 'font-amiri text-base text-right' : ''
                    }`}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    {q.question}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="এডিট করুন"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {checkedQuestions.length > 1 && (
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Problem Alert Box (Screenshot 5) */}
              {isProblem && (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {q.errorMessage || 'সমস্যা: সঠিক উত্তর পাওয়া যায়নি | উত্তর চিহ্নিত করুন।'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(q)}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shrink-0"
                  >
                    উত্তর নির্বাচন করুন
                  </button>
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isCorrect = q.correctAnswer === opt;
                  const optText = q.options[opt];
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs transition-all ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-[#050914] border-slate-800 text-slate-300'
                      }`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt}
                      </span>
                      <span className={`flex-1 ${isArabic ? 'font-amiri text-sm text-right' : ''}`}>
                        {optText || <span className="text-slate-500">বিকল্প নেই</span>}
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                          ✓ সঠিক
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="bg-[#050914] border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    ব্যাখ্যা:
                  </span>
                  <p
                    className={isArabic ? 'font-amiri text-sm text-right' : ''}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Validation Checklist (Screenshot 5) */}
      <DuplicateValidationCard
        summary={summary}
        totalQuestions={checkedQuestions.length}
        title="পার্সিং সারাংশ ও যাচাইকরণ"
      />

      {/* 7. Big Rocket Publish Button */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleFinalPublish}
          disabled={isPublishing}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 stroke-[2.5]" />
            <span>প্রিভিউ দেখুন ও যুক্ত করুন (Publish)</span>
          </div>
          <span className="text-[11px] font-medium opacity-90">
            সব প্রশ্ন সরাসরি প্রশ্ন ব্যাংকে যুক্ত হবে
          </span>
        </button>

        <p className="text-center text-[11px] text-slate-400">
          ⓘ পরবর্তী ধাপে প্রতিটি প্রশ্ন যাচাই করে প্রকাশ (Publish) করতে পারবেন।
        </p>
      </div>

      {/* Inline Edit Modal */}
      {editingQuestion && (
        <EditQuestionModal
          isOpen={Boolean(editingQuestion)}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveEdited}
        />
      )}

      {/* Success Modal */}
      <SuccessPublishModal
        isOpen={showSuccessModal}
        count={checkedQuestions.length}
        subject={meta?.subject || 'সাধারণ'}
        onGoToBank={onGoToBank}
        onAddNew={onBackToStep1}
      />
    </div>
  );
};
