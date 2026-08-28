import React, { useState } from 'react';
import { X, Check, Globe } from 'lucide-react';
import { WorkingQuestion } from '../../types/questionBank';
import { getQuestionBankDirectionality } from '../../lib/questionBankEngine';

interface EditQuestionModalProps {
  isOpen: boolean;
  question: WorkingQuestion | null;
  onClose: () => void;
  onSave: (updated: WorkingQuestion) => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
}) => {
  if (!isOpen || !question) return null;

  const [formData, setFormData] = useState<WorkingQuestion>({ ...question });
  
  const dirInfo = getQuestionBankDirectionality({
    question: formData.question,
    options: formData.options,
    explanation: formData.explanation,
    language: formData.language,
  });

  const isArabic = dirInfo.isQuestionArabic;
  const qDir = dirInfo.questionDir;
  const optDir = dirInfo.optionsDir;
  const expDir = dirInfo.explanationDir;

  const arabicOptionLabels: Record<string, string> = {
    A: 'أ',
    B: 'ب',
    C: 'ج',
    D: 'د',
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      isArabic,
      questionDir: qDir,
      optionsDir: optDir,
      explanationDir: expDir,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">প্রশ্ন সম্পাদনা করুন</h3>
            {isArabic ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                عربي (RTL)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold">
                LTR
              </span>
            )}
            {optDir === 'rtl' && !isArabic && (
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                বিকল্প: RTL
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              প্রশ্ন লিখুন *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              dir={qDir}
              className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                qDir === 'rtl' ? 'font-amiri text-base leading-relaxed text-right' : 'text-left'
              }`}
              required
            />
          </div>

          {/* 4 Options Grid */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                বিকল্পসমূহ *
              </label>
              <span className="text-[10px] text-slate-500">
                {optDir === 'rtl' ? 'বিন্যাস: ডান দিক (RTL)' : 'বিন্যাস: বাম দিক (LTR)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir={optDir}>
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;
                return (
                  <div key={opt} className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">
                      বিকল্প {optLabel} *
                    </label>
                    <div className="relative flex items-center">
                      <span className={`absolute ${optDir === 'rtl' ? 'right-3' : 'left-3'} text-xs font-bold text-slate-500`}>
                        {optLabel}.
                      </span>
                      <input
                        type="text"
                        value={formData.options[opt] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            options: { ...formData.options, [opt]: e.target.value },
                          })
                        }
                        dir={optDir}
                        className={`w-full bg-[#050914] border ${
                          formData.correctAnswer === opt
                            ? 'border-emerald-500/80 bg-emerald-950/20'
                            : 'border-slate-700/80'
                        } rounded-xl ${optDir === 'rtl' ? 'pr-8 pl-3 font-amiri text-right' : 'pl-8 pr-3 text-left'} py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct Answer Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              সঠিক উত্তর নির্বাচন করুন *
            </label>
            <div className="grid grid-cols-4 gap-2" dir={optDir}>
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optLabel = optDir === 'rtl' ? arabicOptionLabels[opt] || opt : opt;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formData.correctAnswer === opt
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black ring-2 ring-emerald-400/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{optLabel}</span>
                    {formData.correctAnswer === opt && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ব্যাখ্যা (ঐচ্ছিক)
            </label>
            <textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={2}
              dir={expDir}
              className={`w-full bg-[#050914] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                expDir === 'rtl' ? 'font-amiri text-sm leading-relaxed text-right' : 'text-left'
              }`}
              placeholder="প্রশ্নের ব্যাখ্যা বা সমাধান লিখুন..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
