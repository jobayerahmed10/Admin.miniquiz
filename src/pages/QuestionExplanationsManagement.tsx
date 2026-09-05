import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchQuestionExplanations,
  updateQuestionExplanationStatus,
  deleteQuestionExplanation,
} from '../lib/supabase';
import { QuestionExplanation, ExplanationStatus } from '../types';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  Edit3,
  Trash2,
  Copy,
  Database,
  Sparkles,
  BookOpen,
  User,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export const QuestionExplanationsManagement: React.FC = () => {
  const [explanations, setExplanations] = useState<QuestionExplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const navigate = useNavigate();

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExplanations = async () => {
    setLoading(true);
    const { explanations: data, error, isTableMissing: missing } = await fetchQuestionExplanations();
    if (missing) {
      setIsTableMissing(true);
    } else {
      setIsTableMissing(false);
    }

    if (error && !missing) {
      showToast('ব্যাখ্যা তালিকা লোড করতে সমস্যা হয়েছে: ' + error, 'error');
    }
    setExplanations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadExplanations();
  }, []);

  const handleApprove = async (item: QuestionExplanation) => {
    const textToApprove = editingId === item.id ? editingText : item.explanation;
    if (!textToApprove.trim()) {
      showToast('ব্যাখ্যার বিবরণ ফাঁকা রাখা যাবে না', 'error');
      return;
    }

    const { success, error } = await updateQuestionExplanationStatus(
      item.id,
      item.question_id,
      'approved',
      textToApprove
    );

    if (success) {
      showToast('ব্যাখ্যাটি সফলভাবে অনুমোদিত এবং প্রশ্ন ব্যাংকে সেভ করা হয়েছে!', 'success');
      setEditingId(null);
      loadExplanations();
    } else {
      showToast('অনুমোদন করতে ব্যর্থ: ' + (error || 'Unknown error'), 'error');
    }
  };

  const handleReject = async (item: QuestionExplanation) => {
    const { success, error } = await updateQuestionExplanationStatus(
      item.id,
      item.question_id,
      'rejected'
    );

    if (success) {
      showToast('ব্যাখ্যাটি বাতিল (Reject) করা হয়েছে', 'success');
      loadExplanations();
    } else {
      showToast('বাতিল করতে সমস্যা হয়েছে: ' + (error || ''), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যাখ্যার আবেদনটি মুছে ফেলতে চান?')) return;

    const { success, error } = await deleteQuestionExplanation(id);
    if (success) {
      showToast('আবেদনটি মুছে ফেলা হয়েছে', 'success');
      loadExplanations();
    } else {
      showToast('মুছতে সমস্যা হয়েছে: ' + (error || ''), 'error');
    }
  };

  const startEdit = (item: QuestionExplanation) => {
    setEditingId(item.id);
    setEditingText(item.explanation);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const filteredExplanations = explanations.filter((exp) => {
    const expStatus = exp.status || 'pending';
    const matchesFilter = filter === 'all' ? true : expStatus === filter;

    const sLower = searchTerm.toLowerCase();
    const qText = (exp.question?.question || '').toLowerCase();
    const expText = (exp.explanation || '').toLowerCase();
    const submitter = (exp.submitted_by || '').toLowerCase();

    const matchesSearch =
      qText.includes(sLower) || expText.includes(sLower) || submitter.includes(sLower);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = explanations.filter((e) => e.status === 'pending').length;
  const approvedCount = explanations.filter((e) => e.status === 'approved').length;
  const rejectedCount = explanations.filter((e) => e.status === 'rejected').length;

  const sqlSetupScript = `-- Supabase SQL Editor এ নিচের কমান্ডটি এক্সিকিউট করে question_explanations টেবিল তৈরি করুন:

CREATE TABLE IF NOT EXISTS public.question_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id TEXT NOT NULL,
    explanation TEXT NOT NULL,
    submitted_by TEXT DEFAULT 'Student',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ডিজেবল অথবা সবার জন্য পারমিশন অন করুন:
ALTER TABLE public.question_explanations DISABLE ROW LEVEL SECURITY;
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    showToast('SQL কোড ক্লিপবোর্ডে কপি হয়েছে!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : 'bg-rose-950 text-rose-200 border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>প্রশ্ন ব্যাখ্যা অনুমোদন ও পরিচালনা</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            শিক্ষার্থীদের সাবমিট করা ব্যাখ্যাসকল রিভিউ করে চেক, এডিট, অনুমোদন বা রিজেক্ট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>SQL টেবিল সেটআপ</span>
          </button>

          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3.5 py-2 rounded-xl border border-amber-500/20 text-xs font-bold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{pendingCount}টি পেন্ডিং ব্যাখ্যা</span>
          </div>
        </div>
      </div>

      {/* Table missing alert banner if applicable */}
      {isTableMissing && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">সুপাবেজে question_explanations টেবিলটি বিদ্যমান নেই!</p>
              <p className="text-slate-300">
                সুপাবেজে নতুন সাবমিশন সেভ করার জন্য SQL কুয়েরি রান করে টেবিল তৈরি করে নিন।
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all shrink-0"
          >
            SQL কোড দেখুন
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'all'
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">মোট ব্যাখ্যা</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{explanations.length}</p>
        </div>

        <div
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">পেন্ডিং (রিভিউ বাকি)</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">অনুমোদিত (Approved)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</p>
        </div>

        <div
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'rejected'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">বাতিলকৃত (Rejected)</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
        {/* Search and Filters Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="প্রশ্ন বা ব্যাখ্যার অংশ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'pending', label: `পেন্ডিং (${pendingCount})` },
              { key: 'approved', label: `অনুমোদিত (${approvedCount})` },
              { key: 'rejected', label: `বাতিল (${rejectedCount})` },
              { key: 'all', label: `সব (${explanations.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === tab.key
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">ব্যাখ্যাসমূহ লোড করা হচ্ছে...</p>
          </div>
        ) : filteredExplanations.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-slate-300">কোনো ব্যাখ্যা পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500">
              {filter !== 'all' ? 'অন্যান্য ফিল্টার নির্বাচন করে চেষ্টা করুন' : 'শিক্ষার্থীরা প্রশ্ন ব্যাখ্যা সাবমিট করলে এখানে দেখাবে।'}
            </p>
          </div>
        ) : (
          /* Explanations List */
          <div className="space-y-4">
            {filteredExplanations.map((item) => {
              const q = item.question;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    item.status === 'pending'
                      ? 'bg-amber-950/10 dark:bg-slate-800/40 border-amber-500/30 hover:border-amber-500/50'
                      : item.status === 'approved'
                      ? 'bg-emerald-950/10 dark:bg-slate-800/40 border-emerald-500/30'
                      : 'bg-slate-900/40 border-slate-800 opacity-80'
                  }`}
                >
                  {/* Top Bar: Submitter & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold text-slate-200">{item.submitted_by || 'শিক্ষার্থী'}</span>
                      <span>&bull;</span>
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'সম্প্রতি'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          পেন্ডিং (অনুমোদন বাকি)
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          অনুমোদিত (প্রশ্ন ব্যাংকে সেভড)
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          বাতিলকৃত
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Reference Details */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>মূল প্রশ্ন</span>
                        {q?.subject && <span className="text-slate-400">&bull; {q.subject}</span>}
                        {q?.topic && <span className="text-slate-400">&bull; {q.topic}</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Q-ID: {item.question_id}</span>
                    </div>

                    <p className="text-slate-200 font-bold text-sm leading-snug">
                      {q?.question || 'প্রশ্ন লোড করা সম্ভব হয়নি'}
                    </p>

                    {/* Question Options if available */}
                    {q && (q.option_a || q.option_b) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        {q.option_a && (
                          <div
                            className={`p-2 rounded-lg border ${
                              q.correct_answer === 'option_a' || q.correct_answer === 'a' || q.correct_answer === q.option_a
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-bold">ক.</span> {q.option_a}
                          </div>
                        )}
                        {q.option_b && (
                          <div
                            className={`p-2 rounded-lg border ${
                              q.correct_answer === 'option_b' || q.correct_answer === 'b' || q.correct_answer === q.option_b
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-bold">খ.</span> {q.option_b}
                          </div>
                        )}
                        {q.option_c && (
                          <div
                            className={`p-2 rounded-lg border ${
                              q.correct_answer === 'option_c' || q.correct_answer === 'c' || q.correct_answer === q.option_c
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-bold">গ.</span> {q.option_c}
                          </div>
                        )}
                        {q.option_d && (
                          <div
                            className={`p-2 rounded-lg border ${
                              q.correct_answer === 'option_d' || q.correct_answer === 'd' || q.correct_answer === q.option_d
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-bold">ঘ.</span> {q.option_d}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current Question Bank Explanation if present */}
                    {q?.explanation && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <span className="font-bold text-amber-400">বর্তমানে থাকা ব্যাখ্যা:</span> {q.explanation}
                      </div>
                    )}
                  </div>

                  {/* Proposed Explanation Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-cyan-400 flex items-center justify-between">
                      <span>শিক্ষার্থীর প্রস্তাবিত নতুন ব্যাখ্যা:</span>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-normal"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>সম্পাদনা (Edit)</span>
                        </button>
                      )}
                    </label>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-3 bg-slate-950 border border-cyan-500/50 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          placeholder="ব্যাখ্যার বিবরণ এডিট করুন..."
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                          >
                            বাতিল
                          </button>
                          <button
                            onClick={() => handleApprove(item)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>এডিট শেষে এপ্রুভ করুন</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {item.explanation}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      {item.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4" />
                          <span>এপ্রুভ করুন (Approve)</span>
                        </button>
                      )}

                      {item.status !== 'rejected' && (
                        <button
                          onClick={() => handleReject(item)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>রিজেক্ট করুন (Reject)</span>
                        </button>
                      )}

                      <button
                        onClick={() => startEdit(item)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>এডিট</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-all"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Database className="w-5 h-5" />
                <span>Supabase Table SQL Script (question_explanations)</span>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              সুপাবেজের <strong>SQL Editor</strong> এ গিয়ে নিচের কোডটি পেস্ট করে <strong>Run</strong> বাটনে
              ক্লিক করুন। এর মাধ্যমে <code>question_explanations</code> টেবিল প্রস্তুত হয়ে যাবে।
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed select-all">
              {sqlSetupScript}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={copySql}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>SQL কপি করুন</span>
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
