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
} from 'lucide-react';
import { fetchDashboardStats, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { DashboardStats } from '../types';
import { StudentPreviewModal } from '../components/StudentPreviewModal';

export const Dashboard: React.FC = () => {
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
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> MiniQuiz অ্যাডমিন প্যানেল
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            প্রশ্নমালা ড্যাশবোর্ড
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            এখানে আপনি সব প্রশ্ন দেখতে পাবেন, নতুন MCQ প্রশ্ন তৈরি করতে পারবেন এবং ড্রাফট থেকে সরাসরি স্টুডেন্ট অ্যাপে প্রকাশ করতে পারবেন।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/questions/create"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> নতুন প্রশ্ন তৈরি করুন
            </Link>
            <Link
              to="/admin/questions"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <ListOrdered className="w-4 h-4" /> সব প্রশ্ন দেখুন
            </Link>
            <button
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" /> স্টুডেন্ট অ্যাপ প্রিভিউ
            </button>
          </div>
        </div>
      </div>

      {/* Database Warning if not configured or table missing */}
      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">সুপাবেস কানেকশন সেটআপ প্রয়োজন</h4>
            <p className="mt-1 opacity-90">
              <code>NEXT_PUBLIC_SUPABASE_URL</code> এবং <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> প্রদান করা হয়নি। উপরে ডানের
              &apos;Supabase কনফিগার করুন&apos; বাটনে ক্লিক করে আপনার প্রকল্প তথ্য দিন।
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">ডাটাবেস ত্রুটি</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* STATS CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            পরিসংখ্যান সারসংক্ষেপ (public.questions & public.exams)
          </h2>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Questions Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                মোট প্রশ্ন
              </span>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {loading ? '...' : stats.totalQuestions}
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">টি প্রশ্ন</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>সব প্রশ্ন দেখুন</span>
              <Link to="/admin/questions" className="text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
                দেখা <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Published Questions Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                প্রকাশিত প্রশ্ন
              </span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? '...' : stats.publishedQuestions}
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">স্টুডেন্টদের জন্য</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>স্টুডেন্ট অ্যাপে ওপেন</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                Active
              </span>
            </div>
          </div>

          {/* Draft Questions Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Draft প্রশ্ন
              </span>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                <FileEdit className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {loading ? '...' : stats.draftQuestions}
              </span>
              <span className="text-xs text-[#64748b] ml-2 font-medium">অপ্রকাশিত</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>সম্পাদনা করুন</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                Draft
              </span>
            </div>
          </div>

          {/* Exams & Model Tests Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                পরীক্ষা ও মডেল টেস্ট
              </span>
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {loading ? '...' : (stats.totalExams || 0)}
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">টি মডেল টেস্ট ({stats.activeExams || 0} active)</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>পরীক্ষা পরিচালনা করুন</span>
              <Link to="/admin/exams" className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                ম্যানেজ করুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK WORKFLOW GUIDE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          সিস্টেমের কাজের ধাপ (System Flow):
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              ১. অ্যাডমিন প্যানেল
            </div>
            <p className="leading-relaxed">
              প্রশ্ন তৈরি করার সময় পছন্দ অনুযায়ী স্ট্যাটাস সিলেক্ট করুন। <code>published</code> হলে প্রশ্ন সাথে সাথেই স্টুডেন্ট অ্যাপে চলে যাবে।
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              ২. Supabase public.questions
            </div>
            <p className="leading-relaxed">
              আপনার সংরক্ষিত প্রশ্নটি সরাসরি Supabase ডাটাবেসের <code>public.questions</code> টেবিলে ইনসার্ট হবে।
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              ৩. Student App
            </div>
            <p className="leading-relaxed">
              স্টুডেন্ট অ্যাপটি এই একই টেবিল থেকে প্রকাশিত প্রশ্ন লোড করে শিক্ষার্থীদের কুইজ নেওয়ার সুযোগ দেয়।
            </p>
          </div>
        </div>
      </div>

      <StudentPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
};
