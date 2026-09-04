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
      await autoAssignAndRepairQuestionTopics();
      const { questions: data } = await fetchAllQuestions();
      setQuestions(data || []);
    } catch (err) {
      console.warn('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Publish handler to batch insert into Supabase + local cache
  const handlePublishQuestions = async (
    workingList: WorkingQuestion[],
    options?: { custom_prefix?: string; custom_start_number?: number }
  ) => {
    const prefix = options?.custom_prefix || getDefaultSubjectPrefix(workingList[0]?.subject);

    const questionsToInsert = workingList.map((wq, idx) => {
      // Find correct answer text
      const optKey = wq.correctAnswer as 'A' | 'B' | 'C' | 'D';
      const ansText = wq.options[optKey] || `option_${optKey.toLowerCase()}`;

      return {
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

  // Delete question handler
  const handleConfirmDelete = async () => {
    if (!deletingQuestionId) return;
    setIsDeleting(true);
    try {
      await deleteQuestion(deletingQuestionId);
      setQuestions((prev) => prev.filter((q) => String(q.id) !== String(deletingQuestionId)));
      setDeletingQuestionId(null);
    } catch (err) {
      console.error('Delete question error:', err);
    } finally {
      setIsDeleting(false);
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
    if (window.confirm('আপনি কি নিশ্চিতভাবে সব প্রশ্ন মুছে ফেলতে চান?')) {
      await clearAllQuestions();
      setQuestions([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
        message="এই প্রশ্নটি মুছে ফেললে তা ডাটাবেস ও সকল সংশ্লিষ্ট মডেল টেস্ট থেকে স্থায়ীভাবে অপসারিত হবে।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        isDanger
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingQuestionId(null)}
      />
    </div>
  );
};
