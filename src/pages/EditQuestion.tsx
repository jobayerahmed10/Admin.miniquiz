import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Edit, RefreshCw } from 'lucide-react';
import { fetchQuestionById, updateQuestion } from '../lib/supabase';
import { QuestionStatus } from '../types';

export const EditQuestion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('option_a');
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<QuestionStatus>('published');

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuestionData = async () => {
      setInitialLoading(true);
      setErrorMsg(null);

      const { question, error } = await fetchQuestionById(id);

      setInitialLoading(false);

      if (error || !question) {
        setErrorMsg(error || 'প্রশ্নটি লোড করা সম্ভব হয়নি।');
      } else {
        setQuestionText(question.question);
        setOptionA(question.option_a);
        setOptionB(question.option_b);
        setOptionC(question.option_c);
        setOptionD(question.option_d);
        setCorrectAnswer(question.correct_answer || 'option_a');
        setExplanation(question.explanation || '');
        setStatus(question.status || 'published');
      }
    };

    loadQuestionData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!questionText.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রশ্ন লিখুন।');
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setErrorMsg('চারটি বিকল্পের (ক, খ, গ, ঘ) প্রতিটি ঘরই পূরণ করুন।');
      return;
    }

    setSaving(true);

    const updatedData = {
      question: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: correctAnswer,
      explanation: explanation.trim(),
      status: status,
    };

    const result = await updateQuestion(id, updatedData);

    setSaving(false);

    if (result.success) {
      setSuccessMsg('প্রশ্নটি সফলভাবে তথ্য আপডেট করা হয়েছে!');
      setTimeout(() => {
        navigate('/admin/questions');
      }, 1200);
    } else {
      setErrorMsg(result.error || 'আপডেট করতে ত্রুটি ঘটেছে।');
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        প্রশ্নের তথ্য লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          প্রশ্ন তালিকায় ফিরে যান
        </Link>

        <span className="text-xs text-slate-500 font-mono">
          ID: {id}
        </span>
      </div>

      {/* Main Form Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Edit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                প্রশ্ন সম্পাদনা করুন (Edit Question)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supabase <code>public.questions</code> টেবিলে সংরক্ষিত প্রশ্নের তথ্য পরিবর্তন করুন
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ত্রুটি!</p>
              <p className="mt-0.5 opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              প্রশ্ন <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Options Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
              বিকল্প সমুহ (Options)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প ক
                </label>
                <input
                  type="text"
                  required
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প খ
                </label>
                <input
                  type="text"
                  required
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প গ
                </label>
                <input
                  type="text"
                  required
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প ঘ
                </label>
                <input
                  type="text"
                  required
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Correct answer & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                সঠিক উত্তর
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="option_a">বিকল্প ক ({optionA || 'ক'})</option>
                <option value="option_b">বিকল্প খ ({optionB || 'খ'})</option>
                <option value="option_c">বিকল্প গ ({optionC || 'গ'})</option>
                <option value="option_d">বিকল্প ঘ ({optionD || 'ঘ'})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                স্ট্যাটাস (Status)
              </label>
              <div className="flex items-center gap-3 pt-0.5">
                <label className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all ${
                  status === 'published'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="text-emerald-600"
                  />
                  <span>published (প্রকাশিত)</span>
                </label>

                <label className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all ${
                  status === 'draft'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="text-amber-600"
                  />
                  <span>draft (ড্রাফট)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              ব্যাখ্যা (Explanation)
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/admin/questions"
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              বাতিল করুন
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  পরিবর্তন সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
