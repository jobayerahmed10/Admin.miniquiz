import React from 'react';
import {
  X,
  FileEdit,
  Eye,
  Copy,
  BookOpen,
  Bookmark,
  PlusCircle,
  Calendar,
  BarChart2,
  Rocket,
  MinusCircle,
  Trash2,
} from 'lucide-react';
import { Exam } from '../../types';

interface ExamContextMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  onEdit: (exam: Exam) => void;
  onQuickEditTopic?: (exam: Exam) => void;
  onPreview: (exam: Exam) => void;
  onDuplicate: (exam: Exam) => void;
  onViewQuestions: (exam: Exam) => void;
  onAddQuestions: (exam: Exam) => void;
  onSchedule: (exam: Exam) => void;
  onAnalytics: (exam: Exam) => void;
  onTogglePublish: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export const ExamContextMenuModal: React.FC<ExamContextMenuModalProps> = ({
  isOpen,
  onClose,
  exam,
  onEdit,
  onQuickEditTopic,
  onPreview,
  onDuplicate,
  onViewQuestions,
  onAddQuestions,
  onSchedule,
  onAnalytics,
  onTogglePublish,
  onDelete,
}) => {
  if (!isOpen || !exam) return null;

  const isPublished = exam.status === 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative w-full max-w-md bg-[#0b1322] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-slideUp sm:animate-scaleUp text-slate-100 z-10">
        {/* Top Header with pill handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden mb-2" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-black text-sm text-white truncate">{exam.title}</h3>
            <p className="text-[11px] font-mono text-slate-400">ID: {exam.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Options Grid / List */}
        <div className="space-y-1 text-xs font-semibold">
          {/* 1. Edit Exam */}
          <button
            onClick={() => {
              onClose();
              onEdit(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">পরীক্ষা এডিট করুন</span>
              <span className="text-[10px] text-slate-400">শিরোনাম, সময়, নম্বর ও অপশন পরিবর্তন</span>
            </div>
          </button>

          {/* 1.5 Quick Topic Edit */}
          {onQuickEditTopic && (
            <button
              onClick={() => {
                onClose();
                onQuickEditTopic(exam);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">টপিক ও বিষয় সেট করুন</span>
                <span className="text-[10px] text-slate-400">
                  {exam.topic ? `বর্তমান টপিক: "${exam.topic}"` : 'কোনো টপিক সেট করা নেই'}
                </span>
              </div>
            </button>
          )}

          {/* 2. Preview */}
          <button
            onClick={() => {
              onClose();
              onPreview(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">প্রিভিউ দেখুন</span>
              <span className="text-[10px] text-slate-400">শিক্ষার্থী হিসেবে পরীক্ষা দিয়ে যাচাই করুন</span>
            </div>
          </button>

          {/* 3. Duplicate */}
          <button
            onClick={() => {
              onClose();
              onDuplicate(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">পরীক্ষা Duplicate করুন</span>
              <span className="text-[10px] text-slate-400">অনুরূপ আরেকটি নতুন টেস্ট তৈরি করুন</span>
            </div>
          </button>

          {/* 4. View Questions */}
          <button
            onClick={() => {
              onClose();
              onViewQuestions(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">প্রশ্ন দেখুন</span>
              <span className="text-[10px] text-slate-400">সংযুক্ত সকল প্রশ্ন তালিকা ও সঠিক উত্তর</span>
            </div>
          </button>

          {/* 5. Add Questions */}
          <button
            onClick={() => {
              onClose();
              onAddQuestions(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">প্রশ্ন যোগ করুন</span>
              <span className="text-[10px] text-slate-400">ব্যাংক বা এআই দিয়ে নতুন প্রশ্ন সংযোজন</span>
            </div>
          </button>

          {/* 6. Schedule */}
          <button
            onClick={() => {
              onClose();
              onSchedule(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Schedule করুন</span>
              <span className="text-[10px] text-slate-400">তারিখ ও সময় অনুযায়ী স্বয়ংক্রিয় প্রকাশ</span>
            </div>
          </button>

          {/* 7. Analytics */}
          <button
            onClick={() => {
              onClose();
              onAnalytics(exam);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-800/80 text-slate-200 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold">ফলাফল ও Analytics</span>
              <span className="text-[10px] text-slate-400">অংশগ্রহণকারী, গড় নম্বর ও পারফরম্যান্স</span>
            </div>
          </button>

          {/* 8. Toggle Publish / Unpublish */}
          <button
            onClick={() => {
              onClose();
              onTogglePublish(exam);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-colors ${
              isPublished
                ? 'hover:bg-amber-950/40 text-amber-300'
                : 'hover:bg-emerald-950/40 text-emerald-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPublished
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isPublished ? <MinusCircle className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="block font-bold">
                {isPublished ? '🔴 Unpublish করুন' : '🚀 Publish করুন'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isPublished ? 'ড্রাফট মোডে রাখুন (শিক্ষার্থীদের দেখানো হবে না)' : 'লাইভ ও সক্রিয় করুন'}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-800/80">
            {/* 9. Delete Exam (Danger) */}
            <button
              onClick={() => {
                onClose();
                onDelete(exam);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">🗑 পরীক্ষা মুছে ফেলুন</span>
                <span className="text-[10px] text-rose-400/80">স্থায়ীভাবে ডাটাবেজ থেকে রিমুভ করুন</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
