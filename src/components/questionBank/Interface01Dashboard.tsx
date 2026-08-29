import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  Sparkles,
  Bot,
  ArrowRight,
  Layers,
  CheckCircle2,
  FileText,
  Clock,
  Copy,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit,
  Download,
  BarChart3,
  Globe,
  ChevronRight,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  Tag,
  X,
  CheckSquare,
  Square,
  FolderSync,
} from 'lucide-react';
import { Question } from '../../types';
import { QuestionBankHeader } from './Header';
import { isArabicText, getQuestionBankDirectionality } from '../../lib/questionBankEngine';
import { transferQuestionsSubjectTopic } from '../../lib/supabase';
import {
  sanitizeSubjectName,
  isSameSubject,
  groupItemsBySanitizedSubject,
  getAllSubjects,
} from '../../lib/subjectManager';

interface Interface01DashboardProps {
  questions: Question[];
  onSelectManual: () => void;
  onSelectCopyPaste: () => void;
  onSelectAiGenerate: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string | number) => void;
  onRefresh: () => void;
  onClearAll?: () => void;
}

export const Interface01Dashboard: React.FC<Interface01DashboardProps> = ({
  questions,
  onSelectManual,
  onSelectCopyPaste,
  onSelectAiGenerate,
  onEditQuestion,
  onDeleteQuestion,
  onRefresh,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'subject' | 'topic'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<(string | number)[]>([]);

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceSubject, setTransferSourceSubject] = useState<string>('all');
  const [transferSourceTopic, setTransferSourceTopic] = useState<string>('all');
  const [transferTargetSubject, setTransferTargetSubject] = useState<string>('উসূলুল ফিকহ');
  const [transferTargetTopic, setTransferTargetTopic] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Dynamic calculations based on real questions
  const stats = useMemo(() => {
    const total = questions.length;
    const published = questions.filter((q) => q.status === 'published').length;
    const draft = questions.filter((q) => q.status === 'draft').length;
    const pending = 0;
    const duplicates = 0;
    const addedToday = questions.length;

    return {
      total,
      published,
      draft,
      pending,
      duplicates,
      addedToday,
    };
  }, [questions]);

  // Unique topics list
  const allUniqueTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      const cleanTop = (q.topic || '').replace(/\s+/g, ' ').trim();
      if (cleanTop) set.add(cleanTop);
    });
    return Array.from(set);
  }, [questions]);

  // Unique subjects list from actual questions (Sanitized & Deduplicated)
  const availableSubjectsFromQuestions = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      const cleanSub = sanitizeSubjectName(q.subject);
      if (cleanSub) set.add(cleanSub);
    });
    return Array.from(set);
  }, [questions]);

  // Subject counts based on real questions (Sanitized, Trimmed & Case-Insensitive Merged)
  const subjectStats = useMemo(() => {
    // 1. Group real questions by sanitized subject
    const grouped = groupItemsBySanitizedSubject(questions);
    const countsMap = new Map<string, number>();
    grouped.forEach((g) => {
      countsMap.set(g.name, g.count);
    });

    const colorPalettes = [
      { color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/30' },
      { color: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' },
      { color: 'from-amber-500 to-orange-600', text: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' },
      { color: 'from-blue-500 to-sky-600', text: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-500/30' },
      { color: 'from-rose-500 to-pink-600', text: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/30' },
      { color: 'from-teal-500 to-cyan-600', text: 'text-teal-400', bg: 'bg-teal-950/40 border-teal-500/30' },
      { color: 'from-indigo-500 to-violet-600', text: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-500/30' },
      { color: 'from-cyan-500 to-blue-600', text: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-500/30' },
    ];

    // Priority default subjects to guarantee visual completeness
    const defaultPrioritySubs = ['বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান', 'বিজ্ঞান', 'কম্পিউটার ও তথ্যপ্রযুক্তি', 'আল কুরআন ও হাদিস', 'আরবি', 'ফিকহ', 'উসূলুল ফিকহ'];
    
    // Merge existing question subjects first, then standard priority subjects
    const uniqueSubjectsList = Array.from(
      new Set([...grouped.map((g) => g.name), ...defaultPrioritySubs])
    ).filter(Boolean);

    return uniqueSubjectsList.map((name, idx) => {
      const palette = colorPalettes[idx % colorPalettes.length];
      return {
        name,
        count: countsMap.get(name) || 0,
        ...palette,
      };
    });
  }, [questions]);

  // Topic counts based on real questions (Trimmed and Sanitized)
  const topicStats = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const top = (q.topic || '').replace(/\s+/g, ' ').trim() || 'সাধারণ টপিক';
      counts[top] = (counts[top] || 0) + 1;
    });

    const colorPalettes = [
      { color: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' },
      { color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/30' },
      { color: 'from-amber-500 to-orange-600', text: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' },
      { color: 'from-blue-500 to-sky-600', text: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-500/30' },
      { color: 'from-rose-500 to-pink-600', text: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/30' },
      { color: 'from-cyan-500 to-teal-600', text: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-500/30' },
    ];

    const uniqueTopics = Object.keys(counts).filter(Boolean);

    return uniqueTopics.map((name, idx) => {
      const palette = colorPalettes[idx % colorPalettes.length];
      return {
        name,
        count: counts[name] || 0,
        ...palette,
      };
    });
  }, [questions]);

  // Filter questions for the list table
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== 'all' && !isSameSubject(q.subject, selectedSubject)) return false;
      if (selectedTopic !== 'all') {
        const qTop = (q.topic || 'সাধারণ টপিক').replace(/\s+/g, ' ').trim().toLowerCase();
        const selTop = selectedTopic.replace(/\s+/g, ' ').trim().toLowerCase();
        if (qTop !== selTop) return false;
      }
      if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
      if (selectedLanguage !== 'all') {
        const isArab = isArabicText(q.question);
        if (selectedLanguage === 'arabic' && !isArab) return false;
        if (selectedLanguage === 'bangla' && (isArab || /^[a-zA-Z\s.,?]+$/.test(q.question))) return false;
      }
      if (searchQuery.trim()) {
        const qSub = sanitizeSubjectName(q.subject);
        const qStr = (q.question + ' ' + (q.subject || '') + ' ' + qSub + ' ' + (q.topic || '') + ' ' + (q.id || '')).toLowerCase();
        if (!qStr.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [questions, selectedSubject, selectedTopic, selectedStatus, selectedLanguage, searchQuery]);

  // Count matching questions for transfer preview
  const transferMatchingCount = useMemo(() => {
    if (selectedQuestionIds.length > 0) return selectedQuestionIds.length;
    return questions.filter((q) => {
      if (transferSourceSubject !== 'all' && !isSameSubject(q.subject, transferSourceSubject)) return false;
      if (transferSourceTopic !== 'all') {
        const qTop = (q.topic || 'সাধারণ টপিক').replace(/\s+/g, ' ').trim().toLowerCase();
        const selTop = transferSourceTopic.replace(/\s+/g, ' ').trim().toLowerCase();
        if (qTop !== selTop) return false;
      }
      return true;
    }).length;
  }, [questions, selectedQuestionIds, transferSourceSubject, transferSourceTopic]);

  // Selection handlers
  const handleToggleSelectQuestion = (id: string | number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredQuestions.map((q) => q.id);
    const isAllSelected = allFilteredIds.every((id) => selectedQuestionIds.includes(id));
    if (isAllSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Perform transfer action
  const handlePerformTransfer = async () => {
    const sanitizedTarget = sanitizeSubjectName(transferTargetSubject);
    if (!sanitizedTarget.trim()) {
      alert('অনুগ্রহ করে একটি লক্ষ্য বিষয় (Target Subject) সিলেক্ট করুন বা লিখুন।');
      return;
    }

    setIsTransferring(true);
    try {
      let idsToTransfer: (string | number)[] = [];

      if (selectedQuestionIds.length > 0) {
        idsToTransfer = selectedQuestionIds;
      } else {
        idsToTransfer = questions
          .filter((q) => {
            if (transferSourceSubject !== 'all' && !isSameSubject(q.subject, transferSourceSubject)) return false;
            if (transferSourceTopic !== 'all') {
              const qTop = (q.topic || 'সাধারণ টপিক').replace(/\s+/g, ' ').trim().toLowerCase();
              const selTop = transferSourceTopic.replace(/\s+/g, ' ').trim().toLowerCase();
              if (qTop !== selTop) return false;
            }
            return true;
          })
          .map((q) => q.id);
      }

      if (idsToTransfer.length === 0) {
        alert('ট্রান্সফারের জন্য কোনো প্রশ্ন পাওয়া যায়নি।');
        setIsTransferring(false);
        return;
      }

      const res = await transferQuestionsSubjectTopic(
        idsToTransfer,
        transferTargetSubject.trim(),
        transferTargetTopic.trim() || undefined
      );

      if (res.success) {
        alert(`সফলভাবে ${res.count} টি প্রশ্ন '${transferTargetSubject.trim()}' বিষয়ে স্থানান্তরিত করা হয়েছে!`);
        setSelectedQuestionIds([]);
        setIsTransferModalOpen(false);
        onRefresh();
      } else {
        alert(res.error || 'প্রশ্ন ট্রান্সফার করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      alert(err?.message || 'প্রশ্ন স্থানান্তরে ত্রুটি ঘটেছে।');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <QuestionBankHeader title="মাস্টার প্রশ্ন ব্যাংক" subTitle="QUESTION BANK" />

      {/* 2. Three Creation Method Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-white px-1">
          প্রশ্ন যুক্ত করার উপায় নির্বাচন করুন
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Manual Entry */}
          <div
            onClick={onSelectManual}
            className="group cursor-pointer bg-[#0c1024] hover:bg-[#111736] border border-indigo-500/30 hover:border-indigo-400/60 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <FileEdit className="w-6 h-6" />
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1 group-hover:text-indigo-300 transition-colors">
                ম্যানুয়ালি যুক্ত করুন
              </h3>
              <p className="text-xs text-slate-400">একটি করে প্রশ্ন যুক্ত করুন</p>
            </div>
          </div>

          {/* Card 2: AI Copy-Paste */}
          <div
            onClick={onSelectCopyPaste}
            className="group cursor-pointer bg-[#081d22] hover:bg-[#0c282f] border border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-xl shadow-emerald-950/30 relative overflow-hidden flex flex-col justify-between ring-1 ring-emerald-500/30"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:translate-x-1 transition-all font-black">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                  AI কপি-পেস্ট
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  জনপ্রিয়
                </span>
              </div>
              <p className="text-xs text-slate-400">কপি-পেস্ট করে একসাথে প্রশ্ন যুক্ত করুন</p>
            </div>
          </div>

          {/* Card 3: AI Auto Generate */}
          <div
            onClick={onSelectAiGenerate}
            className="group cursor-pointer bg-[#1c120b] hover:bg-[#2a1b10] border border-amber-500/30 hover:border-amber-400/60 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-xl shadow-amber-950/20 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:translate-x-1 transition-all font-black">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1 group-hover:text-amber-300 transition-colors">
                AI অটো জেনারেট
              </h3>
              <p className="text-xs text-slate-400">AI দিয়ে অটো প্রশ্ন তৈরি করুন</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Stats */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-white px-1">সারসংক্ষেপ</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Questions */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">মোট প্রশ্ন</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-white font-mono">
              {stats.total.toLocaleString()}
            </p>
          </div>

          {/* Published */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">প্রকাশিত</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {stats.published.toLocaleString()}
            </p>
          </div>

          {/* Draft */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">ড্রাফট</span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {stats.draft.toLocaleString()}
            </p>
          </div>

          {/* Under Review */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">পর্যালোচনাধীন</span>
              <div className="w-7 h-7 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-yellow-400 font-mono">
              {stats.pending.toLocaleString()}
            </p>
          </div>

          {/* Duplicate */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">ডুপ্লিকেট</span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Copy className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-rose-400 font-mono">
              {stats.duplicates.toLocaleString()}
            </p>
          </div>

          {/* Added Today */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">আজ যুক্ত হয়েছে</span>
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-sky-400 font-mono">
              {stats.addedToday.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Transfer Assistance Banner if needed */}
      {questions.some((q) => q.subject === 'উসুলুল') && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-[#0b152d] to-indigo-950/80 border border-indigo-500/40 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ArrowRightLeft className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">
                'উসুলুল' বিষয়ের প্রশ্নগুলো 'উসূলুল ফিকহ' এ স্থানান্তর করুন
              </h4>
              <p className="text-[11px] text-slate-300">
                ডাটাবেসে ২০ টি প্রশ্ন 'উসুলুল' বিষয় হিসেবে আছে। ট্রান্সফার টুল ব্যবহার করে এক ক্লিকেই সেগুলো 'উসূলুল ফিকহ' এ নিয়ে নিতে পারেন।
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTransferSourceSubject('উসুলুল');
              setTransferTargetSubject('উসূলুল ফিকহ');
              setIsTransferModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>এখনই স্থানান্তর করুন</span>
          </button>
        </div>
      )}

      {/* 4. Subject & Topic Breakdown with Switch & Transfer Action */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-white">
              {viewMode === 'subject' ? 'বিষয় ভিত্তিক প্রশ্ন সংখ্যা' : 'টপিক ভিত্তিক প্রশ্ন সংখ্যা'}
            </h2>

            {/* View Switcher: Subject vs Topic */}
            <div className="flex items-center bg-[#050914] border border-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => setViewMode('subject')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'subject'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>বিষয় ভিত্তিক</span>
              </button>
              <button
                onClick={() => setViewMode('topic')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'topic'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>টপিক ভিত্তিক</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Transfer Questions Button */}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all shadow-md"
              title="এক বিষয়/টপিক থেকে অন্য বিষয়/টপিক এ ট্রান্সফার করুন"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>বিষয় / টপিক ট্রান্সফার</span>
            </button>

            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedTopic('all');
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>সব দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Breakdown Cards Grid */}
        {viewMode === 'subject' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {subjectStats.map((sub) => {
              const isSelected = isSameSubject(selectedSubject, sub.name);
              return (
                <div
                  key={sub.name}
                  onClick={() => setSelectedSubject(isSelected ? 'all' : sub.name)}
                  className={`cursor-pointer rounded-3xl p-4 border transition-all ${
                    isSelected
                      ? 'bg-[#121c2d] border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                      : 'bg-[#0b1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black ${sub.text} truncate max-w-[100px]`} title={sub.name}>
                      {sub.name}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-base font-black text-white font-mono mb-2">
                    {sub.count.toLocaleString()} টি
                  </p>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${sub.color}`}
                      style={{ width: `${Math.min(100, (sub.count / Math.max(1, questions.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topicStats.length === 0 ? (
              <div className="col-span-full text-center py-6 bg-[#0b1322] border border-slate-800 rounded-3xl text-slate-400 text-xs">
                কোনো টপিক পাওয়া যায়নি।
              </div>
            ) : (
              topicStats.map((top) => (
                <div
                  key={top.name}
                  onClick={() => setSelectedTopic(selectedTopic === top.name ? 'all' : top.name)}
                  className={`cursor-pointer rounded-3xl p-4 border transition-all ${
                    selectedTopic === top.name
                      ? 'bg-[#121c2d] border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                      : 'bg-[#0b1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black ${top.text} truncate max-w-[100px]`} title={top.name}>
                      {top.name}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  </div>
                  <p className="text-base font-black text-white font-mono mb-2">
                    {top.count.toLocaleString()} টি
                  </p>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${top.color}`}
                      style={{ width: `${Math.min(100, (top.count / Math.max(1, questions.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 5. Latest Questions Section with Filter Toolbar & Table/List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white">সর্বশেষ যুক্ত প্রশ্নসমূহ</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              {filteredQuestions.length} টি
            </span>

            {/* Multi select helper */}
            <button
              onClick={handleSelectAllFiltered}
              className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 ml-2 transition-colors"
            >
              {filteredQuestions.length > 0 &&
              filteredQuestions.every((q) => selectedQuestionIds.includes(q.id)) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>সব আনসিলেক্ট</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>সব সিলেক্ট</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {questions.length > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors"
                title="সব প্রশ্ন মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব প্রশ্ন মুছুন</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="প্রশ্ন, বিষয় বা আইডি দিয়ে খুঁজুন..."
                className="w-full bg-[#050914] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Subject Select */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="all">সকল বিষয় ({questions.length})</option>
              {subjectStats.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.count})
                </option>
              ))}
            </select>

            {/* Topic Select */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="all">সকল টপিক</option>
              {allUniqueTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="all">সকল স্থিতি</option>
              <option value="published">প্রকাশিত (Live)</option>
              <option value="draft">ড্রাফট (Draft)</option>
            </select>
          </div>

          {/* Question Items List */}
          <div className="space-y-2.5 pt-2">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-10 bg-[#050914] rounded-2xl border border-slate-800/80">
                <p className="text-xs text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি।</p>
              </div>
            ) : (
              filteredQuestions.slice(0, 15).map((q) => {
                const isChecked = selectedQuestionIds.includes(q.id);
                const dirInfo = getQuestionBankDirectionality({
                  question: q.question,
                  options: [q.option_a, q.option_b, q.option_c, q.option_d],
                  explanation: q.explanation,
                  language: q.language,
                });
                const isArab = dirInfo.isQuestionArabic;
                const qDir = dirInfo.questionDir;
                return (
                  <div
                    key={String(q.id)}
                    className={`bg-[#050914] border rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isChecked ? 'border-indigo-500/80 bg-indigo-950/20' : 'border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectQuestion(q.id)}
                        className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                            #{q.id}
                          </span>
                          {q.subject && (
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-lg">
                              {q.subject}
                            </span>
                          )}
                          {q.topic && (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg">
                              {q.topic}
                            </span>
                          )}
                          {isArab && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Arabic RTL
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs font-bold text-white leading-relaxed ${
                            qDir === 'rtl' ? 'font-amiri text-sm text-right' : 'text-left'
                          }`}
                          dir={qDir}
                        >
                          {q.question}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>উত্তর: <strong className="text-emerald-400">{q.correct_answer}</strong></span>
                          {q.post && <span>• পদ: {q.post}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          q.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {q.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditQuestion(q)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Action Bar */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0c1222] border border-indigo-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-4 text-xs animate-in slide-in-from-bottom-5">
          <span className="font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedQuestionIds.length} টি প্রশ্ন সিলেক্ট করা হয়েছে</span>
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => {
              setIsTransferModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>অন্য বিষয়ে স্থানান্তর করুন</span>
          </button>

          <button
            onClick={() => setSelectedQuestionIds([])}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="নির্বাচন বাতিল করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. Quick Actions Row at Bottom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* 1. View All Questions */}
        <div
          onClick={onSelectManual}
          className="cursor-pointer bg-[#0b1322] hover:bg-[#101b30] border border-slate-800 hover:border-slate-700 rounded-3xl p-4 transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
              সব প্রশ্ন দেখুন
            </h4>
            <p className="text-[10px] text-slate-400">প্রশ্ন ব্যাংকের সকল প্রশ্ন</p>
          </div>
        </div>

        {/* 2. Filter Questions */}
        <div
          onClick={() => setSelectedSubject(selectedSubject === 'all' ? 'উসূলুল ফিকহ' : 'all')}
          className="cursor-pointer bg-[#0b1322] hover:bg-[#101b30] border border-slate-800 hover:border-slate-700 rounded-3xl p-4 transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
              ফিল্টার করুন
            </h4>
            <p className="text-[10px] text-slate-400">আপনার প্রয়োজনমতো</p>
          </div>
        </div>

        {/* 3. Import History */}
        <div
          onClick={onSelectCopyPaste}
          className="cursor-pointer bg-[#0b1322] hover:bg-[#101b30] border border-slate-800 hover:border-slate-700 rounded-3xl p-4 transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white group-hover:text-sky-300 transition-colors">
              ইমপোর্ট হিস্ট্রি
            </h4>
            <p className="text-[10px] text-slate-400">ইমপোর্টের ইতিহাস দেখুন</p>
          </div>
        </div>

        {/* 4. Reports */}
        <div
          onClick={onSelectAiGenerate}
          className="cursor-pointer bg-[#0b1322] hover:bg-[#101b30] border border-slate-800 hover:border-slate-700 rounded-3xl p-4 transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
              রিপোর্টস
            </h4>
            <p className="text-[10px] text-slate-400">বিস্তারিত পরিসংখ্যান</p>
          </div>
        </div>
      </div>

      {/* QUESTION SUBJECT & TOPIC TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1222] border border-slate-700/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">বিষয় ও টপিক পরিবর্তন (Transfer)</h3>
                  <p className="text-xs text-slate-400">প্রশ্নগুলোর বিষয় ও টপিক পরিবর্তন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selection Scope Info */}
            {selectedQuestionIds.length > 0 ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300 font-bold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>আপনি {selectedQuestionIds.length} টি নির্দিষ্ট প্রশ্ন সিলেক্ট করেছেন</span>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">১. উৎস বিষয় সিলেক্ট করুন (Source Subject)</label>
                <select
                  value={transferSourceSubject}
                  onChange={(e) => setTransferSourceSubject(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">সকল বিষয় ({questions.length} টি প্রশ্ন)</option>
                  {subjectStats.map((sub) => (
                    <option key={sub.name} value={sub.name}>
                      {sub.name} ({sub.count} টি প্রশ্ন)
                    </option>
                  ))}
                </select>

                <label className="text-xs font-bold text-slate-300 block pt-1">উৎস টপিক (অপশনাল filter)</label>
                <select
                  value={transferSourceTopic}
                  onChange={(e) => setTransferSourceTopic(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">সকল টপিক</option>
                  {allUniqueTopics.map((top) => (
                    <option key={top} value={top}>
                      {top}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Subject & Topic */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 block">
                ২. লক্ষ্য বিষয় নির্বাচন বা নাম লিখুন (Target Subject)
              </label>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {['উসূলুল ফিকহ', 'ফিকহ', 'আরবি', 'বাংলাদেশ বিষয়াবলি', 'আন্তর্জাতিক বিষয়াবলি', 'বাংলা', 'English', 'গণিত', 'সাধারণ জ্ঞান'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTransferTargetSubject(preset)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      transferTargetSubject === preset
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={transferTargetSubject}
                onChange={(e) => setTransferTargetSubject(e.target.value)}
                placeholder="বিষয়ের নাম লিখুন (যেমন: উসূলুল ফিকহ)"
                className="w-full bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <label className="text-xs font-bold text-slate-300 block pt-1">
                লক্ষ্য টপিক (Target Topic - অপশনাল)
              </label>
              <input
                type="text"
                value={transferTargetTopic}
                onChange={(e) => setTransferTargetTopic(e.target.value)}
                placeholder="টপিকের নাম লিখুন (যেমন: ফিকহ ও উসুলুল ফিকহ)"
                className="w-full bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Summary preview badge */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 text-xs text-indigo-300 space-y-1">
              <div className="flex items-center justify-between">
                <span>ট্রান্সফারের বিবরণ:</span>
                <span className="font-mono font-bold text-white">{transferMatchingCount} টি প্রশ্ন</span>
              </div>
              <p className="text-[11px] text-slate-300">
                উৎস: <strong className="text-white">{selectedQuestionIds.length > 0 ? 'সিলেক্টেড প্রশ্ন' : transferSourceSubject}</strong> ➔ লক্ষ্য বিষয়: <strong className="text-emerald-400">{transferTargetSubject || '...'}</strong>
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isTransferring || transferMatchingCount === 0 || !transferTargetSubject.trim()}
                onClick={handlePerformTransfer}
                className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ট্রান্সফার হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>স্থানান্তর সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
