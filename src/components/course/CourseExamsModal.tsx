import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit,
  CheckCircle,
  HelpCircle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { Course, CourseExam, CourseExamQuestion } from '../../types';

interface CourseExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  exams: CourseExam[];
  loading: boolean;
  onAddExam: (examData: Omit<CourseExam, 'id' | 'created_at'>) => Promise<void>;
  onUpdateExam: (id: string, updatedFields: Partial<CourseExam>) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onToggleLock: (exam: CourseExam) => Promise<void>;
}

export const CourseExamsModal: React.FC<CourseExamsModalProps> = ({
  isOpen,
  onClose,
  course,
  exams,
  loading,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onToggleLock,
}) => {
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<CourseExam | null>(null);

  // Exam Form State
  const [examForm, setExamForm] = useState({
    title: '',
    subject: course.category || 'আরবি',
    topic: '',
    question_count: 20,
    time_minutes: 15,
    total_marks: 20,
    pass_marks: 10,
    negative_marks: 0.25,
    is_locked: false,
    instructions: 'প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হবে।',
  });

  // Question Form State (for active exam)
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState<{
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
  }>({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'option_a',
    explanation: '',
  });

  useEffect(() => {
    if (activeExamForQuestions) {
      const refreshed = exams.find((e) => e.id === activeExamForQuestions.id);
      if (refreshed) {
        setActiveExamForQuestions(refreshed);
      }
    }
  }, [exams]);

  if (!isOpen) return null;

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim()) return;

    if (editingExamId) {
      await onUpdateExam(editingExamId, {
        title: examForm.title.trim(),
        subject: examForm.subject,
        topic: examForm.topic,
        question_count: Number(examForm.question_count || 20),
        time_minutes: Number(examForm.time_minutes || 15),
        total_marks: Number(examForm.total_marks || 20),
        pass_marks: Number(examForm.pass_marks || 10),
        negative_marks: Number(examForm.negative_marks || 0.25),
        is_locked: examForm.is_locked,
        instructions: examForm.instructions,
      });
      setEditingExamId(null);
    } else {
      await onAddExam({
        course_id: course.id,
        title: examForm.title.trim(),
        subject: examForm.subject,
        topic: examForm.topic,
        question_count: Number(examForm.question_count || 20),
        time_minutes: Number(examForm.time_minutes || 15),
        total_marks: Number(examForm.total_marks || 20),
        pass_marks: Number(examForm.pass_marks || 10),
        negative_marks: Number(examForm.negative_marks || 0.25),
        is_locked: examForm.is_locked,
        position: exams.length + 1,
        instructions: examForm.instructions,
        questions: [],
      });
    }

    setExamForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      question_count: 20,
      time_minutes: 15,
      total_marks: 20,
      pass_marks: 10,
      negative_marks: 0.25,
      is_locked: false,
      instructions: 'প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হবে।',
    });
  };

  const handleStartEditExam = (exam: CourseExam) => {
    setEditingExamId(exam.id);
    setExamForm({
      title: exam.title,
      subject: exam.subject || 'আরবি',
      topic: exam.topic || '',
      question_count: exam.question_count,
      time_minutes: exam.time_minutes,
      total_marks: exam.total_marks,
      pass_marks: exam.pass_marks || 10,
      negative_marks: exam.negative_marks,
      is_locked: exam.is_locked,
      instructions: exam.instructions || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setExamForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      question_count: 20,
      time_minutes: 15,
      total_marks: 20,
      pass_marks: 10,
      negative_marks: 0.25,
      is_locked: false,
      instructions: '',
    });
  };

  // Add Question to Active Exam
  const handleAddQuestionToExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExamForQuestions || !questionForm.question.trim()) return;

    const newQuestion: CourseExamQuestion = {
      id: `q-${Date.now()}`,
      question: questionForm.question.trim(),
      option_a: questionForm.option_a.trim() || 'ক. অপশন ১',
      option_b: questionForm.option_b.trim() || 'খ. অপশন ২',
      option_c: questionForm.option_c.trim() || 'গ. অপশন ৩',
      option_d: questionForm.option_d.trim() || 'ঘ. অপশন ৪',
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation.trim() || undefined,
      subject: activeExamForQuestions.subject,
      topic: activeExamForQuestions.topic,
    };

    const currentQuestions = activeExamForQuestions.questions || [];
    const updatedQuestions = [...currentQuestions, newQuestion];

    await onUpdateExam(activeExamForQuestions.id, {
      questions: updatedQuestions,
      question_count: updatedQuestions.length,
      total_marks: updatedQuestions.length,
    });

    setQuestionForm({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'option_a',
      explanation: '',
    });
    setShowQuestionForm(false);
  };

  const handleDeleteQuestionFromExam = async (questionId?: string, idx?: number) => {
    if (!activeExamForQuestions) return;
    const current = activeExamForQuestions.questions || [];
    const filtered = current.filter((q, i) => (q.id ? q.id !== questionId : i !== idx));
    await onUpdateExam(activeExamForQuestions.id, {
      questions: filtered,
      question_count: filtered.length,
      total_marks: filtered.length,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                মডেল টেস্ট ও প্রশ্ন নির্মাতা: {course.title}
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                পরীক্ষার বিষয়, টপিক, সময় ও প্রশ্ন যুক্ত করুন (Supabase <code className="font-mono">public.course_exams</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Active Exam Question Builder View */}
          {activeExamForQuestions ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    প্রশ্ন ব্যবস্থাপনা মোড
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {activeExamForQuestions.title} ({activeExamForQuestions.questions?.length || 0} টি প্রশ্ন)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    নতুন প্রশ্ন তৈরি করুন
                  </button>

                  <button
                    onClick={() => setActiveExamForQuestions(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                  >
                    পরীক্ষার তালিকায় ফিরুন
                  </button>
                </div>
              </div>

              {/* Add Question Form */}
              {showQuestionForm && (
                <form
                  onSubmit={handleAddQuestionToExam}
                  className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in"
                >
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4" /> প্রশ্নে নতুন তথ্য যোগ করুন
                  </h5>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      প্রশ্নের মূল টেক্সট <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="প্রশ্ন লিখুন (যেমন: কুরআন মাজিদের কোন সূরায় সর্বপ্রথম বিসমিল্লাহ নাজিল হয়?)"
                      value={questionForm.question}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, question: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'option_a', label: 'ক (Option A)' },
                      { key: 'option_b', label: 'খ (Option B)' },
                      { key: 'option_c', label: 'গ (Option C)' },
                      { key: 'option_d', label: 'ঘ (Option D)' },
                    ].map((opt) => (
                      <div key={opt.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span>{opt.label}</span>
                          <label className="flex items-center gap-1 cursor-pointer text-emerald-400">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={questionForm.correct_answer === opt.key}
                              onChange={() =>
                                setQuestionForm({
                                  ...questionForm,
                                  correct_answer: opt.key,
                                })
                              }
                              className="text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>সঠিক উত্তর</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder={`${opt.label} লিখুন...`}
                          value={(questionForm as any)[opt.key]}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              [opt.key]: e.target.value,
                            })
                          }
                          className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                            questionForm.correct_answer === opt.key
                              ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-emerald-950/20'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      ব্যাখ্যা (Explanation - ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="সঠিক উত্তরের ব্যাখ্যা বা তথ্যসূত্র লিখুন..."
                      value={questionForm.explanation}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, explanation: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuestionForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                    >
                      প্রশ্ন যুক্ত করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Questions List */}
              <div className="space-y-2">
                {(!activeExamForQuestions.questions || activeExamForQuestions.questions.length === 0) ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500">
                    এখনও এই পরীক্ষায় কোনো কাস্টম প্রশ্ন যুক্ত করা হয়নি। উপরের "নতুন প্রশ্ন তৈরি করুন" বাটনে ক্লিক করে প্রশ্ন যোগ করুন।
                  </div>
                ) : (
                  activeExamForQuestions.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white text-sm">{q.question}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestionFromExam(q.id, idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                          title="প্রশ্ন মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { key: 'option_a', text: q.option_a, label: 'ক.' },
                          { key: 'option_b', text: q.option_b, label: 'খ.' },
                          { key: 'option_c', text: q.option_c, label: 'গ.' },
                          { key: 'option_d', text: q.option_d, label: 'ঘ.' },
                        ].map((item) => (
                          <div
                            key={item.key}
                            className={`p-2 rounded-xl border text-[11px] ${
                              q.correct_answer === item.key
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-slate-950/40 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="mr-1 opacity-70">{item.label}</span>
                            {item.text}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                          💡 <span className="font-bold text-slate-300">ব্যাখ্যা:</span> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Exam Creation / Edit Form */}
              <form
                onSubmit={handleSaveExam}
                className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    {editingExamId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingExamId ? 'পরীক্ষা সম্পাদনা করুন' : 'নতুন মডেল টেস্ট তৈরি করুন'}
                  </h4>
                  {editingExamId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      সম্পাদনা বাতিল
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">
                      পরীক্ষার শিরোনাম <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মডেল টেস্ট ০১: উলুমুল কুরআন ও তাফসির বিশেষ পরীক্ষা"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">বিষয় (Subject)</label>
                    <input
                      type="text"
                      placeholder="যেমন: আরবি / আল কুরআন"
                      value={examForm.subject}
                      onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">টপিক / অধ্যায় (Topic)</label>
                    <input
                      type="text"
                      placeholder="যেমন: উলুমুল কুরআন ও শানে নুযূল"
                      value={examForm.topic}
                      onChange={(e) => setExamForm({ ...examForm, topic: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">প্রশ্ন সংখ্যা</label>
                    <input
                      type="number"
                      value={examForm.question_count}
                      onChange={(e) =>
                        setExamForm({ ...examForm, question_count: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">সময় (মিনিট)</label>
                    <input
                      type="number"
                      value={examForm.time_minutes}
                      onChange={(e) =>
                        setExamForm({ ...examForm, time_minutes: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট নম্বর</label>
                    <input
                      type="number"
                      value={examForm.total_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">পাস মার্ক</label>
                    <input
                      type="number"
                      value={examForm.pass_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, pass_marks: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">নেগেটিভ মার্কিং</label>
                    <select
                      value={examForm.negative_marks}
                      onChange={(e) =>
                        setExamForm({ ...examForm, negative_marks: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    >
                      <option value={0.25}>০.২৫ নম্বর (প্রতি ৪ ভুলে ১ নম্বর কর্তন)</option>
                      <option value={0.5}>০.৫০ নম্বর (প্রতি ২ ভুলে ১ নম্বর কর্তন)</option>
                      <option value={0}>০.০০ (কোনো নেগেটিভ মার্কিং নেই)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.is_locked}
                      onChange={(e) => setExamForm({ ...examForm, is_locked: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                    />
                    <span>🔒 পরীক্ষাটি লক্ড (পেইড ক্লায়েন্টদের জন্য সংরক্ষিত)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    {editingExamId ? 'আপডেট সম্পন্ন করুন' : 'মডেল টেস্ট যুক্ত করুন'}
                  </button>
                </div>
              </form>

              {/* List of Exams */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>এই কোর্সে যুক্ত মডেল টেস্ট তালিকা ({exams.length} টি):</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    "প্রশ্ন যুক্ত করুন" বাটনে ক্লিক করে সরাসরি প্রশ্ন তৈরি করুন
                  </span>
                </h4>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">পরীক্ষা লোড হচ্ছে...</div>
                ) : exams.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                    এখনও কোনো পরীক্ষা যুক্ত করা হয়নি।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exams.map((exam, index) => (
                      <div
                        key={exam.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 font-black text-center leading-7 shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white text-sm">{exam.title}</h5>
                              {exam.topic && (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                  {exam.topic}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              বিষয়: {exam.subject} &bull; সময়: {exam.time_minutes} মি. &bull; মোট নম্বর: {exam.total_marks} &bull; প্রশ্ন: {exam.questions?.length || exam.question_count}টি
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveExamForQuestions(exam)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 flex items-center gap-1.5"
                          >
                            <FileQuestion className="w-3.5 h-3.5" />
                            প্রশ্ন ({exam.questions?.length || 0})
                          </button>

                          <button
                            onClick={() => onToggleLock(exam)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              exam.is_locked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {exam.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {exam.is_locked ? 'লকড' : 'মুক্ত'}
                          </button>

                          <button
                            onClick={() => handleStartEditExam(exam)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                            title="এডিট"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteExam(exam.id)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
