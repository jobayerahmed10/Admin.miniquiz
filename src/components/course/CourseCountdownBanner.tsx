import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Sparkles, Rocket } from 'lucide-react';
import { Course } from '../../types';
import { calculateCountdown, toBengaliDigits, CountdownState } from '../../lib/countdown';

interface CourseCountdownBannerProps {
  course: Course;
  compact?: boolean;
  className?: string;
}

export const CourseCountdownBanner: React.FC<CourseCountdownBannerProps> = ({
  course,
  compact = false,
  className = '',
}) => {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(course.upcoming_date)
  );

  useEffect(() => {
    if (!course.is_upcoming || !course.upcoming_date) return;

    setCountdown(calculateCountdown(course.upcoming_date));
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(course.upcoming_date));
    }, 1000);

    return () => clearInterval(timer);
  }, [course.is_upcoming, course.upcoming_date]);

  if (!course.is_upcoming) {
    return null;
  }

  const badgeText = course.upcoming_badge_text?.trim() || 'আপকামিং ব্যাচ';

  // Compact Mode (for list or minimal widgets)
  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 shadow-sm">
            <Rocket className="w-3 h-3 text-amber-400" />
            <span>{badgeText}</span>
          </span>

          {countdown.hasTarget && !countdown.isPassed && (
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>
                বাকি: {toBengaliDigits(countdown.days)} দিন {toBengaliDigits(countdown.hours)} ঘণ্টা
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-3.5 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-orange-950/30 border border-amber-500/30 shadow-lg shadow-amber-500/5 relative overflow-hidden space-y-2.5 ${className}`}
    >
      {/* Top row: Badge & Start Date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black flex items-center gap-1.5 shadow-sm">
            <Rocket className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{badgeText}</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>

        {countdown.hasTarget && (
          <div className="text-[11px] font-bold text-amber-200/90 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>শুরু: {countdown.fullBengaliDateTime || countdown.formattedBengaliDate}</span>
          </div>
        )}
      </div>

      {/* Countdown Timer Boxes */}
      {countdown.hasTarget && (
        <>
          {countdown.isPassed ? (
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>ব্যাচের ক্লাস ও কার্যক্রম শুরু হয়ে গেছে!</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>ক্লাস শুরু হতে বাকি:</span>
                </span>
                <span className="text-[10px] text-slate-400">লাইভ কাউন্টডাউন</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-1.5">
                  <span className="text-sm sm:text-base font-black text-amber-300 block font-mono">
                    {toBengaliDigits(String(countdown.days).padStart(2, '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold">দিন</span>
                </div>

                <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-1.5">
                  <span className="text-sm sm:text-base font-black text-amber-300 block font-mono">
                    {toBengaliDigits(String(countdown.hours).padStart(2, '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold">ঘণ্টা</span>
                </div>

                <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-1.5">
                  <span className="text-sm sm:text-base font-black text-amber-300 block font-mono">
                    {toBengaliDigits(String(countdown.minutes).padStart(2, '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold">মিনিট</span>
                </div>

                <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-1.5">
                  <span className="text-sm sm:text-base font-black text-orange-400 block font-mono animate-pulse">
                    {toBengaliDigits(String(countdown.seconds).padStart(2, '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold">সেকেন্ড</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Optional Note / Announcement */}
      {course.upcoming_note && (
        <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-start gap-1.5 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{course.upcoming_note}</span>
        </div>
      )}
    </div>
  );
};
