import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  GraduationCap,
  CreditCard,
  Database,
  Sparkles,
  PenTool,
  BookOpen,
  Users,
  X,
  Flame,
  ChevronLeft,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiModal: () => void;
  questionsCount?: number;
  examsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenAiModal,
  questionsCount = 0,
  examsCount = 0,
}) => {
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      path: '/admin',
      title: 'ড্যাশবোর্ড ও ওভারভিউ',
      subTitle: 'DASHBOARD',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'exams',
      path: '/admin/exams',
      title: 'ফ্রি পরীক্ষা ও মডেল টেস্ট',
      subTitle: 'MODEL TESTS',
      icon: Award,
      badge: examsCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'subject-posts',
      path: '/admin/subject-posts',
      title: 'বিষয়ভিত্তিক পদ ও সিলেবাস ব্যবস্থাপনা',
      subTitle: 'SUBJECT POSTS & TOPICS',
      icon: Layers,
      badge: 'মাস্টার',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold',
    },
    {
      id: 'courses',
      path: '/admin/courses',
      title: 'কোর্স ও লাইভ ব্যাচ',
      subTitle: 'COURSES & BATCHES',
      icon: GraduationCap,
      badge: 'লাইভ',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'enrollments',
      path: '/admin/enrollments',
      title: 'পেমেন্ট ও এনরোলমেন্ট অনুমোদন',
      subTitle: 'PAYMENT & ENROLLMENTS',
      icon: CreditCard,
      badge: 'অনুমোদন',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold',
    },
    {
      id: 'questions',
      path: '/admin/questions',
      title: 'মাস্টার প্রশ্ন ব্যাংক',
      subTitle: 'QUESTION BANK',
      icon: Database,
      badge: questionsCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'ai-hub',
      path: 'action:ai-hub',
      title: 'এআই প্রশ্ন তৈরি হাব',
      subTitle: 'AI QUESTION HUB',
      icon: Sparkles,
      badge: 'AI 3.6',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold',
      isAi: true,
    },
    {
      id: 'cq-exams',
      path: '#',
      title: 'সিকিউ ও লিখিত পরীক্ষা',
      subTitle: 'WRITTEN & CQ EXAMS',
      icon: PenTool,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'users',
      path: '/admin/students',
      title: 'নিবন্ধিত শিক্ষার্থী তালিকা',
      subTitle: 'STUDENTS & ID LIST',
      icon: Users,
      badge: 'নতুন',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
  ];


  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#0a111e] text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out shadow-sm dark:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-emerald-500/20">
              ত
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                তামরীন একাডেমি
              </h2>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
                NTRCA Cadre Admin CMS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="মেনু বন্ধ করুন"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Special Banner / Pill */}
        <div className="px-3.5 pt-3.5 pb-1">
          <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50 dark:from-emerald-950/80 dark:via-slate-900 dark:to-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5 shadow-sm">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-snug">
                ১৮তম NTRCA ক্যাডার স্পেশাল
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                প্রভাষক ও সহকারী শিক্ষক (আরবি)
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path !== '#' &&
              item.path !== 'action:ai-hub' &&
              location.pathname === item.path;

            const handleClick = (e: React.MouseEvent) => {
              if (item.isAi || item.path === 'action:ai-hub') {
                e.preventDefault();
                onOpenAiModal();
                if (window.innerWidth < 1024) {
                  onClose();
                }
              } else if (item.path === '#') {
                e.preventDefault();
                alert(`"${item.title}" মডিউলটি শিগগিরই যুক্ত হচ্ছে।`);
              } else {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }
            };

            return (
              <Link
                key={item.id}
                to={item.path === 'action:ai-hub' ? '#' : item.path}
                onClick={handleClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-slate-950'
                        : item.isAi
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                    }`}
                  />
                  <div className="truncate">
                    <span
                      className={`block font-bold text-xs truncate ${
                        isActive ? 'text-slate-950' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`block text-[9px] font-semibold tracking-wider uppercase -mt-0.5 ${
                        isActive ? 'text-emerald-950/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.subTitle}
                    </span>
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ml-2 ${
                      isActive
                        ? 'bg-slate-950 text-emerald-400'
                        : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer & Student App Link */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#070c16] space-y-2">
          <Link
            to="/app"
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 dark:from-emerald-600/20 dark:to-teal-500/20 dark:hover:from-emerald-600/30 dark:hover:to-teal-500/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী অ্যাপে যান (Student App)</span>
          </Link>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-1">
            <span className="font-semibold">v2.5 Full-Stack</span>
            <span className="text-emerald-600 dark:text-emerald-400/80 font-mono font-medium">Supabase Auth</span>
          </div>
        </div>
      </aside>
    </>
  );
};
