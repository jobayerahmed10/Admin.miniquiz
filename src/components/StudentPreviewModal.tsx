import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, RefreshCw, X, HelpCircle, Layers } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { Question } from '../types';

interface StudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({ isOpen, onClose }) => {
  const [publishedQuestions, setPublishedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchStudentView = async () => {
    setLoading(true);
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await client
        .from('questions')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const questionsList: Question[] = data.map((row: any) => ({
          id: row.id,
          question: row.question || row.question_text || '',
          option_a: row.option_a || '',
          option_b: row.option_b || '',
          option_c: row.option_c || '',
          option_d: row.option_d || '',
          correct_answer: row.correct_answer || row.correct_option || 'option_a',
          explanation: row.explanation || '',
          status: 'published',
          created_at: row.created_at,
        }));
        setPublishedQuestions(questionsList);
        setSelectedIndex(0);
        setSelectedOption(null);
        setShowAnswer(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudentView();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = publishedQuestions[selectedIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">স্টুডেন্ট অ্যাপ প্রিভিউ (MiniQuiz Student App)</h3>
              <p className="text-[11px] text-slate-400">
                Supabase <code>public.questions</code> (status = published)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudentView}
              title="রিফ্রেশ করুন"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              স্টুডেন্ট অ্যাপ প্রশ্ন লোড করছে...
            </div>
          ) : publishedQuestions.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                কোনো প্রকাশিত প্রশ্ন পাওয়া যায়নি!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                অ্যাডমিন প্যানেল থেকে কোনো প্রশ্ন স্ট্যাটাস <strong>published</strong> সিলেক্ট করে সংরক্ষণ করলে তা এখানে তাৎক্ষণিকভাবে দেখাবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  প্রশ্ন {selectedIndex + 1} / {publishedQuestions.length}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> লাইভ সিঙ্কড
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 leading-relaxed">
                  {currentQ.question}
                </h4>

                <div className="space-y-2.5">
                  {[
                    { key: 'option_a', label: 'ক', text: currentQ.option_a },
                    { key: 'option_b', label: 'খ', text: currentQ.option_b },
                    { key: 'option_c', label: 'গ', text: currentQ.option_c },
                    { key: 'option_d', label: 'ঘ', text: currentQ.option_d },
                  ].map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    const isCorrect =
                      currentQ.correct_answer === opt.key ||
                      currentQ.correct_answer === opt.label ||
                      currentQ.correct_answer === opt.text;

                    let btnStyle =
                      'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-500';

                    if (showAnswer) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 font-medium';
                    }

                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSelectedOption(opt.key);
                          setShowAnswer(true);
                        }}
                        className={`w-full p-3 text-left rounded-xl border text-sm transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {opt.label}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">{opt.text}</span>
                        </div>
                        {showAnswer && isCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showAnswer && currentQ.explanation && (
                  <div className="mt-4 p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> সঠিক উত্তরের ব্যাখ্যা:
                    </p>
                    <p className="leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={selectedIndex === 0}
                  onClick={() => {
                    setSelectedIndex((prev) => Math.max(0, prev - 1));
                    setSelectedOption(null);
                    setShowAnswer(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  পূর্ববর্তী প্রশ্ন
                </button>
                <button
                  disabled={selectedIndex === publishedQuestions.length - 1}
                  onClick={() => {
                    setSelectedIndex((prev) => Math.min(publishedQuestions.length - 1, prev + 1));
                    setSelectedOption(null);
                    setShowAnswer(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  পরবর্তী প্রশ্ন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
