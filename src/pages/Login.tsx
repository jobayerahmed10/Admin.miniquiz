import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, ShieldCheck, AlertCircle, Database, Sparkles, LogIn } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, updateSupabaseCredentials } from '../lib/supabase';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('ইমেইল এবং পাসওয়ার্ড দুটিই পূরণ করুন।');
      return;
    }

    setLoading(true);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('সুপাবেস কনফিগার করা নেই! অনুগ্রহ করে প্রথমে Supabase URL এবং Anon Key সেটআপ করুন।');
      setLoading(false);
      return;
    }

    try {
      // Add a 10s timeout wrapper for slow mobile networks
      const loginPromise = client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 10000)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        // Bengali error formatting for common error codes
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('ভুল ইমেইল অথবা পাসওয়ার্ড! আবার চেষ্টা করুন।');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('আপনার ইমেইল ভেরিফাই করা হয়নি। অনুগ্রহ করে ইমেইল ইনবক্স চেক করুন।');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setErrorMsg('মোবাইল ডেটা বা ইন্টারনেট কানেকশনে সমস্যা হচ্ছে। অনুগ্রহ করে সংযোগ চেক করুন অথবা নিচে "ডেমো অ্যাডমিন মোড" ব্যবহার করুন।');
        } else {
          setErrorMsg(`লগইন ব্যর্থ হয়েছে: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (data?.session) {
        onLoginSuccess(data.session);
        navigate('/admin');
      } else {
        setErrorMsg('লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে।');
      }
    } catch (err: any) {
      if (err?.message === 'NETWORK_TIMEOUT' || err?.message?.includes('Failed to fetch')) {
        setErrorMsg('মোবাইল ডেটা ধীরগতির কারণে টাইমআউট হয়েছে। আবার চেষ্টা করুন অথবা নিচে "ডেমো অ্যাডমিন মোড" ব্যবহার করে সরাসরি পরিচালনা করুন।');
      } else {
        setErrorMsg(err?.message || 'লগইন করতে অজানা কোন সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access Mode if testing locally without strict auth requirement
  const handleQuickDemoSession = () => {
    const demoSession = {
      user: { email: email || 'admin@miniquiz.com', id: 'admin-demo-123' },
      access_token: 'demo-token',
    };
    onLoginSuccess(demoSession);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-xl shadow-emerald-950 mb-4">
            MQ
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MiniQuiz অ্যাডমিন লগইন</h1>
          <p className="text-xs text-slate-400 mt-2">
            প্রশ্নমালা তৈরি ও ওয়েবসাইট পরিচালনার জন্যSupabase দিয়ে সাইন ইন করুন
          </p>
        </div>

        {/* Database Status Notice */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Supabase কনফিগার করা হয়নি</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                আপনার <code>NEXT_PUBLIC_SUPABASE_URL</code> এবং <code>ANON_KEY</code> প্রয়োজন।
              </p>
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                className="mt-2 text-xs font-semibold text-amber-400 underline flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5" /> সংযোগ কনফিগার করুন
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ইমেইল অ্যাড্রেস
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@miniquiz.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                যাচাই করা হচ্ছে...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                লগইন করুন
              </>
            )}
          </button>
        </form>

        {/* Footer info & options */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => setConfigModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" /> Supabase সেটিংস
            </button>
            <button
              onClick={handleQuickDemoSession}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> ডেমো অ্যাডমিন মোড
            </button>
          </div>
        </div>
      </div>

      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  );
};
