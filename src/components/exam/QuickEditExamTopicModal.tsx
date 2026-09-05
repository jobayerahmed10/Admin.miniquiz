import React, { useState, useEffect } from 'react';
import { X, Bookmark, BookOpen, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Exam, DEFAULT_TOPICS } from '../../types';
import { getAllSubjects } from '../../lib/subjectManager';
import { updateExam } from '../../lib/supabase';

interface QuickEditExamTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  onSuccess: (updatedExam: Exam) => void;
}

export const QuickEditExamTopicModal: React.FC<QuickEditExamTopicModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSuccess,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exam) {
      setTopic(exam.topic || '');
      setSubject(exam.subject || 'বাংলা');
      setError(null);
    }
  }, [exam]);

  if (!isOpen || !exam) return null;

  // Gather suggested topics based on questions attached to this exam or default topics
  const questionTopics = Array.from(
    new Set(
      (exam.questions || [])
        .map((q) => (q.topic || '').trim())
        .filter(Boolean)
    )
  );

  const allSuggestedTopics = Array.from(
    new Set([...questionTopics, ...DEFAULT_TOPICS])
  );

  const handleAutoFillFromQuestions = () => {
    if (questionTopics.length > 0) {
      setTopic(questionTopics[0]);
    } else {
      setError('এই পরীক্ষার প্রশ্নের মধ্যে কোনো টপিক পাওয়া যায়নি। নিচে থেকে লিখে দিন বা সিলেক্ট করুন।');
    }
  };

  const handleSave = async () => {
    const cleanTopic = topic.replace(/\s+/g, ' ').trim();
    if (!cleanTopic) {
      setError('অনুগ্রহ করে টপিকের নাম লিখুন।');
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await updateExam(exam.id, {
      topic: cleanTopic,
      subject: subject.trim() || exam.subject,
    });

    setIsSaving(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setError(res.error || 'টপিক সেভ করতে ব্যর্থ হয়েছে।');
    }
  };

  const availableSubjects = getAllSubjects();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0b1322] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-slideUp sm:animate-scaleUp text-slate-100 z-10">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">পরীক্ষার টপিক সেট করুন</h3>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {exam.title} (ID: {exam.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>বিষয় (Subject)</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-sans"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                <span>টপিক (Topic)</span>
                <span className="text-rose-400">*</span>
              </label>

              {questionTopics.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFillFromQuestions}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>প্রশ্ন থেকে নিন ({questionTopics[0]})</span>
                </button>
              )}
            </div>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="যেমন: কারক ও বিভক্তি, সমাস, প্রাচীন যুগ..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-sans"
              autoFocus
            />
          </div>

          {/* Suggested Topics Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2">
              পরামর্শকৃত টপিকসমূহ (ক্লিক করুন):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {allSuggestedTopics.map((top) => (
                <button
                  key={top}
                  type="button"
                  onClick={() => setTopic(top)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    topic === top
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {top}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !topic.trim()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            {isSaving ? (
              <span>সংরক্ষণ হচ্ছে...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>টপিক সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
