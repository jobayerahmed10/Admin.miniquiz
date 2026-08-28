import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Layers,
  Plus,
  RefreshCw,
  MoreVertical,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  Radio,
  Clock,
  Search,
  Filter,
  BookOpen,
  Briefcase,
  Flag,
  Calendar,
  Zap,
  Lightbulb,
  ArrowRight,
  Code2,
  Copy,
  Check,
  ExternalLink,
  X,
  Edit3,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchAllExams,
  insertExam,
  updateExam,
  deleteExam,
  toggleExamStatus,
} from '../lib/supabase';
import { Exam, ExamBadgeType, ExamStatus } from '../types';
import { ExamCard } from '../components/exam/ExamCard';
import { ExamContextMenuModal } from '../components/exam/ExamContextMenuModal';
import { LiveExamStudentPreviewModal } from '../components/exam/LiveExamStudentPreviewModal';
import { ExamAnalyticsModal } from '../components/exam/ExamAnalyticsModal';
import { ExamScheduleModal } from '../components/exam/ExamScheduleModal';
import { ExamQuestionsListModal } from '../components/exam/ExamQuestionsListModal';
import { CreateExamWizard } from '../components/exam/CreateExamWizard';
import { ConfirmModal } from '../components/ConfirmModal';

export const ExamsManagement: React.FC = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState('২ মিনিট আগে');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChip, setActiveChip] = useState<'all' | 'free' | 'paid' | 'live' | 'draft' | 'scheduled'>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [postFilter, setPostFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'questions' | 'popular'>('latest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals & Sheets State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardExamToEdit, setWizardExamToEdit] = useState<Exam | null>(null);

  const [selectedExamForMenu, setSelectedExamForMenu] = useState<Exam | null>(null);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [analyticsExam, setAnalyticsExam] = useState<Exam | null>(null);
  const [scheduleExam, setScheduleExam] = useState<Exam | null>(null);
  const [questionsListExam, setQuestionsListExam] = useState<Exam | null>(null);

  // Delete State
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SQL Helper Modal
  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showHeaderExtraMenu, setShowHeaderExtraMenu] = useState(false);

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
      setLastUpdatedText('এইমাত্র');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Compute Summary Statistics
  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.status === 'active' || e.badge_type === 'live').length;
  const draftCount = exams.filter((e) => e.status === 'draft').length;
  const liveCount = exams.filter((e) => e.badge_type === 'live').length;
  const publishedPercent = totalExams > 0 ? Math.round((publishedCount / totalExams) * 100) : 100;

  // Filtered and Sorted Exams
  const filteredExams = useMemo(() => {
    let result = exams.filter((exam) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        exam.title.toLowerCase().includes(term) ||
        exam.subject.toLowerCase().includes(term) ||
        exam.badge.toLowerCase().includes(term) ||
        (exam.post && exam.post.toLowerCase().includes(term)) ||
        exam.id.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. Chip filter
      if (activeChip === 'free' && exam.badge_type !== 'free' && exam.exam_type !== 'free') {
        return false;
      }
      if (activeChip === 'paid' && exam.exam_type !== 'course' && exam.badge_type === 'free') {
        return false;
      }
      if (activeChip === 'live' && exam.badge_type !== 'live') {
        return false;
      }
      if (activeChip === 'draft' && exam.status !== 'draft') {
        return false;
      }
      if (
        activeChip === 'scheduled' &&
        exam.status !== 'upcoming' &&
        !exam.badge?.toLowerCase().includes('schedule')
      ) {
        return false;
      }

      // 3. Subject filter
      if (subjectFilter !== 'all' && exam.subject !== subjectFilter) {
        return false;
      }

      // 4. Post filter
      if (postFilter !== 'all') {
        if (!exam.post || !exam.post.includes(postFilter)) return false;
      }

      // 5. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'published' && exam.status !== 'active') return false;
        if (statusFilter === 'draft' && exam.status !== 'draft') return false;
        if (statusFilter === 'live' && exam.badge_type !== 'live') return false;
        if (statusFilter === 'scheduled' && exam.status !== 'upcoming') return false;
      }

      return true;
    });

    // Sort result
    return result.sort((a, b) => {
      if (sortOption === 'questions') {
        return (b.question_count || 0) - (a.question_count || 0);
      }
      if (sortOption === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      // Latest default
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [exams, searchTerm, activeChip, subjectFilter, postFilter, statusFilter, sortOption]);

  // Unique Subjects for dropdown
  const uniqueSubjects = Array.from(new Set(exams.map((e) => e.subject).filter(Boolean)));

  // Handlers for Actions
  const handleOpenCreateModal = () => {
    setWizardExamToEdit(null);
    setIsWizardOpen(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setWizardExamToEdit(exam);
    setIsWizardOpen(true);
  };

  const handleTogglePublish = async (exam: Exam) => {
    const nextStatus: ExamStatus = exam.status === 'active' ? 'draft' : 'active';
    setExams((prev) =>
      prev.map((item) => (item.id === exam.id ? { ...item, status: nextStatus } : item))
    );

    const res = await toggleExamStatus(exam.id, exam.status);
    if (!res.success) {
      setExams((prev) =>
        prev.map((item) => (item.id === exam.id ? { ...item, status: exam.status } : item))
      );
      alert(`স্ট্যাটাস পরিবর্তন ব্যর্থ: ${res.error}`);
    }
  };

  const handleDuplicateExam = async (exam: Exam) => {
    const duplicatedExam: Omit<Exam, 'id' | 'created_at' | 'updated_at'> = {
      title: `${exam.title} (কপি)`,
      badge: exam.badge,
      badge_type: exam.badge_type,
      subject: exam.subject,
      topic: exam.topic,
      post: exam.post,
      pass_mark: exam.pass_mark,
      exam_type: exam.exam_type,
      category: exam.category,
      question_count: exam.question_count,
      time_minutes: exam.time_minutes,
      negative_marks: exam.negative_marks,
      marks_per_question: exam.marks_per_question,
      total_marks: exam.total_marks,
      description: exam.description,
      status: 'draft',
      questions: exam.questions ? [...exam.questions] : [],
    };

    const res = await insertExam(duplicatedExam);
    if (res.success) {
      loadExams();
    } else {
      alert(`ডুপ্লিকেট করতে ব্যর্থ: ${res.error}`);
    }
  };

  const handleSaveSchedule = async (examId: string, startDate: string, startTime: string) => {
    const fullDateTime = `${startDate}T${startTime}:00`;
    await updateExam(examId, {
      start_date: fullDateTime,
      status: 'upcoming',
      badge: 'Scheduled',
    });
    loadExams();
  };

  const handleConfirmDelete = async () => {
    if (!deletingExam) return;
    setIsDeleting(true);
    const res = await deleteExam(deletingExam.id);
    setIsDeleting(false);
    setDeletingExam(null);
    if (res.success) {
      loadExams();
    } else {
      alert(`মুছে ফেলতে ব্যর্থ: ${res.error}`);
    }
  };

  // SQL code for setup
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

ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(createTableSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-16 min-h-screen text-slate-100">
      {/* ========================================================================= */}
      {/* 2. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-[#09111e]/90 border border-slate-800/90 p-4 sm:p-5 rounded-3xl backdrop-blur-md shadow-xl">
        {/* Left: Hamburger + Green Database Icon + Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
            <Layers className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>পরীক্ষা ও মডেল টেস্ট</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {totalExams}টি পরীক্ষা • {publishedCount}টি প্রকাশিত
            </p>
          </div>
        </div>

        {/* Right: Refresh Icon + Action Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={loadExams}
            disabled={loading}
            className="p-2.5 text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="তালিকা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Large Primary Green Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>নতুন পরীক্ষা তৈরি করুন</span>
          </button>

          {/* Header 3-dot Menu */}
          <div className="relative">
            <button
              onClick={() => setShowHeaderExtraMenu(!showHeaderExtraMenu)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-300 hover:text-white transition-colors"
              title="অতিরিক্ত অপশন"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderExtraMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0b1322] border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs font-semibold animate-scaleUp">
                <button
                  onClick={() => {
                    setShowHeaderExtraMenu(false);
                    setShowSqlHelper(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white text-left"
                >
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>SQL টেবিল সেটআপ</span>
                </button>
                <button
                  onClick={() => {
                    setShowHeaderExtraMenu(false);
                    navigate('/admin/questions');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white text-left"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>প্রশ্ন ব্যাংকে যান</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL Setup Guide Modal / Drawer if opened */}
      {(showSqlHelper || isTableMissing) && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-3xl text-slate-100 shadow-xl space-y-3">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUMMARY STATISTICS (2-column mobile grid, 4-column desktop)            */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
          {/* Card 1: মোট পরীক্ষা */}
          <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-bold">মোট পরীক্ষা</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight block">
                {String(totalExams).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
                সব পরীক্ষা
              </span>
            </div>
          </div>

          {/* Card 2: প্রকাশিত */}
          <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-bold">প্রকাশিত</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight block">
                {String(publishedCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-400/80 font-medium block mt-0.5">
                {publishedPercent}% প্রকাশিত
              </span>
            </div>
          </div>

          {/* Card 3: ড্রাফট */}
          <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-bold">ড্রাফট</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight block">
                {String(draftCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-400/80 font-medium block mt-0.5">
                প্রকাশের অপেক্ষায়
              </span>
            </div>
          </div>

          {/* Card 4: লাইভ */}
          <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-bold">লাইভ</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight block">
                {String(liveCount).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-400/80 font-medium block mt-0.5">
                চলমান পরীক্ষা
              </span>
            </div>
          </div>
        </div>

        {/* Last updated indicator below cards */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pl-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>সর্বশেষ আপডেট: {lastUpdatedText}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH + FILTER SYSTEM                                                 */}
      {/* ========================================================================= */}
      <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3.5">
        {/* Search input + Filter button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পরীক্ষা খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
              showAdvancedFilters
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4 text-slate-400" />
            <span>ফিল্টার</span>
          </button>
        </div>

        {/* Horizontal filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {(
            [
              { id: 'all', label: 'সব' },
              { id: 'free', label: 'ফ্রি' },
              { id: 'paid', label: 'পেইড' },
              { id: 'live', label: 'লাইভ' },
              { id: 'draft', label: 'Draft' },
              { id: 'scheduled', label: 'Scheduled' },
            ] as const
          ).map((chip) => {
            const isActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Filter Dropdowns Row (Scrollable on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium text-xs">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="all" className="bg-slate-900 text-slate-200">বিষয়: সব</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900 text-slate-200">
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Post Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={postFilter}
              onChange={(e) => setPostFilter(e.target.value)}
              className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="all" className="bg-slate-900 text-slate-200">পদ: সব</option>
              <option value="BCS" className="bg-slate-900 text-slate-200">BCS</option>
              <option value="NTRCA" className="bg-slate-900 text-slate-200">NTRCA</option>
              <option value="Primary" className="bg-slate-900 text-slate-200">Primary</option>
              <option value="Bank" className="bg-slate-900 text-slate-200">Bank</option>
              <option value="Other" className="bg-slate-900 text-slate-200">অন্যান্য</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl">
            <Flag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="all" className="bg-slate-900 text-slate-200">স্ট্যাটাস: সব</option>
              <option value="published" className="bg-slate-900 text-slate-200">প্রকাশিত (Online)</option>
              <option value="draft" className="bg-slate-900 text-slate-200">ড্রাফট (Draft)</option>
              <option value="live" className="bg-slate-900 text-slate-200">লাইভ (Live)</option>
              <option value="scheduled" className="bg-slate-900 text-slate-200">Scheduled</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="latest" className="bg-slate-900 text-slate-200">সর্বশেষ</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">পুরাতন</option>
              <option value="questions" className="bg-slate-900 text-slate-200">প্রশ্ন সংখ্যা</option>
              <option value="popular" className="bg-slate-900 text-slate-200">জনপ্রিয়</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EXAM CARD LIST                                                         */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-[#09111e]/90 rounded-3xl border border-slate-800">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">পরীক্ষার তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-16 text-center bg-[#09111e]/90 rounded-3xl border border-slate-800 p-8 space-y-3">
          <div className="w-14 h-14 bg-slate-900 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-white">কোনো পরীক্ষা পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            আপনার ফিল্টারের সাথে মিলে এমন কোনো পরীক্ষা নেই। সার্চ পরিবর্তন করুন অথবা নতুন পরীক্ষা যোগ করুন।
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> নতুন পরীক্ষা তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPreview={(target) => setPreviewExam(target)}
              onEdit={(target) => handleOpenEditModal(target)}
              onOpenMenu={(target) => setSelectedExamForMenu(target)}
              onResults={(target) => setAnalyticsExam(target)}
              onManageLive={(target) => setAnalyticsExam(target)}
            />
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PRO TIPS SECTION                                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#09111e]/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-white">প্রো টিপস</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              পরীক্ষার প্রশ্ন যোগ করতে ড্যাশবোর্ড থেকে “প্রশ্ন ব্যাংক” ব্যবহার করুন।
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/questions')}
          className="px-4 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 text-emerald-300 border border-emerald-800/50 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 self-end sm:self-auto"
        >
          <span>প্রশ্ন ব্যাংকে যান</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 9. QUICK CREATE FLOATING BUTTON (FAB)                                      */}
      {/* ========================================================================= */}
      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-emerald-400 hover:bg-emerald-300 active:scale-90 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all group"
        title="নতুন পরীক্ষা তৈরি করুন"
      >
        <Plus className="w-7 h-7 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* ========================================================================= */}
      {/* MODALS & BOTTOM SHEETS                                                    */}
      {/* ========================================================================= */}

      {/* 6. Context Menu Bottom Sheet */}
      <ExamContextMenuModal
        isOpen={Boolean(selectedExamForMenu)}
        onClose={() => setSelectedExamForMenu(null)}
        exam={selectedExamForMenu}
        onEdit={(target) => handleOpenEditModal(target)}
        onPreview={(target) => setPreviewExam(target)}
        onDuplicate={(target) => handleDuplicateExam(target)}
        onViewQuestions={(target) => setQuestionsListExam(target)}
        onAddQuestions={(target) => handleOpenEditModal(target)}
        onSchedule={(target) => setScheduleExam(target)}
        onAnalytics={(target) => setAnalyticsExam(target)}
        onTogglePublish={(target) => handleTogglePublish(target)}
        onDelete={(target) => setDeletingExam(target)}
      />

      {/* Student Interactive Preview Modal */}
      <LiveExamStudentPreviewModal
        isOpen={Boolean(previewExam)}
        onClose={() => setPreviewExam(null)}
        exam={previewExam}
      />

      {/* Exam Analytics / Results Modal */}
      <ExamAnalyticsModal
        isOpen={Boolean(analyticsExam)}
        onClose={() => setAnalyticsExam(null)}
        exam={analyticsExam}
      />

      {/* Exam Schedule Modal */}
      <ExamScheduleModal
        isOpen={Boolean(scheduleExam)}
        onClose={() => setScheduleExam(null)}
        exam={scheduleExam}
        onSaveSchedule={handleSaveSchedule}
      />

      {/* Exam Questions List Inspector */}
      <ExamQuestionsListModal
        isOpen={Boolean(questionsListExam)}
        onClose={() => setQuestionsListExam(null)}
        exam={questionsListExam}
        onAddMoreQuestions={(target) => handleOpenEditModal(target)}
      />

      {/* 3-Step Create / Edit Wizard */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingExam)}
        title="পরীক্ষাটি মুছে ফেলতে চান?"
        message={`"${deletingExam?.title}" পরীক্ষাটি মুছে ফেললে এর সকল তথ্য ও ফলাফল স্থায়ীভাবে মুছে যাবে।`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        isDanger={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  );
};
