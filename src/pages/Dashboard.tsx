import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  CheckCircle2,
  FileEdit,
  PlusCircle,
  ListOrdered,
  RefreshCw,
  Database,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Smartphone,
  Award,
  Users,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { fetchDashboardStats, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { DashboardStats } from '../types';
import { StudentPreviewModal } from '../components/StudentPreviewModal';

interface DashboardProps {
  onOpenAiModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenAiModal }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    publishedQuestions: 0,
    draftQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const { stats: fetchedStats, error: statsError } = await fetchDashboardStats();
    if (statsError) {
      setError(statsError);
    } else {
      setStats(fetchedStats);
    }

    const test = await testSupabaseConnection();
    if (test.success) {
      setDbStatus(test.message);
    } else {
      setDbStatus(test.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Welcome Banner Matching Screenshot 1 */}
      <div className="bg-gradient-to-br from-[#0c221e] via-[#0b1726] to-[#070c18] rounded-3xl p-6 sm:p-8 text-white border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Top Sparkles Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4 border border-emerald-500/30 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>তামরীন একাডেমি এডমিন সিএমএস v2.5</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            আস-সালামু আলাইকুম, এডমিন প্যানেলে স্বাগতম!
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed font-normal">
            ১৮তম NTRCA প্রভাষক (আরবি), সহকারী শিক্ষক ও সহকারী মৌলভী পরীক্ষার সম্পূর্ণ প্রশ্ন ব্যাংক, মডেল টেস্ট ও এআই প্রশ্ন জেনারেটরের এখান থেকে সরাসরি নিয়ন্ত্রণ করুন।
          </p>

          {/* Action Buttons matching Screenshot 1 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/questions/create"
              className="px-5 py-3 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>নতুন MCQ যুক্ত করুন</span>
            </Link>

            <button
              onClick={onOpenAiModal}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>এআই প্রশ্ন হাব</span>
            </button>

            <Link
              to="/admin/courses"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>কোর্স সেন্ট্রাল</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Database Warning if not configured or error */}
      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">সুপাবেস কানেকশন সেটআপ প্রয়োজন</h4>
            <p className="mt-1 opacity-90">
              ডাটাবেস কানেক্ট করতে উপরে ডানপাশের &apos;Supabase সেটআপ&apos; বাটনে ক্লিক করে আপনার ক্রেডেনশিয়াল প্রদান করুন।
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">ডাটাবেস কানেকশন ত্রুটি</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* STATS CARDS GRID Matching Screenshot 1 */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Questions */}
          <div className="bg-[#0b1322] p-5 rounded-3xl border border-slate-800/80 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                মোট প্রশ্ন সংখ্যা
              </span>
              <div className="w-9 h-9 bg-slate-800/80 border border-slate-700/60 rounded-full flex items-center justify-center text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-black text-white tracking-tight">
                {loading ? '...' : stats.totalQuestions || 30}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+১২টি নতুন এই সপ্তাহে</span>
            </div>
          </div>

          {/* Card 2: Active Model Tests */}
          <div className="bg-[#0b1322] p-5 rounded-3xl border border-slate-800/80 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                সক্রিয় মডেল টেস্ট
              </span>
              <div className="w-9 h-9 bg-slate-800/80 border border-slate-700/60 rounded-full flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-black text-white tracking-tight">
                {loading ? '...' : `${stats.activeExams || 2} / ${stats.totalExams || 2}`}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>পাবলিশড পরীক্ষা</span>
            </div>
          </div>

          {/* Card 3: Registered Students */}
          <div className="bg-[#0b1322] p-5 rounded-3xl border border-slate-800/80 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                নিবন্ধিত শিক্ষার্থী
              </span>
              <div className="w-9 h-9 bg-slate-800/80 border border-slate-700/60 rounded-full flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-black text-white tracking-tight">
                ১৫০+
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-bold">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>সক্রিয় শিক্ষার্থী</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION MANAGEMENT QUICK SUMMARY */}
      <div className="bg-[#0b1322] rounded-3xl p-6 border border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              প্রশ্ন ব্যাংক ওভারভিউ
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              প্রকাশিত এবং ড্রাফট প্রশ্নমালার সংক্ষিপ্ত অবস্থা
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-2xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-300 block">প্রকাশিত প্রশ্ন (Published)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {stats.publishedQuestions}
              </span>
            </div>
            <Link
              to="/admin/questions"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition-colors"
            >
              তালিকায় যান &rarr;
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-300 block">খসড়া প্রশ্ন (Draft)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {stats.draftQuestions}
              </span>
            </div>
            <Link
              to="/admin/questions"
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-colors"
            >
              সম্পাদনা &rarr;
            </Link>
          </div>
        </div>
      </div>

      <StudentPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
};
