import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  FileText,
  Award,
  Users,
  CheckCircle,
  ExternalLink,
  Download,
  Clock,
  HelpCircle,
  Phone,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react';
import { Course, CourseExam, CourseSheet, CourseExamQuestion, COURSE_THEMES } from '../../types';
import { fetchCourseExams, fetchCourseSheets } from '../../lib/supabase';

interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  initialTab?: 'details' | 'routine' | 'syllabus' | 'exams' | 'sheets';
  onEditCourse?: (course: Course) => void;
  onManageExams?: (course: Course) => void;
  onManageSheets?: (course: Course) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  isOpen,
  onClose,
  course,
  initialTab = 'details',
  onEditCourse,
  onManageExams,
  onManageSheets,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'routine' | 'syllabus' | 'exams' | 'sheets'>(
    initialTab
  );

  const [exams, setExams] = useState<CourseExam[]>([]);
  const [sheets, setSheets] = useState<CourseSheet[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Active Interactive Exam Taker State
  const [takingExam, setTakingExam] = useState<CourseExam | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number>(0);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && course) {
      loadCourseContent();
    }
  }, [isOpen, course]);

  const loadCourseContent = async () => {
    setLoadingContent(true);
    const [examRes, sheetRes] = await Promise.all([
      fetchCourseExams(course.id),
      fetchCourseSheets(course.id),
    ]);
    setExams(examRes.exams);
    setSheets(sheetRes.sheets);
    setLoadingContent(false);
  };

  // Exam Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (takingExam && !examSubmitted && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setExamSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [takingExam, examSubmitted, examTimeLeft]);

  if (!isOpen || !course) return null;

  const themeObj = COURSE_THEMES.find((t) => t.id === course.theme_color) || COURSE_THEMES[0];

  const handleStartExam = (exam: CourseExam) => {
    setTakingExam(exam);
    setSelectedAnswers({});
    setExamSubmitted(false);
    setExamTimeLeft((exam.time_minutes || 15) * 60);
  };

  const handleSelectOption = (qId: string, optKey: string) => {
    if (examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
  };

  // Calculate Exam Result
  const calculateResult = () => {
    if (!takingExam) return { total: 0, correct: 0, wrong: 0, skipped: 0, score: 0, isPassed: false };
    const questions = takingExam.questions || [];
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (!selected) {
        skipped++;
      } else if (selected === q.correct_answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const negPerWrong = Number(takingExam.negative_marks) || 0.25;
    const rawScore = correct * 1 - wrong * negPerWrong;
    const score = Math.max(0, Number(rawScore.toFixed(2)));
    const passMarks = Number(takingExam.pass_marks) || 10;
    const isPassed = score >= passMarks;

    return { total: questions.length, correct, wrong, skipped, score, isPassed };
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Top Header */}
        <div className="border-b border-slate-800 p-5 sm:p-6 bg-slate-900/80 relative overflow-hidden">
          <div
            className={`absolute -top-24 -right-24 w-60 h-60 ${themeObj.bg} rounded-full blur-3xl pointer-events-none opacity-40`}
          />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                  {course.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${themeObj.badgeBg}`}>
                  {course.badge}
                </span>
                {course.badge_subtitle && (
                  <span className="text-xs text-slate-400 font-medium">&bull; {course.badge_subtitle}</span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {course.price}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {course.title}
              </h2>

              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                শিক্ষক প্যানেল: <span className="text-slate-200 font-medium">{course.instructor_name}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-emerald-400 font-bold">{course.enrolled_count} জন শিক্ষার্থী যুক্ত</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          {!takingExam && (
            <div className="flex items-center gap-1.5 mt-5 overflow-x-auto scrollbar-none pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                ১. কোর্স পরিচিতি (Overview)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('routine')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'routine'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                ২. রুটিন সময়সূচি
                {course.routine_pdf_url && <span className="w-2 h-2 rounded-full bg-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('syllabus')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'syllabus'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                ৩. সম্পূর্ণ সিলেবাস
                {course.syllabus_pdf_url && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('exams')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'exams'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                ৪. পরীক্ষা ও মডেল টেস্ট ({exams.length || course.total_exams})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sheets')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'sheets'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                ৫. পিডিএফ লেকচার শিট ({sheets.length || course.total_sheets})
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* -------------------------------------------------------------
              VIEW: ACTIVE EXAM TAKER SCREEN
             ------------------------------------------------------------- */}
          {takingExam ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Exam Taker Header */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                    মডেল টেস্ট পরীক্ষা
                  </span>
                  <h3 className="text-base font-black text-white mt-1">{takingExam.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    বিষয়: {takingExam.subject} &bull; মোট প্রশ্ন: {takingExam.questions?.length || takingExam.question_count}টি &bull; পাশ নম্বর: {takingExam.pass_marks}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {!examSubmitted ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm">
                      <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>{formatTimer(examTimeLeft)}</span>
                    </div>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      পরীক্ষা সম্পন্ন
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (examSubmitted || confirm('আপনি কি পরীক্ষা বন্ধ করে ফিরে যেতে চান?')) {
                        setTakingExam(null);
                        setExamSubmitted(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    তালিকা পেজে ফিরুন
                  </button>
                </div>
              </div>

              {/* RESULT SCORECARD BANNER (If Submitted) */}
              {examSubmitted && (
                <div className="bg-gradient-to-br from-slate-900 to-[#0c1629] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
                  {(() => {
                    const res = calculateResult();
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                          <div className="flex items-center gap-3 text-center sm:text-left">
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                                res.isPassed
                                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                                  : 'bg-rose-500 text-white shadow-rose-500/20'
                              }`}
                            >
                              {res.isPassed ? '✓' : '✗'}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-white">
                                {res.isPassed ? 'মাশাআল্লাহ! আপনি পরীক্ষায় উত্তীর্ণ হয়েছেন' : 'দুঃখিত, আপনি পাশ করতে পারেননি'}
                              </h4>
                              <p className="text-xs text-slate-400">
                                প্রাপ্ত নম্বর: <span className="font-bold text-emerald-400">{res.score}</span> / {res.total} (পাশ নম্বর: {takingExam.pass_marks})
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartExam(takingExam)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            পুনরায় পরীক্ষা দিন
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block font-medium">সঠিক উত্তর</span>
                            <span className="text-base font-black text-emerald-400">{res.correct} টি</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block font-medium">ভুল উত্তর</span>
                            <span className="text-base font-black text-rose-400">{res.wrong} টি</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block font-medium">অনুত্তরিত</span>
                            <span className="text-base font-black text-slate-400">{res.skipped} টি</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block font-medium">কাটা নম্বর</span>
                            <span className="text-base font-black text-amber-400">
                              -{(res.wrong * (Number(takingExam.negative_marks) || 0.25)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* QUESTIONS LIST */}
              {(!takingExam.questions || takingExam.questions.length === 0) ? (
                <div className="p-10 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="font-bold text-white text-sm">এই পরীক্ষায় এখনও প্রশ্ন যুক্ত করা হয়নি।</p>
                  <p className="text-xs text-slate-400">
                    এডমিন প্যানেলে "মডেল টেস্ট" বাটনে ক্লিক করে প্রশ্ন ব্যাংক বা AI দিয়ে সহজে প্রশ্ন যুক্ত করা যাবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {takingExam.questions.map((q, idx) => {
                    const selected = selectedAnswers[q.id];
                    const isAnswered = Boolean(selected);

                    return (
                      <div
                        key={q.id || idx}
                        className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-700">
                            {idx + 1}
                          </span>
                          <h4 className="flex-1 text-sm font-bold text-white leading-relaxed">
                            {q.question}
                          </h4>
                          {q.subject && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] shrink-0 font-medium">
                              {q.subject}
                            </span>
                          )}
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {[
                            { key: 'option_a', label: 'ক', text: q.option_a },
                            { key: 'option_b', label: 'খ', text: q.option_b },
                            { key: 'option_c', label: 'গ', text: q.option_c },
                            { key: 'option_d', label: 'ঘ', text: q.option_d },
                          ].map((opt) => {
                            const isThisSelected = selected === opt.key;
                            const isCorrectOpt = q.correct_answer === opt.key;

                            let optClasses = 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 text-slate-200';

                            if (examSubmitted) {
                              if (isCorrectOpt) {
                                optClasses = 'border-emerald-500/80 bg-emerald-500/20 text-emerald-200 font-bold';
                              } else if (isThisSelected && !isCorrectOpt) {
                                optClasses = 'border-rose-500/80 bg-rose-500/20 text-rose-200';
                              } else {
                                optClasses = 'border-slate-800/60 bg-slate-950/30 text-slate-400 opacity-60';
                              }
                            } else if (isThisSelected) {
                              optClasses = 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold shadow-sm shadow-purple-500/20';
                            }

                            return (
                              <button
                                key={opt.key}
                                type="button"
                                disabled={examSubmitted}
                                onClick={() => handleSelectOption(q.id, opt.key)}
                                className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between gap-3 ${optClasses}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-lg bg-slate-800/90 text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-700">
                                    {opt.label}
                                  </span>
                                  <span className="leading-snug">{opt.text}</span>
                                </div>

                                {examSubmitted && isCorrectOpt && (
                                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box (When Submitted) */}
                        {examSubmitted && q.explanation && (
                          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-indigo-300">
                              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> সঠিক উত্তরের ব্যাখ্যা:
                            </p>
                            <p className="leading-relaxed text-slate-300">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit Exam Button */}
                  {!examSubmitted && (
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmitExam}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2"
                      >
                        <Check className="w-5 h-5 text-slate-950" />
                        পরীক্ষা সমাপ্ত ও সাবমিট করুন
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'details' ? (
            /* -------------------------------------------------------------
               TAB 1: COURSE OVERVIEW & DETAILS
               ------------------------------------------------------------- */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Top Highlights Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    কোর্সের মূল আকর্ষণ ও বৈশিষ্ট্যসমূহ
                  </h3>
                  <span className="text-xs text-emerald-400 font-bold">পূর্ণাঙ্গ প্যাকেজ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(course.features && course.features.length > 0
                    ? course.features
                    : ['লাইভ ও রেকর্ড ক্লাসের আনলিমিটেড অ্যাক্সেস', 'অধ্যায়ভিত্তিক ৩০টি স্পেশাল মডেল টেস্ট', 'সম্পূর্ণ প্রিন্ট উপযোগী লেকচার শিট', 'সার্বক্ষণিক মেন্টরশিপ ও সলভ সাপোর্ট']
                  ).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-200"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full About Text / Description */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  কোর্স বিস্তারিত বিবরণ
                </h3>

                {course.about_text || course.description ? (
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
                    {course.about_text || course.description}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/30 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    <p>এই কোর্সের বিস্তারিত বিবরণ এখনও যুক্ত করা হয়নি।</p>
                    {onEditCourse && (
                      <button
                        onClick={() => {
                          onClose();
                          onEditCourse(course);
                        }}
                        className="mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-colors"
                      >
                        কোর্স বিস্তারিত টেক্সট যুক্ত করুন
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Helpline & Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">সার্বক্ষণিক হেল্পলাইন</span>
                    <span className="text-xs font-black text-white">
                      {course.helpline_contact || '+880 1800-000000'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={course.enroll_button_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-center"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                    {course.enroll_button_text || 'এখনই ভর্তি হন'}
                  </a>

                  <a
                    href={course.details_button_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all text-center"
                  >
                    {course.details_button_text || 'টেলিগ্রাম গ্রুপ'}
                  </a>
                </div>
              </div>
            </div>
          ) : activeTab === 'routine' ? (
            /* -------------------------------------------------------------
               TAB 2: CLASS & EXAM ROUTINE
               ------------------------------------------------------------- */
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                    সময়সূচি ও ক্লাস ক্যালেন্ডার
                  </span>
                  <h3 className="text-base font-black text-white">সাপ্তাহিক রুটিন শিডিউল</h3>
                  <p className="text-xs text-slate-300">
                    নিয়মিত ক্লাস ও মেগা মডেল টেস্টের সময়সূচি নিচে দেওয়া হয়েছে
                  </p>
                </div>

                {course.routine_pdf_url && (
                  <a
                    href={course.routine_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    রুটিন PDF ডাউনলোড
                  </a>
                )}
              </div>

              {/* Routine Text Content */}
              {course.routine_text ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    লিখিত রুটিন বিবরণ:
                  </h4>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {course.routine_text}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 text-amber-400/50 mx-auto" />
                  <p className="font-bold text-white text-sm">এই কোর্সে কোনো রুটিন টেক্সট যুক্ত করা হয়নি।</p>
                  <p className="text-xs text-slate-400">
                    এডমিন প্যানেলে "বাটন ও কোর্স এডিট করুন" এ গিয়ে রুটিন লিখে দিতে পারেন বা PDF আপলোড করতে পারেন।
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'syllabus' ? (
            /* -------------------------------------------------------------
               TAB 3: SYLLABUS & MARKS BREAKDOWN
               ------------------------------------------------------------- */
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase">
                    সিলেবাস রূপরেখা
                  </span>
                  <h3 className="text-base font-black text-white">সম্পূর্ণ সিলেবাস ও নম্বর বণ্টন</h3>
                  <p className="text-xs text-slate-300">
                    শিক্ষক নিবন্ধন ও নিয়োগ পরীক্ষার বিষয়ভিত্তিক বিস্তারিত সিলেবাস
                  </p>
                </div>

                {course.syllabus_pdf_url && (
                  <a
                    href={course.syllabus_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-5 py-2.5 rounded-2xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-400 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 shrink-0"
                  >
                    <Download className="w-4 h-4 text-white" />
                    সিলেবাস PDF ডাউনলোড
                  </a>
                )}
              </div>

              {/* Syllabus Text Content */}
              {course.syllabus_text ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    সিলেবাসের বিষয়সমূহ:
                  </h4>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {course.syllabus_text}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-indigo-400/50 mx-auto" />
                  <p className="font-bold text-white text-sm">এই কোর্সে কোনো সিলেবাস টেক্সট যুক্ত করা হয়নি।</p>
                  <p className="text-xs text-slate-400">
                    এডমিন প্যানেলে "বাটন ও কোর্স এডিট করুন" এ গিয়ে সিলেবাস যুক্ত করতে পারেন।
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'exams' ? (
            /* -------------------------------------------------------------
               TAB 4: COURSE EXAMS & LIVE MOCK TESTS
               ------------------------------------------------------------- */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    কোর্সের সকল মডেল টেস্ট পরীক্ষা ({exams.length}টি)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    যেকোনো পরীক্ষায় "পরীক্ষা দিন" বাটনে ক্লিক করে সরাসরি টেস্টে অংশ নিন
                  </p>
                </div>

                {onManageExams && (
                  <button
                    onClick={() => {
                      onClose();
                      onManageExams(course);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    পরীক্ষা ম্যানেজ করুন
                  </button>
                )}
              </div>

              {exams.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
                  <Award className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">এখনও কোনো পরীক্ষা যুক্ত করা হয়নি</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    এডমিন প্যানেলে "মডেল টেস্ট ({course.total_exams})" বাটনে ক্লিক করে প্রশ্ন ব্যাংক বা AI দিয়ে সহজে মডেল টেস্ট তৈরি করুন।
                  </p>
                  {onManageExams && (
                    <button
                      onClick={() => {
                        onClose();
                        onManageExams(course);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      নতুন মডেল টেস্ট তৈরি করুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.map((exam, idx) => (
                    <div
                      key={exam.id || idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                            {exam.subject || 'আরবি'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {exam.time_minutes} মিনিট
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                          {exam.title}
                        </h4>

                        {exam.topic && (
                          <p className="text-xs text-slate-400 font-medium">টপিক: {exam.topic}</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/60 rounded-xl text-center text-[10px]">
                          <div>
                            <span className="block font-bold text-white">{exam.question_count || exam.questions?.length || 0} টি</span>
                            <span className="text-slate-500">প্রশ্ন</span>
                          </div>
                          <div>
                            <span className="block font-bold text-emerald-400">{exam.total_marks || 20}</span>
                            <span className="text-slate-500">পূর্ণমান</span>
                          </div>
                          <div>
                            <span className="block font-bold text-amber-400">{exam.pass_marks || 10}</span>
                            <span className="text-slate-500">পাশ মার্ক</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartExam(exam)}
                        className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-purple-500/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        পরীক্ষা শুরু করুন
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* -------------------------------------------------------------
               TAB 5: COURSE LECTURE SHEETS & HANDNOTES
               ------------------------------------------------------------- */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    পিডিএফ লেকচার শিট ও হ্যান্ডনোটসমূহ ({sheets.length}টি)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    সকল পিডিএফ শিট সরাসরি ভিউ এবং ডাউনলোড করা যাবে
                  </p>
                </div>

                {onManageSheets && (
                  <button
                    onClick={() => {
                      onClose();
                      onManageSheets(course);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold hover:bg-teal-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    শিট আপলোড ও ম্যানেজ করুন
                  </button>
                )}
              </div>

              {sheets.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">এখনও কোনো লেকচার শিট যুক্ত করা হয়নি</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    এডমিন প্যানেলে "পিডিএফ শিট ({course.total_sheets})" বাটনে ক্লিক করে নতুন শিট আপলোড বা যুক্ত করুন।
                  </p>
                  {onManageSheets && (
                    <button
                      onClick={() => {
                        onClose();
                        onManageSheets(course);
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      নতুন শিট যুক্ত করুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheets.map((sheet, idx) => (
                    <div
                      key={sheet.id || idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-bold text-[10px]">
                            {sheet.badge_text || 'লেকচার শিট'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {sheet.page_count || '১০ পেজ'} &bull; {sheet.file_size || '১.২ মেগাবাইট'}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white group-hover:text-teal-300 transition-colors">
                          {sheet.title}
                        </h4>

                        {sheet.topic && (
                          <p className="text-xs text-slate-400 font-medium">টপিক: {sheet.topic}</p>
                        )}
                      </div>

                      <a
                        href={sheet.pdf_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="w-full py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-teal-500/30"
                      >
                        <Download className="w-3.5 h-3.5" />
                        পিডিএফ ডাউনলোড করুন
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
