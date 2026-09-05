import React from 'react';
import {
  Zap,
  Edit3,
  Target,
  Radio,
  Clock,
  Wifi,
  WifiOff,
  MoreVertical,
  Eye,
  FileEdit,
  BarChart2,
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MinusCircle,
  HelpCircle,
  BookOpen,
  Bookmark,
} from 'lucide-react';
import { Exam, ExamBadgeType } from '../../types';
import { CircularProgressIndicator } from './CircularProgressIndicator';

interface ExamCardProps {
  exam: Exam;
  onPreview: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onOpenMenu: (exam: Exam) => void;
  onQuickEditTopic?: (exam: Exam) => void;
  onResults?: (exam: Exam) => void;
  onManageLive?: (exam: Exam) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onPreview,
  onEdit,
  onOpenMenu,
  onQuickEditTopic,
  onResults,
  onManageLive,
}) => {
  // Determine actual attached questions count
  const realCount = (exam.questions && exam.questions.length > 0)
    ? exam.questions.length
    : (exam.question_ids && exam.question_ids.length > 0)
    ? exam.question_ids.length
    : exam.question_count || 0;
  const attachedCount = realCount;
  const targetCount = exam.question_count || 5;

  // Determine badge styling & icon
  const renderBadge = () => {
    switch (exam.badge_type) {
      case 'free':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{exam.badge || 'ফ্রি পরীক্ষা'}</span>
          </span>
        );
      case 'daily':
        if (exam.status === 'draft') {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/30">
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>{exam.badge || 'ড্রাফট'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-bold text-xs border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5 text-indigo-300" />
            <span>{exam.badge || 'দৈনিক মডেল টেস্ট'}</span>
          </span>
        );
      case 'weekly':
        if (exam.status === 'upcoming' || exam.badge?.toLowerCase().includes('schedule')) {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-bold text-xs border border-cyan-500/30">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{exam.badge || 'শিডিউলড'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold text-xs border border-purple-500/30">
            <Target className="w-3.5 h-3.5 text-purple-300" />
            <span>{exam.badge || 'মডেল টেস্ট'}</span>
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 font-bold text-xs border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>{exam.badge || 'লাইভ পরীক্ষা'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
            {exam.badge || 'মডেল টেস্ট'}
          </span>
        );
    }
  };

  // Determine status badge
  const renderStatus = () => {
    if (exam.badge_type === 'live') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
          লাইভ
        </span>
      );
    }
    if (exam.status === 'upcoming' || exam.badge?.toLowerCase().includes('schedule')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold">
          শিডিউলড
        </span>
      );
    }
    if (exam.status === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
          ড্রাফট
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
        প্রকাশিত
      </span>
    );
  };

  // Determine Online / Offline
  const isOnline = exam.status === 'active' || exam.badge_type === 'live';

  // Format date display
  const formatDateDisplay = () => {
    if (exam.id === 'EX-BANGLA-001') return 'আজ, 4:32 PM';
    if (exam.id === 'EX-ENG-002') return 'গতকাল, 10:15 PM';
    if (exam.id === 'EX-GK-003') return '২০ মে, ২০২৪';
    if (exam.id === 'EX-MATH-004') return '১৯ মে, ২০২৪';
    if (exam.id === 'EX-MOCK-01') return '২৬ মে, ২০২৪ • সকাল 10:00';

    if (exam.created_at) {
      try {
        const d = new Date(exam.created_at);
        return d.toLocaleDateString('bn-BD', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch (e) {
        return 'আজ';
      }
    }
    return 'আজ';
  };

  const isLive = exam.badge_type === 'live';
  const isScheduled = exam.status === 'upcoming' || exam.badge?.toLowerCase().includes('schedule');

  return (
    <div className="bg-[#09111e]/90 hover:bg-[#0c1626] border border-slate-800/90 hover:border-slate-700/90 rounded-3xl p-4 sm:p-5 text-slate-100 shadow-xl transition-all duration-200 relative overflow-hidden backdrop-blur-md">
      {/* Top Bar: Badge Left, Status & Online & Menu Right */}
      <div className="flex items-center justify-between gap-2">
        <div>{renderBadge()}</div>

        <div className="flex items-center gap-1.5">
          {renderStatus()}

          {/* Online / Offline badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              isOnline
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/40'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-slate-400" />
                <span>Offline</span>
              </>
            )}
          </span>

          {/* Three-dot context menu */}
          <button
            onClick={() => onOpenMenu(exam)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="আরও অপশন"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Section: Title, Description, Chips on Left | Circular Gauge on Right */}
      <div className="mt-3.5 flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Left Column: Title & Description & Metadata */}
        <div className="flex-1 space-y-2 min-w-0">
          <h3
            onClick={() => onEdit(exam)}
            className="text-base sm:text-lg font-black text-white leading-tight cursor-pointer hover:text-emerald-400 transition-colors"
          >
            {exam.title}
          </h3>

          {exam.description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {exam.description}
            </p>
          )}

          {/* Metadata Chips Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[11px]">
            {/* Exam ID */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>ID: {exam.id}</span>
            </div>

            {/* Subject */}
            {exam.subject && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-sans font-bold">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{exam.subject}</span>
              </div>
            )}

            {/* Topic */}
            {exam.topic ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onQuickEditTopic) onQuickEditTopic(exam);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-sans font-bold hover:bg-cyan-900/60 hover:border-cyan-400/50 transition-all cursor-pointer group"
                title="টপিক পরিবর্তন করতে ক্লিক করুন"
              >
                <Bookmark className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{exam.topic}</span>
              </button>
            ) : onQuickEditTopic ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickEditTopic(exam);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-sans font-bold hover:bg-amber-900/60 hover:border-amber-400 transition-all cursor-pointer animate-pulse"
                title="এই পরীক্ষায় টপিক যোগ করুন"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>+ টপিক সেট করুন</span>
              </button>
            ) : null}

            {/* Question count */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{exam.question_count} প্রশ্ন</span>
            </div>

            {/* Time */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{exam.time_minutes} মিনিট</span>
            </div>

            {/* Total marks */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-rose-300">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>{exam.total_marks} নম্বর</span>
            </div>

            {/* Negative mark */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-rose-400">
              <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>-{exam.negative_marks}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Circular Progress / Countdown Indicator */}
        <div className="shrink-0 self-center sm:self-start pt-1">
          <CircularProgressIndicator
            current={attachedCount}
            total={targetCount}
            type={isLive ? 'live' : isScheduled ? 'scheduled' : 'progress'}
            remainingText={
              attachedCount < targetCount
                ? `${targetCount - attachedCount} টি প্রশ্ন বাকি`
                : undefined
            }
            timeRemaining="15:32"
            scheduledDays="05"
          />
        </div>
      </div>

      {/* Bottom Row: Exam ID & Date (Left) | Action Buttons (Right) */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Exam ID and Date */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="text-slate-300">Exam ID: {exam.id}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 font-sans">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDateDisplay()}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isLive ? (
            <>
              <button
                onClick={() => onResults?.(exam)}
                className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 text-emerald-300 border border-emerald-800/50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ফলাফল</span>
              </button>

              <button
                onClick={() => onManageLive?.(exam)}
                className="px-3.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 active:scale-95 text-blue-300 border border-blue-800/50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>ম্যানেজ</span>
              </button>
            </>
          ) : (
            <>
              {/* Preview Button (Subtle Purple) */}
              <button
                onClick={() => onPreview(exam)}
                className="px-3.5 py-1.5 bg-purple-950/30 hover:bg-purple-900/50 active:scale-95 text-purple-300 border border-purple-800/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>প্রিভিউ</span>
              </button>

              {/* Edit Button (Subtle Blue/Cyan) */}
              <button
                onClick={() => onEdit(exam)}
                className="px-3.5 py-1.5 bg-blue-950/30 hover:bg-blue-900/50 active:scale-95 text-blue-300 border border-blue-800/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileEdit className="w-3.5 h-3.5 text-blue-400" />
                <span>এডিট</span>
              </button>
            </>
          )}

          {/* More options button */}
          <button
            onClick={() => onOpenMenu(exam)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors"
            title="মেনু"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
