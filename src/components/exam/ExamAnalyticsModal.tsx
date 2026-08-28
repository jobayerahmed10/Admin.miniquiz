import React from 'react';
import {
  X,
  BarChart2,
  Users,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Exam } from '../../types';

interface ExamAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
}

export const ExamAnalyticsModal: React.FC<ExamAnalyticsModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  if (!isOpen || !exam) return null;

  // Mocked rich statistical data for this exam
  const participantsCount = exam.badge_type === 'live' ? 142 : 58;
  const averageScore = exam.total_marks > 0 ? (exam.total_marks * 0.74).toFixed(1) : '14.8';
  const highestScore = exam.total_marks > 0 ? (exam.total_marks * 0.95).toFixed(0) : '19';
  const passRate = '82%';

  const topStudents = [
    { rank: 1, name: 'তানভীর আহমেদ', score: highestScore, time: '12:40 মিনিট', date: 'আজ, 4:45 PM' },
    { rank: 2, name: 'সাদিয়া জাহান', score: (Number(highestScore) - 1).toString(), time: '13:10 মিনিট', date: 'আজ, 4:50 PM' },
    { rank: 3, name: 'রাকিব হাসান', score: (Number(highestScore) - 2).toString(), time: '14:05 মিনিট', date: 'আজ, 4:52 PM' },
    { rank: 4, name: 'নুসরাত পারভীন', score: (Number(highestScore) - 2.5).toString(), time: '14:20 মিনিট', date: 'আজ, 4:55 PM' },
    { rank: 5, name: 'মাহমুদুল হক', score: (Number(highestScore) - 3).toString(), time: '14:45 মিনিট', date: 'আজ, 5:00 PM' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0b1322] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 text-slate-100 animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">ফলাফল ও এনালিটিক্স</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{exam.title} ({exam.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-bold">অংশগ্রহণকারী</span>
            <span className="text-lg font-black text-white font-mono">{participantsCount} জন</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-bold">গড় নম্বর</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{averageScore}</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-bold">সর্বোচ্চ নম্বর</span>
            <span className="text-lg font-black text-amber-300 font-mono">{highestScore}</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-bold">পাস রেট</span>
            <span className="text-lg font-black text-indigo-300 font-mono">{passRate}</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300">টপ পারফর্মার লিডারবোর্ড (শীর্ষ ৫)</h4>
            <span className="text-[10px] text-slate-400">লাইভ আপডেট</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {topStudents.map((st) => (
              <div key={st.rank} className="flex items-center justify-between p-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center font-mono ${
                      st.rank === 1
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : st.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : st.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{st.rank}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 block">{st.name}</span>
                    <span className="text-[10px] text-slate-400">সময়: {st.time}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-sm font-black text-emerald-400 block">
                    {st.score} / {exam.total_marks}
                  </span>
                  <span className="text-[10px] text-slate-500">{st.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              alert('সকল ফলাফল এক্সেল (CSV) ফরম্যাটে ডাউনলোড হচ্ছে...');
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
