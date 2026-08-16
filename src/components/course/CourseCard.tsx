import React from 'react';
import {
  Users,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  Award,
  Calendar,
  BookOpen,
  Sparkles,
  ExternalLink,
  Info,
  Eye,
} from 'lucide-react';
import { Course, COURSE_THEMES } from '../../types';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onEditCourse: (course: Course) => void;
  onEditCourseTab?: (course: Course, tab: 'basic' | 'details' | 'routine' | 'syllabus' | 'buttons') => void;
  onDeleteCourse: (courseId: string, title: string) => void;
  onToggleStatus: (course: Course) => void;
  onManageExams: (course: Course) => void;
  onManageSheets: (course: Course) => void;
  onViewDetails?: (course: Course, tab?: 'details' | 'routine' | 'syllabus' | 'exams' | 'sheets') => void;
  onSyncCourse?: (course: Course) => void;
  isSyncing?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEditCourse,
  onEditCourseTab,
  onDeleteCourse,
  onToggleStatus,
  onManageExams,
  onManageSheets,
  onViewDetails,
  onSyncCourse,
  isSyncing = false,
}) => {
  const themeObj =
    COURSE_THEMES.find((t) => t.id === course.theme_color) || COURSE_THEMES[0];

  const handleOpenTab = (tab: 'basic' | 'details' | 'routine' | 'syllabus' | 'buttons') => {
    if (onEditCourseTab) {
      onEditCourseTab(course, tab);
    } else {
      onEditCourse(course);
    }
  };

  return (
    <div
      className={`bg-[#0a111e] border ${themeObj.border} rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/5 group relative overflow-hidden`}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 ${themeObj.bg} rounded-full blur-3xl pointer-events-none opacity-50`}
      />

      {/* Card Top Section */}
      <div>
        {/* Category, Sync Status & Status Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700/80 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              {course.category}
            </span>

            {/* Supabase Live Sync Indicator */}
            {course.is_synced_to_supabase !== false ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>সুপাবেজে লাইভ</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span>লোকাল মেমোরি (সিঙ্ক করুন)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {course.is_synced_to_supabase === false && onSyncCourse && (
              <button
                type="button"
                onClick={() => onSyncCourse(course)}
                disabled={isSyncing}
                className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/20"
                title="সুপাবেজ ডাটাবেসে আপলোড করুন"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>সুপাবেজে সিঙ্ক</span>
              </button>
            )}

            <button
              onClick={() => onToggleStatus(course)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                course.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
              title="পাবলিশ স্ট্যাটাস পরিবর্তন করুন"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  course.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {course.status === 'published' ? 'পাবলিশড' : 'ড্রাফট'}
            </button>
          </div>
        </div>

        {/* Main Title & Badge */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${themeObj.badgeBg}`}
            >
              {course.badge}
            </span>
            {course.badge_subtitle && (
              <span className="text-[11px] text-slate-400 font-medium">
                &bull; {course.badge_subtitle}
              </span>
            )}
          </div>

          <h3 className="text-base font-extrabold text-white leading-snug tracking-tight group-hover:text-emerald-300 transition-colors">
            {course.title}
          </h3>

          <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            ইন্সট্রাক্টর: <span className="text-slate-200">{course.instructor_name}</span>
          </p>
        </div>

        {/* Price & Enrolled count pill */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">কোর্স ফি</span>
            <span className={`text-base font-black ${themeObj.text}`}>{course.price}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">নথিভুক্ত শিক্ষার্থী</span>
            <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {course.enrolled_count} জন
            </span>
          </div>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 block">ক্লাস</span>
            <span className="text-xs font-bold text-white">{course.total_classes} টি</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 block">পিডিএফ শিট</span>
            <span className="text-xs font-bold text-white">{course.total_sheets} টি</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 block">মডেল টেস্ট</span>
            <span className="text-xs font-bold text-white">{course.total_exams} টি</span>
          </div>
        </div>

        {/* Course Features */}
        {course.features && course.features.length > 0 && (
          <div className="space-y-1.5 mb-4 bg-slate-950/40 rounded-2xl p-3 border border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              কোর্স বৈশিষ্ট্যসমূহ:
            </span>
            {course.features.slice(0, 3).map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Button Content Status Indicators */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
          <button
            type="button"
            onClick={() => handleOpenTab('details')}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>১. বিস্তারিত বাটন</span>
              </span>
              <Edit className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 group-hover/btn:text-emerald-300 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.about_text || course.description ? '✓ বিবরণ যুক্ত (এডিট)' : 'খালি (ক্লিক করে লিখুন)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTab('routine')}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>২. রুটিন বাটন</span>
              </span>
              <Edit className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 group-hover/btn:text-amber-300 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.routine_pdf_url ? '✓ PDF যুক্ত (এডিট)' : course.routine_text ? '✓ টেক্সট যুক্ত' : 'খালি (ক্লিক করে যুক্ত)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTab('syllabus')}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-indigo-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>৩. সিলেবাস বাটন</span>
              </span>
              <Edit className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 group-hover/btn:text-indigo-300 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.syllabus_pdf_url ? '✓ PDF যুক্ত (এডিট)' : course.syllabus_text ? '✓ টেক্সট যুক্ত' : 'খালি (ক্লিক করে যুক্ত)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTab('buttons')}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-all cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-teal-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>৪. বাটন লিংক</span>
              </span>
              <Edit className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 group-hover/btn:text-teal-300 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.enroll_button_text || 'ভর্তি বাটন এডিট'}
            </span>
          </button>
        </div>
      </div>

      {/* Card Bottom Actions */}
      <div className="space-y-2 pt-3 border-t border-slate-800/80">
        {/* Quick Direct Button Row */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenTab('details')}
            className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
          >
            <Info className="w-3 h-3 text-emerald-400" />
            <span>বিস্তারিত</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTab('routine')}
            className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>রুটিন</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTab('syllabus')}
            className="py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>সিলেবাস</span>
          </button>
        </div>

        {/* Full View / Enter Inside Button */}
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(course, 'details')}
            className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700/80"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>ভিতরে প্রবেশ &bull; প্রিভিউ ও লাইভ স্টুডেন্ট ভিউ</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onManageExams(course)}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-500/30"
          >
            <Award className="w-3.5 h-3.5" />
            মডেল টেস্ট ({course.total_exams})
          </button>

          <button
            onClick={() => onManageSheets(course)}
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-indigo-500/30"
          >
            <FileText className="w-3.5 h-3.5" />
            পিডিএফ শিট ({course.total_sheets})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCourse(course)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Edit className="w-3.5 h-3.5" />
            বাটন ও কোর্স এডিট করুন
          </button>

          <button
            onClick={() => onDeleteCourse(course.id, course.title)}
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
            title="কোর্স মুছুন"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
