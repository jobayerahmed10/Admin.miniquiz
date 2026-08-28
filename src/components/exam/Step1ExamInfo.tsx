import React, { useState, useEffect } from 'react';
import {
  FileText,
  LayoutGrid,
  Calendar,
  Clock,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  X,
  ArrowLeft,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';
import { Exam } from '../../types';
import {
  fetchAllExams,
  getDefaultExamPrefix,
  generateSequentialExamId,
} from '../../lib/supabase';

export interface ExamInfoFormData {
  title: string;
  subject: string;
  topic: string;
  post: string;
  exam_format: string;
  question_count: number;
  total_marks: number;
  marks_per_question: number;
  time_minutes: number;
  has_negative_marking: boolean;
  negative_marks: number;
  start_date: string;
  end_date: string;
  max_attempts: number;
  instructions: string;
  custom_id?: string;
  custom_id_pattern?: string;
}

interface Step1ExamInfoProps {
  initialData: Partial<ExamInfoFormData>;
  onNext: (data: ExamInfoFormData) => void;
  onCancel: () => void;
  onPreviewQuick?: () => void;
}

export const Step1ExamInfo: React.FC<Step1ExamInfoProps> = ({
  initialData,
  onNext,
  onCancel,
  onPreviewQuick,
}) => {
  const [formData, setFormData] = useState<ExamInfoFormData>({
    title: initialData.title || '',
    subject: initialData.subject || '',
    topic: initialData.topic || '',
    post: initialData.post || '',
    exam_format: initialData.exam_format || 'MCQ (বহুনির্বাচনি)',
    question_count: initialData.question_count || 50,
    total_marks: initialData.total_marks || 50,
    marks_per_question: initialData.marks_per_question || 1,
    time_minutes: initialData.time_minutes || 30,
    has_negative_marking:
      initialData.has_negative_marking !== undefined
        ? initialData.has_negative_marking
        : (initialData.negative_marks || 0) > 0,
    negative_marks: initialData.negative_marks !== undefined ? initialData.negative_marks : 0.25,
    start_date: initialData.start_date || '',
    end_date: initialData.end_date || '',
    max_attempts: initialData.max_attempts || 1,
    instructions: initialData.instructions || '',
    custom_id: initialData.custom_id || initialData.id || '',
    custom_id_pattern: initialData.custom_id_pattern || '',
  });

  useEffect(() => {
    if (!formData.custom_id) {
      fetchAllExams().then(({ exams }) => {
        const prefix = getDefaultExamPrefix(formData.subject, formData.exam_format);
        const nextId = generateSequentialExamId(prefix, exams);
        setFormData(prev => ({ ...prev, custom_id: nextId }));
      });
    }
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'পরীক্ষার নাম লিখা আবশ্যক';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'বিষয় লিখা আবশ্যক';
    }
    if (!formData.topic.trim()) {
      newErrors.topic = 'টপিক লিখা আবশ্যক';
    }
    if (!formData.post.trim()) {
      newErrors.post = 'পদের নাম বা প্রযোজ্য ক্ষেত্র লিখা আবশ্যক';
    }
    if (!formData.question_count || formData.question_count <= 0) {
      newErrors.question_count = 'সঠিক প্রশ্ন সংখ্যা দিন';
    }
    if (!formData.total_marks || formData.total_marks <= 0) {
      newErrors.total_marks = 'পূর্ণমান দিন';
    }
    if (!formData.time_minutes || formData.time_minutes <= 0) {
      newErrors.time_minutes = 'পরীক্ষার সময় দিন';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    } else {
      // Scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleNextClick} className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* ================= CARD 1: পরীক্ষার সাধারণ তথ্য ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-8 h-8 rounded-xl bg-[#5B36F5]/10 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            পরীক্ষার সাধারণ তথ্য
          </h2>
        </div>

        {/* 1. পরীক্ষার নাম */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            পরীক্ষার নাম <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            placeholder="যেমন: বাংলা মডেল টেস্ট – ০১"
            className={`w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] transition-all ${
              errors.title ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.title && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.title}</p>}
        </div>

        {/* 2-col Grid: বিষয় & টপিক */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              বিষয় (ম্যানুয়ালি লিখুন) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => {
                const newSubj = e.target.value;
                fetchAllExams().then(({ exams }) => {
                  const prefix = getDefaultExamPrefix(newSubj, formData.exam_format);
                  const nextId = generateSequentialExamId(prefix, exams);
                  setFormData(prev => ({ ...prev, subject: newSubj, custom_id: nextId }));
                });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              placeholder="যেমন: বাংলা"
              className={`w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] transition-all ${
                errors.subject ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.subject && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              টপিক (ম্যানুয়ালি লিখুন) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => {
                setFormData({ ...formData, topic: e.target.value });
                if (errors.topic) setErrors({ ...errors, topic: '' });
              }}
              placeholder="যেমন: ব্যাকরণ"
              className={`w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] transition-all ${
                errors.topic ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.topic && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.topic}</p>}
          </div>
        </div>

        {/* পরীক্ষার আইডি (Exam ID) - placed right after name & subject */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>পরীক্ষার আইডি (Exam ID) <span className="text-rose-500">*</span></span>
            <button
              type="button"
              onClick={() => {
                fetchAllExams().then(({ exams }) => {
                  const prefix = getDefaultExamPrefix(formData.subject, formData.exam_format);
                  const nextId = generateSequentialExamId(prefix, exams);
                  setFormData({ ...formData, custom_id: nextId });
                });
              }}
              className="text-[11px] text-[#5B36F5] dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3 h-3" /> নতুন আইডি জেনারেট করুন
            </button>
          </label>
          <input
            type="text"
            value={formData.custom_id || ''}
            onChange={(e) => setFormData({ ...formData, custom_id: e.target.value })}
            placeholder="যেমন: EXAM-FREE-0001"
            className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            বিষয় ও টাইপের উপর ভিত্তি করে অটোমেটিক প্রেফিক্স ও সিকুয়েন্স নম্বরযুক্ত আইডি (ম্যানুয়ালি এডিটেবল)।
          </p>
        </div>

        {/* 2-col Grid: পদ / যাদের জন্য প্রযোজ্য & পরীক্ষার ধরন */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              পদ / পরীক্ষা যাদের জন্য প্রযোজ্য <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.post}
              onChange={(e) => {
                setFormData({ ...formData, post: e.target.value });
                if (errors.post) setErrors({ ...errors, post: '' });
              }}
              placeholder="যেমন: সহকারী শিক্ষক"
              className={`w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] transition-all ${
                errors.post ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.post && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.post}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              পরীক্ষার ধরন <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.exam_format}
              onChange={(e) => setFormData({ ...formData, exam_format: e.target.value })}
              className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5] cursor-pointer"
            >
              <option value="MCQ (বহুনির্বাচনি)">MCQ (বহুনির্বাচনি)</option>
              <option value="মডেল টেস্ট">মডেল টেস্ট (Model Test)</option>
              <option value="দৈনিক মডেল টেস্ট">দৈনিক মডেল টেস্ট (Daily)</option>
              <option value="সাপ্তাহিক টেস্ট">সাপ্তাহিক টেস্ট (Weekly)</option>
              <option value="লাইভ পরীক্ষা">লাইভ পরীক্ষা (Live Exam)</option>
              <option value="ফ্রি পরীক্ষা">ফ্রি পরীক্ষা (Free Test)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= CARD 2: পরীক্ষার ধরন ও গঠন ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-8 h-8 rounded-xl bg-[#5B36F5]/10 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            পরীক্ষার ধরন ও গঠন
          </h2>
        </div>

        {/* 3-col Row: প্রশ্ন সংখ্যা, পূর্ণমান, প্রতি প্রশ্নের নম্বর */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              প্রশ্ন সংখ্যা <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={formData.question_count || ''}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                setFormData({
                  ...formData,
                  question_count: count,
                  total_marks: count * formData.marks_per_question,
                });
              }}
              placeholder="৫০"
              className="w-full px-3 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              পূর্ণমান <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.total_marks || ''}
              onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 0 })}
              placeholder="৫০"
              className="w-full px-3 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 truncate">
              প্রতি প্রশ্নের নম্বর <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.marks_per_question || ''}
              onChange={(e) => {
                const mark = parseFloat(e.target.value) || 1;
                setFormData({
                  ...formData,
                  marks_per_question: mark,
                  total_marks: formData.question_count * mark,
                });
              }}
              placeholder="১"
              className="w-full px-3 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>
        </div>

        {/* 2-col Row: সময় & নেগেটিভ মার্কিং */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              সময় (মিনিট) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="1"
                max="300"
                value={formData.time_minutes || ''}
                onChange={(e) => setFormData({ ...formData, time_minutes: parseInt(e.target.value) || 0 })}
                placeholder="৩০ মিনিট"
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-bold">মিনিট</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span>নেগেটিভ মার্কিং</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className={`text-xs font-bold ${formData.has_negative_marking ? 'text-[#5B36F5]' : 'text-slate-400'}`}>
                {formData.has_negative_marking ? 'চালু' : 'বন্ধ'}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">ভুল উত্তরে নম্বর কর্তন</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_negative_marking: !formData.has_negative_marking })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  formData.has_negative_marking ? 'bg-[#5B36F5]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    formData.has_negative_marking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ভুল উত্তরের জন্য কত নম্বর কাটা যাবে (If Negative Marking ON) */}
        {formData.has_negative_marking && (
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              ভুল উত্তরের জন্য কত নম্বর কাটা যাবে <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="2"
              value={formData.negative_marks}
              onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
              placeholder="0.25"
              className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>
        )}
      </div>

      {/* ================= CARD 3: অতিরিক্ত সেটিংস ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-8 h-8 rounded-xl bg-[#5B36F5]/10 text-[#5B36F5] dark:text-indigo-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            অতিরিক্ত সেটিংস
          </h2>
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              পরীক্ষা শুরুর তারিখ <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              পরীক্ষা শেষ তারিখ <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
              />
            </div>
          </div>
        </div>

        {/* সর্বোচ্চ চেষ্টা সংখ্যা & কাস্টম আইডি প্যাটার্ন */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              সর্বোচ্চ চেষ্টা সংখ্যা
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.max_attempts || ''}
              onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
              placeholder="১"
              className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              প্রশ্ন সিকুয়েন্স ID প্যাটার্ন <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={formData.custom_id_pattern || ''}
              onChange={(e) => setFormData({ ...formData, custom_id_pattern: e.target.value })}
              placeholder="যেমন: Q-BANGLA-"
              className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
            />
          </div>
        </div>

        {/* বিশেষ নির্দেশনা */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              বিশেষ নির্দেশনা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {formData.instructions.length}/300
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={300}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="পরীক্ষার্থীদের জন্য বিশেষ নির্দেশনা লিখুন..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B36F5]/20 focus:border-[#5B36F5]"
          />
        </div>

        {/* Information Box: পরামর্শ */}
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex items-start gap-3">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/80 text-[#5B36F5] dark:text-indigo-300 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
              পরামর্শ
            </h4>
            <p className="text-[11px] sm:text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
              সঠিক তথ্য দিন, কারণ প্রকাশের পর এগুলো পরিবর্তন করা কঠিন হতে পারে।
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Next Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3.5 bg-[#5B36F5] hover:bg-[#4E2DE3] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>পরবর্তী ধাপ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
