import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchAllQuestions,
  deleteQuestion,
  updateQuestion,
  insertBatchQuestions,
  getDefaultSubjectPrefix,
  clearAllQuestions,
  autoAssignAndRepairQuestionTopics,
  restoreQuestion,
  getTrashQuestions,
} from '../lib/supabase';
import { Question } from '../types';
import { QuestionBankView, WorkingQuestion, AiAutoGenerateConfig } from '../types/questionBank';
import { Interface01Dashboard } from '../components/questionBank/Interface01Dashboard';
import { Interface02ManualEntry } from '../components/questionBank/Interface02ManualEntry';
import { Interface03ManualPreview } from '../components/questionBank/Interface03ManualPreview';
import { Interface04AiCopyPaste } from '../components/questionBank/Interface04AiCopyPaste';
import { Interface05AiCopyPastePreview } from '../components/questionBank/Interface05AiCopyPastePreview';
import { Interface06AiAutoGenerate } from '../components/questionBank/Interface06AiAutoGenerate';
import { Interface07AiGeneratedPreview } from '../components/questionBank/Interface07AiGeneratedPreview';
import { EditQuestionModal } from '../components/questionBank/EditQuestionModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PracticeSection } from '../components/questionBank/PracticeSection';
import { TrashRecycleBin } from '../components/questionBank/TrashRecycleBin';
import { RotateCcw, X } from 'lucide-react';
import { formatSequentialId, sanitizeExplanation } from '../lib/questionBankEngine';

export const QuestionsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Primary active interface view state
  const [currentView, setCurrentView] = useState<QuestionBankView>('dashboard');

  // Loaded questions from database
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Staged data between Step 1 and Step 2
  const [manualStagedQuestions, setManualStagedQuestions] = useState<WorkingQuestion[]>([]);
  const [manualMeta, setManualMeta] = useState<any>(null);

  const [copyPasteStagedQuestions, setCopyPasteStagedQuestions] = useState<WorkingQuestion[]>([]);
  const [copyPasteMeta, setCopyPasteMeta] = useState<any>(null);

  const [aiGenStagedQuestions, setAiGenStagedQuestions] = useState<WorkingQuestion[]>([]);
  const [aiGenConfig, setAiGenConfig] = useState<AiAutoGenerateConfig | null>(null);

  // Modal states for dashboard edit / delete
  const [editingFromDashboard, setEditingFromDashboard] = useState<WorkingQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Undo and Trash states
  const [undoItem, setUndoItem] = useState<Question | null>(null);
  const [trashCount, setTrashCount] = useState<number>(0);

  // Sync mode from search params on mount
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'manual') setCurrentView('manual_step1');
    else if (mode === 'copypaste' || mode === 'copy-paste') setCurrentView('copypaste_step1');
    else if (mode === 'autogen' || mode === 'ai-generate') setCurrentView('autogen_step1');
    else setCurrentView('dashboard');
  }, [searchParams]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { questions: data } = await fetchAllQuestions();
      setQuestions(data || []);
      const trash = getTrashQuestions();
      setTrashCount(trash.length);
    } catch (err) {
      console.warn('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Listen for background updates to the trash bin
  useEffect(() => {
    const handleTrashUpdate = () => {
      const trash = getTrashQuestions();
      setTrashCount(trash.length);
    };
    handleTrashUpdate();
    window.addEventListener('miniquiz_trash_updated', handleTrashUpdate);
    return () => {
      window.removeEventListener('miniquiz_trash_updated', handleTrashUpdate);
    };
  }, []);

  // Publish handler to batch insert into Supabase + local cache
  const handlePublishQuestions = async (
    workingList: WorkingQuestion[],
    options?: { custom_prefix?: string; custom_start_number?: number }
  ) => {
    const prefix = options?.custom_prefix || getDefaultSubjectPrefix(workingList[0]?.subject);

    const questionsToInsert = workingList.map((wq) => {
      // Find correct answer text
      const optKey = wq.correctAnswer as 'A' | 'B' | 'C' | 'D';

      return {
        id: wq.id || wq.custom_question_id,
        custom_id: wq.custom_question_id || wq.id,
        code: wq.id || wq.custom_question_id,
        question: wq.question,
        option_a: wq.options.A || '',
        option_b: wq.options.B || '',
        option_c: wq.options.C || '',
        option_d: wq.options.D || '',
        correct_answer: `option_${optKey.toLowerCase()}`,
        explanation: sanitizeExplanation(wq.explanation, wq.options) || '',
        status: wq.status || 'published',
        subject: wq.subject || 'সাধারণ',
        topic: wq.topic || '',
        sub_topic: wq.sub_topic || (wq as any).subtopic || '',
        post: wq.post || '',
      };
    });

    const res = await insertBatchQuestions(questionsToInsert, {
      custom_prefix: prefix,
      custom_start_number: options?.custom_start_number,
    });

    // Reload questions in background
    await loadQuestions();
  };

  // Delete question handler with automatic Trash move & Undo banner
  const handleConfirmDelete = async () => {
    if (!deletingQuestionId) return;
    const itemToDelete = questions.find((q) => String(q.id) === String(deletingQuestionId)) || null;
    setIsDeleting(true);
    try {
      const res = await deleteQuestion(deletingQuestionId);
      if (!res.success) {
        alert('সুপাবেজ থেকে প্রশ্ন মুছে ফেলতে সমস্যা হয়েছে: ' + (res.error || 'অজানা ত্রুটি'));
        await loadQuestions();
        return;
      }
      setQuestions((prev) => prev.filter((q) => String(q.id) !== String(deletingQuestionId)));
      setDeletingQuestionId(null);
      if (itemToDelete) {
        setUndoItem(itemToDelete);
        const trash = getTrashQuestions();
        setTrashCount(trash.length);
        // Automatically hide undo banner after 8 seconds
        setTimeout(() => {
          setUndoItem((curr) => (curr && String(curr.id) === String(itemToDelete.id) ? null : curr));
        }, 8000);
      }
      await loadQuestions();
    } catch (err: any) {
      console.error('Delete question error:', err);
      alert('প্রশ্ন মুছে ফেলতে ত্রুটি ঘটেছে: ' + (err?.message || 'অজানা ত্রুটি'));
      await loadQuestions();
    } finally {
      setIsDeleting(false);
    }
  };

  // Undo delete: restore the last deleted item immediately
  const handleUndoDelete = async () => {
    if (!undoItem) return;
    try {
      await restoreQuestion(undoItem.id);
      await loadQuestions();
      setUndoItem(null);
    } catch (err) {
      console.error('Undo delete error:', err);
    }
  };

  // Convert Question from db to WorkingQuestion for editing
  const handleEditFromDashboard = (q: Question) => {
    let optKey: 'A' | 'B' | 'C' | 'D' = 'A';
    if (q.correct_answer === 'option_b' || q.correct_answer === 'b' || q.correct_answer === 'B') optKey = 'B';
    else if (q.correct_answer === 'option_c' || q.correct_answer === 'c' || q.correct_answer === 'C') optKey = 'C';
    else if (q.correct_answer === 'option_d' || q.correct_answer === 'd' || q.correct_answer === 'D') optKey = 'D';

    const wq: WorkingQuestion = {
      tempId: `edit_${q.id}`,
      id: String(q.id),
      question: q.question,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      correctAnswer: optKey,
      explanation: sanitizeExplanation(q.explanation, { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }) || '',
      subject: q.subject || 'সাধারণ',
      topic: q.topic || '',
      post: q.post || '',
      language: 'বাংলা',
      questionType: 'MCQ (একটি সঠিক উত্তর)',
      difficulty: 'মাঝারি',
      status: q.status,
    };

    setEditingFromDashboard(wq);
  };

  const handleSaveDashboardEdit = async (updated: WorkingQuestion) => {
    if (!updated.id) return;
    const optKey = updated.correctAnswer as 'A' | 'B' | 'C' | 'D';

    await updateQuestion(updated.id, {
      question: updated.question,
      option_a: updated.options.A,
      option_b: updated.options.B,
      option_c: updated.options.C,
      option_d: updated.options.D,
      correct_answer: `option_${optKey.toLowerCase()}`,
      explanation: sanitizeExplanation(updated.explanation, updated.options) || '',
      status: updated.status,
    });

    await loadQuestions();
    setEditingFromDashboard(null);
  };

  const handleClearAllQuestions = async () => {
    if (
      window.confirm(
        'আপনি কি নিশ্চিতভাবে সব প্রশ্ন মুছে ফেলতে চান? মনে রাখবেন, সব প্রশ্ন নিরাপদভাবে রিসাইকেল বিনে জমা থাকবে এবং আপনি যেকোনো সময় রিসাইকেল বিন থেকে ফিরিয়ে আনতে (Restore) পারবেন।'
      )
    ) {
      const res = await clearAllQuestions();
      if (!res.success) {
        alert('সুপাবেজ থেকে সব প্রশ্ন মুছে ফেলতে সমস্যা হয়েছে: ' + (res.error || 'অজানা ত্রুটি'));
      }
      await loadQuestions();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top View Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 flex-wrap">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            currentView === 'dashboard'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📊 মাস্টার প্রশ্ন ব্যাংক</span>
        </button>

        <button
          onClick={() => setCurrentView('practice' as any)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            (currentView as string) === 'practice'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🎯 প্র্যাকটিস (বিষয়, টপিক ও সাব-টপিক)</span>
        </button>

        <button
          onClick={() => setCurrentView('trash')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            currentView === 'trash'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🗑️ রিসাইকেল বিন</span>
          {trashCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                currentView === 'trash'
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* 0. Practice View */}
      {(currentView as string) === 'practice' && (
        <PracticeSection
          questions={questions}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      )}

      {/* 1. Interface 01: Master Question Bank Dashboard */}
      {currentView === 'dashboard' && (
        <Interface01Dashboard
          questions={questions}
          onSelectManual={() => setCurrentView('manual_step1')}
          onSelectCopyPaste={() => setCurrentView('copypaste_step1')}
          onSelectAiGenerate={() => setCurrentView('autogen_step1')}
          onEditQuestion={handleEditFromDashboard}
          onDeleteQuestion={(id) => setDeletingQuestionId(id)}
          onRefresh={loadQuestions}
          onClearAll={handleClearAllQuestions}
          onOpenTrash={() => setCurrentView('trash')}
          trashCount={trashCount}
        />
      )}

      {/* 2. Interface 02: Manual MCQ Entry - Step 1 */}
      {currentView === 'manual_step1' && (
        <Interface02ManualEntry
          existingQuestions={questions}
          initialQuestions={manualStagedQuestions}
          onBack={() => setCurrentView('dashboard')}
          onProceedToPreview={(staged, meta) => {
            setManualStagedQuestions(staged);
            setManualMeta(meta);
            setCurrentView('manual_step2');
          }}
        />
      )}

      {/* 3. Interface 03: Manual Preview + Validation - Step 2 */}
      {currentView === 'manual_step2' && (
        <Interface03ManualPreview
          questions={manualStagedQuestions}
          existingQuestions={questions}
          meta={manualMeta}
          onBackToStep1={() => setCurrentView('manual_step1')}
          onPublish={async (finalList) => {
            await handlePublishQuestions(finalList, {
              custom_prefix: manualMeta?.prefix,
              custom_start_number: manualMeta?.nextNumber,
            });
          }}
          onGoToBank={() => setCurrentView('dashboard')}
        />
      )}

      {/* 4. Interface 04: AI Copy-Paste - Step 1 */}
      {currentView === 'copypaste_step1' && (
        <Interface04AiCopyPaste
          existingQuestions={questions}
          onBack={() => setCurrentView('dashboard')}
          onProceedToPreview={(parsed, meta) => {
            setCopyPasteStagedQuestions(parsed);
            setCopyPasteMeta(meta);
            setCurrentView('copypaste_step2');
          }}
        />
      )}

      {/* 5. Interface 05: AI Copy-Paste Preview + Duplicate - Step 2 */}
      {currentView === 'copypaste_step2' && (
        <Interface05AiCopyPastePreview
          parsedQuestions={copyPasteStagedQuestions}
          existingQuestions={questions}
          meta={copyPasteMeta}
          onBackToStep1={() => setCurrentView('copypaste_step1')}
          onPublish={async (finalList) => {
            await handlePublishQuestions(finalList, {
              custom_prefix: copyPasteMeta?.prefix,
              custom_start_number: copyPasteMeta?.nextNumber,
            });
          }}
          onGoToBank={() => setCurrentView('dashboard')}
        />
      )}

      {/* 6. Interface 06: AI Auto Generate - Step 1 */}
      {currentView === 'autogen_step1' && (
        <Interface06AiAutoGenerate
          existingQuestions={questions}
          onBack={() => setCurrentView('dashboard')}
          onProceedToPreview={(generated, config) => {
            setAiGenStagedQuestions(generated);
            setAiGenConfig(config);
            setCurrentView('autogen_step2');
          }}
        />
      )}

      {/* 7. Interface 07: AI Generated Preview + Final Publish - Step 2 */}
      {currentView === 'autogen_step2' && aiGenConfig && (
        <Interface07AiGeneratedPreview
          generatedQuestions={aiGenStagedQuestions}
          config={aiGenConfig}
          existingQuestions={questions}
          onBackToStep1={() => setCurrentView('autogen_step1')}
          onPublish={async (finalList) => {
            await handlePublishQuestions(finalList, {
              custom_prefix: aiGenConfig.prefix,
              custom_start_number: aiGenConfig.startNumber,
            });
          }}
          onGoToBank={() => setCurrentView('dashboard')}
        />
      )}

      {/* 8. Interface 08: Recycle Bin & Recovery */}
      {currentView === 'trash' && (
        <TrashRecycleBin
          onBackToDashboard={() => setCurrentView('dashboard')}
          onQuestionRestored={loadQuestions}
        />
      )}

      {/* Inline Edit Modal from Dashboard */}
      {editingFromDashboard && (
        <EditQuestionModal
          isOpen={Boolean(editingFromDashboard)}
          question={editingFromDashboard}
          onClose={() => setEditingFromDashboard(null)}
          onSave={handleSaveDashboardEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingQuestionId)}
        title="প্রশ্ন মুছে ফেলতে চান?"
        message="প্রশ্নটি মুছে ফেললে তা রিসাইকেল বিনে চলে যাবে। ভুলবশত মুছে ফেললেও আপনি যেকোনো সময় রিসাইকেল বিন থেকে এটি ফিরিয়ে আনতে (Restore) পারবেন।"
        confirmText="হ্যাঁ, রিসাইকেল বিনে পাঠান"
        cancelText="বাতিল"
        isDanger
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingQuestionId(null)}
      />

      {/* Floating Undo Toast Notification */}
      {undoItem && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c1322] border border-amber-500/60 shadow-2xl rounded-2xl p-4 flex items-center gap-3 text-xs max-w-md animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white">প্রশ্নটি রিসাইকেল বিনে পাঠানো হয়েছে</p>
            <p className="text-[11px] text-slate-400 truncate">{undoItem.question}</p>
          </div>
          <button
            onClick={handleUndoDelete}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>পূর্বাবস্থায় আনুন (Undo)</span>
          </button>
          <button
            onClick={() => setUndoItem(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
