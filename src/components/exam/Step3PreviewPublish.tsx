import React, { useState } from 'react';
import {
  Edit,
  Check,
  CheckCircle2,
  FileText,
  Clock,
  Award,
  Layers,
  ArrowLeft,
  Send,
  Eye,
  Tag,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  Radio,
} from 'lucide-react';
import { Exam, Question, ExamStatus } from '../../types';
import { ExamInfoFormData } from './Step1ExamInfo';
import { QuestionDetailModal } from './QuestionDetailModal';

interface Step3PreviewPublishProps {
  examInfo: ExamInfoFormData;
  questions: Question[];
  initialStatus?: ExamStatus;
  isSaving?: boolean;
  onEditInfo: () => void;
  onEditQuestions: () => void;
  onPrev: () => void;
  onPublish: (finalStatus: ExamStatus) => void;
}

export const Step3PreviewPublish: React.FC<Step3PreviewPublishProps> = ({
  examInfo,
  questions,
  initialStatus = 'active',
  isSaving = false,
  onEditInfo,
  onEditQuestions,
  onPrev,
  onPublish,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ExamStatus>(initialStatus || 'active');
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const displayedQuestions = showAllQuestions ? questions : questions.slice(0, 5);

  const isOptionCorrect = (q: Question, optKey: string) => {
    return (
      q.correct_answer === optKey ||
      q.correct_answer?.toLowerCase() === optKey.replace('option_', '').toLowerCase()
    );
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* ================= 1. পরীক্ষার প্রিভিউ কার্ড ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              পরীক্ষার প্রিভিউ
            </h3>
          </div>

          <button
            type="button"
            onClick={onEditInfo}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>সম্পাদনা করুন</span>
          </button>
        </div>

        {/* 2-Column Info Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Left Column */}
          <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পরীক্ষার নাম:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-right max-w-[60%]">
                {examInfo.title || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">বিষয়:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {examInfo.subject || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">টপিক:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {examInfo.topic || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পদের নাম:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {examInfo.post || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পরীক্ষার ধরন:</span>
              <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-[#5B36F5] dark:text-indigo-300 font-extrabold text-[11px] rounded-lg">
                {examInfo.exam_format || 'MCQ'}
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">মোট প্রশ্ন:</span>
              <span className="font-extrabold text-[#5B36F5] dark:text-indigo-400">
                {questions.length} / {examInfo.question_count} টি
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">সময়:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {examInfo.time_minutes} মিনিট
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পূর্ণমান:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {examInfo.total_marks} নম্বর
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পাস নম্বর:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.round(examInfo.total_marks * 0.4)} নম্বর
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">নেগেটিভ মার্কিং:</span>
              <span
                className={`font-extrabold text-[11px] px-2 py-0.5 rounded-lg ${
                  examInfo.has_negative_marking
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                {examInfo.has_negative_marking ? `-${examInfo.negative_marks}` : 'বন্ধ'}
              </span>
            </div>
          </div>
        </div>

        {/* Special Instructions preview if present */}
        {examInfo.instructions && (
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300">
            <span className="font-extrabold block mb-0.5">পরীক্ষার্থীদের নির্দেশনা:</span>
            <p className="leading-relaxed">{examInfo.instructions}</p>
          </div>
        )}
      </div>

      {/* ================= 2. প্রশ্ন প্রিভিউ সেকশন ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              প্রশ্ন প্রিভিউ {questions.length > 5 && !showAllQuestions ? '(প্রথম ৫টি)' : `(মোট ${questions.length}টি)`}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 text-xs font-bold">
              {questions.length} টি
            </span>
          </div>

          <button
            type="button"
            onClick={onEditQuestions}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#5B36F5] dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>প্রশ্ন পরিবর্তন করুন</span>
          </button>
        </div>

        {/* Question Cards List */}
        <div className="space-y-3">
          {displayedQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  <span className="text-[#5B36F5] mr-1">{idx + 1}.</span>
                  {q.question}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(q)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-[#5B36F5] bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 rounded-lg flex items-center gap-1 shrink-0"
                >
                  <Edit className="w-3 h-3" />
                  <span>সম্পাদনা</span>
                </button>
              </div>

              {/* Options Grid with Green Correct Answer Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {[
                  { key: 'option_a', prefix: 'ক', text: q.option_a },
                  { key: 'option_b', prefix: 'খ', text: q.option_b },
                  { key: 'option_c', prefix: 'গ', text: q.option_c },
                  { key: 'option_d', prefix: 'ঘ', text: q.option_d },
                ].map((opt) => {
                  const isCorrect = isOptionCorrect(q, opt.key);
                  return (
                    <div
                      key={opt.key}
                      className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-extrabold dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt.prefix}
                        </span>
                        <span>{opt.text || '-'}</span>
                      </div>
                      {isCorrect && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="font-extrabold mr-1">ব্যাখ্যা:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Questions Button */}
        {questions.length > 5 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              {showAllQuestions ? 'সংক্ষিপ্ত ভিউ দেখুন' : `সব ${questions.length}টি প্রশ্ন দেখুন`}
            </button>
          </div>
        )}
      </div>

      {/* ================= 3. পরীক্ষার স্ট্যাটাস নির্বাচন করুন ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
          পরীক্ষার স্ট্যাটাস নির্বাচন করুন
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: ড্রাফট */}
          <div
            onClick={() => setSelectedStatus('draft')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedStatus === 'draft'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedStatus === 'draft'
                    ? 'border-[#5B36F5] bg-[#5B36F5] text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedStatus === 'draft' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                ড্রাফট
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                শুধু এডমিন প্যানেলে থাকবে
              </p>
            </div>
          </div>

          {/* Option 2: আপকামিং */}
          <div
            onClick={() => setSelectedStatus('upcoming')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedStatus === 'upcoming'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedStatus === 'upcoming'
                    ? 'border-[#5B36F5] bg-[#5B36F5] text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedStatus === 'upcoming' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                আপকামিং
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                অ্যাপে দেখাবে, কিন্তু পরীক্ষা দেওয়া যাবে না
              </p>
            </div>
          </div>

          {/* Option 3: পাবলিশ */}
          <div
            onClick={() => setSelectedStatus('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedStatus === 'active'
                ? 'border-[#5B36F5] bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-[#5B36F5]'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedStatus === 'active'
                    ? 'border-[#5B36F5] bg-[#5B36F5] text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedStatus === 'active' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                পাবলিশ
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                সকলেই পরীক্ষা দিতে পারবে
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>পূর্ববর্তী</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => onPublish(selectedStatus)}
          className="px-6 py-3.5 bg-[#5B36F5] hover:bg-[#4E2DE3] disabled:opacity-50 active:scale-[0.99] text-white font-extrabold text-xs sm:text-base rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরীক্ষা সংরক্ষণ ও প্রকাশ করুন'}</span>
        </button>
      </div>

      {/* Question Details View / Quick Edit Modal */}
      {editingQuestion && (
        <QuestionDetailModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
};
