import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Zap,
} from 'lucide-react';
import { Exam, Question } from '../../types';
import { fetchQuestionsByExamId, fetchAllQuestions } from '../../lib/supabase';

interface LiveExamStudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
}

export const LiveExamStudentPreviewModal: React.FC<LiveExamStudentPreviewModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && exam) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setShowExplanation(false);

      if (exam.questions && exam.questions.length > 0) {
        setFetchedQuestions(exam.questions as Question[]);
      } else {
        setLoading(true);
        fetchQuestionsByExamId(exam.id).then(async (res) => {
          if (res.questions && res.questions.length > 0) {
            setFetchedQuestions(res.questions as Question[]);
          } else {
            const allQ = await fetchAllQuestions();
            const matched = allQ.questions.filter(
              (q) => String(q.exam_id) === String(exam.id) || q.subject === exam.subject
            );
            if (matched.length > 0) {
              setFetchedQuestions(matched);
            } else {
              setFetchedQuestions([
                {
                  id: '1',
                  question: 'নমুনা প্রশ্ন ১: এই পরীক্ষার সঠিক উত্তর কোনটি?',
                  option_a: 'অপশন ক (নমুনা)',
                  option_b: 'অপশন খ (সঠিক উত্তর)',
                  option_c: 'অপশন গ (নমুনা)',
                  option_d: 'অপশন ঘ (নমুনা)',
                  correct_answer: 'option_b',
                  explanation: 'ব্যাখ্যা: এটি একটি সঠিক বিকল্প।',
                  status: 'published',
                },
              ]);
            }
          }
          setLoading(false);
        });
      }
    }
  }, [isOpen, exam]);

  if (!isOpen || !exam) return null;

  const questions: Question[] = fetchedQuestions.length > 0 
    ? fetchedQuestions 
    : (exam.questions && exam.questions.length > 0 ? (exam.questions as Question[]) : [
        {
          id: '1',
          question: 'নমুনা প্রশ্ন ১: এই পরীক্ষার সঠিক উত্তর কোনটি?',
          option_a: 'অপশন ক (নমুনা)',
          option_b: 'অপশন খ (সঠিক উত্তর)',
          option_c: 'অপশন গ (নমুনা)',
          option_d: 'অপশন ঘ (নমুনা)',
          correct_answer: 'option_b',
          explanation: 'ব্যাখ্যা: এটি একটি সঠিক বিকল্প।',
          status: 'published',
        },
      ]);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (key: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    let wrong = 0;
    questions.forEach((q, idx) => {
      const ans = selectedAnswers[idx];
      if (ans && typeof ans === 'string') {
        const cleanAns = ans.replace('option_', '').toLowerCase();
        const correctAns = (q.correct_answer || '').toLowerCase();
        const isCorrect =
          q.correct_answer === ans ||
          correctAns === cleanAns;
        if (isCorrect) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });
    const marksPerQ = exam.marks_per_question || 1;
    const negMarks = exam.negative_marks || 0.25;
    const finalScore = Math.max(0, correct * marksPerQ - wrong * negMarks);
    return {
      correct,
      wrong,
      unanswered: questions.length - (correct + wrong),
      finalScore: Number(finalScore.toFixed(2)),
    };
  };

  const scoreStats = calculateScore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0b1322] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  শিক্ষার্থী প্রিভিউ মোড
                </span>
                <span className="text-[11px] text-slate-400">ID: {exam.id}</span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-0.5">{exam.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{exam.time_minutes}:00 মিনিট</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Progress bar and counter */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>
              প্রশ্ন {currentIndex + 1} / {questions.length}
            </span>
            <span>
              উত্তর দেওয়া হয়েছে: {Object.keys(selectedAnswers).length} টি
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Box */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center font-mono">
                {currentIndex + 1}
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-2">
              {(
                [
                  { key: 'option_a', text: currentQ.option_a, label: 'ক' },
                  { key: 'option_b', text: currentQ.option_b, label: 'খ' },
                  { key: 'option_c', text: currentQ.option_c, label: 'গ' },
                  { key: 'option_d', text: currentQ.option_d, label: 'ঘ' },
                ] as const
              ).map(({ key, text, label }) => {
                if (!text) return null;
                const isSelected = selectedAnswers[currentIndex] === key;
                const isCorrect =
                  currentQ.correct_answer === key ||
                  currentQ.correct_answer?.toLowerCase() === label.toLowerCase() ||
                  currentQ.correct_answer?.toLowerCase() === key.replace('option_', '').toLowerCase();

                let style =
                  'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700';

                if (isSubmitted) {
                  if (isCorrect) {
                    style = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-bold';
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-rose-950/60 border-rose-500/80 text-rose-300 font-bold';
                  }
                } else if (isSelected) {
                  style = 'bg-indigo-950/70 border-indigo-500 text-indigo-200 font-bold shadow-md';
                }

                return (
                  <div
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${style}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center font-mono ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-xs sm:text-sm flex-1">{text}</span>
                    {isSubmitted && isCorrect && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation when submitted */}
            {isSubmitted && currentQ.explanation && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 leading-relaxed">
                <span className="font-bold block mb-1">ব্যাখ্যা:</span>
                {currentQ.explanation}
              </div>
            )}
          </div>

          {/* Results Summary Box (if submitted) */}
          {isSubmitted && (
            <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>পরীক্ষার ফলাফল সারসংক্ষেপ</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">সঠিক উত্তর</span>
                  <span className="text-emerald-400 font-bold text-sm">{scoreStats.correct} টি</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">ভুল উত্তর</span>
                  <span className="text-rose-400 font-bold text-sm">{scoreStats.wrong} টি</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">উত্তর দেননি</span>
                  <span className="text-slate-400 font-bold text-sm">{scoreStats.unanswered} টি</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="text-slate-400 block text-[10px]">অর্জিত নম্বর</span>
                  <span className="text-emerald-300 font-bold text-sm">{scoreStats.finalScore} / {exam.total_marks}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> পূর্ববর্তী
          </button>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <button
                onClick={() => setIsSubmitted(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              >
                সাবমিট ও রেজাল্ট দেখুন
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedAnswers({});
                  setCurrentIndex(0);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> পুনরায় পরীক্ষা দিন
              </button>
            )}

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              পরবর্তী <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
