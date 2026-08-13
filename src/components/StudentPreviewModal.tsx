import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, RefreshCw, X, HelpCircle, Layers, BookOpen, Award, Video, FileText } from 'lucide-react';
import { getSupabaseClient, fetchPublishedCoursesForStudent } from '../lib/supabase';
import { Question, Course } from '../types';

interface StudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'questions'>('courses');
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [publishedQuestions, setPublishedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const fetchStudentView = async () => {
    setLoading(true);

    // Fetch Courses for student
    const coursesRes = await fetchPublishedCoursesForStudent();
    setPublishedCourses(coursesRes.courses);
    setCoursesError(coursesRes.error);

    // Fetch Questions
    const client = getSupabaseClient();
    if (client) {
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
            subject: row.subject || row.category || row.topic || 'ইংরেজি',
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
      }
    }
    setLoading(false);
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
              <h3 className="font-bold text-sm text-slate-100">স্টুডেন্ট অ্যাপ লাইভ প্রিভিউ (Student App Live View)</h3>
              <p className="text-[11px] text-slate-400">
                Supabase <code>status = published</code> ডাটা প্রদর্শন
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'courses'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>প্রকাশিত কোর্সসমূহ ({publishedCourses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>প্রশ্ন ব্যাংক ({publishedQuestions.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              স্টুডেন্ট অ্যাপের লাইভ ডাটা লোড হচ্ছে...
            </div>
          ) : activeTab === 'courses' ? (
            publishedCourses.length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  কোনো প্রকাশিত কোর্স পাওয়া যায়নি!
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  এডমিন প্যানেল থেকে কোনো কোর্সের স্ট্যাটাস <strong>"পাবলিশড (published)"</strong> সিলেক্ট করে সেভ করলে স্টুডেন্ট অ্যাপে তৎক্ষণাৎ তা দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>মোট প্রকাশিত কোর্স: {publishedCourses.length}টি</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" /> Supabase Synced
                  </span>
                </div>

                {publishedCourses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        {c.category}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{c.price}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.title}</h4>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-[10px]">
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{c.total_classes}টি</span>
                        <span className="text-slate-500">ক্লাস</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{c.total_sheets}টি</span>
                        <span className="text-slate-500">শিট</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{c.total_exams}টি</span>
                        <span className="text-slate-500">মডেল টেস্ট</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">শিক্ষক: {c.instructor_name}</span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-[11px]">
                        {c.enroll_button_text || 'ভর্তি হন'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : publishedQuestions.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                কোনো প্রকাশিত প্রশ্ন পাওয়া যায়নি!
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
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[11px]">
                    {currentQ.subject || 'ইংরেজি'}
                  </span>
                </div>

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
