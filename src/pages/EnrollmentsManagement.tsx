import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Search,
  Copy,
  Check,
  Trash2,
  Code,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  User,
  GraduationCap,
  X,
  AlertTriangle,
  Zap,
  Filter,
} from 'lucide-react';
import { CourseApplication, ApplicationStatus } from '../types';
import {
  fetchAllCourseApplications,
  updateCourseApplicationStatus,
  deleteCourseApplication,
  insertCourseApplication,
  subscribeToCourseApplications,
} from '../lib/supabase';

export const EnrollmentsManagement: React.FC = () => {
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ApplicationStatus>('all');
  const [isTableMissing, setIsTableMissing] = useState(false);

  // Copying feedback states
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  // Modals state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // Form data for manual testing entry
  const [newAppForm, setNewAppForm] = useState({
    student_name: '',
    phone_number: '',
    course_title: '১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ',
    payment_method: 'bKash',
    amount: 950,
    transaction_id: '',
    notes: '',
  });

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadApplications = async () => {
    setLoading(true);
    const result = await fetchAllCourseApplications();
    setApplications(result.applications);
    if (result.isTableMissing) {
      setIsTableMissing(true);
    } else {
      setIsTableMissing(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();

    // Subscribe to Supabase Realtime channel
    const unsubscribe = subscribeToCourseApplications((payload) => {
      loadApplications();
      if (payload.eventType === 'INSERT') {
        showToast('🔔 নতুন শিক্ষার্থী পেমেন্ট ও এনরোলমেন্ট আবেদন করেছেন!', 'info');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // One-click Copy Transaction ID
  const handleCopyTrx = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrxId(trxId);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  // Quick Action Handlers
  const handleApprove = async (id: string) => {
    const result = await updateCourseApplicationStatus(id, 'approved');
    if (result.success) {
      showToast('Enrollment Approved & Course Unlocked for Student!', 'success');
      loadApplications();
    }
  };

  const handleReject = async (id: string) => {
    const result = await updateCourseApplicationStatus(id, 'rejected');
    if (result.success) {
      showToast('আবেদনটি বাতিল করা হয়েছে।', 'danger');
      loadApplications();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${name}"-এর পেমেন্ট রেকর্ড মুছে ফেলতে চান?`)) {
      const result = await deleteCourseApplication(id);
      if (result.success) {
        showToast('পেমেন্ট আবেদন রেকর্ড মুছে ফেলা হয়েছে।', 'info');
        loadApplications();
      }
    }
  };

  // Handle Add Test Application
  const handleCreateNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.student_name || !newAppForm.phone_number || !newAppForm.transaction_id) {
      alert('অনুগ্রহ করে নাম, ফোন নম্বর এবং ট্রানজেকশন আইডি দিন।');
      return;
    }

    await insertCourseApplication({
      student_name: newAppForm.student_name,
      phone_number: newAppForm.phone_number,
      course_title: newAppForm.course_title,
      payment_method: newAppForm.payment_method,
      amount: Number(newAppForm.amount || 0),
      transaction_id: newAppForm.transaction_id.toUpperCase(),
      status: 'pending',
      notes: newAppForm.notes,
    });

    setShowNewModal(false);
    showToast('নতুন এনরোলমেন্ট পেমেন্ট আবেদন যুক্ত করা হয়েছে!', 'success');
    loadApplications();

    setNewAppForm({
      student_name: '',
      phone_number: '',
      course_title: '১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ',
      payment_method: 'bKash',
      amount: 950,
      transaction_id: '',
      notes: '',
    });
  };

  // Stats Calculations
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;
  const totalRevenue = applications
    .filter((a) => a.status === 'approved')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Filter & Search Logic
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.course_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Gateway Badges Helper
  const renderGatewayBadge = (method: string) => {
    const lower = method.toLowerCase();
    if (lower.includes('bkash') || lower.includes('বিকাশ')) {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[11px] font-bold flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
          bKash
        </span>
      );
    }
    if (lower.includes('nagad') || lower.includes('নগদ')) {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Nagad
        </span>
      );
    }
    if (lower.includes('rocket') || lower.includes('রকেট')) {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Rocket
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {method}
      </span>
    );
  };

  // Status Badge Helper
  const renderStatusBadge = (status: ApplicationStatus) => {
    if (status === 'approved') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 w-fit">
          <CheckCircle className="w-3.5 h-3.5" />
          অনুমোদিত
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center gap-1.5 w-fit">
          <XCircle className="w-3.5 h-3.5" />
          বাতিলকৃত
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center gap-1.5 w-fit animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        অপেক্ষমাণ
      </span>
    );
  };

  const sqlCode = `-- Supabase SQL Setup for Course Applications (Enrollments & Payment Approvals)
CREATE TABLE IF NOT EXISTS public.course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  course_title TEXT NOT NULL,
  course_id TEXT DEFAULT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bKash',
  amount NUMERIC DEFAULT 0,
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

-- Add Public Access Policies
CREATE POLICY "Allow public select course_applications" ON public.course_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert course_applications" ON public.course_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update course_applications" ON public.course_applications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete course_applications" ON public.course_applications FOR DELETE USING (true);

-- Enable Supabase Realtime for instant payment notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_applications;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'danger'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : toastMessage.type === 'danger'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toastMessage.type === 'danger' && <XCircle className="w-5 h-5" />}
            {toastMessage.type === 'info' && <Zap className="w-5 h-5" />}
          </div>
          <div className="text-xs font-bold leading-relaxed">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                কোর্স এনরোলমেন্ট ও পেমেন্ট সেন্টার
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono border border-slate-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Supabase Realtime Sync Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              পেমেন্ট যাচাই ও কোর্স অনুমোদন
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              শিক্ষার্থীদের বিকাশ, নগদ বা রকেট ট্রানজেকশন আইডি পরীক্ষা করে কোর্স এক্সেস অনুমোদন বা
              বাতিল করার কেন্দ্রীয় এডমিন প্যানেল।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 shadow-lg"
            >
              <Code className="w-4 h-4 text-amber-400" />
              সুপাবেস SQL কোড
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              নতুন পেমেন্ট আবেদন যুক্ত করুন
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          {/* Card 1: Total Pending */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">অপেক্ষমাণ আবেদন</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30 animate-pulse">
                {pendingCount} Alert
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{pendingCount} টি</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              যাচাইয়ের অপেক্ষায় রয়েছে
            </span>
          </div>

          {/* Card 2: Total Approved */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">অনুমোদিত শিক্ষার্থী</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                Success
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{approvedCount} জন</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              কোর্স এক্সেস সক্রিয় রয়েছে
            </span>
          </div>

          {/* Card 3: Total Rejected */}
          <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 relative overflow-hidden group hover:border-rose-500/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">বাতিলকৃত আবেদন</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                Rejected
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-rose-400">{rejectedCount} টি</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              ভুল ট্রানজেকশন বা অসম্পূর্ণ
            </span>
          </div>

          {/* Card 4: Total Revenue Collected */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden group hover:border-cyan-500/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">মোট সংগৃহীত পেমেন্ট</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/30">
                Revenue
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-cyan-300">
                ৳{totalRevenue.toLocaleString('bn-BD')}
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              অনুমোদিত পেমেন্ট থেকে অর্জিত
            </span>
          </div>
        </div>
      </div>

      {/* Table Missing Alert Banner */}
      {isTableMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200">
                সুপাবেসে <code className="text-amber-300 font-mono">public.course_applications</code> টেবিল পেন্ডিং
              </h4>
              <p className="text-slate-300 mt-0.5">
                স্থায়ী রিয়েল-টাইম ডাটা সেভ করার জন্য আপনার সুপাবেস প্রজেক্টের SQL এডিটরে{' '}
                <button
                  onClick={() => setShowSqlModal(true)}
                  className="text-amber-400 underline font-bold hover:text-amber-300"
                >
                  SQL কোডটি রান করুন
                </button>। আপাতত সকল ডাটা লোকাল মেমোরিতে নিরাপদে কাজ করছে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors"
          >
            SQL দেখুন
          </button>
        </div>
      )}

      {/* 2. APPLICATIONS FILTER & SEARCH BAR */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            সকল আবেদন ({applications.length})
          </button>

          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            অপেক্ষমাণ ({pendingCount})
          </button>

          <button
            onClick={() => setSelectedStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            অনুমোদিত ({approvedCount})
          </button>

          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === 'rejected'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-800/80 text-rose-400 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            বাতিলকৃত ({rejectedCount})
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="শিক্ষার্থীর নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* 2. APPLICATIONS TABLE */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">পেমেন্ট ও এনরোলমেন্ট ডাটা লোড করা হচ্ছে...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">কোনো পেমেন্ট আবেদন পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              আপনার অনুসন্ধানের সাথে মিল রেখে কোনো আবেদন পাওয়া যায়নি বা কোনো শিক্ষার্থী আবেদন করেননি।
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              টেস্ট পেমেন্ট যুক্ত করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="p-4">তারিখ ও সময়</th>
                  <th className="p-4">শিক্ষার্থীর নাম ও মোবাইল</th>
                  <th className="p-4">আবেদনকৃত কোর্স</th>
                  <th className="p-4">পেমেন্ট মেথড</th>
                  <th className="p-4">পরিমাণ (৳)</th>
                  <th className="p-4">ট্রানজেকশন আইডি (TrxID)</th>
                  <th className="p-4 text-center">স্ট্যাটাস</th>
                  <th className="p-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredApplications.map((app) => {
                  const isCopied = copiedTrxId === app.transaction_id;
                  const formattedDate = new Date(app.created_at).toLocaleString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="p-4 text-slate-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Student Name & Phone */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 border border-slate-700">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-xs">{app.student_name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <a href={`tel:${app.phone_number}`} className="hover:underline">
                                {app.phone_number}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course Title */}
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-slate-200 line-clamp-2 flex items-start gap-1.5">
                          <GraduationCap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{app.course_title}</span>
                        </div>
                        {app.notes && (
                          <span className="text-[10px] text-slate-500 block mt-1 italic">
                            নোট: {app.notes}
                          </span>
                        )}
                      </td>

                      {/* Payment Gateway */}
                      <td className="p-4 whitespace-nowrap">{renderGatewayBadge(app.payment_method)}</td>

                      {/* Amount */}
                      <td className="p-4 whitespace-nowrap font-black text-sm text-emerald-400">
                        ৳{Number(app.amount).toLocaleString('bn-BD')}
                      </td>

                      {/* Transaction ID with One-Click Copy */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-slate-900 border border-slate-700 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider">
                            {app.transaction_id}
                          </span>
                          <button
                            onClick={() => handleCopyTrx(app.transaction_id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                            }`}
                            title="TrxID কপি করুন"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {renderStatusBadge(app.status)}
                      </td>

                      {/* 3. QUICK ACTION BUTTONS */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-all border border-emerald-500/30 flex items-center gap-1 shadow-sm active:scale-95"
                              title="অনুমোদন করুন ও কোর্স আনলক করুন"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              অনুমোদন
                            </button>
                          )}

                          {app.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(app.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-all border border-amber-500/30 flex items-center gap-1 shadow-sm active:scale-95"
                              title="বাতিল করুন"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              বাতিল
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(app.id, app.student_name)}
                            className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30"
                            title="রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* SQL SETUP MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Supabase Table & Realtime SQL Setup
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              সুপাবেসে <code className="text-amber-300 font-mono">public.course_applications</code>{' '}
              টেবিল তৈরি এবং **Supabase Realtime Subscription** সক্রিয় করার জন্য নিচের কোডটি আপনার Supabase SQL
              Editor-এ রান করুন:
            </p>

            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-64 scrollbar-thin">
                {sqlCode}
              </pre>
              <button
                onClick={copySqlToClipboard}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-lg"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSql ? 'কপি হয়েছে!' : 'কপি করুন'}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PAYMENT SIMULATOR MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  নতুন পেমেন্ট ও এনরোলমেন্ট আবেদন যুক্ত করুন
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">শিক্ষার্থীর নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাফেজ মাওলানা মাহমুদুল হাসান"
                  value={newAppForm.student_name}
                  onChange={(e) => setNewAppForm({ ...newAppForm, student_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ফোন / বিকাশ নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 01712345678"
                  value={newAppForm.phone_number}
                  onChange={(e) => setNewAppForm({ ...newAppForm, phone_number: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">কোর্সের নাম *</label>
                <select
                  value={newAppForm.course_title}
                  onChange={(e) => setNewAppForm({ ...newAppForm, course_title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ">
                    ১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ
                  </option>
                  <option value="সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স ২০২৬">
                    সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স ২০২৬
                  </option>
                  <option value="NTRCA সাধারণ বিষয় ফ্রি স্পেশাল ব্যাচ">
                    NTRCA সাধারণ বিষয় ফ্রি স্পেশাল ব্যাচ
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={newAppForm.payment_method}
                    onChange={(e) => setNewAppForm({ ...newAppForm, payment_method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                    <option value="Upay">Upay (উপায়)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    value={newAppForm.amount}
                    onChange={(e) => setNewAppForm({ ...newAppForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ট্রানজেকশন আইডি (TrxID) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: BK9X2M7P4Q"
                  value={newAppForm.transaction_id}
                  onChange={(e) => setNewAppForm({ ...newAppForm, transaction_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">অতিরিক্ত নোটস (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: পার্সোনাল বিকাশ থেকে ট্রানজেকশন করা হয়েছে"
                  value={newAppForm.notes}
                  onChange={(e) => setNewAppForm({ ...newAppForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors"
                >
                  আবেদন জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
