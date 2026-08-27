import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  HelpCircle,
  Award,
  Sparkles,
  BarChart3,
  User,
  LogOut,
  ShieldCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Flame,
  Check,
  X,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  GraduationCap,
  Play,
  RotateCcw,
  Target,
  FileText,
  Video,
  Zap,
} from 'lucide-react';
import {
  getCurrentStudentSession,
  logoutStudent,
  getStudentDashboardGrowthData,
  saveStudentExamAttempt,
} from '../lib/studentAuth';
import {
  fetchAllExams,
  fetchAllQuestions,
  fetchQuestionsByExamId,
  fetchPublishedCoursesForStudent,
  getSupabaseClient,
} from '../lib/supabase';
import { Exam, Course, Question, StudentUser, StudentDashboardGrowthData } from '../types';
import { CourseDetailsModal } from '../components/course/CourseDetailsModal';
import { AddAiQuestionsModal } from '../components/AddAiQuestionsModal';
import { SubjectWisePractice } from '../components/student/SubjectWisePractice';

export const StudentApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'exams' | 'courses' | 'ai' | 'dashboard' | 'profile'>('exams');
  const [examSubTab, setExamSubTab] = useState<'subject_posts' | 'model_tests'>('subject_posts');
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [growthData, setGrowthData] = useState<StudentDashboardGrowthData | null>(null);

  // Exams & Courses Data
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Exam Taking Mode
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, string>>({});
  const [examFinished, setExamFinished] = useState(false);
  const [examScore, setExamScore] = useState<{ correct: number; wrong: number; total: number; score: number } | null>(null);
  const [examTimer, setExamTimer] = useState(0);

  // Course Details Modal
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const navigate = useNavigate();

  // Load session & data
  const loadData = async () => {
    setLoading(true);
    const activeStudent = getCurrentStudentSession();
    if (activeStudent) {
      setStudent(activeStudent);
      const growth = getStudentDashboardGrowthData(activeStudent);
      setGrowthData(growth);
    }

    // Fetch Exams
    const examsRes = await fetchAllExams();
    const publishedExams = (examsRes.exams || []).filter((e) => e.status !== 'draft');
    setExams(publishedExams.length > 0 ? publishedExams : (examsRes.exams || []));

    // Fetch Courses
    const coursesRes = await fetchPublishedCoursesForStudent();
    setCourses(coursesRes.courses || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleSessionChange = () => {
      const active = getCurrentStudentSession();
      setStudent(active);
      if (active) {
        setGrowthData(getStudentDashboardGrowthData(active));
      }
    };
    window.addEventListener('tamrin_student_session_changed', handleSessionChange);
    return () => {
      window.removeEventListener('tamrin_student_session_changed', handleSessionChange);
    };
  }, []);

  // Exam Taking Timer
  useEffect(() => {
    let interval: any;
    if (activeTakingExam && !examFinished && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer((prev) => {
          if (prev <= 1) {
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTakingExam, examFinished, examTimer]);

  // Start taking an exam
  const handleStartExam = async (exam: Exam) => {
    setActiveTakingExam(exam);
    let questions = exam.questions || [];

    if (questions.length === 0) {
      const res = await fetchQuestionsByExamId(exam.id);
      if (res.questions && res.questions.length > 0) {
        questions = res.questions;
      } else {
        const allQ = await fetchAllQuestions();
        const matched = allQ.questions.filter(
          (q) => String(q.exam_id) === String(exam.id) || q.subject === exam.subject
        );
        questions = matched.length > 0 ? matched : allQ.questions.slice(0, 10);
      }
    }

    setExamQuestions(questions);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setExamFinished(false);
    setExamScore(null);
    setExamTimer((exam.time_minutes || 15) * 60);
  };

  // Submit & evaluate exam
  const handleFinishExam = () => {
    if (!activeTakingExam) return;

    let correct = 0;
    let wrong = 0;
    const questions = examQuestions;

    questions.forEach((q) => {
      const userAns = selectedAnswers[q.id];
      if (userAns) {
        if (userAns === q.correct_answer) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });

    const negMarks = activeTakingExam.negative_marks || 0.25;
    const score = Math.max(0, correct - wrong * negMarks);

    setExamScore({
      correct,
      wrong,
      total: questions.length,
      score: Number(score.toFixed(2)),
    });
    setExamFinished(true);

    // Save to Student Study Growth
    if (student) {
      saveStudentExamAttempt(student.id, {
        id: `att-${Date.now()}`,
        exam_id: activeTakingExam.id,
        exam_title: activeTakingExam.title,
        subject: activeTakingExam.subject || 'সাধারণ বিষয়',
        total_questions: questions.length,
        correct_answers: correct,
        wrong_answers: wrong,
        score: Number(score.toFixed(2)),
        total_marks: activeTakingExam.total_marks || questions.length,
        date: 'আজকে, ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      });
      // Refresh Growth Data
      setGrowthData(getStudentDashboardGrowthData(student));
    }
  };

  const handleLogout = () => {
    logoutStudent();
    navigate('/login');
  };

  // Format Time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-1.5 leading-tight">
                আত-তামরীন একাডেমি
              </h1>
              <p className="text-[11px] text-emerald-400 font-bold">
                {student ? `আইডি: ${student.student_id_code}` : 'প্রস্তুতি হোক আরও স্মার্ট'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 border border-slate-700"
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">অ্যাডমিন সিএমএস</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-slate-700"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: EXAMS (মডেল টেস্ট ও ফ্রি পরীক্ষা) */}
        {currentTab === 'exams' && (
          <div className="space-y-5">
            {/* Taking Exam Active Overlay */}
            {activeTakingExam ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
                {/* Exam Title & Live Timer Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeTakingExam.badge || 'মডেল টেস্ট'}
                    </span>
                    <h2 className="text-lg font-extrabold text-white mt-1">
                      {activeTakingExam.title}
                    </h2>
                  </div>

                  {!examFinished && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm">
                      <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>{formatTime(examTimer)}</span>
                    </div>
                  )}
                </div>

                {/* Exam In-Progress Question Card */}
                {!examFinished ? (
                  examQuestions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>প্রশ্ন নং {currentQIndex + 1} / {examQuestions.length}</span>
                        <span>বিষয়: {examQuestions[currentQIndex]?.subject || activeTakingExam.subject}</span>
                      </div>

                      {/* Animated Question Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentQIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Question Text */}
                          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                            {examQuestions[currentQIndex]?.question}
                          </div>

                          {/* 4 Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {[
                              { key: 'option_a', label: 'ক', text: examQuestions[currentQIndex]?.option_a },
                              { key: 'option_b', label: 'খ', text: examQuestions[currentQIndex]?.option_b },
                              { key: 'option_c', label: 'গ', text: examQuestions[currentQIndex]?.option_c },
                              { key: 'option_d', label: 'ঘ', text: examQuestions[currentQIndex]?.option_d },
                            ].map((opt) => {
                              const isSelected = selectedAnswers[examQuestions[currentQIndex]?.id] === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAnswers({
                                      ...selectedAnswers,
                                      [examQuestions[currentQIndex].id]: opt.key,
                                    });
                                  }}
                                  className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-3 text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/40'
                                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                                      isSelected ? 'bg-white text-emerald-700' : 'bg-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="leading-snug">{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Question Navigation */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          disabled={currentQIndex === 0}
                          onClick={() => setCurrentQIndex(currentQIndex - 1)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-40"
                        >
                          পূর্ববর্তী প্রশ্ন
                        </button>

                        <div className="flex items-center gap-2">
                          {currentQIndex < examQuestions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setCurrentQIndex(currentQIndex + 1)}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow"
                            >
                              পরবর্তী প্রশ্ন
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleFinishExam}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg animate-pulse"
                            >
                              পরীক্ষা শেষ ও সাবমিট করুন
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      এই পরীক্ষায় এখনও প্রশ্ন সংযুক্ত করা হয়নি।
                    </div>
                  )
                ) : (
                  /* Exam Finished Result View */
                  <div className="space-y-6 text-center py-4 animate-fadeIn">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                      <Award className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">পরীক্ষা সফলভাবে সম্পন্ন হয়েছে!</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        আপনার পরীক্ষার ফলাফল স্বয়ংক্রিয়ভাবে আপনার স্টাডি গ্রোথ ড্যাশবোর্ডে যুক্ত হয়েছে।
                      </p>
                    </div>

                    {examScore && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold">প্রাপ্ত নম্বর</span>
                          <p className="text-lg font-black text-emerald-400">{examScore.score}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold">সঠিক উত্তর</span>
                          <p className="text-lg font-black text-teal-400">{examScore.correct}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold">ভুল উত্তর</span>
                          <p className="text-lg font-black text-rose-400">{examScore.wrong}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold">মোট প্রশ্ন</span>
                          <p className="text-lg font-black text-slate-300">{examScore.total}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setActiveTakingExam(null);
                          setCurrentTab('dashboard');
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>স্টাডি গ্রোথ ড্যাশবোর্ডে দেখুন</span>
                      </button>

                      <button
                        onClick={() => setActiveTakingExam(null)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                      >
                        ফিরে যান
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Exams & Subject-Wise Prep Section */
              <div className="space-y-5">
                {/* Sub-tabs Navigation */}
                <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExamSubTab('subject_posts')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      examSubTab === 'subject_posts'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>বিষয়ভিত্তিক ও পদভিত্তিক প্রস্তুতি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExamSubTab('model_tests')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      examSubTab === 'model_tests'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>পূর্ণাঙ্গ মডেল টেস্ট ({exams.length})</span>
                  </button>
                </div>

                {/* Sub-tab 1: Dynamic Subject Posts & Syllabus Topics */}
                {examSubTab === 'subject_posts' && (
                  <SubjectWisePractice
                    student={student}
                    onRefreshGrowth={() => {
                      if (student) {
                        setGrowthData(getStudentDashboardGrowthData(student));
                      }
                    }}
                  />
                )}

                {/* Sub-tab 2: Full Model Tests Grid */}
                {examSubTab === 'model_tests' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white">
                          মডেল টেস্ট ও ফ্রি পরীক্ষা
                        </h2>
                        <p className="text-xs text-slate-400">
                          আপনার শিক্ষক নিবন্ধন ও জব প্রস্তুতির জন্য লাইভ টেস্ট দিন
                        </p>
                      </div>
                      <button
                        onClick={loadData}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="রিফ্রেশ করুন"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {exam.badge || 'মডেল টেস্ট'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" /> {exam.time_minutes || 15} মিনিট
                              </span>
                            </div>

                            <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors leading-snug">
                              {exam.title}
                            </h3>

                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                              <span>বিষয়: <strong className="text-slate-200">{exam.subject}</strong></span>
                              <span>&bull;</span>
                              <span>প্রশ্ন: <strong className="text-slate-200">{exam.question_count || exam.questions?.length || 20} টি</strong></span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-400">
                              পূর্ণমান: {exam.total_marks || 20}
                            </span>

                            {exam.status === 'upcoming' ? (
                              <button
                                disabled
                                className="px-4 py-2 bg-slate-800 text-slate-400 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-not-allowed"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>আপকামিং</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartExam(exam)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>পরীক্ষা শুরু করুন</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COURSES (কোর্স ও ব্যাচসমূহ) */}
        {currentTab === 'courses' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                প্রস্তুতি কোর্স ও লাইভ ব্যাচসমূহ
              </h2>
              <p className="text-xs text-slate-400">
                এনটিআরসিএ ক্যাডার ও শিক্ষক নিবন্ধন চূড়ান্ত প্রস্তুতির পূর্ণাঙ্গ ব্যাচ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {course.badge || 'স্পেশাল ব্যাচ'}
                      </span>
                      <span className="text-xs font-black text-emerald-400">{course.price || 'ফ্রি'}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-white leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {course.description || 'সম্পূর্ণ সিলেবাস কভার করে স্পেশাল মডেল টেস্ট, লাইভ ক্লাস ও হ্যান্ডনোট।'}
                    </p>

                    <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-400 pt-1">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Video className="w-3 h-3 text-emerald-400" /> {course.total_classes || 30}+ ক্লাস
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3 text-teal-400" /> {course.total_sheets || 40}+ শিট
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" /> {course.total_exams || 25}+ পরীক্ষা
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      প্রভাষক: {course.instructor_name || 'অভিজ্ঞ প্যানেল'}
                    </span>

                    <button
                      onClick={() => setSelectedCourseForDetails(course)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      বিস্তারিত দেখুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TAMRIN AI (তামরীন এআই) */}
        {currentTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                তামরীন এআই স্টাডি অ্যাসিস্ট্যান্ট
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                যেকোনো কঠিন টপিক বা আরবি, বাংলা, ইংরেজির অধ্যায় থেকে তৎক্ষণাৎ কাস্টম প্রশ্ন তৈরি করুন এবং নিজেকে যাচাই করুন।
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setAiModalOpen(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-950 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>এআই দিয়ে কাস্টম টেস্ট তৈরি করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: STUDY GROWTH DASHBOARD (পড়াশোনার গ্রোথ ড্যাশবোর্ড - requested by user) */}
        {currentTab === 'dashboard' && growthData && (
          <div className="space-y-6">
            {/* Header with Greeting & Student ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800/80 p-5 rounded-3xl border border-slate-800">
              <div>
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                  STUDY GROWTH & PERFORMANCE
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  পড়াশোনার গ্রোথ ড্যাশবোর্ড
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  শিক্ষার্থী: <strong className="text-slate-200">{growthData.student.name}</strong> &bull; আইডি:{' '}
                  <strong className="text-emerald-400">{growthData.student.student_id_code}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 leading-none">স্টাডি স্ট্রিক</p>
                    <p className="text-xs font-black text-amber-200">{growthData.studyStreakDays} দিন একটানা</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Growth Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> মোট পরীক্ষা
                </span>
                <p className="text-2xl font-black text-white">{growthData.totalExamsTaken} টি</p>
                <span className="text-[10px] text-emerald-400 font-bold">অংশগ্রহণ সম্পন্ন</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" /> প্রশ্ন সমাধান
                </span>
                <p className="text-2xl font-black text-white">{growthData.totalQuestionsSolved}+</p>
                <span className="text-[10px] text-teal-400 font-bold">সঠিক অনুশীলন</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> সামগ্রিক নির্ভুলতা
                </span>
                <p className="text-2xl font-black text-white">{growthData.overallAccuracyPct}%</p>
                <span className="text-[10px] text-amber-400 font-bold">সঠিকতার হার</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> স্টাডি টাইম
                </span>
                <p className="text-2xl font-black text-white">{growthData.totalStudyHours} ঘণ্টা</p>
                <span className="text-[10px] text-indigo-400 font-bold">মোট অনুশীলনের সময়</span>
              </div>
            </div>

            {/* Subject Mastery Progress Bars */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" /> বিষয়ভিত্তিক পারফরম্যান্স ও দখল
                  </h3>
                  <p className="text-xs text-slate-400">প্রতিটি বিষয়ে আপনার সঠিক উত্তরের হার ও দক্ষতা</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {growthData.subjectPerformances.map((subj) => (
                  <div key={subj.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span>{subj.subject}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                            subj.mastery_level === 'strong'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : subj.mastery_level === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {subj.mastery_level === 'strong'
                            ? 'মজবুত দখল'
                            : subj.mastery_level === 'moderate'
                            ? 'মধ্যম মান'
                            : 'আরও পড়তে হবে'}
                        </span>
                      </span>
                      <span className="text-emerald-400 font-extrabold">{subj.accuracy_pct}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          subj.accuracy_pct >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : subj.accuracy_pct >= 65
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{ width: `${subj.accuracy_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Strength & Focus Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-3xl p-5 space-y-2.5">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> আপনার সবচেয়ে শক্তিশালী বিষয়
                </h4>
                <ul className="space-y-1 text-xs text-slate-200">
                  {growthData.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{item} (৮০%+ সঠিকতা)</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/40 rounded-3xl p-5 space-y-2.5">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" /> আরও মনোযোগ দিতে হবে যেগুলোতে
                </h4>
                <ul className="space-y-1 text-xs text-slate-200">
                  {growthData.weaknesses.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{item} (অনুশীলন বাড়ানো জরুরি)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent Exam Attempts Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="font-extrabold text-base text-white">
                সাম্প্রতিক পরীক্ষার ইতিহাস ও নম্বর
              </h3>
              <div className="divide-y divide-slate-800">
                {growthData.recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-100">{attempt.exam_title}</p>
                      <p className="text-[11px] text-slate-500">{attempt.date} &bull; বিষয়: {attempt.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-black text-emerald-400">
                        {attempt.score} / {attempt.total_marks}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        সঠিক: {attempt.correct_answers} | ভুল: {attempt.wrong_answers}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE (প্রোফাইল - No Payment Count, No Leaderboard) */}
        {currentTab === 'profile' && student && (
          <div className="space-y-5">
            {/* Profile Identity Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-950">
                  {student.name.charAt(0)}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                    আইডি: {student.student_id_code}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{student.name}</h2>
                  <p className="text-xs text-slate-400">
                    {student.phone ? `মোবাইল: ${student.phone}` : ''}{' '}
                    {student.email ? `&bull; ইমেইল: ${student.email}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Profile Summary Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white">শিক্ষার্থী বিবরণী</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">টার্গেট পরীক্ষা</span>
                  <span className="text-slate-100 font-bold">{student.target_exam || 'NTRCA ক্যাডার'}</span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">যোগদানের তারিখ</span>
                  <span className="text-slate-100 font-bold">
                    {new Date(student.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">অ্যাকাউন্ট স্ট্যাটাস</span>
                  <span className="text-emerald-400 font-black">✓ সক্রিয় শিক্ষার্থী</span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">নিরাপত্তা</span>
                  <span className="text-teal-400 font-bold">মোবাইল/ইমেইল ভেরিফাইড</span>
                </div>
              </div>
            </div>

            {/* Actions & Logout */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>আমার পড়াশোনার গ্রোথ ড্যাশবোর্ড দেখুন</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 font-bold text-xs rounded-2xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION - Visible ONLY in Student App */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTakingExam(null);
              setCurrentTab('exams');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              currentTab === 'exams'
                ? 'bg-emerald-600/20 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">পরীক্ষা দিন</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTakingExam(null);
              setCurrentTab('courses');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              currentTab === 'courses'
                ? 'bg-emerald-600/20 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">কোর্স</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTakingExam(null);
              setCurrentTab('ai');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              currentTab === 'ai'
                ? 'bg-emerald-600/20 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] mt-1 tracking-tight">তামরীন এআই</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTakingExam(null);
              setCurrentTab('dashboard');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              currentTab === 'dashboard'
                ? 'bg-emerald-600/20 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">ড্যাশবোর্ড</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTakingExam(null);
              setCurrentTab('profile');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              currentTab === 'profile'
                ? 'bg-emerald-600/20 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">প্রোফাইল</span>
          </button>
        </div>
      </nav>

      {/* Course Details Modal */}
      {selectedCourseForDetails && (
        <CourseDetailsModal
          course={selectedCourseForDetails}
          isOpen={Boolean(selectedCourseForDetails)}
          onClose={() => setSelectedCourseForDetails(null)}
          defaultTab="details"
        />
      )}

      {/* AI Hub Modal */}
      <AddAiQuestionsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onQuestionsSaved={() => {
          setAiModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
