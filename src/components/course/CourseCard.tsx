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

interface CourseCardProps {
  course: Course;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string, title: string) => void;
  onToggleStatus: (course: Course) => void;
  onManageExams: (course: Course) => void;
  onManageSheets: (course: Course) => void;
  onViewDetails?: (course: Course, tab?: 'details' | 'routine' | 'syllabus' | 'exams' | 'sheets') => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEditCourse,
  onDeleteCourse,
  onToggleStatus,
  onManageExams,
  onManageSheets,
  onViewDetails,
}) => {
  const themeObj =
    COURSE_THEMES.find((t) => t.id === course.theme_color) || COURSE_THEMES[0];

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
        {/* Category & Status Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700/80 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            {course.category}
          </span>

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
        <div className="grid grid-cols-2 gap-2 mb-5 text-[11px]">
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(course, 'details')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                <span>বিস্তারিত কন্টেন্ট</span>
              </span>
              <Eye className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.about_text ? '✓ টেক্সট যুক্ত আছে' : 'টেক্সট খালি (ক্লিক)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(course, 'routine')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>রুটিন কন্টেন্ট</span>
              </span>
              <Eye className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.routine_pdf_url ? '✓ PDF যুক্ত' : course.routine_text ? '✓ টেক্সট যুক্ত' : 'খালি (ক্লিক)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(course, 'syllabus')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group/btn"
          >
            <div className="flex items-center justify-between text-indigo-400 font-bold mb-0.5">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                <span>সিলেবাস কন্টেন্ট</span>
              </span>
              <Eye className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.syllabus_pdf_url ? '✓ PDF যুক্ত' : course.syllabus_text ? '✓ টেক্সট যুক্ত' : 'খালি (ক্লিক)'}
            </span>
          </button>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <div className="flex items-center gap-1.5 text-teal-400 font-bold mb-0.5">
              <ExternalLink className="w-3 h-3" />
              <span>ভর্তি বাটন</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {course.enroll_button_text || 'ভর্তি হন'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Bottom Actions */}
      <div className="space-y-2 pt-3 border-t border-slate-800/80">
        {/* Full View / Enter Inside Button */}
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(course, 'details')}
            className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700/80"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>ভিতরে প্রবেশ &bull; বিস্তারিত, রুটিন ও পরীক্ষা প্রিভিউ</span>
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
