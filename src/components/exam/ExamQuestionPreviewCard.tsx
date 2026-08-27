import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  Copy,
  Check,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Question } from '../../types';
import { isArabicText } from '../AddAiQuestionsModal';

interface ExamQuestionPreviewCardProps {
  question: Question;
  index: number;
  isStudentMode?: boolean;
  studentSelectedAnswer?: string | null;
  onStudentSelectAnswer?: (optKey: string) => void;
  onQuickSetCorrectAnswer: (
    questionId: string | number,
    correctOption: 'option_a' | 'option_b' | 'option_c' | 'option_d'
  ) => Promise<void>;
  onUpdateQuestion: (
    questionId: string | number,
    updatedData: Partial<Question>
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteQuestion: (questionId: string | number) => Promise<void>;
  onDuplicateQuestion: (question: Question) => Promise<void>;
  subjectsList: string[];
}

export const ExamQuestionPreviewCard: React.FC<ExamQuestionPreviewCardProps> = ({
  question,
  index,
  isStudentMode = false,
  studentSelectedAnswer,
  onStudentSelectAnswer,
  onQuickSetCorrectAnswer,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  subjectsList,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isSettingCorrect, setIsSettingCorrect] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    question: question.question,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    correct_answer: (question.correct_answer as any) || 'option_a',
    explanation: question.explanation || '',
    subject: question.subject || 'বাংলা',
    topic: question.topic || '',
  });

  const handleStartEdit = () => {
    setEditData({
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: (question.correct_answer as any) || 'option_a',
      explanation: question.explanation || '',
      subject: question.subject || 'বাংলা',
      topic: question.topic || '',
    });
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (
      !editData.question.trim() ||
      !editData.option_a.trim() ||
      !editData.option_b.trim() ||
      !editData.option_c.trim() ||
      !editData.option_d.trim()
    ) {
      setErrorMsg('প্রশ্নের বিবরণ এবং চারটি অপশনই পূরণ করা আবশ্যক।');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const res = await onUpdateQuestion(question.id, {
      question: editData.question.trim(),
      option_a: editData.option_a.trim(),
      option_b: editData.option_b.trim(),
      option_c: editData.option_c.trim(),
      option_d: editData.option_d.trim(),
      correct_answer: editData.correct_answer,
      explanation: editData.explanation.trim() || null,
      subject: editData.subject.trim(),
      topic: editData.topic.trim() || undefined,
    });

    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || 'সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  const handleOptionClick = async (optKey: 'option_a' | 'option_b' | 'option_c' | 'option_d') => {
    if (isStudentMode) {
      if (onStudentSelectAnswer) {
        onStudentSelectAnswer(optKey);
      }
      return;
    }

    if (question.correct_answer === optKey) return;
    setIsSettingCorrect(true);
    await onQuickSetCorrectAnswer(question.id, optKey);
    setIsSettingCorrect(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই প্রশ্নটি পরীক্ষা থেকে বাদ দিতে চান?')) {
      return;
    }
    setIsDeleting(true);
    await onDeleteQuestion(question.id);
    setIsDeleting(false);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    await onDuplicateQuestion(question);
    setIsDuplicating(false);
  };

  const isAr = isArabicText(question.question) || isArabicText(question.option_a);

  // EDIT MODE RENDER
  if (isEditing) {
    return (
      <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg animate-fadeIn">
        <div className="flex items-center justify-between border-b border-emerald-200/70 dark:border-emerald-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-sm">
              প্রশ্ন #{index + 1} সরাসরি এডিট
            </span>
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              যেকোনো অপশন ও উত্তর পরিবর্তন করে সেভ করুন
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
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

        {/* Subject & Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              বিষয় (Subject):
            </label>
            <select
              value={editData.subject}
              onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              টপিক (Topic - ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={editData.topic}
              onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
              placeholder="টপিক..."
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-[11px] font-black text-slate-900 dark:text-slate-100 mb-1">
            প্রশ্নের শিরোনাম (Question Text):
          </label>
          <textarea
            rows={2}
            value={editData.question}
            onChange={(e) => setEditData({ ...editData, question: e.target.value })}
            dir={isArabicText(editData.question) ? 'rtl' : 'ltr'}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'option_a' as const, label: 'ক) অপশন A', val: editData.option_a },
            { key: 'option_b' as const, label: 'খ) অপশন B', val: editData.option_b },
            { key: 'option_c' as const, label: 'গ) অপশন C', val: editData.option_c },
            { key: 'option_d' as const, label: 'ঘ) অপশন D', val: editData.option_d },
          ].map((opt) => (
            <div
              key={opt.key}
              className={`p-3 rounded-2xl border transition-all ${
                editData.correct_answer === opt.key
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/70 border-emerald-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                  {opt.label}:
                </span>
                <button
                  type="button"
                  onClick={() => setEditData({ ...editData, correct_answer: opt.key })}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${
                    editData.correct_answer === opt.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-200 hover:text-emerald-900'
                  }`}
                >
                  {editData.correct_answer === opt.key && <Check className="w-3 h-3" />}
                  {editData.correct_answer === opt.key ? 'সঠিক উত্তর' : 'সঠিক হিসেবে বাছুন'}
                </button>
              </div>

              <input
                type="text"
                value={opt.val}
                onChange={(e) => setEditData({ ...editData, [opt.key]: e.target.value })}
                dir={isArabicText(opt.val) ? 'rtl' : 'ltr'}
                className="w-full p-2 bg-transparent border-0 border-b border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            ব্যাখ্যা / নোট (Explanation - ঐচ্ছিক):
          </label>
          <textarea
            rows={2}
            value={editData.explanation}
            onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
            dir={isArabicText(editData.explanation) ? 'rtl' : 'ltr'}
            placeholder="প্রশ্নের বিস্তারিত ব্যাখ্যা..."
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveEdit}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>সংশোধন সেভ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // STANDARD PREVIEW RENDER
  const options = [
    { key: 'option_a' as const, label: 'ক', text: question.option_a },
    { key: 'option_b' as const, label: 'খ', text: question.option_b },
    { key: 'option_c' as const, label: 'গ', text: question.option_c },
    { key: 'option_d' as const, label: 'ঘ', text: question.option_d },
  ];

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all space-y-3.5 relative group"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header Bar: Index, Subject, Topic & Action Superpowers */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-xs">
            প্রশ্ন #{index + 1}
          </span>
          {question.subject && (
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
              {question.subject}
            </span>
          )}
          {question.topic && (
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
              {question.topic}
            </span>
          )}
          {isAr && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
              আরবি
            </span>
          )}
        </div>

        {/* Superpower Actions: Edit, Duplicate, Delete */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
            title="প্রশ্নের টেক্সট বা অপশন সংশোধন করতে ক্লিক করুন"
          >
            <Edit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>সংশোধন</span>
          </button>

          <button
            type="button"
            disabled={isDuplicating}
            onClick={handleDuplicate}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
            title="এই প্রশ্নটির একটি কপি / ডুপ্লিকেট তৈরি করুন"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl transition-all"
            title="এই পরীক্ষা থেকে প্রশ্নটি বাদ দিন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Text (Clicking directly also starts edit!) */}
      <div
        onClick={handleStartEdit}
        className="cursor-pointer group/q"
        title="ক্লিক করে প্রশ্নটি এডিট করুন"
      >
        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed group-hover/q:text-emerald-600 dark:group-hover/q:text-emerald-400 transition-colors">
          {question.question}
        </p>
      </div>

      {/* 4 Clickable Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {options.map((opt) => {
          const isCorrect = question.correct_answer === opt.key;
          const isStudentSelected = studentSelectedAnswer === opt.key;

          let cardStyle = 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-400';
          let badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

          if (!isStudentMode) {
            // Admin View
            if (isCorrect) {
              cardStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/40 shadow-sm';
              badgeStyle = 'bg-emerald-600 text-white shadow';
            }
          } else {
            // Student Simulation Mode
            if (isStudentSelected) {
              if (isCorrect) {
                cardStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500';
                badgeStyle = 'bg-emerald-600 text-white';
              } else {
                cardStyle = 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500';
                badgeStyle = 'bg-rose-600 text-white';
              }
            } else if (studentSelectedAnswer && isCorrect) {
              cardStyle = 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-400 text-emerald-900';
              badgeStyle = 'bg-emerald-600 text-white';
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={isSettingCorrect}
              onClick={() => handleOptionClick(opt.key)}
              title={
                isStudentMode
                  ? 'উত্তরে ক্লিক করুন'
                  : isCorrect
                  ? 'এটি সঠিক উত্তর'
                  : 'সরাসরি ক্লিক করে এই অপশনটিকে সঠিক উত্তর হিসেবে সেট করুন'
              }
              className={`group/opt px-4 py-3 rounded-2xl text-xs font-bold border flex items-center justify-between text-left transition-all duration-150 cursor-pointer ${cardStyle}`}
            >
              <div className="flex items-center gap-2.5 pr-2" dir={isArabicText(opt.text) ? 'rtl' : 'ltr'}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${badgeStyle}`}>
                  {opt.label}
                </span>
                <span className="leading-snug">{opt.text}</span>
              </div>

              {!isStudentMode && (
                <div className="shrink-0" dir="ltr">
                  {isCorrect ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Check className="w-3.5 h-3.5" /> সঠিক উত্তর
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 group-hover/opt:text-emerald-600 opacity-60 sm:opacity-0 group-hover/opt:opacity-100 transition-opacity">
                      সঠিক করতে ক্লিক
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {question.explanation && (!isStudentMode || studentSelectedAnswer) && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ব্যাখ্যা ও রেফারেন্স:</span>
          </div>
          <p className="leading-relaxed pl-5 font-medium">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
