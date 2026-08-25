import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  Plus,
  X,
  Tag,
} from 'lucide-react';
import { fetchAllQuestions, deleteQuestion, updateQuestion } from '../lib/supabase';
import { Question } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { RlsErrorHelper } from '../components/RlsErrorHelper';
import { AddAiQuestionsModal } from '../components/AddAiQuestionsModal';
import {
  getAllSubjects,
  getCustomSubjects,
  addCustomSubject,
  deleteCustomSubject,
  BASE_SUBJECTS,
} from '../lib/subjectManager';
import { parsePosts, getAllPosts, isPostMatch } from '../lib/postManager';

export const QuestionsList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [postFilter, setPostFilter] = useState<string>('all');

  // Custom Subject Management States
  const [customSubjects, setCustomSubjects] = useState<string[]>(getCustomSubjects());
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [subjectModalError, setSubjectModalError] = useState<string | null>(null);
  const [subjectModalSuccess, setSubjectModalSuccess] = useState<string | null>(null);

  // Prompt new subject inline for single question
  const [quickNewSubjectQuestionId, setQuickNewSubjectQuestionId] = useState<string | number | null>(null);
  const [quickNewSubjectName, setQuickNewSubjectName] = useState('');

  // Delete modal states
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Expanded details modal
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  // AI Question Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Bulk selection and Subject updates
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkSubject, setBulkSubject] = useState<string>('বাংলা');
  const [customBulkSubjectInput, setCustomBulkSubjectInput] = useState<string>('');
  const [showCustomBulkSubject, setShowCustomBulkSubject] = useState<boolean>(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const [inlineUpdatingId, setInlineUpdatingId] = useState<string | number | null>(null);

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

    const handleCustomSubUpdate = () => {
      setCustomSubjects(getCustomSubjects());
    };
    window.addEventListener('custom_subjects_updated', handleCustomSubUpdate);
    return () => {
      window.removeEventListener('custom_subjects_updated', handleCustomSubUpdate);
    };
  }, []);

  // Compute all unified available subjects (memoized to avoid rerender thrashing)
  const allAvailableSubjects = useMemo(
    () => getAllSubjects(questions.map((q) => q.subject)),
    [questions, customSubjects]
  );

  // Compute all available posts
  const allAvailablePosts = useMemo(
    () => getAllPosts(questions.map((q) => q.post)),
    [questions]
  );

  const handleSingleSubjectChange = async (questionId: string | number, newSubject: string) => {
    if (newSubject === '__NEW_SUBJECT__') {
      setQuickNewSubjectQuestionId(questionId);
      setQuickNewSubjectName('');
      return;
    }

    setInlineUpdatingId(questionId);
    const { success, error: err } = await updateQuestion(questionId, { subject: newSubject });
    setInlineUpdatingId(null);

    if (success) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, subject: newSubject } : q))
      );
    } else {
      alert(`বিষয় আপডেট করতে সমস্যা হয়েছে: ${err || ''}`);
    }
  };

  const handleSaveQuickNewSubject = async () => {
    if (!quickNewSubjectQuestionId || !quickNewSubjectName.trim()) {
      setQuickNewSubjectQuestionId(null);
      return;
    }
    const cleanName = quickNewSubjectName.trim();
    addCustomSubject(cleanName);
    setCustomSubjects(getCustomSubjects());

    await handleSingleSubjectChange(quickNewSubjectQuestionId, cleanName);
    setQuickNewSubjectQuestionId(null);
    setQuickNewSubjectName('');
  };

  const handleBulkSubjectChange = async () => {
    if (selectedIds.length === 0) return;
    const targetSubject = showCustomBulkSubject ? customBulkSubjectInput.trim() : bulkSubject;

    if (!targetSubject) {
      alert('অনুগ্রহ করে একটি সঠিক বিষয় নির্বাচন অথবা লিখুন।');
      return;
    }

    if (showCustomBulkSubject && targetSubject) {
      addCustomSubject(targetSubject);
      setCustomSubjects(getCustomSubjects());
    }

    setIsBulkUpdating(true);

    for (const id of selectedIds) {
      await updateQuestion(id, { subject: targetSubject });
    }

    setQuestions((prev) =>
      prev.map((q) => (selectedIds.includes(q.id) ? { ...q, subject: targetSubject } : q))
    );

    setIsBulkUpdating(false);
    setSelectedIds([]);
    setShowCustomBulkSubject(false);
    setCustomBulkSubjectInput('');
  };

  const handleAddNewSubjectFromModal = () => {
    setSubjectModalError(null);
    setSubjectModalSuccess(null);
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      setSubjectModalError('অনুগ্রহ করে বিষয়ের নাম লিখুন।');
      return;
    }
    if (trimmed === 'সাধারণ' || trimmed === 'সকল বিষয়') {
      setSubjectModalError('এই নামটি বিষয় হিসেবে ব্যবহার করা যাবে না।');
      return;
    }

    addCustomSubject(trimmed);
    setCustomSubjects(getCustomSubjects());
    setNewSubjectInput('');
    setSubjectModalSuccess(`'${trimmed}' বিষয়টি সফলভাবে যুক্ত করা হয়েছে!`);
    setTimeout(() => setSubjectModalSuccess(null), 2500);
  };

  const handleDeleteSubject = (sub: string) => {
    deleteCustomSubject(sub);
    setCustomSubjects(getCustomSubjects());
  };

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

  // Filter & search logic
  const filteredQuestions = questions.filter((q) => {
    const qSub = q.subject || 'বাংলা';
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.option_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.option_b.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.post && q.post.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : q.status === statusFilter;

    const matchesSubject =
      subjectFilter === 'all' ? true : qSub === subjectFilter;

    const matchesPost = isPostMatch(q.post, postFilter);

    return matchesSearch && matchesStatus && matchesSubject && matchesPost;
  });

  // Count questions with unwanted 'সাধারণ' or empty subject
  const sadharanCount = questions.filter((q) => q.subject === 'সাধারণ' || !q.subject).length;

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
            আপনার সকল বিষয়ের প্রশ্ন সংরক্ষিত স্থান। বিষয় ও টপিক অনুযায়ী প্রশ্ন পরিচালনা ও পরীক্ষা তৈরি করুন।
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
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-500/30 transition-all flex items-center gap-1.5"
            title="নতুন বিষয় যোগ বা পরিচালনা করুন"
          >
            <Layers className="w-3.5 h-3.5" />
            বিষয়সমূহ পরিচালনা
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

      {/* Warning Notice if any question has 'সাধারণ' */}
      {sadharanCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{sadharanCount}</strong> টি প্রশ্নে বিষয় এখনো নির্দিষ্ট করা হয়নি বা 'সাধারণ' রয়েছে। নিচের টেবিলের ড্রপডাউন থেকে সরাসরি সঠিক বিষয় সিলেক্ট করুন অথবা টিক চিহ্ন দিয়ে একসাথে বিষয় পরিবর্তন করুন।
            </span>
          </div>
          <button
            onClick={() => {
              const targetIds = questions
                .filter((q) => q.subject === 'সাধারণ' || !q.subject)
                .map((q) => q.id);
              setSelectedIds(targetIds);
            }}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-[11px] whitespace-nowrap hover:bg-amber-400 transition-all shrink-0"
          >
            সবগুলো সিলেক্ট করুন ({sadharanCount})
          </button>
        </div>
      )}

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
            placeholder="প্রশ্ন, বিষয় বা টপিক দিয়ে খুঁজুন..."
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
              {allAvailableSubjects.map((sub) => {
                const count = questions.filter((q) => (q.subject || 'বাংলা') === sub).length;
                return (
                  <option key={sub} value={sub}>
                    {sub} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Post / Designation Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={postFilter}
              onChange={(e) => setPostFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">সকল পদ (All Posts)</option>
              {allAvailablePosts.map((p) => {
                const count = questions.filter((q) => isPostMatch(q.post, p)).length;
                return (
                  <option key={p} value={p}>
                    {p} ({count})
                  </option>
                );
              })}
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

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-950/90 border border-indigo-500/40 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px]">
              {selectedIds.length}
            </span>
            <span>টি প্রশ্ন সিলেক্ট করা হয়েছে</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">নতুন বিষয় সেট করুন:</span>
            {!showCustomBulkSubject ? (
              <select
                value={bulkSubject}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setShowCustomBulkSubject(true);
                  } else {
                    setBulkSubject(e.target.value);
                  }
                }}
                className="bg-slate-900 border border-indigo-500/50 text-indigo-100 text-xs font-extrabold px-3 py-1.5 rounded-xl focus:outline-none"
              >
                {allAvailableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="__CUSTOM__">+ নতুন বিষয় লিখুন...</option>
              </select>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customBulkSubjectInput}
                  onChange={(e) => setCustomBulkSubjectInput(e.target.value)}
                  placeholder="নতুন বিষয়ের নাম..."
                  className="bg-slate-900 border border-indigo-400 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none w-44"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomBulkSubject(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  বাতিল
                </button>
              </div>
            )}

            <button
              onClick={handleBulkSubjectChange}
              disabled={isBulkUpdating}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow flex items-center gap-1.5"
            >
              {isBulkUpdating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              বিষয় পরিবর্তন করুন
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white text-xs rounded-xl font-bold transition-colors"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

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
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredQuestions.length > 0 &&
                        filteredQuestions.every((q) => selectedIds.includes(q.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredQuestions.map((q) => q.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-6">প্রশ্ন (Question)</th>
                  <th className="py-3.5 px-4 w-48">বিষয় (Subject) ও টপিক</th>
                  <th className="py-3.5 px-4 w-28">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 w-36">তৈরির তারিখ</th>
                  <th className="py-3.5 px-6 w-32 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredQuestions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  const currentSub = q.subject || 'বাংলা';
                  const isSadharan = q.subject === 'সাধারণ' || !q.subject;

                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/30 dark:bg-indigo-950/50'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, q.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== q.id));
                            }
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

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

                      {/* Subject, Topic & Post Column */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="flex items-center gap-1">
                            <select
                              value={isSadharan ? '' : currentSub}
                              disabled={inlineUpdatingId === q.id}
                              onChange={(e) => handleSingleSubjectChange(q.id, e.target.value)}
                              className={`font-bold text-[11px] px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border ${
                                isSadharan
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                                  : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border-indigo-700/60'
                              }`}
                              title="বিষয় পরিবর্তন করতে ক্লিক করুন"
                            >
                              {isSadharan && <option value="">বিষয় নির্বাচন করুন...</option>}
                              {allAvailableSubjects.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                              <option value="__NEW_SUBJECT__">+ নতুন বিষয় যোগ করুন...</option>
                            </select>
                            {inlineUpdatingId === q.id && (
                              <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                            )}
                          </div>
                          {q.topic && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold text-[10px] border border-purple-200/50 dark:border-purple-800/50">
                              <Tag className="w-2.5 h-2.5" />
                              টপিক: {q.topic}
                            </span>
                          )}
                          {q.post && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {parsePosts(q.post).map((p) => (
                                <span
                                  key={p}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] border border-amber-200/60 dark:border-amber-800/60"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK INLINE NEW SUBJECT MODAL */}
      {quickNewSubjectQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                নতুন বিষয় যোগ করুন
              </h3>
              <button
                onClick={() => setQuickNewSubjectQuestionId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                বিষয়ের নাম (Subject Name):
              </label>
              <input
                type="text"
                autoFocus
                value={quickNewSubjectName}
                onChange={(e) => setQuickNewSubjectName(e.target.value)}
                placeholder="যেমন: আরবি সাহিত্য, বালাগাত, আইসিটি..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveQuickNewSubject();
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickNewSubjectQuestionId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveQuickNewSubject}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
              >
                সেভ ও সেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SUBJECTS MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    বিষয়সমূহ পরিচালনা (Subject Management)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    এখানে নতুন বিষয় যুক্ত করুন, যা সব জায়গায় ব্যবহারযোগ্য হবে
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subjectModalSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{subjectModalSuccess}</span>
              </div>
            )}

            {subjectModalError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{subjectModalError}</span>
              </div>
            )}

            {/* Add Subject Input Box */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                নতুন বিষয় যোগ করুন
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="যেমন: আরবি, আল ফিকহ, বালাগাত ও মানতিক..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewSubjectFromModal();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewSubjectFromModal}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  যুক্ত করুন
                </button>
              </div>
            </div>

            {/* Existing Subjects List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">
                সকল বিদ্যমান বিষয় তালিকা ({allAvailableSubjects.length}):
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {allAvailableSubjects.map((sub) => {
                  const isCustom = customSubjects.includes(sub);
                  const count = questions.filter((q) => (q.subject || 'বাংলা') === sub).length;

                  return (
                    <div
                      key={sub}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{sub}</span>
                        {isCustom && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            কাস্টম
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          ({count} টি প্রশ্ন)
                        </span>
                      </div>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sub)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">তথ্য:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10px]">
                  বিষয়: {viewQuestion.subject || 'বাংলা'}
                </span>
                {viewQuestion.topic && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                    টপিক: {viewQuestion.topic}
                  </span>
                )}
                {viewQuestion.post && (
                  <div className="flex flex-wrap items-center gap-1">
                    {parsePosts(viewQuestion.post).map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]"
                      >
                        পদ: {p}
                      </span>
                    ))}
                  </div>
                )}
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
        availableSubjects={allAvailableSubjects}
      />
    </div>
  );
};
