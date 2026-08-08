import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { insertQuestion } from '../lib/supabase';
import { QuestionStatus } from '../types';

export const CreateQuestion: React.FC = () => {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('option_a');
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<QuestionStatus>('published');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form Validations
    if (!questionText.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রশ্ন লিখুন।');
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setErrorMsg('চারটি বিকল্পের (ক, খ, গ, ঘ) প্রতিটি ঘরই পূরণ করা আবশ্যক।');
      return;
    }

    setLoading(true);

    const newQuestionData = {
      question: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: correctAnswer,
      explanation: explanation.trim(),
      status: status,
    };

    const result = await insertQuestion(newQuestionData);

    setLoading(false);

    if (result.success) {
      setSuccessMsg(
        status === 'published'
          ? 'প্রশ্নটি সফলভাবে "published" অবস্থায় public.questions টেবিলে সংরক্ষিত হয়েছে এবং স্টুডেন্ট অ্যাপে যুক্ত হয়েছে!'
          : 'প্রশ্নটি "draft" হিসেবে সফলভাবে সংরক্ষিত হয়েছে।'
      );

      // Reset form options
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setExplanation('');

      // Auto navigate after short delay or let user create another
      setTimeout(() => {
        navigate('/admin/questions');
      }, 1500);
    } else {
      setErrorMsg(result.error || 'প্রশ্ন সংরক্ষণ করা যায়নি। Supabase এর ত্রুটি পরীক্ষা করুন।');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          প্রশ্ন তালিকায় ফিরে যান
        </Link>

        <span className="text-xs font-medium text-slate-500">
          Supabase Table: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">public.questions</code>
        </span>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                নতুন প্রশ্ন তৈরি করুন
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                নিচের সব তথ্য পূরণ করে প্রশ্নটি সংরক্ষণ করুন
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">সংরক্ষণ করতে ব্যর্থ হয়েছে!</p>
              <p className="mt-0.5 opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="mt-0.5 text-[11px] opacity-80">প্রশ্ন তালিকায় স্থানান্তরিত হচ্ছে...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              প্রশ্ন <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="যেমন: বাংলাদেশের বর্তমান রাজধানীর নাম কী?"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Options Grid (ক, খ, গ, ঘ) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
              বিকল্প সমুহ (Options) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প ক
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    ক
                  </span>
                  <input
                    type="text"
                    required
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="বিকল্প ক এর টেক্সট"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Option B */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প খ
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    খ
                  </span>
                  <input
                    type="text"
                    required
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="বিকল্প খ এর টেক্সট"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Option C */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প গ
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    গ
                  </span>
                  <input
                    type="text"
                    required
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="বিকল্প গ এর টেক্সট"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Option D */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  বিকল্প ঘ
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    ঘ
                  </span>
                  <input
                    type="text"
                    required
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="বিকল্প ঘ এর টেক্সট"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Correct Answer Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                সঠিক উত্তর <span className="text-red-500">*</span>
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

            {/* Status Radio Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                স্ট্যাটাস (Status) <span className="text-red-500">*</span>
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
                    className="text-emerald-600 focus:ring-emerald-500"
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
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>draft (ড্রাফট)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Explanation Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              ব্যাখ্যা (Explanation - ঐচ্ছিক)
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="শিক্ষার্থীরা সঠিক উত্তর জানার পর এই ব্যাখ্যাটি দেখতে পাবে..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/admin/questions"
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              বাতিল করুন
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  প্রশ্ন সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
