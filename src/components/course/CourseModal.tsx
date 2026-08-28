import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  Layers,
  FileText,
  Calendar,
  BookOpen,
  Award,
  ExternalLink,
  Sparkles,
  CheckCircle,
  Upload,
  Eye,
  FileCode,
  HelpCircle,
  Trash2,
  Plus,
  Info,
  Rocket,
  Clock,
} from 'lucide-react';
import { Course, COURSE_CATEGORIES, COURSE_THEMES } from '../../types';
import { formatBengaliDateTime } from '../../lib/countdown';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => Promise<void>;
  editingCourse: Course | null;
  initialTab?: 'basic' | 'details' | 'routine' | 'syllabus' | 'buttons';
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCourse,
  initialTab = 'basic',
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'details' | 'routine' | 'syllabus' | 'buttons'
  >(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  const routineFileInputRef = useRef<HTMLInputElement>(null);
  const syllabusFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [formData, setFormData] = useState({
    custom_id: '',
    title: '',
    category: 'আরবি প্রভাষক',
    badge: 'রেকর্ড ব্যাচ',
    badge_subtitle: 'প্রিলি ও লিখিত প্রস্তুতি',
    instructor_name: 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
    price: '৳৯৫০',
    enrolled_count: 50,
    total_classes: 30,
    total_sheets: 20,
    total_exams: 15,
    theme_color: 'emerald',
    features: ['লাইভ ও রেকর্ড ক্লাসের অ্যাক্সেস', 'অধ্যায়ভিত্তিক ৩০টি স্পেশাল মডেল টেস্ট', 'সকল পিডিএফ লেকচার শিট'],
    newFeatureText: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    // Upcoming settings
    is_upcoming: false,
    upcoming_date: '',
    upcoming_badge_text: 'আপকামিং ব্যাচ',
    upcoming_note: '',
    // Rich content fields
    description: '',
    about_text: '',
    routine_text: '',
    routine_pdf_url: '',
    routine_pdf_name: '',
    syllabus_text: '',
    syllabus_pdf_url: '',
    syllabus_pdf_name: '',
    leaderboard_enabled: true,
    leaderboard_info: 'পরীক্ষা শেষ হওয়ার পর তাৎক্ষণিক অটো-মেরিট লিস্ট ও লাইভ লিডারবোর্ড প্রদর্শিত হবে।',
    helpline_contact: '+880 1800-000000',
    // Button configs
    details_button_text: 'কোর্স বিস্তারিত',
    details_button_link: 'https://t.me/tamreen_academy',
    enroll_button_text: 'এখনই ভর্তি হন',
    enroll_button_link: 'https://tamreen.academy/enroll',
    enter_button_text: 'ক্লাসরুমে প্রবেশ',
    sheet_button_text: 'শিট ডাউনলোড',
  });

  useEffect(() => {
    if (editingCourse) {
      const desc = editingCourse.about_text || editingCourse.description || '';
      setFormData({
        custom_id: editingCourse.id || '',
        title: editingCourse.title || '',
        category: editingCourse.category || 'আরবি প্রভাষক',
        badge: editingCourse.badge || 'রেকর্ড ব্যাচ',
        badge_subtitle: editingCourse.badge_subtitle || '',
        instructor_name: editingCourse.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
        price: editingCourse.price || '৳৯৫০',
        enrolled_count: Number(editingCourse.enrolled_count) || 0,
        total_classes: Number(editingCourse.total_classes ?? (editingCourse as any).classes_count ?? 0),
        total_sheets: Number(editingCourse.total_sheets ?? (editingCourse as any).sheets_count ?? 0),
        total_exams: Number(editingCourse.total_exams ?? (editingCourse as any).exams_count ?? 0),
        theme_color: editingCourse.theme_color || 'emerald',
        features: Array.isArray(editingCourse.features) ? editingCourse.features : [],
        newFeatureText: '',
        status: editingCourse.status || 'published',
        is_upcoming: editingCourse.is_upcoming !== undefined ? Boolean(editingCourse.is_upcoming) : false,
        upcoming_date: editingCourse.upcoming_date || '',
        upcoming_badge_text: editingCourse.upcoming_badge_text || 'আপকামিং ব্যাচ',
        upcoming_note: editingCourse.upcoming_note || '',
        description: desc,
        about_text: desc,
        routine_text: editingCourse.routine_text || '',
        routine_pdf_url: editingCourse.routine_pdf_url || '',
        routine_pdf_name: editingCourse.routine_pdf_name || '',
        syllabus_text: editingCourse.syllabus_text || '',
        syllabus_pdf_url: editingCourse.syllabus_pdf_url || '',
        syllabus_pdf_name: editingCourse.syllabus_pdf_name || '',
        leaderboard_enabled: editingCourse.leaderboard_enabled !== undefined ? editingCourse.leaderboard_enabled : true,
        leaderboard_info: editingCourse.leaderboard_info || '',
        helpline_contact: editingCourse.helpline_contact || '',
        details_button_text: editingCourse.details_button_text || 'কোর্স বিস্তারিত',
        details_button_link: editingCourse.details_button_link || '#',
        enroll_button_text: editingCourse.enroll_button_text || 'এখনই ভর্তি হন',
        enroll_button_link: editingCourse.enroll_button_link || '#',
        enter_button_text: editingCourse.enter_button_text || 'ক্লাসরুমে প্রবেশ',
        sheet_button_text: editingCourse.sheet_button_text || 'শিট ডাউনলোড',
      });
    } else {
      setFormData({
        title: '',
        category: 'আরবি প্রভাষক',
        badge: 'রেকর্ড ব্যাচ',
        badge_subtitle: 'প্রিলি ও লিখিত প্রস্তুতি',
        instructor_name: 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
        price: '৳৯৫০',
        enrolled_count: 50,
        total_classes: 30,
        total_sheets: 20,
        total_exams: 15,
        theme_color: 'emerald',
        features: ['লাইভ ও রেকর্ড ক্লাসের অ্যাক্সেস', 'অধ্যায়ভিত্তিক ৩০টি স্পেশাল মডেল টেস্ট', 'সকল পিডিএফ লেকচার শিট'],
        newFeatureText: '',
        status: 'published',
        is_upcoming: false,
        upcoming_date: '',
        upcoming_badge_text: 'আপকামিং ব্যাচ',
        upcoming_note: '',
        description: '',
        about_text: `বিসমিল্লাহির রাহমানির রাহিম।
এই কোর্সে শিক্ষক নিবন্ধন (NTRCA) ও মাদ্রাসা প্রভাষক পদের জন্য আরবি ও ইসলামিক স্টাডিজ বিষয়ের পূর্ণাঙ্গ প্রস্তুতি প্রদান করা হবে।
• কোর্স বৈশিষ্ট্য:
১. বিষয়ভিত্তিক লাইভ ও হাই-ডেফিনিশন রেকর্ড ক্লাস
২. প্রতিটি অধ্যায়ের সমৃদ্ধ লেকচার হ্যান্ডনোট পিডিএফ
৩. লাইভ ও প্র্যাকটিস মডেল টেস্ট এবং ইনস্ট্যান্ট র‍্যাংক লিডারবোর্ড
৪. অভিজ্ঞ ওস্তাদদের সার্বক্ষণিক গাইডলাইন`,
        routine_text: `🗓️ সাপ্তাহিক ক্লাস ও পরীক্ষা সময়সূচি:
• শনি ও সোমবার: সন্ধ্যা ৭:০০ টা - আল কুরআন ও তাফসির লাইভ ক্লাস
• মঙ্গল ও বৃহস্পতিবার: রাত ৮:৩০ টা - হাদিস ও উসুলুল হাদিস
• শুক্রবার: রাত ৯:০০ টা - মেগা উইকলি মডেল টেস্ট ও লাইভ সল্ভ ক্লাস`,
        routine_pdf_url: '',
        routine_pdf_name: '',
        syllabus_text: `📖 সম্পূর্ণ সিলেবাস বিভাজন:
১. কুরআন ও উলুমুল কুরআন (২০ নম্বর)
২. হাদিস শরীফ ও মুস্তালাহুল হাদিস (২০ নম্বর)
৩. আরবি সাহিত্য ও ব্যাকরণ (নাহু ও সরফ) (২৫ নম্বর)
৪. ফিকহ ও উসুলুল ফিকহ (১৫ নম্বর)
৫. ইসলামিক ইতিহাস ও সংস্কৃতি (২০ নম্বর)`,
        syllabus_pdf_url: '',
        syllabus_pdf_name: '',
        leaderboard_enabled: true,
        leaderboard_info: 'পরীক্ষা শেষ হওয়ার পর তাৎক্ষণিক অটো-মেরিট লিস্ট ও লাইভ লিডারবোর্ড প্রদর্শিত হবে।',
        helpline_contact: '+880 1800-000000',
        details_button_text: 'কোর্স বিস্তারিত',
        details_button_link: 'https://t.me/tamreen_academy',
        enroll_button_text: 'এখনই ভর্তি হন',
        enroll_button_link: 'https://tamreen.academy/enroll',
        enter_button_text: 'ক্লাসরুমে প্রবেশ',
        sheet_button_text: 'শিট ডাউনলোড',
      });
    }
  }, [editingCourse, isOpen]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (formData.newFeatureText.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, formData.newFeatureText.trim()],
        newFeatureText: '',
      });
    }
  };

  const handleRemoveFeature = (idx: number) => {
    const updated = [...formData.features];
    updated.splice(idx, 1);
    setFormData({ ...formData, features: updated });
  };

  const handleRoutineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        routine_pdf_url: fakeUrl,
        routine_pdf_name: file.name,
      });
    }
  };

  const handleSyllabusFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        syllabus_pdf_url: fakeUrl,
        syllabus_pdf_name: file.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('অনুগ্রহ করে কোর্সের নাম লিখুন');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        ...(formData.custom_id.trim() ? { id: formData.custom_id.trim(), custom_id: formData.custom_id.trim() } : {}),
      };
      await onSave(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {editingCourse ? 'কোর্স ও বাটন কন্টেন্ট এডিটর' : 'নতুন কোর্স তৈরি ও বাটন সেটআপ'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                প্রত্যেকটি বাটনের (বিস্তারিত, রুটিন, সিলেবাস, বাটন লিংক) জন্য পৃথকভাবে কন্টেন্ট সাজান
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-slate-950/40 border-b border-slate-800 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'basic'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            ১. সাধারণ তথ্য ও হেডার
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'details'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            ২. কোর্স বিস্তারিত (টেক্সট)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'routine'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            ৩. রুটিন (টেক্সট + PDF)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'syllabus'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            ৪. সিলেবাস (টেক্সট + PDF)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'buttons'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            ৫. বাটন ও লিডারবোর্ড সেটিংস
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    কাস্টম কোর্স আইডি (Custom Course ID) <span className="text-slate-400 font-normal text-[11px]">(ঐচ্ছিক, যেমন: COURSE-NTRCA বা COURSE-BANGLA-01)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: COURSE-NTRCA বা COURSE-BANGLA-01"
                    value={formData.custom_id}
                    onChange={(e) => setFormData({ ...formData, custom_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ফাঁকা রাখলে অটো জেনারেট র্যান্ডম আইডি ব্যবহার করা হবে। কাস্টম আইডি দিলে ডাটাবেজে ও ইউআরএলে সেটিই প্রধান আইডি হিসেবে থাকবে।
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    কোর্সের পূর্ণাঙ্গ নাম (Course Title) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ১৮তম NTRCA আরবি প্রভাষক বিশেষ মডেল টেস্ট ব্যাচ"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ক্যাটাগরি (Category)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ইন্সট্রাক্টর / শিক্ষক প্যানেল
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মুফতি শফিক উল্লাহ ও তামরীন প্যানেল"
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ব্যাজ / ব্যাচ নাম (Badge)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 'রেকর্ড ব্যাচ' / 'এক্সাম ব্যাচ-১'"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    সাব-ব্যাজ টেক্সট (Sub-Badge)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: প্রিলি ও লিখিত পূর্ণাঙ্গ প্রস্তুতি"
                    value={formData.badge_subtitle}
                    onChange={(e) => setFormData({ ...formData, badge_subtitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    কোর্স ফি (Price)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ৳৯৫০ অথবা ৳০ (ফ্রি)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    এনরোলকৃত শিক্ষার্থী কাউন্টার
                  </label>
                  <input
                    type="number"
                    value={formData.enrolled_count}
                    onChange={(e) =>
                      setFormData({ ...formData, enrolled_count: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Counters & Theme */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  কার্ড পরিসংখ্যান ও থিম কালার
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট ক্লাস</label>
                    <input
                      type="number"
                      value={formData.total_classes}
                      onChange={(e) =>
                        setFormData({ ...formData, total_classes: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট শিট</label>
                    <input
                      type="number"
                      value={formData.total_sheets}
                      onChange={(e) =>
                        setFormData({ ...formData, total_sheets: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট পরীক্ষা</label>
                    <input
                      type="number"
                      value={formData.total_exams}
                      onChange={(e) =>
                        setFormData({ ...formData, total_exams: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">থিম কালার</label>
                    <select
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    >
                      {COURSE_THEMES.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* আপকামিং কোর্স ও সময় সেটিংস (Upcoming Course & Schedule Options) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-950/70 to-orange-950/20 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-300">
                        আপকামিং কোর্স সেটিংস (Upcoming Option)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        কোর্স কার্ডে 'আপকামিং' ট্যাগ ও ঐচ্ছিক সময়/কাউন্টডাউন প্রদর্শন করুন
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_upcoming}
                      onChange={(e) =>
                        setFormData({ ...formData, is_upcoming: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    <span className="ml-2 text-xs font-bold text-slate-200">
                      {formData.is_upcoming ? 'আপকামিং সক্রিয়' : 'সাধারণ কোর্স'}
                    </span>
                  </label>
                </div>

                {formData.is_upcoming && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-3.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-200/90 mb-1">
                          আপকামিং ব্যাজ লেখা (Upcoming Badge Text)
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: আপকামিং স্পেশাল ব্যাচ / শীঘ্রই আসছে"
                          value={formData.upcoming_badge_text}
                          onChange={(e) =>
                            setFormData({ ...formData, upcoming_badge_text: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-amber-200/90 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>ক্লাস/কোর্স শুরুর সময় (অপশনাল)</span>
                          </label>
                          {formData.upcoming_date && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, upcoming_date: '' })}
                              className="text-[10px] text-rose-400 hover:underline"
                            >
                              রিসেট
                            </button>
                          )}
                        </div>
                        <input
                          type="datetime-local"
                          value={formData.upcoming_date ? formData.upcoming_date.slice(0, 16) : ''}
                          onChange={(e) =>
                            setFormData({ ...formData, upcoming_date: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold">কুইক টাইম সেট:</span>
                      {[
                        { label: 'আগামীকাল রাত ৮টা', days: 1, hour: 20 },
                        { label: '৩ দিন পর', days: 3, hour: 20 },
                        { label: '৭ দিন পর', days: 7, hour: 21 },
                        { label: '১৫ দিন পর', days: 15, hour: 20 },
                        { label: '১ মাস পর', days: 30, hour: 20 },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + preset.days);
                            d.setHours(preset.hour, 0, 0, 0);
                            // format as YYYY-MM-DDTHH:mm
                            const pad = (n: number) => String(n).padStart(2, '0');
                            const isoLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
                              d.getDate()
                            )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            setFormData({ ...formData, upcoming_date: isoLocal });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-[10px] font-bold text-slate-300 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Announcement / Note */}
                    <div>
                      <label className="block text-xs font-bold text-amber-200/90 mb-1">
                        আপকামিং ঘোষণা বা শর্ট নোট (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ১৫ সেপ্টেম্বর থেকে সরাসরি লাইভ ওরিয়েন্টেশন ক্লাস শুরু হতে যাচ্ছে।"
                        value={formData.upcoming_note}
                        onChange={(e) =>
                          setFormData({ ...formData, upcoming_note: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Bangla formatted date display */}
                    {formData.upcoming_date && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>নির্ধারিত সময়:</strong>{' '}
                          {formatBengaliDateTime(formData.upcoming_date).fullStr ||
                            formData.upcoming_date}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights tags */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  কোর্স হাইলাইটস ও বৈশিষ্ট্যসমূহ:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="যেমন: সম্পূর্ণ লিখিত সিলেবাস কভারিং"
                    value={formData.newFeatureText}
                    onChange={(e) => setFormData({ ...formData, newFeatureText: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors"
                  >
                    যোগ করুন
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSE DETAILS (TEXT ONLY / COPY-PASTE) */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-emerald-300">কোর্স সম্পর্কে বিস্তারিত তথ্য</h4>
                  <p className="text-slate-300 mt-1">
                    শিক্ষার্থী যখন অ্যাপ বা পোর্টালে "কোর্স বিস্তারিত" বাটনে ক্লিক করবে, তখন এই বিস্তারিত বিবরণটি দেখতে পাবে। আপনি এখানে যেকোনো টেক্সট সরাসরি লিখতে পারেন অথবা কপি করে এনে পেস্ট করতে পারেন।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  কোর্স পরিচিতি ও বিস্তারিত টেক্সট (Text / Copy-Paste Supported)
                </label>
                <textarea
                  rows={12}
                  placeholder="কোর্স সম্পর্কে বিস্তারিত বিবরণ লিখুন বা পেস্ট করুন..."
                  value={formData.about_text}
                  onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  সংক্ষিপ্ত এক-বাক্য বিবরণ (Short Summary)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আরবি প্রভাষক পদের লিখিত ও প্রিলি পরীক্ষার সেরা পূর্ণাঙ্গ প্রস্তুতি।"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ROUTINE (TEXT + PDF UPLOAD) */}
          {activeTab === 'routine' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-300">রুটিন কন্টেন্ট ও পিডিএফ আপলোড</h4>
                  <p className="text-slate-300 mt-1">
                    শিক্ষার্থীরা রুটিন বাটনে ক্লিক করলে লিখিত রুটিন পড়তে পারবে এবং সরাসরি রুটিন PDF ডাউনলোড করতে পারবে।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ১. লিখিত রুটিন সময়সূচি (Text / Schedule List)
                </label>
                <textarea
                  rows={7}
                  placeholder="সাপ্তাহিক ক্লাস বা পরীক্ষার রুটিন লিখুন বা পেস্ট করুন..."
                  value={formData.routine_text}
                  onChange={(e) => setFormData({ ...formData, routine_text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-amber-400">
                  ২. রুটিন পিডিএফ ফাইল আপলোড বা URL
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={routineFileInputRef}
                    accept=".pdf"
                    onChange={handleRoutineFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => routineFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    পিডিএফ ফাইল আপলোড করুন
                  </button>

                  <span className="text-xs text-slate-400">অথবা সরাসরি লিংক দিন:</span>

                  <input
                    type="url"
                    placeholder="https://example.com/routine.pdf"
                    value={formData.routine_pdf_url}
                    onChange={(e) => setFormData({ ...formData, routine_pdf_url: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {formData.routine_pdf_url && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-amber-300">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold">{formData.routine_pdf_name || 'রুটিন ফাইল সংযুক্ত হয়েছে'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, routine_pdf_url: '', routine_pdf_name: '' })}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SYLLABUS (TEXT + PDF UPLOAD) */}
          {activeTab === 'syllabus' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-indigo-300">সিলেবাস কন্টেন্ট ও পিডিএফ আপলোড</h4>
                  <p className="text-slate-300 mt-1">
                    শিক্ষার্থীরা সিলেবাস বাটনে ক্লিক করলে লিখিত সিলেবাস পড়তে পারবে এবং পূর্ণাঙ্গ সিলেবাস PDF ডাউনলোড করতে পারবে।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ১. লিখিত সিলেবাস রূপরেখা (Text / Topic Breakdown)
                </label>
                <textarea
                  rows={7}
                  placeholder="কোর্সের পূর্ণাঙ্গ সিলেবাস ও বিষয়ভিত্তিক নম্বর বণ্টন লিখুন বা পেস্ট করুন..."
                  value={formData.syllabus_text}
                  onChange={(e) => setFormData({ ...formData, syllabus_text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-indigo-400">
                  ২. সিলেবাস পিডিএফ ফাইল আপলোড বা URL
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={syllabusFileInputRef}
                    accept=".pdf"
                    onChange={handleSyllabusFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => syllabusFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    পিডিএফ ফাইল আপলোড করুন
                  </button>

                  <span className="text-xs text-slate-400">অথবা সরাসরি লিংক দিন:</span>

                  <input
                    type="url"
                    placeholder="https://example.com/syllabus.pdf"
                    value={formData.syllabus_pdf_url}
                    onChange={(e) => setFormData({ ...formData, syllabus_pdf_url: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {formData.syllabus_pdf_url && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold">{formData.syllabus_pdf_name || 'সিলেবাস ফাইল সংযুক্ত হয়েছে'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, syllabus_pdf_url: '', syllabus_pdf_name: '' })}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACTION BUTTONS & LEADERBOARD SETTINGS */}
          {activeTab === 'buttons' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    'বিস্তারিত' বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={formData.details_button_text}
                    onChange={(e) => setFormData({ ...formData, details_button_text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    'বিস্তারিত' এক্সটার্নাল লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.details_button_link}
                    onChange={(e) => setFormData({ ...formData, details_button_link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    'এখনই ভর্তি হন' বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={formData.enroll_button_text}
                    onChange={(e) => setFormData({ ...formData, enroll_button_text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    'ভর্তি হন' পেমেন্ট / ফর্ম লিংক
                  </label>
                  <input
                    type="text"
                    value={formData.enroll_button_link}
                    onChange={(e) => setFormData({ ...formData, enroll_button_link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    এনরোলড শিক্ষার্থীদের জন্য 'প্রবেশ' বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={formData.enter_button_text}
                    onChange={(e) => setFormData({ ...formData, enter_button_text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    'শিট ডাউনলোড' বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={formData.sheet_button_text}
                    onChange={(e) => setFormData({ ...formData, sheet_button_text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Leaderboard & Helpline */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      এই কোর্সের সকল পরীক্ষার লাইভ লিডারবোর্ড চালু থাকবে
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.leaderboard_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, leaderboard_enabled: e.target.checked })
                    }
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    হেল্পলাইন নম্বর বা হোয়াটসঅ্যাপ
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: +880 1800-000000"
                    value={formData.helpline_contact}
                    onChange={(e) => setFormData({ ...formData, helpline_contact: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-300">স্ট্যাটাস:</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })
                }
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="published">পাবলিশড (Published)</option>
                <option value="draft">ড্রাফট (Draft)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                বাতিল
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingCourse ? 'কোর্স আপডেট করুন' : 'কোর্স সেভ করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
