import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Plus,
  CheckCircle2,
  HelpCircle,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { Exam, Question } from '../../types';
import { fetchQuestionsByExamId } from '../../lib/supabase';
import { QuestionDetailModal } from './QuestionDetailModal';

interface ExamQuestionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  onAddMoreQuestions: (exam: Exam) => void;
}

export const ExamQuestionsListModal: React.FC<ExamQuestionsListModalProps> = ({
  isOpen,
  onClose,
  exam,
  onAddMoreQuestions,
}) => {
  const [selectedQuestionForDetail, setSelectedQuestionForDetail] = useState<Question | null>(null);
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && exam) {
      if (exam.questions && exam.questions.length > 0) {
        setFetchedQuestions(exam.questions);
      } else {
        setLoading(true);
        fetchQuestionsByExamId(exam.id).then((res) => {
          if (res.questions && res.questions.length > 0) {
            setFetchedQuestions(res.questions);
          } else {
            setFetchedQuestions([]);
          }
          setLoading(false);
        });
      }
    }
  }, [isOpen, exam]);

  if (!isOpen || !exam) return null;

  const displayQuestions = fetchedQuestions.length > 0 ? fetchedQuestions : (exam.questions || []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-2xl bg-[#0b1322] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-scaleUp max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">সংযুক্ত প্রশ্ন তালিকা</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">
                  {exam.title} ({displayQuestions.length} / {exam.question_count || displayQuestions.length} টি প্রশ্ন)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Questions list */}
          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <p className="text-xs font-semibold">প্রশ্ন সমুহ লোড করা হচ্ছে...</p>
              </div>
            ) : displayQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <p className="text-sm font-bold text-slate-300">এখনো কোনো প্রশ্ন যুক্ত করা হয়নি।</p>
                <p className="text-xs text-slate-500">নিচের "আরও প্রশ্ন যোগ করুন" বাটন থেকে প্রশ্ন যুক্ত করতে পারেন।</p>
              </div>
            ) : (
              displayQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {q.question}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                          ID: {q.id}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedQuestionForDetail(q)}
                      className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 rounded-lg shrink-0"
                      title="ডিটেইলস দেখুন"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Option grid preview */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div
                      className={`p-2 rounded-xl border ${
                        q.correct_answer === 'option_a' || q.correct_answer === 'a'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      ক. {q.option_a}
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        q.correct_answer === 'option_b' || q.correct_answer === 'b'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      খ. {q.option_b}
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        q.correct_answer === 'option_c' || q.correct_answer === 'c'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      গ. {q.option_c}
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        q.correct_answer === 'option_d' || q.correct_answer === 'd'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      ঘ. {q.option_d}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                onClose();
                onAddMoreQuestions(exam);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>আরও প্রশ্ন যোগ করুন</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>

      {/* Question Details Inspector */}
      {selectedQuestionForDetail && (
        <QuestionDetailModal
          question={selectedQuestionForDetail}
          onClose={() => setSelectedQuestionForDetail(null)}
        />
      )}
    </>
  );
};
