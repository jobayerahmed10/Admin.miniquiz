import React from 'react';
import { X, Check, HelpCircle, FileText, Tag, BookOpen, Layers } from 'lucide-react';
import { Question } from '../../types';

interface QuestionDetailModalProps {
  question: Question | null;
  onClose: () => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({ question, onClose }) => {
  if (!question) return null;

  const isOptionCorrect = (optKey: string) => {
    return question.correct_answer === optKey ||
      question.correct_answer?.toLowerCase() === optKey.replace('option_', '').toLowerCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                প্রশ্নের বিস্তারিত বিবরণ
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                ID: {question.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Question Meta Tags */}
          <div className="flex flex-wrap gap-1.5">
            {question.subject && (
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B36F5] dark:text-indigo-300 font-bold text-[11px] rounded-lg">
                বিষয়: {question.subject}
              </span>
            )}
            {question.topic && (
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg">
                টপিক: {question.topic}
              </span>
            )}
            {question.post && (
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-lg">
                পদ: {question.post}
              </span>
            )}
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] rounded-lg">
              MCQ
            </span>
          </div>

          {/* Question Text */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
              {question.question}
            </h4>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              বিকল্পসমূহ:
            </label>

            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'option_a', prefix: 'ক', text: question.option_a },
                { key: 'option_b', prefix: 'খ', text: question.option_b },
                { key: 'option_c', prefix: 'গ', text: question.option_c },
                { key: 'option_d', prefix: 'ঘ', text: question.option_d },
              ].map((opt) => {
                const isCorrect = isOptionCorrect(opt.key);
                return (
                  <div
                    key={opt.key}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold ring-1 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {opt.prefix}
                      </span>
                      <span>{opt.text || '-'}</span>
                    </div>

                    {isCorrect && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> সঠিক উত্তর
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
              <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 block">
                ব্যাখ্যা:
              </span>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
