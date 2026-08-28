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
  Bot,
} from 'lucide-react';
import { WorkingQuestion, AiAutoGenerateConfig } from '../../types/questionBank';
import { QuestionBankHeader } from './Header';
import { StepIndicator } from './StepIndicator';
import { DuplicateValidationCard } from './DuplicateValidationCard';
import { EditQuestionModal } from './EditQuestionModal';
import { SuccessPublishModal } from './SuccessPublishModal';
import {
  validateAndCheckDuplicates,
  isArabicText,
  getQuestionBankDirectionality,
} from '../../lib/questionBankEngine';
import { Question } from '../../types';

interface Interface07AiGeneratedPreviewProps {
  generatedQuestions: WorkingQuestion[];
  config: AiAutoGenerateConfig;
  existingQuestions: Question[];
  onBackToStep1: () => void;
  onPublish: (finalQuestions: WorkingQuestion[]) => Promise<void>;
  onGoToBank: () => void;
}

export const Interface07AiGeneratedPreview: React.FC<Interface07AiGeneratedPreviewProps> = ({
  generatedQuestions,
  config,
  existingQuestions,
  onBackToStep1,
  onPublish,
  onGoToBank,
}) => {
  const [workingList, setWorkingList] = useState<WorkingQuestion[]>(generatedQuestions);
  const [editingQuestion, setEditingQuestion] = useState<WorkingQuestion | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Run duplicate and quality validation engine
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
        step1Label="AI দিয়ে প্রশ্ন জেনারেট"
        step2Label="প্রিভিউ ও প্রকাশ করুন"
        onStepClick={(step) => {
          if (step === 1) onBackToStep1();
        }}
      />

      {/* 3. AI Generated Summary Card (Screenshot 7) */}
      <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">
              AI জেনারেট প্রিভিউ ও প্রকাশ
            </h2>
            <p className="text-xs text-slate-400">
              মোট {checkedQuestions.length} টি প্রশ্ন তৈরি হয়েছে | বিষয়: {config.subject}
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
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">সফল প্রশ্ন</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {summary.validCount}
            </span>
          </div>

          <div className="bg-[#050914] border border-amber-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">সমস্যাযুক্ত</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {checkedQuestions.length - summary.validCount}
            </span>
          </div>

          <div className="bg-[#050914] border border-rose-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">ডুপ্লিকেট</span>
            <span className="text-base font-black text-rose-400 font-mono">
              {summary.duplicateCount}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Generated Question Cards (Screenshot 7) */}
      <div className="space-y-4">
        {checkedQuestions.map((q, idx) => {
          const dirInfo = getQuestionBankDirectionality({
            question: q.question,
            options: q.options,
            explanation: q.explanation,
            language: q.language,
          });
          const isArabic = dirInfo.isQuestionArabic;
          const qDir = q.questionDir || dirInfo.questionDir;
          const optDir = q.optionsDir || dirInfo.optionsDir;
          const expDir = q.explanationDir || dirInfo.explanationDir;

          const arabicOptionLabels: Record<string, string> = {
            A: 'أ',
            B: 'ب',
            C: 'ج',
            D: 'د',
          };

          return (
            <div
              key={q.tempId}
              className={`bg-[#0b1322] border ${
                q.isDuplicate
                  ? 'border-rose-500/60 ring-1 ring-rose-500/30'
                  : q.hasErrors
                  ? 'border-amber-500/60'
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
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      AI Generated
                    </span>
                    {isArabic && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        عربي (RTL)
                      </span>
                    )}
                    {optDir === 'rtl' && !isArabic && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                        বিকল্প: RTL
                      </span>
                    )}
                    {q.subject && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {q.subject}
                      </span>
                    )}
                    {q.topic && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px]">
                        {q.topic}
                      </span>
                    )}
                    {q.post && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px]">
                        {q.post}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px]">
                      {q.difficulty}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold text-white leading-relaxed ${
                      qDir === 'rtl' ? 'font-amiri text-base text-right' : 'text-left'
                    }`}
                    dir={qDir}
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

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" dir={optDir}>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isCorrect = q.correctAnswer === opt;
                  const optText = q.options[opt];
                  const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs transition-all ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-[#050914] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {optLabel}
                      </span>
                      <span className={`flex-1 ${optDir === 'rtl' ? 'font-amiri text-sm text-right' : 'text-left'}`}>
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
                    className={expDir === 'rtl' ? 'font-amiri text-sm text-right' : 'text-left'}
                    dir={expDir}
                  >
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Duplicate and Quality Validation Checklist Card (Screenshot 7) */}
      <DuplicateValidationCard
        summary={summary}
        totalQuestions={checkedQuestions.length}
        title="ডুপ্লিকেট ও মান যাচাই"
      />

      {/* 6. Big Rocket Publish Button (Screenshot 7) */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleFinalPublish}
          disabled={isPublishing}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 stroke-[2.5]" />
            <span>প্রকাশ করুন (Publish)</span>
          </div>
          <span className="text-[11px] font-medium opacity-90">
            সব প্রশ্ন সরাসরি প্রশ্ন ব্যাংকে যুক্ত হবে
          </span>
        </button>

        <p className="text-center text-[11px] text-slate-400">
          ⓘ প্রকাশের পর প্রশ্ন ব্যাংকে সাথে সাথে যুক্ত হয়ে যাবে এবং পরে এডিট করতে পারবেন।
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
        subject={config.subject || 'সাধারণ'}
        onGoToBank={onGoToBank}
        onAddNew={onBackToStep1}
      />
    </div>
  );
};
