import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  PlusCircle,
  Award,
  LogOut,
  Database,
  Smartphone,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { StudentPreviewModal } from './StudentPreviewModal';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  onLogout?: () => void;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onLogout, userEmail }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const navLinks = [
    { path: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { path: '/admin/exams', label: 'পরীক্ষা ও মডেল টেস্ট', icon: Award },
    { path: '/admin/questions', label: 'প্রশ্নসমূহ', icon: HelpCircle },
    { path: '/admin/questions/create', label: 'নতুন প্রশ্ন তৈরি', icon: PlusCircle },
  ];

  const dbConfigured = isSupabaseConfigured();

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                MQ
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  MiniQuiz <span className="text-emerald-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 ml-1">অ্যাডমিন</span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  প্রশ্নমালা ব্যবস্থাপনা প্যানেল
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1 space-x-reverse">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600/90 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Tools & User Menu */}
          <div className="hidden md:flex items-center space-x-2 space-x-reverse">
            {/* Supabase Status Indicator */}
            <button
              onClick={() => setConfigModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                dbConfigured
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/60 animate-pulse'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{dbConfigured ? 'Supabase কানেক্টেড' : 'Supabase সেটআপ করুন'}</span>
            </button>

            {/* Student View Live Tester */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="স্টুডেন্ট অ্যাপে প্রকাশিত প্রশ্ন কীভাবে দেখায় তা পরীক্ষা করুন"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>স্টুডেন্ট প্রিভিউ</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
              title="লগআউট করুন"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setConfigModalOpen(true)}
              className="p-2 text-slate-300 bg-slate-800 rounded-lg"
            >
              <Database className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPreviewModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>স্টুডেন্ট অ্যাপ লাইভ প্রিভিউ</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/50 text-red-300 text-xs font-semibold rounded-xl border border-red-900"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          </div>
        )}
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
