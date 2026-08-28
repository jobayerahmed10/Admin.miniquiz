import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  Send,
} from 'lucide-react';
import { Exam } from '../../types';

interface ExamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  onSaveSchedule: (examId: string, startDate: string, startTime: string) => void;
}

export const ExamScheduleModal: React.FC<ExamScheduleModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSaveSchedule,
}) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !exam) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSaveSchedule(exam.id, startDate, startTime);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0b1322] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">পরীক্ষা শিডিউল করুন</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{exam.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-950/30 border border-blue-500/25 rounded-2xl text-blue-300 space-y-1">
            <span className="font-bold block">💡 শিডিউল নির্দেশিকা:</span>
            <p className="text-[11px] text-slate-300">
              নির্ধারিত তারিখ ও সময়ে পরীক্ষাটি স্বয়ংক্রিয়ভাবে শিক্ষার্থীদের জন্য ওপেন হয়ে যাবে।
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">শুরুর তারিখ (Start Date)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">শুরুর সময় (Start Time)</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              {isSubmitting ? 'সেভ হচ্ছে...' : '✓ শিডিউল নিশ্চিত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
