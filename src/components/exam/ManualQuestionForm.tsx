import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Question } from '../../types';

interface ManualQuestionFormProps {
  onAddQuestion: (question: Omit<Question, 'id'>) => void;
  defaultSubject?: string;
  defaultTopic?: string;
  defaultPost?: string;
  marksPerQuestion?: number;
}

export const ManualQuestionForm: React.FC<ManualQuestionFormProps> = ({
  onAddQuestion,
  defaultSubject = 'সাধারণ জ্ঞান',
  defaultTopic = '',
  defaultPost = '',
  marksPerQuestion = 1,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [currentMarks, setCurrentMarks] = useState(marksPerQuestion);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleAddMoreOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      setError('কমপক্ষে ২টি অপশন থাকা বাধ্যতামূলক');
      return;
    }
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    if (correctOptionIdx >= next.length) {
      setCorrectOptionIdx(0);
    }
  };

  const handleReset = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIdx(0);
    setExplanation('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('প্রশ্নের বিবরণ লিখা আবশ্যক');
      return;
    }

    const validOptions = options.map((opt) => opt.trim());
    if (validOptions.some((opt) => !opt)) {
      setError('সকল অপশনের টেক্সট পূরণ করুন');
      return;
    }

    const answerKeyMap: Record<number, string> = {
      0: 'option_a',
      1: 'option_b',
      2: 'option_c',
      3: 'option_d',
      4: 'option_e',
      5: 'option_f',
    };

    const newQ: Omit<Question, 'id'> = {
      question: questionText.trim(),
      option_a: validOptions[0] || '',
      option_b: validOptions[1] || '',
      option_c: validOptions[2] || '',
      option_d: validOptions[3] || '',
      correct_answer: answerKeyMap[correctOptionIdx] || 'option_a',
      explanation: explanation.trim() || null,
      subject: defaultSubject || 'বাংলা',
      topic: defaultTopic || null,
      post: defaultPost || null,
      status: 'published',
    };

    onAddQuestion(newQ);
    handleReset();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="pb-1 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
          ম্যানুয়ালি প্রশ্ন যোগ করুন
        </h3>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* প্রশ্ন লিখুন */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            প্রশ্ন লিখুন <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {questionText.length}/500
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="এখানে প্রশ্ন লিখুন..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
        />
      </div>

      {/* সঠিক উত্তর & প্রতি প্রশ্নের নম্বর */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            সঠিক উত্তর <span className="text-rose-500">*</span>
          </label>
          <select
            value={correctOptionIdx}
            onChange={(e) => setCorrectOptionIdx(parseInt(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
          >
            {options.map((opt, idx) => (
              <option key={idx} value={idx}>
                {`অপশন ${idx + 1}`}: {opt ? opt.substring(0, 30) : `(অপশন ${idx + 1} পূরণ করুন)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            প্রতি প্রশ্নের নম্বর <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={currentMarks}
            onChange={(e) => setCurrentMarks(parseFloat(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
          />
        </div>
      </div>

      {/* বিকল্পসমূহ */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          বিকল্পসমূহ <span className="text-rose-500">*</span>
        </label>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectOptionIdx(idx)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  correctOptionIdx === idx
                    ? 'border-[#5B36F5] bg-[#5B36F5] text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                }`}
                title={`অপশন ${idx + 1}-কে সঠিক উত্তর নির্ধারণ করুন`}
              >
                {correctOptionIdx === idx && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`অপশন ${idx + 1} লিখুন`}
                className={`flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] ${
                  correctOptionIdx === idx
                    ? 'border-[#5B36F5] ring-1 ring-[#5B36F5]/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />

              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
                  title="অপশন মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 6 && (
          <button
            type="button"
            onClick={handleAddMoreOption}
            className="w-full py-2.5 border-2 border-dashed border-[#5B36F5]/30 dark:border-indigo-500/30 hover:border-[#5B36F5] text-[#5B36F5] dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>আরও অপশন যোগ করুন</span>
          </button>
        )}
      </div>

      {/* ব্যাখ্যা (ঐচ্ছিক) */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          ব্যাখ্যা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
        </label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="সঠিক উত্তরের ব্যাখ্যা বা সূত্র লিখুন..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>রিসেট করুন</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-[#5B36F5] hover:bg-[#4E2DE3] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>প্রশ্ন যুক্ত করুন</span>
        </button>
      </div>
    </div>
  );
};
