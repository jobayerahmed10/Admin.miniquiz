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
} from 'lucide-react';
import { Question } from '../../types';
import { QuestionBankHeader } from './Header';
import { isArabicText, getQuestionBankDirectionality } from '../../lib/questionBankEngine';

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
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [viewAllQuestionsModal, setViewAllQuestionsModal] = useState(false);
  const [viewQuestionDetail, setViewQuestionDetail] = useState<Question | null>(null);

  // Dynamic calculations based on real questions (no fake mock inflation)
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

  // Subject counts based on real questions
  const subjectStats = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const subj = q.subject || 'অন্যান্য';
      counts[subj] = (counts[subj] || 0) + 1;
    });

    const defaultSubjects = [
      { name: 'বাংলা', color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/30' },
      { name: 'English', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' },
      { name: 'গণিত', color: 'from-amber-500 to-orange-600', text: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' },
      { name: 'সাধারণ জ্ঞান', color: 'from-blue-500 to-sky-600', text: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-500/30' },
      { name: 'العربية', color: 'from-rose-500 to-pink-600', text: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/30' },
      { name: 'ফিকহ', color: 'from-teal-500 to-cyan-600', text: 'text-teal-400', bg: 'bg-teal-950/40 border-teal-500/30' },
    ];

    return defaultSubjects.map((s) => ({
      ...s,
      count: counts[s.name] || 0,
    }));
  }, [questions]);

  // Filter questions for the list table
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
      if (selectedLanguage !== 'all') {
        const isArab = isArabicText(q.question);
        if (selectedLanguage === 'arabic' && !isArab) return false;
        if (selectedLanguage === 'bangla' && (isArab || /^[a-zA-Z\s.,?]+$/.test(q.question))) return false;
      }
      if (searchQuery.trim()) {
        const qStr = (q.question + ' ' + (q.subject || '') + ' ' + (q.topic || '') + ' ' + (q.id || '')).toLowerCase();
        if (!qStr.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [questions, selectedSubject, selectedStatus, selectedLanguage, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <QuestionBankHeader title="মাস্টার প্রশ্ন ব্যাংক" subTitle="QUESTION BANK" />

      {/* 2. Three Creation Method Cards (Exactly like Screenshot 1) */}
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

          {/* Card 2: AI Copy-Paste (Glowing Recommended) */}
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

      {/* 3. Summary Stats (6 Cards, exactly like Screenshot 1) */}
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

      {/* 4. Subject Breakdown with 'সব দেখুন' */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white">বিষয় ভিত্তিক প্রশ্ন সংখ্যা</h2>
          <button
            onClick={() => setSelectedSubject('all')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {subjectStats.map((sub) => (
            <div
              key={sub.name}
              onClick={() => setSelectedSubject(selectedSubject === sub.name ? 'all' : sub.name)}
              className={`cursor-pointer rounded-3xl p-4 border transition-all ${
                selectedSubject === sub.name
                  ? 'bg-[#121c2d] border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                  : 'bg-[#0b1322] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black ${sub.text}`}>{sub.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-base font-black text-white font-mono mb-2">
                {sub.count.toLocaleString()} টি
              </p>
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${sub.color}`}
                  style={{ width: `${Math.min(100, (sub.count / 3500) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Latest Questions Section with Filter Toolbar & Table/List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white">সর্বশেষ যুক্ত প্রশ্নসমূহ</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              {filteredQuestions.length} টি
            </span>
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
              <option value="all">সকল বিষয়</option>
              <option value="বাংলা">বাংলা</option>
              <option value="English">English</option>
              <option value="গণিত">গণিত</option>
              <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান</option>
              <option value="العربية">العربية</option>
              <option value="ফিকহ">ফিকহ</option>
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
              filteredQuestions.slice(0, 10).map((q, idx) => {
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
                    className="bg-[#050914] border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
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

      {/* 6. Quick Actions Row at Bottom (4 Clickable Cards) */}
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
          onClick={() => setSelectedSubject(selectedSubject === 'all' ? 'বাংলা' : 'all')}
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
    </div>
  );
};
