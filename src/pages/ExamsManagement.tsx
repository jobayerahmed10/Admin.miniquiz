import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  FileEdit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  HelpCircle,
  MinusCircle,
  BookOpen,
  Zap,
  Radio,
  Calendar,
  Layers,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Rocket,
} from 'lucide-react';
import {
  fetchAllExams,
  insertExam,
  updateExam,
  deleteExam,
  toggleExamStatus,
} from '../lib/supabase';
import {
  Exam,
  ExamBadgeType,
  ExamStatus,
  EXAM_BADGE_OPTIONS,
  EXAM_CATEGORIES,
  QUICK_SUBJECT_SUGGESTIONS,
  QUICK_POST_SUGGESTIONS,
} from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { CreateExamWizard } from '../components/exam/CreateExamWizard';
import { getAllSubjects, addCustomSubject } from '../lib/subjectManager';

export const ExamsManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [badgeTypeFilter, setBadgeTypeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Modal State
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SQL Helper Modal state
  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Details Modal
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);

  // Add Questions / Create Wizard Modal State (3-step wizard)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardExamToEdit, setWizardExamToEdit] = useState<Exam | null>(null);

  // Load Exams
  const loadExams = async () => {
    setLoading(true);
    setError(null);
    setIsTableMissing(false);
    const result = await fetchAllExams();
    if (result.error) {
      setError(result.error);
      if (result.isTableMissing) {
        setIsTableMissing(true);
      }
    } else {
      setExams(result.exams);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Open Create Modal -> Opens 3-step wizard starting at Step 1 with fresh form
  const handleOpenCreateModal = () => {
    setWizardExamToEdit(null);
    setIsWizardOpen(true);
  };

  // Open Edit Modal -> Opens 3-step wizard directly with existing exam data
  const handleOpenEditModal = (exam: Exam) => {
    setWizardExamToEdit(exam);
    setIsWizardOpen(true);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await deleteExam(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
    if (res.success) {
      loadExams();
    } else {
      alert(`মুছে ফেলতে ব্যর্থ: ${res.error}`);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (exam: Exam) => {
    // Optimistic UI update
    const nextStatus: ExamStatus = exam.status === 'active' ? 'draft' : 'active';
    setExams((prev) =>
      prev.map((item) => (item.id === exam.id ? { ...item, status: nextStatus } : item))
    );

    const res = await toggleExamStatus(exam.id, exam.status);
    if (!res.success) {
      // Rollback on error
      setExams((prev) =>
        prev.map((item) => (item.id === exam.id ? { ...item, status: exam.status } : item))
      );
      alert(`স্ট্যাটাস পরিবর্তন ব্যর্থ: ${res.error}`);
    }
  };

  // Filtered Exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.badge.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBadgeType = badgeTypeFilter === 'all' ? true : exam.badge_type === badgeTypeFilter;
    const matchesSubject = subjectFilter === 'all' ? true : exam.subject === subjectFilter;
    const matchesStatus = statusFilter === 'all' ? true : exam.status === statusFilter;

    return matchesSearch && matchesBadgeType && matchesSubject && matchesStatus;
  });

  // Unique Subjects present in list
  const availableSubjects = Array.from(new Set(exams.map((e) => e.subject)));

  // SQL snippet for creating exams table in Supabase
  const createTableSql = `-- Supabase SQL Editor এ নিচের কমান্ডটি এক্সিকিউট করে public.exams টেবিল তৈরি করুন:

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    badge TEXT NOT NULL DEFAULT 'মডেল টেস্ট',
    badge_type TEXT NOT NULL DEFAULT 'daily',
    subject TEXT NOT NULL DEFAULT 'সকল বিষয়',
    question_count INTEGER NOT NULL DEFAULT 10,
    time_minutes INTEGER NOT NULL DEFAULT 15,
    negative_marks NUMERIC(4,2) NOT NULL DEFAULT 0.25,
    total_marks INTEGER NOT NULL DEFAULT 10,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) অকার্যকর করা যাতে সরাসরি প্রশ্ন পড়া ও লিখা যায়:
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(createTableSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Helper styling for Badge type
  const getBadgeStyle = (type: ExamBadgeType, customText: string) => {
    switch (type) {
      case 'free':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800">
            <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            {customText || 'ফ্রি পরীক্ষা'}
          </span>
        );
      case 'daily':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-200 dark:border-indigo-800">
            <Calendar className="w-3 h-3 text-indigo-500" />
            {customText || 'দৈনিক মডেল টেস্ট'}
          </span>
        );
      case 'weekly':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200 dark:border-amber-800">
            <Award className="w-3 h-3 text-amber-500" />
            {customText || 'সাপ্তাহিক টেস্ট'}
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-extrabold text-[11px] border border-rose-200 dark:border-rose-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <Radio className="w-3 h-3 text-rose-600" />
            {customText || 'লাইভ পরীক্ষা'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
            {customText}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                পরীক্ষা ও মডেল টেস্ট ম্যানেজমেন্ট
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ফ্রি পরীক্ষা, দৈনিক, সাপ্তাহিক ও লাইভ মডেল টেস্ট তৈরি ও লাইভ কন্ট্রোল করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSqlHelper(!showSqlHelper)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors"
            title="Supabase SQL Schema দেখুন"
          >
            <Code2 className="w-4 h-4 text-indigo-500" />
            <span>SQL টেবিল সেটআপ</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পরীক্ষা তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* SQL HELPER BANNER OR MODAL */}
      {(showSqlHelper || isTableMissing) && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-3xl text-slate-100 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Supabase `public.exams` টেবিল সেটআপ গাইড
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  আপনার Supabase প্রজেক্টের SQL Editor এ নিচের কুয়েরিটি রান করলে <code className="text-amber-300 font-mono">exams</code> টেবিল তৈরি হয়ে যাবে।
                </p>
              </div>
            </div>
            {showSqlHelper && !isTableMissing && (
              <button
                onClick={() => setShowSqlHelper(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="relative group">
            <pre className="bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
              {createTableSql}
            </pre>
            <button
              onClick={handleCopySql}
              className="absolute top-3 right-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 shadow-md transition-all"
            >
              {sqlCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> কপি হয়েছে!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> SQL কপি করুন
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              ধাপ ১: Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Paste SQL &gt; Click <strong>Run</strong>
            </span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
            >
              Supabase Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* STATS COUNTER BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">মোট পরীক্ষা</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {exams.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">একটিভ টেস্ট</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {exams.filter((e) => e.status === 'active').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">দৈনিক ও ফ্রি</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
              {exams.filter((e) => e.badge_type === 'daily' || e.badge_type === 'free').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">সাপ্তাহিক ও লাইভ</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {exams.filter((e) => e.badge_type === 'weekly' || e.badge_type === 'live').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পরীক্ষার নাম বা বিষয় খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            {/* Badge Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={badgeTypeFilter}
                onChange={(e) => setBadgeTypeFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">সকল ধরন (All Badges)</option>
                <option value="free">ফ্রি পরীক্ষা (Free)</option>
                <option value="daily">দৈনিক মডেল টেস্ট (Daily)</option>
                <option value="weekly">সাপ্তাহিক মডেল টেস্ট (Weekly)</option>
                <option value="live">লাইভ পরীক্ষা (Live)</option>
              </select>
            </div>

            {/* Subject Filter Dropdown */}
            {availableSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">সকল বিষয় ({exams.length})</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} ({exams.filter((e) => e.subject === sub).length})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">সকল স্ট্যাটাস</option>
                <option value="active">Active (একটিভ)</option>
                <option value="draft">Draft (ড্রাফট)</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadExams}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="তালিকা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadExams}
            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold rounded-lg text-[11px]"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">পরীক্ষার তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        /* EMPTY STATE */
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            কোনো পরীক্ষা পাওয়া যায়নি!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || badgeTypeFilter !== 'all' || subjectFilter !== 'all' || statusFilter !== 'all'
              ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো পরীক্ষা নেই। সার্চ পরিবর্তন করে দেখুন।'
              : 'এখনো কোনো পরীক্ষা তৈরি করা হয়নি। "নতুন পরীক্ষা তৈরি করুন" বাটনে ক্লিক করে নতুন টেস্ট যুক্ত করুন।'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            নতুন পরীক্ষা যোগ করুন
          </button>
        </div>
      ) : (
        /* EXAMS GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden relative group ${
                exam.status === 'active'
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Badge */}
                  {getBadgeStyle(exam.badge_type, exam.badge)}

                  {/* Status / Publish Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(exam)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm ${
                      exam.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white hover:from-amber-600 hover:to-emerald-700 animate-pulse'
                    }`}
                    title="স্ট্যাটাস পরিবর্তন বা পাবলিশ করুন"
                  >
                    {exam.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>✓ পাবলিশড (Online)</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-3.5 h-3.5 text-white" />
                        <span>🚀 পাবলিশ করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Title & Clickable Area to Open Preview & Editor */}
                <div
                  onClick={() => handleOpenEditModal(exam)}
                  className="cursor-pointer group/title"
                  title="ক্লিক করে পুরো মডেল টেস্ট প্রিভিউ দেখুন ও প্রশ্ন এডিট করুন"
                >
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors">
                    {exam.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      বিষয়: <span className="text-slate-900 dark:text-slate-200">{exam.subject}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-3 h-3" /> ক্লিক করে প্রিভিউ ও এডিট
                    </span>
                  </div>
                </div>

                {/* Description Guidelines */}
                {exam.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    {exam.description}
                  </p>
                )}

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">
                        প্রশ্ন সংখ্যা
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {exam.question_count} টি
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">
                        সময়সীমা
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {exam.time_minutes} মিনিট
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">
                        মোট নম্বর
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {exam.total_marks}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2">
                    <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">
                        নেগেটিভ মার্ক
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">
                        {exam.negative_marks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(exam)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
                    title="পুরো মডেল টেস্ট প্রিভিউ দেখুন, প্রশ্ন ও অপশন এডিট করুন"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>মডেল টেস্ট প্রিভিউ ও এডিট</span>
                  </button>

                  <button
                    onClick={() => setViewingExam(exam)}
                    className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    ডিটেইলস
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(exam)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors"
                    title="সেটিংস সম্পাদনা করুন"
                  >
                    <FileEdit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingId(exam.id)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* VIEW DETAILS MODAL */}
      {viewingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getBadgeStyle(viewingExam.badge_type, viewingExam.badge)}
                <span className="text-xs font-bold text-slate-500">ডিটেইলস</span>
              </div>
              <button
                onClick={() => setViewingExam(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                {viewingExam.title}
              </h3>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                বিষয়: {viewingExam.subject}
              </p>
            </div>

            {viewingExam.description && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold block text-[10px] uppercase text-slate-400 mb-1">
                  পরীক্ষার বিবরণ:
                </span>
                {viewingExam.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">মোট প্রশ্ন:</span>
                <span className="font-extrabold text-sm">{viewingExam.question_count} টি</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">সময়সীমা:</span>
                <span className="font-extrabold text-sm">{viewingExam.time_minutes} মিনিট</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">মোট নম্বর:</span>
                <span className="font-extrabold text-sm">{viewingExam.total_marks}</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans font-bold">নেগেটিভ মার্ক:</span>
                <span className="font-extrabold text-sm text-rose-500">{viewingExam.negative_marks}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  const curr = viewingExam;
                  setViewingExam(null);
                  handleOpenEditModal(curr);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
              >
                <Eye className="w-4 h-4" />
                পূর্ণাঙ্গ মডেল টেস্ট প্রিভিউ ও এডিট করুন
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleStatus(viewingExam);
                    setViewingExam(null);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  {viewingExam.status === 'active' ? 'ড্রাফট করুন' : 'পাবলিশ করুন'}
                </button>
                <button
                  onClick={() => setViewingExam(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT EXAM WIZARD (3-STEP) */}
      <CreateExamWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardExamToEdit(null);
        }}
        examToEdit={wizardExamToEdit}
        onSuccess={() => {
          loadExams();
        }}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="পরীক্ষাটি মুছে ফেলতে চান?"
        message="এই কাজটি একবার সম্পন্ন হলে আর ফিরিয়ে আনা সম্ভব হবে না।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        isDanger={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
