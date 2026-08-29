import React, { useState } from 'react';
import { Plus, X, Save, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { isArabicText } from '../AddAiQuestionsModal';
import { sanitizeSubjectName, getAllSubjects } from '../../lib/subjectManager';

interface QuickAddQuestionInlineProps {
  examId: string;
  defaultSubject: string;
  subjectsList: string[];
  onAddQuestion: (questionData: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'option_a' | 'option_b' | 'option_c' | 'option_d';
    explanation?: string | null;
    subject?: string;
    topic?: string;
    exam_id: string;
    status: 'published';
  }) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const QuickAddQuestionInline: React.FC<QuickAddQuestionInlineProps> = ({
  examId,
  defaultSubject,
  subjectsList,
  onAddQuestion,
  onClose,
}) => {
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [explanation, setExplanation] = useState('');
  const effectiveSubjectsList = subjectsList && subjectsList.length > 0 ? subjectsList : getAllSubjects();
  const [subject, setSubject] = useState(() => sanitizeSubjectName(defaultSubject || 'বাংলা'));
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setErrorMsg('প্রশ্নের বিবরণ এবং চারটি অপশনই পূরণ করা বাধ্যতামূলক।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const cleanSub = sanitizeSubjectName(subject);
    const cleanTopic = topic.replace(/\s+/g, ' ').trim();

    const res = await onAddQuestion({
      question: question.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: correctAnswer,
      explanation: explanation.trim() || null,
      subject: cleanSub,
      topic: cleanTopic || undefined,
      exam_id: examId,
      status: 'published',
    });

    setIsSubmitting(false);

    if (res.success) {
      // Clear form
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setExplanation('');
      setTopic('');
      onClose();
    } else {
      setErrorMsg(res.error || 'প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-500 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fadeIn"
    >
      <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-900/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-xl">
            <Plus className="w-4 h-4" />
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-white">
            সরাসরি নতুন প্রশ্ন যুক্ত করুন
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            বিষয় (Subject)
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {effectiveSubjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            টপিক (Topic - ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="যেমন: সমাস, সংবিধান..."
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-black text-slate-900 dark:text-slate-100 mb-1">
          প্রশ্নের শিরোনাম (Question) <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          dir={isArabicText(question) ? 'rtl' : 'ltr'}
          placeholder="প্রশ্ন লিখুন..."
          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'option_a' as const, label: 'ক) অপশন A', val: optionA, setVal: setOptionA },
          { key: 'option_b' as const, label: 'খ) অপশন B', val: optionB, setVal: setOptionB },
          { key: 'option_c' as const, label: 'গ) অপশন C', val: optionC, setVal: setOptionC },
          { key: 'option_d' as const, label: 'ঘ) অপশন D', val: optionD, setVal: setOptionD },
        ].map((opt) => (
          <div
            key={opt.key}
            className={`p-3 rounded-2xl border transition-all ${
              correctAnswer === opt.key
                ? 'bg-emerald-100/70 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                {opt.label} <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setCorrectAnswer(opt.key)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                  correctAnswer === opt.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                }`}
              >
                {correctAnswer === opt.key ? '✓ সঠিক উত্তর' : 'সঠিক হিসেবে বাছুন'}
              </button>
            </div>
            <input
              type="text"
              required
              value={opt.val}
              onChange={(e) => opt.setVal(e.target.value)}
              dir={isArabicText(opt.val) ? 'rtl' : 'ltr'}
              placeholder="অপশনের টেক্সট লিখুন..."
              className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
          ব্যাখ্যা (Explanation - ঐচ্ছিক)
        </label>
        <textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          dir={isArabicText(explanation) ? 'rtl' : 'ltr'}
          placeholder="উত্তরের সঠিক ব্যাখ্যা লিখুন..."
          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-900/80">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold transition-colors"
        >
          বাতিল
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>সংরক্ষণ হচ্ছে...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>প্রশ্ন সেভ করুন</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
