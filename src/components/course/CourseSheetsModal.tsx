import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Download,
  Upload,
  BookOpen,
} from 'lucide-react';
import { Course, CourseSheet } from '../../types';

interface CourseSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  sheets: CourseSheet[];
  loading: boolean;
  onAddSheet: (sheetData: Omit<CourseSheet, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSheet: (id: string, updatedFields: Partial<CourseSheet>) => Promise<void>;
  onDeleteSheet: (id: string) => Promise<void>;
  onToggleLock: (sheet: CourseSheet) => Promise<void>;
}

export const CourseSheetsModal: React.FC<CourseSheetsModalProps> = ({
  isOpen,
  onClose,
  course,
  sheets,
  loading,
  onAddSheet,
  onUpdateSheet,
  onDeleteSheet,
  onToggleLock,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [sheetForm, setSheetForm] = useState({
    title: '',
    subject: course.category || 'আরবি',
    topic: '',
    pdf_url: '',
    pdf_name: '',
    file_size: '২.৫ মেগাবাইট',
    page_count: '১৬ পেজ',
    badge_text: 'লেকচার নোট',
    is_locked: false,
  });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setSheetForm({
        ...sheetForm,
        pdf_url: fakeUrl,
        pdf_name: file.name,
        file_size: `${sizeMb} মেগাবাইট`,
      });
    }
  };

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetForm.title.trim()) return;

    if (editingSheetId) {
      await onUpdateSheet(editingSheetId, {
        title: sheetForm.title.trim(),
        subject: sheetForm.subject,
        topic: sheetForm.topic,
        pdf_url: sheetForm.pdf_url.trim() || '#',
        pdf_name: sheetForm.pdf_name,
        file_size: sheetForm.file_size,
        page_count: sheetForm.page_count,
        badge_text: sheetForm.badge_text,
        is_locked: sheetForm.is_locked,
      });
      setEditingSheetId(null);
    } else {
      await onAddSheet({
        course_id: course.id,
        title: sheetForm.title.trim(),
        subject: sheetForm.subject,
        topic: sheetForm.topic,
        pdf_url: sheetForm.pdf_url.trim() || '#',
        pdf_name: sheetForm.pdf_name,
        file_size: sheetForm.file_size || '১.৫ মেগাবাইট',
        page_count: sheetForm.page_count || '১০ পেজ',
        badge_text: sheetForm.badge_text || 'লেকচার নোট',
        is_locked: sheetForm.is_locked,
        position: sheets.length + 1,
      });
    }

    setSheetForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      pdf_url: '',
      pdf_name: '',
      file_size: '২.৫ মেগাবাইট',
      page_count: '১৬ পেজ',
      badge_text: 'লেকচার নোট',
      is_locked: false,
    });
  };

  const handleStartEdit = (sheet: CourseSheet) => {
    setEditingSheetId(sheet.id);
    setSheetForm({
      title: sheet.title,
      subject: sheet.subject || course.category || 'আরবি',
      topic: sheet.topic || '',
      pdf_url: sheet.pdf_url,
      pdf_name: sheet.pdf_name || '',
      file_size: sheet.file_size,
      page_count: sheet.page_count,
      badge_text: sheet.badge_text || 'লেকচার নোট',
      is_locked: sheet.is_locked,
    });
  };

  const handleCancelEdit = () => {
    setEditingSheetId(null);
    setSheetForm({
      title: '',
      subject: course.category || 'আরবি',
      topic: '',
      pdf_url: '',
      pdf_name: '',
      file_size: '২.৫ মেগাবাইট',
      page_count: '১৬ পেজ',
      badge_text: 'লেকচার নোট',
      is_locked: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                পিডিএফ লেকচার শিট ও হ্যান্ডনোট ম্যানেজার: {course.title}
              </h3>
              <p className="text-xs text-indigo-300 font-medium">
                পিডিএফ ফাইল আপলোড করুন, লক/আনলক করুন (Supabase <code className="font-mono">public.course_sheets</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Add / Edit Sheet Form */}
          <form onSubmit={handleSaveSheet} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                {editingSheetId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingSheetId ? 'শিটের তথ্য পরিবর্তন করুন' : 'নতুন পিডিএফ শিট যুক্ত করুন'}
              </h4>
              {editingSheetId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-rose-400 hover:underline"
                >
                  সম্পাদনা বাতিল
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  শিটের শিরোনাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অধ্যায় ১: আল কুরআন ও তাফসির স্পেশাল হ্যান্ডনোট"
                  value={sheetForm.title}
                  onChange={(e) => setSheetForm({ ...sheetForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">বিষয় (Subject)</label>
                <input
                  type="text"
                  placeholder="যেমন: আরবি সাহিত্য"
                  value={sheetForm.subject}
                  onChange={(e) => setSheetForm({ ...sheetForm, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">টপিক (Topic)</label>
                <input
                  type="text"
                  placeholder="যেমন: আরবি ব্যাকরণ ও নাহু"
                  value={sheetForm.topic}
                  onChange={(e) => setSheetForm({ ...sheetForm, topic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* PDF File Upload or URL */}
              <div className="sm:col-span-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[11px] text-indigo-300 font-bold">
                  পিডিএফ ফাইল সংযুক্তকরণ
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="file"
                    ref={pdfInputRef}
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    ফাইল ব্রাউজ করুন
                  </button>
                  <span className="text-[11px] text-slate-400">বা URL:</span>
                  <input
                    type="url"
                    placeholder="https://example.com/sheet.pdf"
                    value={sheetForm.pdf_url}
                    onChange={(e) => setSheetForm({ ...sheetForm, pdf_url: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {sheetForm.pdf_name && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ সংযুক্ত ফাইল: {sheetForm.pdf_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">ফাইলের সাইজ</label>
                <input
                  type="text"
                  placeholder="যেমন: ৩.৫ মেগাবাইট"
                  value={sheetForm.file_size}
                  onChange={(e) => setSheetForm({ ...sheetForm, file_size: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">পেজ সংখ্যা</label>
                <input
                  type="text"
                  placeholder="যেমন: ২৪ পেজ"
                  value={sheetForm.page_count}
                  onChange={(e) => setSheetForm({ ...sheetForm, page_count: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sheetForm.is_locked}
                  onChange={(e) => setSheetForm({ ...sheetForm, is_locked: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-950"
                />
                <span>🔒 শিটটি লক্ড (শুধুমাত্র পেইড শিক্ষার্থীদের জন্য)</span>
              </label>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {editingSheetId ? 'আপডেট সম্পন্ন করুন' : 'পিডিএফ শিট যুক্ত করুন'}
              </button>
            </div>
          </form>

          {/* List of Sheets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">
              এই কোর্সে যুক্ত লেকচার শিটসমূহ ({sheets.length} টি):
            </h4>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">শিট লোড হচ্ছে...</div>
            ) : sheets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                এখনও কোনো লেকচার শিট যুক্ত করা হয়নি।
              </div>
            ) : (
              <div className="space-y-2">
                {sheets.map((sheet, index) => (
                  <div
                    key={sheet.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 font-black text-center leading-7 shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-white text-sm">{sheet.title}</h5>
                          {sheet.badge_text && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px]">
                              {sheet.badge_text}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          সাইজ: {sheet.file_size} &bull; পেজ: {sheet.page_count} &bull; বিষয়: {sheet.subject || 'আরবি'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sheet.pdf_url && sheet.pdf_url !== '#' && (
                        <a
                          href={sheet.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          ডাউনলোড
                        </a>
                      )}

                      <button
                        onClick={() => onToggleLock(sheet)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          sheet.is_locked
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {sheet.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {sheet.is_locked ? 'লকড' : 'মুক্ত'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(sheet)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        title="এডিট"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteSheet(sheet.id)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
