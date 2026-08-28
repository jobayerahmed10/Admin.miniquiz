import React from 'react';

interface CircularProgressIndicatorProps {
  current: number;
  total: number;
  type?: 'progress' | 'live' | 'scheduled';
  remainingText?: string;
  timeRemaining?: string;
  scheduledDays?: string;
}

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  current,
  total,
  type = 'progress',
  remainingText,
  timeRemaining = '15:32',
  scheduledDays = '05',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isComplete = percentage >= 100;

  // SVG parameters
  const size = 76;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (type === 'live') {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center w-[78px] h-[78px] rounded-full bg-slate-900/90 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          {/* Animated pulsing red ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-rose-500"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[9px] text-slate-400 font-medium">শেষ হবে</span>
            <span className="text-xs font-mono font-black text-rose-400 mt-0.5 tracking-tight">
              {timeRemaining}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">বাকি</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'scheduled') {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-[78px] h-[78px] rounded-full bg-slate-900/90 border border-cyan-500/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] leading-tight p-1">
          <span className="text-[9px] text-slate-400">পরীক্ষা শুরু হবে</span>
          <span className="text-sm font-black text-cyan-400 font-mono tracking-tight my-0.5">
            {scheduledDays}
          </span>
          <span className="text-[9px] text-slate-400">দিন পর</span>
        </div>
      </div>
    );
  }

  // Progress type (Complete or Incomplete)
  const strokeColor = isComplete ? '#10b981' : '#f59e0b';
  const glowColor = isComplete ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className="relative flex items-center justify-center w-[78px] h-[78px] rounded-full bg-slate-900/90 border border-slate-800"
        style={{ boxShadow: `0 0 15px ${glowColor}` }}
      >
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800/80"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[11px] font-mono font-bold text-slate-200">
            {current} / {total}
          </span>
          <span
            className="text-[10px] font-black mt-1"
            style={{ color: strokeColor }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Completion status text */}
      <div className="mt-1.5 text-center">
        {isComplete ? (
          <span className="text-[11px] font-bold text-emerald-400 inline-flex items-center gap-1">
            <span>✓</span> সব প্রশ্ন সম্পূর্ণ
          </span>
        ) : (
          <span className="text-[11px] font-bold text-amber-400">
            {remainingText || `${total - current}টি প্রশ্ন বাকি`}
          </span>
        )}
      </div>
    </div>
  );
};
