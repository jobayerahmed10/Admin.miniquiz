import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  PlusCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Eye,
  Database,
  Award,
  Sparkles,
} from 'lucide-react';
import { fetchAllQuestions, deleteQuestion } from '../lib/supabase';
import { Question } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { RlsErrorHelper } from '../components/RlsErrorHelper';
import { AddAiQuestionsModal } from '../components/AddAiQuestionsModal';

export const QuestionsList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Delete modal states
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Expanded details modal
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  // AI Question Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    const { questions: data, error: err } = await fetchAllQuestions();
    if (err) {
      setError(err);
    } else {
      setQuestions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    setDeleteError(null);

    const { success, error: err } = await deleteQuestion(deletingId);

    setIsDeleting(false);

    if (success) {
      setQuestions((prev) => prev.filter((q) => q.id !== deletingId));
      setDeletingId(null);
    } else {
      setDeleteError(err || 'প্রশ্ন মুছে ফেলার প্রক্রিয়ায় ত্রুটি ঘটেছে।');
    }
  };

  // Get list of unique subjects
  const availableSubjects = Array.from(
    new Set(questions.map((q) => q.subject || 'সাধারণ'))
  );

  // Filter & search logic
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.option_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.option_b.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : q.status === statusFilter;

    const matchesSubject =
      subjectFilter === 'all' ? true : (q.subject || 'সাধারণ') === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Format date helper for Bengali locale
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-600" />
            প্রশ্ন ব্যাংক (Question Bank)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            আপনার সকল সাবজেক্টের প্রশ্ন সংরক্ষিত স্থান। এখান থেকে প্রশ্ন তৈরি, এডিট বা সিলেক্ট করে মডেল টেস্ট তৈরি করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadQuestions}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 border border-purple-400/30"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
            এআই দিয়ে প্রশ্ন যোগ করুন
          </button>
          <button
            onClick={() => navigate('/admin/exams')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            পরীক্ষা ও মডেল টেস্টে যান
          </button>
          <Link
            to="/admin/questions/create"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            ম্যানুয়ালি প্রশ্ন যোগ
          </Link>
        </div>
      </div>

      {error && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadQuestions}
              className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold rounded-lg text-[11px]"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
          <RlsErrorHelper errorMsg={error} />
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="প্রশ্ন বা বিষয় দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">সকল বিষয় ({questions.length})</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub} ({questions.filter((q) => (q.subject || 'সাধারণ') === sub).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              সব
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'published'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              প্রকাশিত
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'draft'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
              }`}
            >
              <FileEdit className="w-3 h-3" />
              ড্রাফট
            </button>
          </div>
        </div>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            প্রশ্নসমূহ লোড হচ্ছে...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              কোনো প্রশ্ন পাওয়া যায়নি!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'আপনার অনুসন্ধানের সাথে মিল রেখে কোনো প্রশ্ন খুঁজে পাওয়া যায়নি।'
                : 'নতুন একটি প্রশ্ন তৈরি করতে নিচের বাটনে ক্লিক করুন।'}
            </p>
            <Link
              to="/admin/questions/create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" /> নতুন প্রশ্ন তৈরি করুন
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-6">প্রশ্ন (Question)</th>
                  <th className="py-3.5 px-4 w-32">বিষয় (Subject)</th>
                  <th className="py-3.5 px-4 w-28">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 w-36">তৈরির তারিখ</th>
                  <th className="py-3.5 px-6 w-32 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredQuestions.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Question text & options teaser */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                        {q.question}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          ক: {q.option_a}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          খ: {q.option_b}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          গ: {q.option_c}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          ঘ: {q.option_d}
                        </span>
                      </div>
                    </td>

                    {/* Subject Column */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/60 dark:border-indigo-800/60">
                        {q.subject || 'সাধারণ'}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {q.status === 'published' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
                          <FileEdit className="w-3.5 h-3.5" /> draft
                        </span>
                      )}
                    </td>

                    {/* Date Column */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(q.created_at)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewQuestion(q)}
                          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/questions/edit/${q.id}`)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(q.id)}
                          className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="প্রশ্নটি নিশ্চিতভাবে মুছে ফেলবেন?"
        message={
          deleteError
            ? deleteError
            : 'এই প্রশ্নটি মুছে ফেললে তা স্থায়ীভাবে Supabase ডাটাবেস থেকে রিমুভ হবে।'
        }
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeletingId(null);
          setDeleteError(null);
        }}
      />

      {/* VIEW QUESTION MODAL */}
      {viewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                প্রশ্নের পূর্ণাঙ্গ বিবরণ
              </h3>
              <button
                onClick={() => setViewQuestion(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase text-slate-400">প্রশ্ন:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10px]">
                  {viewQuestion.subject || 'সাধারণ'}
                </span>
              </div>
              <p className="font-bold text-base text-slate-900 dark:text-slate-100">
                {viewQuestion.question}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-600">ক.</span> {viewQuestion.option_a}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-600">খ.</span> {viewQuestion.option_b}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-600">গ.</span> {viewQuestion.option_c}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-600">ঘ.</span> {viewQuestion.option_d}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                সঠিক উত্তর:
              </span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                {viewQuestion.correct_answer}
              </span>
            </div>

            {viewQuestion.explanation && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold block mb-0.5">ব্যাখ্যা:</span>
                <p>{viewQuestion.explanation}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const id = viewQuestion.id;
                  setViewQuestion(null);
                  navigate(`/admin/questions/edit/${id}`);
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
              >
                সম্পাদনা করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Questions Modal */}
      <AddAiQuestionsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onQuestionsSaved={() => loadQuestions()}
        availableSubjects={availableSubjects}
      />
    </div>
  );
};
