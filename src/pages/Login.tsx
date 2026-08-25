import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Phone,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  registerStudentAccount,
  loginStudentAccount,
  getCurrentStudentSession,
} from '../lib/studentAuth';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Tabs: 'login' (লগইন) or 'register' (নতুন অ্যাকাউন্ট তৈরি)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [userType, setUserType] = useState<'student' | 'admin'>('student');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const navigate = useNavigate();

  // Handle Form Submit (Instant Registration / Login without OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = phoneOrEmail.trim();

    if (!cleanInput) {
      setErrorMsg('মোবাইল নম্বর অথবা ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }

    if (!password) {
      setErrorMsg('পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('উভয় পাসওয়ার্ড মিলছে না! আবার চেক করুন।');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('অনুগ্রহ করে শর্তাবলী ও গোপনীয়তা নীতিতে সম্মতি প্রদান করুন।');
        return;
      }
    }

    setLoading(true);

    try {
      if (userType === 'admin') {
        // Admin Login via Supabase / local auth
        const client = getSupabaseClient();
        if (client && cleanInput.includes('@')) {
          const { data, error } = await client.auth.signInWithPassword({
            email: cleanInput,
            password: password,
          });
          if (!error && data.session) {
            onLoginSuccess(data.session);
            navigate('/admin');
            return;
          }
        }

        // Demo Admin Session Fallback
        const adminSession = {
          user: { email: cleanInput || 'admin@tamrin.academy', id: 'admin-main' },
          access_token: 'admin-token-live',
        };
        onLoginSuccess(adminSession);
        navigate('/admin');
        return;
      }

      // Student Auth Mode
      if (authMode === 'register') {
        const res = await registerStudentAccount({
          fullName: fullName.trim(),
          phoneOrEmail: cleanInput,
          password: password,
        });

        if (res.success && res.student) {
          setSuccessMsg(`🎉 স্বাগতম ${res.student.name}! আপনার আইডি: ${res.student.student_id_code}`);
          const studentSession = {
            user: {
              id: res.student.id,
              email: res.student.email,
              phone: res.student.phone,
              name: res.student.name,
              student_id_code: res.student.student_id_code,
              role: 'student',
            },
            student: res.student,
          };

          setTimeout(() => {
            onLoginSuccess(studentSession);
            navigate('/app');
          }, 800);
        } else {
          setErrorMsg(res.error || 'অ্যাকাউন্ট তৈরিতে ত্রুটি হয়েছে।');
        }
      } else {
        // Student Login
        const res = await loginStudentAccount(cleanInput, password);
        if (res.success && res.student) {
          setSuccessMsg(`স্বাগতম ${res.student.name}!`);
          const studentSession = {
            user: {
              id: res.student.id,
              email: res.student.email,
              phone: res.student.phone,
              name: res.student.name,
              student_id_code: res.student.student_id_code,
              role: 'student',
            },
            student: res.student,
          };

          setTimeout(() => {
            onLoginSuccess(studentSession);
            navigate('/app');
          }, 600);
        } else {
          setErrorMsg(res.error || 'লগইন সম্ভব হয়নি। আবার চেষ্টা করুন।');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access as Student
  const handleQuickStudentAccess = () => {
    const demoStudent = registerStudentAccount({
      fullName: 'মো: জোবায়ের আহমেদ',
      phoneOrEmail: '01645244715',
    });
    demoStudent.then((res) => {
      if (res.student) {
        onLoginSuccess({ user: { ...res.student, role: 'student' }, student: res.student });
        navigate('/app');
      }
    });
  };

  // Quick Admin Access
  const handleQuickAdminAccess = () => {
    onLoginSuccess({
      user: { email: 'admin@tamrin.academy', id: 'admin-super' },
      access_token: 'admin-token',
    });
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#0b1323] to-[#070b14] text-slate-100 flex flex-col justify-between items-center px-4 py-6 sm:py-10 relative overflow-x-hidden select-none">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Banner */}
      <div className="w-full max-w-md mx-auto text-center pt-2 pb-4 relative z-10">
        {/* Logo Badge */}
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-950/60 mb-3 border border-emerald-400/30 ring-4 ring-emerald-500/10">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          আত-তামরীন একাডেমি
        </h1>
        <p className="text-xs sm:text-sm text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" /> প্রস্তুতি হোক আরও স্মার্ট
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Toggle Student / Admin (Subtle Top Tabs) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন অ্যাকাউন্ট</span>
            </button>
          </div>
        </div>

        {/* Section Heading */}
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {authMode === 'register' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'অ্যাকাউন্টে লগইন করুন'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authMode === 'register'
              ? 'সঠিক তথ্য দিয়ে এক ক্লিকে অ্যাকাউন্ট তৈরি সম্পন্ন করুন'
              : 'আপনার মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিন'}
          </p>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Register Only) */}
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                পূর্ণ নাম <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: মো: জোবায়ের আহমেদ"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Mobile Number or Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                মোবাইল নম্বর <span className="text-emerald-600">*</span>
              </label>
              <span className="text-[11px] font-bold text-slate-400">অথবা ইমেইল</span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="017XXXXXXXX বা student@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
              পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register Only) */}
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                পাসওয়ার্ড নিশ্চিত করুন <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2.5"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Terms checkbox (Register Only) */}
          {authMode === 'register' && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-tight cursor-pointer"
              >
                আমি আত-তামরীন একাডেমির{' '}
                <span className="text-emerald-600 dark:text-emerald-400 underline">শর্তাবলী</span> ও{' '}
                <span className="text-emerald-600 dark:text-emerald-400 underline">গোপনীয়তা নীতি</span> মেনে নিচ্ছি।
              </label>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-3"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : authMode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>অ্যাকাউন্ট তৈরি করুন</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Shortcuts for instant testing */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleQuickStudentAccess}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> ১-ক্লিক ডেমো শিক্ষার্থী মোড
            </button>

            <button
              type="button"
              onClick={handleQuickAdminAccess}
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> অ্যাডমিন সিএমএস প্রবেশ
            </button>
          </div>
        </div>
      </div>

      {/* Clean minimal footer - No bottom navigation buttons! */}
      <div className="w-full max-w-md mx-auto text-center pt-6 pb-2 text-[11px] text-slate-500 font-medium">
        &copy; {new Date().getFullYear()} আত-তামরীন একাডেমি &bull; সর্বস্বত্ব সংরক্ষিত
      </div>

      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  );
};
