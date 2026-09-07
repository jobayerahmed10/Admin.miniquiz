import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Trash2,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Database,
  Clock,
  ShieldCheck,
  FileQuestion,
  RefreshCw,
} from 'lucide-react';
import { TrashQuestion, Question } from '../../types';
import {
  getTrashQuestions,
  restoreQuestion,
  restoreAllTrashQuestions,
  restoreBatchQuestions,
  permanentlyDeleteQuestion,
  emptyTrash,
  getQuestionsBackup,
  restoreFromSafetyBackup,
} from '../../lib/supabase';
import { getQuestionBankDirectionality } from '../../lib/questionBankEngine';

interface TrashRecycleBinProps {
  onBackToDashboard: () => void;
  onQuestionRestored?: () => void;
}

export const TrashRecycleBin: React.FC<TrashRecycleBinProps> = ({
  onBackToDashboard,
  onQuestionRestored,
}) => {
  const [trashItems, setTrashItems] = useState<TrashQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Safety Backup info
  const [backupInfo, setBackupInfo] = useState<{ questions: Question[]; timestamp: string; count: number } | null>(null);

  const loadTrash = () => {
    const items = getTrashQuestions();
    setTrashItems(items);
    const backup = getQuestionsBackup();
    setBackupInfo(backup);
  };

  useEffect(() => {
    loadTrash();

    const handleTrashUpdate = () => {
      loadTrash();
    };

    window.addEventListener('miniquiz_trash_updated', handleTrashUpdate);
    return () => {
      window.removeEventListener('miniquiz_trash_updated', handleTrashUpdate);
    };
  }, []);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Subjects for filter
  const subjects = useMemo(() => {
    const subs = new Set<string>();
    trashItems.forEach((q) => {
      if (q.subject && q.subject.trim()) {
        subs.add(q.subject.trim());
      }
    });
    return Array.from(subs);
  }, [trashItems]);

  // Filtered Trash Items
  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      if (selectedSubject !== 'all' && (item.subject || '').trim() !== selectedSubject) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = (item.question || '').toLowerCase().includes(query);
        const matchesSubject = (item.subject || '').toLowerCase().includes(query);
        const matchesTopic = (item.topic || '').toLowerCase().includes(query);
        const matchesId = String(item.id).toLowerCase().includes(query);
        const matchesCode = (item.question_code || '').toLowerCase().includes(query);
        return matchesText || matchesSubject || matchesTopic || matchesId || matchesCode;
      }

      return true;
    });
  }, [trashItems, selectedSubject, searchQuery]);

  // Handle Restore Single Question
  const handleRestoreSingle = async (id: string | number) => {
    setIsRestoring(true);
    try {
      const res = await restoreQuestion(id);
      if (res.success) {
        showNotification('success', 'প্রশ্নটি সফলভাবে মূল প্রশ্ন ব্যাংকে ফিরিয়ে আনা হয়েছে!');
        loadTrash();
        if (onQuestionRestored) onQuestionRestored();
      } else {
        showNotification('error', res.error || 'প্রশ্ন পুনরুদ্ধার ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showNotification('error', 'প্রশ্ন পুনরুদ্ধার করতে সমস্যা হয়েছে।');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Restore Selected Questions
  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsRestoring(true);
    try {
      const res = await restoreBatchQuestions(selectedIds);
      if (res.success) {
        showNotification('success', `${res.count} টি প্রশ্ন সফলভাবে পুনরুদ্ধার করা হয়েছে!`);
        setSelectedIds([]);
        loadTrash();
        if (onQuestionRestored) onQuestionRestored();
      } else {
        showNotification('error', res.error || 'পুনরুদ্ধার ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      showNotification('error', 'পুনরুদ্ধার করতে সমস্যা হয়েছে।');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Restore All Trash Questions
  const handleRestoreAll = async () => {
    if (trashItems.length === 0) return;
    if (!window.confirm(`আপনি কি রিসাইকেল বিনে থাকা সব (${trashItems.length} টি) প্রশ্ন পুনরুদ্ধার করতে চান?`)) {
      return;
    }
    setIsRestoring(true);
    try {
      const res = await restoreAllTrashQuestions();
      if (res.success) {
        showNotification('success', `সকল (${res.count} টি) প্রশ্ন সফলভাবে পুনরুদ্ধার করা হয়েছে!`);
        setSelectedIds([]);
        loadTrash();
        if (onQuestionRestored) onQuestionRestored();
      } else {
        showNotification('error', res.error || 'পুনরুদ্ধার ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      showNotification('error', 'সব প্রশ্ন পুনরুদ্ধার করতে সমস্যা হয়েছে।');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Restore from Safety Backup
  const handleRestoreBackup = async () => {
    if (!backupInfo || backupInfo.count === 0) return;
    if (
      !window.confirm(
        `স্বয়ংক্রিয় সেফটি ব্যাকআপে থাকা ${backupInfo.count} টি প্রশ্ন কি পুনরুদ্ধার করতে চান? কোনো প্রশ্ন পূর্বে মুছে গিয়ে থাকলে তা যুক্ত হবে।`
      )
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreFromSafetyBackup();
      if (res.success) {
        showNotification('success', `স্বয়ংক্রিয় ব্যাকআপ থেকে ${res.count} টি প্রশ্ন পুনরুদ্ধার সম্পন্ন হয়েছে!`);
        loadTrash();
        if (onQuestionRestored) onQuestionRestored();
      } else {
        showNotification('error', res.error || 'ব্যাকআপ পুনরুদ্ধার সম্ভব হয়নি।');
      }
    } catch (err) {
      showNotification('error', 'ব্যাকআপ পুনরুদ্ধার করতে সমস্যা হয়েছে।');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Permanent Delete Single Question
  const handlePermanentDelete = (id: string | number) => {
    if (!window.confirm('আপনি কি এই প্রশ্নটি চিরতরে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব হবে না।')) {
      return;
    }
    permanentlyDeleteQuestion(id);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    loadTrash();
    showNotification('info', 'প্রশ্নটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
  };

  // Handle Empty Entire Trash
  const handleEmptyTrash = () => {
    if (trashItems.length === 0) return;
    if (
      !window.confirm(
        'সতর্কতা: আপনি কি নিশ্চিতভাবে রিসাইকেল বিন সম্পূর্ণ খালি করতে চান? এর ফলে মুছে ফেলা সকল প্রশ্ন চিরতরে মুছে যাবে।'
      )
    ) {
      return;
    }
    emptyTrash();
    setSelectedIds([]);
    loadTrash();
    showNotification('info', 'রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে।');
  };

  // Toggle selection
  const handleToggleSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (filteredItems.every((item) => selectedIds.includes(item.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
              : notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {notification.type === 'info' && <ShieldCheck className="w-4 h-4 text-indigo-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToDashboard}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="প্রশ্ন ব্যাংকে ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span>🗑️ রিসাইকেল বিন ও পুনরুদ্ধার কেন্দ্র</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  {trashItems.length} টি
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl pl-10">
              ভুলে বা অসাবধানতাবশত মুছে ফেলা যেকোনো প্রশ্ন এখানে সুরক্ষিত থাকে। আপনি যেকোনো সময় এক ক্লিকে মূল প্রশ্ন ব্যাংকে ফিরিয়ে নিতে পারেন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {trashItems.length > 0 && (
              <button
                onClick={handleRestoreAll}
                disabled={isRestoring}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>সবগুলো ফিরিয়ে আনুন</span>
              </button>
            )}

            {trashItems.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                disabled={isRestoring}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>ট্র্যাশ খালি করুন</span>
              </button>
            )}

            <button
              onClick={loadTrash}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Safety Backup Card (if available) */}
      {backupInfo && backupInfo.count > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-[#0b1322] border border-indigo-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white">স্বয়ংক্রিয় ক্লাউড ও লোকাল সেফটি স্ন্যাপশট</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  {backupInfo.count} টি প্রশ্ন
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                সর্বশেষ সেফটি স্ন্যাপশট সংরক্ষিত হয়েছে:{' '}
                <span className="text-slate-300 font-mono">
                  {new Date(backupInfo.timestamp).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleRestoreBackup}
            disabled={isRestoring}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>স্ন্যাপশট থেকে মিসিং প্রশ্ন রিকভার করুন</span>
          </button>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      {trashItems.length > 0 && (
        <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মুছে ফেলা প্রশ্ন, বিষয় বা আইডি দিয়ে খুঁজুন..."
              className="w-full bg-[#050914] border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[#050914] border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
          >
            <option value="all">সকল বিষয় ({trashItems.length})</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Select all toggle */}
          <button
            onClick={handleSelectAllFiltered}
            className="px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors shrink-0"
          >
            {filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id))
              ? 'সব আনসিলেক্ট'
              : 'সব সিলেক্ট'}
          </button>
        </div>
      )}

      {/* Selected Items Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0c1222] border border-emerald-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-4 text-xs animate-in slide-in-from-bottom-5">
          <span className="font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{selectedIds.length} টি প্রশ্ন নির্বাচিত</span>
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={handleRestoreSelected}
            disabled={isRestoring}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>নির্বাচিত প্রশ্নগুলো ফিরিয়ে আনুন</span>
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] transition-colors"
          >
            বাতিল
          </button>
        </div>
      )}

      {/* Trash Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((q) => {
            const isSelected = selectedIds.includes(q.id);
            const dirInfo = getQuestionBankDirectionality({
              question: q.question,
              options: [q.option_a, q.option_b, q.option_c, q.option_d],
              explanation: q.explanation,
            });
            const qDir = dirInfo.questionDir;

            return (
              <div
                key={String(q.id)}
                className={`bg-[#0b1322] border rounded-3xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-emerald-500/70 bg-emerald-950/10 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(q.id)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-[#050914] cursor-pointer"
                  />

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        #{q.id}
                      </span>
                      {q.subject && (
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg">
                          {q.subject}
                        </span>
                      )}
                      {q.topic && (
                        <span className="text-[10px] font-medium text-cyan-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {q.topic}
                        </span>
                      )}
                      {q.sub_topic && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          {q.sub_topic}
                        </span>
                      )}
                      {q.deleted_at && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800/80 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            মুছে ফেলা হয়েছে:{' '}
                            {new Date(q.deleted_at).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-sm font-bold text-white leading-relaxed ${
                        qDir === 'rtl' ? 'font-amiri text-base text-right' : 'text-left'
                      }`}
                      dir={qDir}
                    >
                      {q.question}
                    </p>

                    {/* Options Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { key: 'option_a', label: 'ক', text: q.option_a },
                        { key: 'option_b', label: 'খ', text: q.option_b },
                        { key: 'option_c', label: 'গ', text: q.option_c },
                        { key: 'option_d', label: 'ঘ', text: q.option_d },
                      ].map((opt) => {
                        const isCorrect =
                          q.correct_answer === opt.key ||
                          q.correct_answer === opt.label ||
                          (q.correct_answer && q.correct_answer.toLowerCase() === opt.key.replace('option_', ''));

                        return (
                          <div
                            key={opt.key}
                            className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-[#050914] border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="truncate">{opt.text || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
                  <button
                    onClick={() => handleRestoreSingle(q.id)}
                    disabled={isRestoring}
                    className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="এই প্রশ্নটি মূল প্রশ্ন ব্যাংকে ফিরিয়ে আনুন"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ফিরিয়ে আনুন</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(q.id)}
                    disabled={isRestoring}
                    className="p-2 rounded-2xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                    title="স্থায়ীভাবে ডিলিট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#0b1322] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8 text-slate-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white">রিসাইকেল বিন সম্পূর্ণ ফাঁকা</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              বর্তমানে কোনো প্রশ্ন মুছে ফেলা অবস্থায় নেই। ভবিষ্যতে কোনো প্রশ্ন ভুলে বা ইচ্ছাকৃতভাবে মুছে ফেলা হলে তা স্বয়ংক্রিয়ভাবে এখানে জমা থাকবে এবং যেকোনো সময় ফিরিয়ে আনা যাবে।
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মাস্টার প্রশ্ন ব্যাংকে ফিরে যান</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
