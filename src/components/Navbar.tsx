import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Database,
  Smartphone,
  LogOut,
  CreditCard,
  Sun,
  Moon,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { StudentPreviewModal } from './StudentPreviewModal';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onLogout, userEmail }) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miniquiz_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('miniquiz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('miniquiz_theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const dbConfigured = isSupabaseConfigured();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <>
      <header className="bg-white/95 dark:bg-[#080d1a]/95 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 shadow-sm dark:shadow-lg backdrop-blur-md transition-colors duration-200">
        <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Left Controls: Sidebar Toggle + Quick Nav Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="সাইডবার মেনু টগল করুন"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to="/admin"
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-2 transition-all shrink-0"
            >
              <BarChart2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden xs:inline">ড্যাশবোর্ড</span>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Payment & Fees Pill Button */}
            <button
              onClick={() => alert('পেমেন্ট ও ফি ব্যবস্থাপনা শীঘ্রই যুক্ত হচ্ছে।')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 transition-all shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">পেমেন্ট ও ফি</span>
            </button>

            {/* Database Status Indicator Pill */}
            <button
              onClick={() => setConfigModalOpen(true)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                dbConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80'
                  : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 animate-pulse'
              }`}
              title={dbConfigured ? 'Supabase ডাটাবেস সক্রিয়' : 'Supabase সেটআপ করুন'}
            >
              <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping hidden sm:block" />
              <span className="hidden md:inline">
                {dbConfigured ? 'ডিবি কানেক্টেড' : 'ডিবি সেটআপ'}
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-500 dark:text-amber-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm flex items-center justify-center"
              title={isDarkMode ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Student View Button */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
              title="স্টুডেন্ট অ্যাপে অ্যাপের চেহারা দেখুন"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>স্টুডেন্ট প্রিভিউ</span>
            </button>

            {/* Admin Profile Circle Avatar "জে" */}
            <div
              className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-emerald-400 shadow-md shadow-emerald-500/20 cursor-pointer"
              title={userEmail || 'এডমিন ইউজার'}
            >
              জে
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-900 rounded-2xl transition-colors"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
      <StudentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />
    </>
  );
};
