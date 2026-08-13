import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  FileText,
  Award,
  BookOpen,
  CheckCircle,
  X,
  ExternalLink,
  Code,
  Lock,
  Unlock,
  Users,
  Sparkles,
  ChevronRight,
  Eye,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Search,
  Tag,
  Download,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Course,
  CourseExam,
  CourseSheet,
  COURSE_CATEGORIES,
  COURSE_THEMES,
} from '../types';
import {
  fetchAllCourses,
  insertCourse,
  updateCourse,
  deleteCourse,
  fetchCourseExams,
  insertCourseExam,
  updateCourseExam,
  deleteCourseExam,
  fetchCourseSheets,
  insertCourseSheet,
  updateCourseSheet,
  deleteCourseSheet,
} from '../lib/supabase';

export const CoursesManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [showExamModal, setShowExamModal] = useState(false);
  const [activeCourseForExams, setActiveCourseForExams] = useState<Course | null>(null);
  const [courseExams, setCourseExams] = useState<CourseExam[]>([]);
  const [examLoading, setExamLoading] = useState(false);

  const [showSheetModal, setShowSheetModal] = useState(false);
  const [activeCourseForSheets, setActiveCourseForSheets] = useState<Course | null>(null);
  const [courseSheets, setCourseSheets] = useState<CourseSheet[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Course Form State
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    badge: string;
    badge_subtitle: string;
    instructor_name: string;
    price: string;
    enrolled_count: number;
    total_classes: number;
    total_sheets: number;
    total_exams: number;
    theme_color: string;
    features: string[];
    newFeatureText: string;
    status: 'published' | 'draft' | 'archived';
    details_button_text: string;
    details_button_link: string;
    enroll_button_text: string;
    enroll_button_link: string;
    enter_button_text: string;
    sheet_button_text: string;
  }>({
    title: '',
    category: 'আরবি প্রভাষক',
    badge: 'রেকর্ড ব্যাচ',
    badge_subtitle: '',
    instructor_name: 'মুফতি শফিক উল্লাহ ও টিম',
    price: '৳৯৫০',
    enrolled_count: 0,
    total_classes: 30,
    total_sheets: 20,
    total_exams: 15,
    theme_color: 'emerald',
    features: ['প্রাইভেট রেকর্ড ক্লাস', 'অধ্যায়ভিত্তিক পরীক্ষা', 'পিডিএফ লেকচার শিট'],
    newFeatureText: '',
    status: 'published',
    details_button_text: 'বিস্তারিত',
    details_button_link: 'https://t.me/tamreen_academy',
    enroll_button_text: 'এখনই ভর্তি হন',
    enroll_button_link: 'https://tamreen.academy/enroll',
    enter_button_text: 'প্রবেশ করুন',
    sheet_button_text: 'শিট ডাউনলোড',
  });

  // Course Exam Form State
  const [examFormData, setExamFormData] = useState<{
    title: string;
    subject: string;
    question_count: number;
    time_minutes: number;
    total_marks: number;
    negative_marks: number;
    is_locked: boolean;
  }>({
    title: '',
    subject: 'আরবি',
    question_count: 20,
    time_minutes: 15,
    total_marks: 20,
    negative_marks: 0.25,
    is_locked: false,
  });

  // Course Sheet Form State
  const [sheetFormData, setSheetFormData] = useState<{
    title: string;
    pdf_url: string;
    file_size: string;
    page_count: string;
    badge_text: string;
    is_locked: boolean;
  }>({
    title: '',
    pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '২.৫ মেগাবাইট',
    page_count: '১৬ পেজ',
    badge_text: 'লেকচার নোট',
    is_locked: false,
  });

  const loadCourses = async () => {
    setLoading(true);
    const result = await fetchAllCourses();
    setCourses(result.courses);
    if (result.isTableMissing) {
      setIsTableMissing(true);
    } else {
      setIsTableMissing(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Open Course Create Modal
  const handleOpenCreateModal = () => {
    setEditingCourse(null);
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
      details_button_text: 'বিস্তারিত',
      details_button_link: 'https://t.me/tamreen_academy',
      enroll_button_text: 'এখনই ভর্তি হন',
      enroll_button_link: 'https://tamreen.academy/enroll',
      enter_button_text: 'প্রবেশ করুন',
      sheet_button_text: 'শিট ডাউনলোড',
    });
    setShowCourseModal(true);
  };

  // Open Course Edit Modal
  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category,
      badge: course.badge,
      badge_subtitle: course.badge_subtitle || '',
      instructor_name: course.instructor_name,
      price: course.price,
      enrolled_count: course.enrolled_count,
      total_classes: course.total_classes,
      total_sheets: course.total_sheets,
      total_exams: course.total_exams,
      theme_color: course.theme_color || 'emerald',
      features: course.features || [],
      newFeatureText: '',
      status: course.status,
      details_button_text: course.details_button_text || 'বিস্তারিত',
      details_button_link: course.details_button_link || '#',
      enroll_button_text: course.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_button_link: course.enroll_button_link || '#',
      enter_button_text: course.enter_button_text || 'প্রবেশ করুন',
      sheet_button_text: course.sheet_button_text || 'শিট ডাউনলোড',
    });
    setShowCourseModal(true);
  };

  // Handle Save Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('কোর্সের নাম লিখুন');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      badge: formData.badge,
      badge_subtitle: formData.badge_subtitle,
      instructor_name: formData.instructor_name,
      price: formData.price,
      enrolled_count: Number(formData.enrolled_count || 0),
      total_classes: Number(formData.total_classes || 0),
      total_sheets: Number(formData.total_sheets || 0),
      total_exams: Number(formData.total_exams || 0),
      theme_color: formData.theme_color,
      features: formData.features,
      status: formData.status,
      details_button_text: formData.details_button_text,
      details_button_link: formData.details_button_link,
      enroll_button_text: formData.enroll_button_text,
      enroll_button_link: formData.enroll_button_link,
      enter_button_text: formData.enter_button_text,
      sheet_button_text: formData.sheet_button_text,
    };

    if (editingCourse) {
      const res = await updateCourse(editingCourse.id, payload);
      if (res.error) {
        showToast(`সুপাবেস ওয়ার্নিং: ${res.error} (লোকাল ক্যাশে আপডেট হয়েছে)`, 'info');
      } else {
        showToast('কোর্সটি সফলভাবে আপডেট করা হয়েছে!', 'success');
      }
    } else {
      const res = await insertCourse(payload);
      if (res.error) {
        showToast(`সুপাবেস ওয়ার্নিং: ${res.error} (লোকাল ক্যাশে যুক্ত হয়েছে)`, 'info');
      } else {
        showToast('নতুন কোর্স সফলভাবে যুক্ত ও পাবলিশ করা হয়েছে!', 'success');
      }
    }

    setShowCourseModal(false);
    loadCourses();
  };

  // Handle Delete Course
  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${title}" কোর্সটি মুছে ফেলতে চান?`)) {
      await deleteCourse(courseId);
      showToast('কোর্সটি মুছে ফেলা হয়েছে', 'info');
      loadCourses();
    }
  };

  // Toggle Publish Status
  const handleToggleCourseStatus = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    await updateCourse(course.id, { status: newStatus });
    showToast(newStatus === 'published' ? 'কোর্সটি পাবলিশ করা হয়েছে' : 'কোর্সটি ড্রাফট করা হয়েছে', 'success');
    loadCourses();
  };

  // Add Feature Tag
  const handleAddFeature = () => {
    if (formData.newFeatureText.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, formData.newFeatureText.trim()],
        newFeatureText: '',
      });
    }
  };

  // Remove Feature Tag
  const handleRemoveFeature = (index: number) => {
    const updated = [...formData.features];
    updated.splice(index, 1);
    setFormData({ ...formData, features: updated });
  };

  // -------------------------------------------------------------
  // COURSE EXAMS MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenExamsModal = async (course: Course) => {
    setActiveCourseForExams(course);
    setShowExamModal(true);
    setExamLoading(true);
    const res = await fetchCourseExams(course.id);
    setCourseExams(res.exams);
    setExamLoading(false);
    setExamFormData({
      title: '',
      subject: course.category || 'আরবি',
      question_count: 20,
      time_minutes: 15,
      total_marks: 20,
      negative_marks: 0.25,
      is_locked: false,
    });
  };

  const handleAddCourseExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseForExams || !examFormData.title.trim()) return;

    await insertCourseExam({
      course_id: activeCourseForExams.id,
      title: examFormData.title.trim(),
      subject: examFormData.subject,
      question_count: Number(examFormData.question_count || 20),
      time_minutes: Number(examFormData.time_minutes || 15),
      total_marks: Number(examFormData.total_marks || 20),
      negative_marks: Number(examFormData.negative_marks || 0.25),
      is_locked: examFormData.is_locked,
      position: courseExams.length + 1,
    });

    setExamFormData({
      ...examFormData,
      title: '',
    });

    const res = await fetchCourseExams(activeCourseForExams.id);
    setCourseExams(res.exams);
    // Update count in courses
    updateCourse(activeCourseForExams.id, { total_exams: res.exams.length });
    loadCourses();
  };

  const handleToggleExamLock = async (exam: CourseExam) => {
    if (!activeCourseForExams) return;
    await updateCourseExam(exam.id, activeCourseForExams.id, { is_locked: !exam.is_locked });
    const res = await fetchCourseExams(activeCourseForExams.id);
    setCourseExams(res.exams);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!activeCourseForExams) return;
    if (confirm('পরীক্ষাটি মুছে ফেলতে চান?')) {
      await deleteCourseExam(examId, activeCourseForExams.id);
      const res = await fetchCourseExams(activeCourseForExams.id);
      setCourseExams(res.exams);
      updateCourse(activeCourseForExams.id, { total_exams: res.exams.length });
      loadCourses();
    }
  };

  // -------------------------------------------------------------
  // COURSE SHEETS MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenSheetsModal = async (course: Course) => {
    setActiveCourseForSheets(course);
    setShowSheetModal(true);
    setSheetLoading(true);
    const res = await fetchCourseSheets(course.id);
    setCourseSheets(res.sheets);
    setSheetLoading(false);
    setSheetFormData({
      title: '',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '৩.৫ মেগাবাইট',
      page_count: '২৪ পেজ',
      badge_text: 'লেকচার নোট',
      is_locked: false,
    });
  };

  const handleAddCourseSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseForSheets || !sheetFormData.title.trim()) return;

    await insertCourseSheet({
      course_id: activeCourseForSheets.id,
      title: sheetFormData.title.trim(),
      pdf_url: sheetFormData.pdf_url.trim() || '#',
      file_size: sheetFormData.file_size.trim() || '১.৫ মেগাবাইট',
      page_count: sheetFormData.page_count.trim() || '১০ পেজ',
      badge_text: sheetFormData.badge_text.trim() || 'লেকচার নোট',
      is_locked: sheetFormData.is_locked,
      position: courseSheets.length + 1,
    });

    setSheetFormData({
      ...sheetFormData,
      title: '',
    });

    const res = await fetchCourseSheets(activeCourseForSheets.id);
    setCourseSheets(res.sheets);
    // Update count in course
    updateCourse(activeCourseForSheets.id, { total_sheets: res.sheets.length });
    loadCourses();
  };

  const handleToggleSheetLock = async (sheet: CourseSheet) => {
    if (!activeCourseForSheets) return;
    await updateCourseSheet(sheet.id, activeCourseForSheets.id, { is_locked: !sheet.is_locked });
    const res = await fetchCourseSheets(activeCourseForSheets.id);
    setCourseSheets(res.sheets);
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!activeCourseForSheets) return;
    if (confirm('শিটটি মুছে ফেলতে চান?')) {
      await deleteCourseSheet(sheetId, activeCourseForSheets.id);
      const res = await fetchCourseSheets(activeCourseForSheets.id);
      setCourseSheets(res.sheets);
      updateCourse(activeCourseForSheets.id, { total_sheets: res.sheets.length });
      loadCourses();
    }
  };

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.badge.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'সকল' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const sqlCode = `-- Supabase SQL Setup for Course Control Center
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'আরবি প্রভাষক',
  badge TEXT NOT NULL DEFAULT 'রেকর্ড ব্যাচ',
  badge_subtitle TEXT DEFAULT '',
  instructor_name TEXT NOT NULL DEFAULT 'তামরীন ইনস্ট্রাক্টর টিম',
  price TEXT NOT NULL DEFAULT '৳৯৫০',
  enrolled_count INT DEFAULT 0,
  total_classes INT DEFAULT 0,
  total_sheets INT DEFAULT 0,
  total_exams INT DEFAULT 0,
  theme_color TEXT DEFAULT 'emerald',
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'published',
  details_button_text TEXT DEFAULT 'বিস্তারিত',
  details_button_link TEXT DEFAULT '#',
  enroll_button_text TEXT DEFAULT 'এখনই ভর্তি হন',
  enroll_button_link TEXT DEFAULT '#',
  enter_button_text TEXT DEFAULT 'প্রবেশ করুন',
  sheet_button_text TEXT DEFAULT 'শিট ডাউনলোড',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'আরবি',
  question_count INT DEFAULT 20,
  time_minutes INT DEFAULT 15,
  total_marks INT DEFAULT 20,
  negative_marks NUMERIC DEFAULT 0.25,
  is_locked BOOLEAN DEFAULT false,
  position INT DEFAULT 1,
  exam_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL DEFAULT '#',
  file_size TEXT DEFAULT '১.৫ মেগাবাইট',
  page_count TEXT DEFAULT '১০ পেজ',
  badge_text TEXT DEFAULT 'লেকচার নোট',
  is_locked BOOLEAN DEFAULT false,
  position INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add public access policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public insert courses" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update courses" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete courses" ON public.courses FOR DELETE USING (true);

CREATE POLICY "Allow public select course_exams" ON public.course_exams FOR SELECT USING (true);
CREATE POLICY "Allow public insert course_exams" ON public.course_exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update course_exams" ON public.course_exams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete course_exams" ON public.course_exams FOR DELETE USING (true);

CREATE POLICY "Allow public select course_sheets" ON public.course_sheets FOR SELECT USING (true);
CREATE POLICY "Allow public insert course_sheets" ON public.course_sheets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update course_sheets" ON public.course_sheets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete course_sheets" ON public.course_sheets FOR DELETE USING (true);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                এডমিন কোর্স কন্ট্রোল সেন্টার
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono border border-slate-700">
                Live Supabase Sync
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              কোর্স ও লাইভ ব্যাচ কন্ট্রোল
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              সুপাবেসের <code className="text-emerald-400 font-mono">public.courses</code>,{' '}
              <code className="text-emerald-400 font-mono">public.course_exams</code> এবং{' '}
              <code className="text-emerald-400 font-mono">public.course_sheets</code> টেবিলের সাথে সরাসরি যুক্ত ডায়নামিক কোর্স ম্যানেজমেন্ট প্যানেল।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 shadow-lg"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              সুপাবেস SQL কোড
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              নতুন কোর্স তৈরি করুন
            </button>
          </div>
        </div>

        {/* System Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">মোট কোর্স সংখ্যা</span>
              <span className="text-lg font-black text-white">{courses.length} টি</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">মোট নথিভুক্ত শিক্ষার্থী</span>
              <span className="text-lg font-black text-white">
                {courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0)} জন
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">কোর্স এক্সাম সংখ্যা</span>
              <span className="text-lg font-black text-white">
                {courses.reduce((acc, c) => acc + (c.total_exams || 0), 0)} টি
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">পিডিএফ শিট সংখ্যা</span>
              <span className="text-lg font-black text-white">
                {courses.reduce((acc, c) => acc + (c.total_sheets || 0), 0)} টি
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Local Storage / Supabase Warning Banner */}
      {isTableMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200">
                সুপাবেস ডাটাবেস টেবিল পেন্ডিং (লোকাল ক্যাশে অ্যাক্টিভ)
              </h4>
              <p className="text-slate-300 mt-0.5">
                সুপাবেসে <code className="text-amber-300 font-mono">public.courses</code> টেবিল না থাকা পর্যন্ত আপনার তৈরি সকল কোর্স লোকাল ব্রাউজারে সংরক্ষিত থাকবে। স্থায়ীভাবে সেভ করতে{' '}
                <button
                  onClick={() => setShowSqlModal(true)}
                  className="text-amber-400 underline font-bold hover:text-amber-300"
                >
                  SQL কোডটি দিয়ে টেবিল তৈরি করুন
                </button>।
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors"
          >
            SQL কোড দেখুন
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('সকল')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'সকল'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            সকল কোর্স ({courses.length})
          </button>
          {COURSE_CATEGORIES.map((cat) => {
            const count = courses.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কোর্সের নাম বা ইন্সট্রাক্টর খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">সুপাবেস থেকে কোর্স লোড করা হচ্ছে...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">কোনো কোর্স পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            আপনার অনুসন্ধানের সাথে মিল রেখে কোনো কোর্স খুঁজে পাওয়া যায়নি বা এখনও কোনো নতুন কোর্স তৈরি করা হয়নি।
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            প্রথম কোর্স তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const themeObj =
              COURSE_THEMES.find((t) => t.id === course.theme_color) || COURSE_THEMES[0];

            return (
              <div
                key={course.id}
                className={`bg-[#0a111e] border ${themeObj.border} rounded-3xl p-5 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden`}
              >
                {/* Background Subtle Gradient Glow */}
                <div
                  className={`absolute -top-24 -right-24 w-48 h-48 ${themeObj.bg} rounded-full blur-3xl pointer-events-none opacity-50`}
                />

                {/* Card Top Section */}
                <div>
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700/80 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {course.category}
                    </span>

                    <button
                      onClick={() => handleToggleCourseStatus(course)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                        course.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                      title="পাবলিশ স্ট্যাটাস টগল করুন"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          course.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {course.status === 'published' ? 'পাবলিশড' : 'ড্রাফট'}
                    </button>
                  </div>

                  {/* Main Title & Badge */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${themeObj.badgeBg}`}
                      >
                        {course.badge}
                      </span>
                      {course.badge_subtitle && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          &bull; {course.badge_subtitle}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug tracking-tight group-hover:text-emerald-300 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      ইন্সট্রাক্টর: <span className="text-slate-200">{course.instructor_name}</span>
                    </p>
                  </div>

                  {/* Price & Enrolled count pill */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">কোর্স ফি</span>
                      <span className={`text-base font-black ${themeObj.text}`}>{course.price}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">এনরোলড শিক্ষার্থী</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        {course.enrolled_count} জন
                      </span>
                    </div>
                  </div>

                  {/* Counts Grid (Classes, Sheets, Exams) */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
                      <span className="text-[10px] text-slate-400 block">ক্লাস</span>
                      <span className="text-xs font-bold text-white">{course.total_classes} টি</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
                      <span className="text-[10px] text-slate-400 block">পিডিএফ শিট</span>
                      <span className="text-xs font-bold text-white">{course.total_sheets} টি</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2">
                      <span className="text-[10px] text-slate-400 block">মডেল টেস্ট</span>
                      <span className="text-xs font-bold text-white">{course.total_exams} টি</span>
                    </div>
                  </div>

                  {/* Features Bullet List */}
                  {course.features && course.features.length > 0 && (
                    <div className="space-y-1.5 mb-5 bg-slate-950/40 rounded-2xl p-3 border border-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        কোর্স হাইলাইটস:
                      </span>
                      {course.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Button Labels Preview */}
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] space-y-1.5 mb-5">
                    <span className="text-[10px] font-extrabold text-emerald-400 block uppercase tracking-wider">
                      ডায়নামিক বাটন প্রিভিউ (Dynamic Action Buttons):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-slate-800/80 p-2 rounded-lg text-slate-300 truncate">
                        <span className="text-[9px] text-slate-500 block">আন-এনরোলড বাটন ১:</span>
                        <span className="font-bold text-white">{course.details_button_text || 'বিস্তারিত'}</span>
                      </div>
                      <div className="bg-emerald-950/60 border border-emerald-500/30 p-2 rounded-lg text-emerald-200 truncate">
                        <span className="text-[9px] text-emerald-400/80 block">আন-এনরোলড বাটন ২:</span>
                        <span className="font-bold text-emerald-300">{course.enroll_button_text || 'ভর্তি হন'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenExamsModal(course)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      পরীক্ষা ({course.total_exams})
                    </button>

                    <button
                      onClick={() => handleOpenSheetsModal(course)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      পিডিএফ শিট ({course.total_sheets})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(course)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      কোর্স এডিট
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                      title="কোর্স মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 1. CREATE / EDIT COURSE MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingCourse ? 'কোর্স এডিট করুন' : 'নতুন কোর্স তৈরি করুন'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    সুপাবেস <code className="text-emerald-400 font-mono">public.courses</code> টেবিলে সরাসরি সেভ হবে
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCourseModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourse} className="space-y-5">
              {/* Form Grid Section 1 */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />১. মূল কোর্স পরিচিতি ও শিক্ষক
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      কোর্সের নাম (Title) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ"
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
                      placeholder="যেমন: মুফতি শফিক উল্লাহ & টিম"
                      value={formData.instructor_name}
                      onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      কার্ডের প্রধান ব্যাজ (Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: 'রেকর্ড ব্যাচ' / 'এক্সাম ব্যাচ-১' / 'ফ্রি ব্যাচ'"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      সাব-ব্যাজ টেক্সট (Sub Badge Title)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: প্রিলি ও লিখিত প্রস্তুতি"
                      value={formData.badge_subtitle}
                      onChange={(e) => setFormData({ ...formData, badge_subtitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      কোর্স ফি (Price Text)
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
                      এনরোলকৃত আনুমানিক শিক্ষার্থী
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 1280"
                      value={formData.enrolled_count}
                      onChange={(e) =>
                        setFormData({ ...formData, enrolled_count: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Counts & Theme */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />২. কন্টেন্ট সংখ্যা ও কার্ডের থিম
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      মোট ক্লাস
                    </label>
                    <input
                      type="number"
                      value={formData.total_classes}
                      onChange={(e) =>
                        setFormData({ ...formData, total_classes: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      পিডিএফ শিট
                    </label>
                    <input
                      type="number"
                      value={formData.total_sheets}
                      onChange={(e) =>
                        setFormData({ ...formData, total_sheets: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      মডেল টেস্ট
                    </label>
                    <input
                      type="number"
                      value={formData.total_exams}
                      onChange={(e) =>
                        setFormData({ ...formData, total_exams: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      থিম কালার (Card Theme)
                    </label>
                    <select
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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

              {/* Section 3: Feature Highlights Array */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />৩. কোর্স বৈশিষ্ট্য / টপিক লিস্ট (Highlights)
                </h4>

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
                    যুক্ত করুন
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

              {/* Section 4: Dynamic Buttons & Actions */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />৪. ডায়নামিক বাটন টেক্সট ও লিংক (Action Buttons & Links)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  {/* Unenrolled Button 1 */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      'বিস্তারিত' বাটন টেক্সট
                    </label>
                    <input
                      type="text"
                      value={formData.details_button_text}
                      onChange={(e) => setFormData({ ...formData, details_button_text: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2"
                    />
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      'বিস্তারিত' টার্গেট লিংক
                    </label>
                    <input
                      type="text"
                      value={formData.details_button_link}
                      onChange={(e) => setFormData({ ...formData, details_button_link: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Unenrolled Button 2 */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      'এখনই ভর্তি হন' বাটন টেক্সট
                    </label>
                    <input
                      type="text"
                      value={formData.enroll_button_text}
                      onChange={(e) => setFormData({ ...formData, enroll_button_text: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2"
                    />
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      'ভর্তি হন' পেমেন্ট/ফর্ম লিংক
                    </label>
                    <input
                      type="text"
                      value={formData.enroll_button_link}
                      onChange={(e) => setFormData({ ...formData, enroll_button_link: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Enrolled Action Labels */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      এনরোলড 'প্রবেশ করুন' টেক্সট
                    </label>
                    <input
                      type="text"
                      value={formData.enter_button_text}
                      onChange={(e) => setFormData({ ...formData, enter_button_text: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      এনরোলড 'শিট ডাউনলোড' টেক্সট
                    </label>
                    <input
                      type="text"
                      value={formData.sheet_button_text}
                      onChange={(e) => setFormData({ ...formData, sheet_button_text: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
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
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {editingCourse ? 'কোর্স আপডেট করুন' : 'কোর্স সেভ করুন'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. COURSE EXAMS MANAGEMENT MODAL (`public.course_exams`) */}
      {/* --------------------------------------------------------------------- */}
      {showExamModal && activeCourseForExams && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    কোর্স মডেল টেস্ট ম্যানেজমেন্ট: {activeCourseForExams.title}
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">
                    সুপাবেস <code className="font-mono">public.course_exams</code> টেবিল
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExamModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Create Exam Form inside Course */}
            <form onSubmit={handleAddCourseExam} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> নতুন পরীক্ষা যুক্ত করুন
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="পরীক্ষার নাম (যেমন: মডেল টেস্ট ০১: আল কুরআন ও তাফসির)"
                    value={examFormData.title}
                    onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">বিষয়</label>
                  <input
                    type="text"
                    value={examFormData.subject}
                    onChange={(e) => setExamFormData({ ...examFormData, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">প্রশ্ন সংখ্যা</label>
                  <input
                    type="number"
                    value={examFormData.question_count}
                    onChange={(e) =>
                      setExamFormData({
                        ...examFormData,
                        question_count: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">সময় (মিনিট)</label>
                  <input
                    type="number"
                    value={examFormData.time_minutes}
                    onChange={(e) =>
                      setExamFormData({
                        ...examFormData,
                        time_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">মোট নম্বর</label>
                  <input
                    type="number"
                    value={examFormData.total_marks}
                    onChange={(e) =>
                      setExamFormData({
                        ...examFormData,
                        total_marks: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={examFormData.is_locked}
                    onChange={(e) => setExamFormData({ ...examFormData, is_locked: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span>পরীক্ষাটি লক্ড (পেইড ক্লায়েন্টের জন্য)</span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                >
                  পরীক্ষা যুক্ত করুন
                </button>
              </div>
            </form>

            {/* List of Exams inside Course */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">
                এই কোর্সে যুক্ত পরীক্ষাসমূহ ({courseExams.length} টি):
              </h4>

              {examLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">পরীক্ষা লোড হচ্ছে...</div>
              ) : courseExams.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  এখনও কোনো পরীক্ষা যুক্ত করা হয়নি।
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {courseExams.map((exam, index) => (
                    <div
                      key={exam.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-center leading-6 shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-white">{exam.title}</h5>
                          <span className="text-[11px] text-slate-400">
                            বিষয়: {exam.subject} &bull; প্রশ্ন: {exam.question_count}টি &bull; সময়:{' '}
                            {exam.time_minutes} মি.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleExamLock(exam)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                            exam.is_locked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {exam.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {exam.is_locked ? 'লকড' : 'আনলকড'}
                        </button>

                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowExamModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. COURSE SHEETS MANAGEMENT MODAL (`public.course_sheets`) */}
      {/* --------------------------------------------------------------------- */}
      {showSheetModal && activeCourseForSheets && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    পিডিএফ লেকচার শিট ও হ্যান্ডনোট: {activeCourseForSheets.title}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    সুপাবেস <code className="font-mono">public.course_sheets</code> টেবিল
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSheetModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Sheet Form */}
            <form onSubmit={handleAddCourseSheet} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> নতুন পিডিএফ শিট যুক্ত করুন
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="শিটের নাম (যেমন: অধ্যায় ১: আল কুরআন ও তাফসির স্পেশাল হ্যান্ডনোট)"
                    value={sheetFormData.title}
                    onChange={(e) => setSheetFormData({ ...sheetFormData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="url"
                    required
                    placeholder="পিডিএফ ডাউনলোড/ভিউ URL (যেমন: https://example.com/sheet.pdf)"
                    value={sheetFormData.pdf_url}
                    onChange={(e) => setSheetFormData({ ...sheetFormData, pdf_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">ফাইলের সাইজ</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩.৫ মেগাবাইট"
                    value={sheetFormData.file_size}
                    onChange={(e) => setSheetFormData({ ...sheetFormData, file_size: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">পেজ সংখ্যা</label>
                  <input
                    type="text"
                    placeholder="যেমন: ২৪ পেজ"
                    value={sheetFormData.page_count}
                    onChange={(e) => setSheetFormData({ ...sheetFormData, page_count: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={sheetFormData.is_locked}
                    onChange={(e) => setSheetFormData({ ...sheetFormData, is_locked: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span>শিটটি লক্ড (পেইড শিক্ষার্থীদের জন্য)</span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  পিডিএফ শিট যুক্ত করুন
                </button>
              </div>
            </form>

            {/* List of Sheets inside Course */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">
                এই কোর্সে যুক্ত লেকচার শিটসমূহ ({courseSheets.length} টি):
              </h4>

              {sheetLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">শিট লোড হচ্ছে...</div>
              ) : courseSheets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  এখনও কোনো শিট যুক্ত করা হয়নি।
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {courseSheets.map((sheet, index) => (
                    <div
                      key={sheet.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-center leading-6 shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-white">{sheet.title}</h5>
                          <span className="text-[11px] text-slate-400">
                            সাইজ: {sheet.file_size} &bull; পেজ: {sheet.page_count}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={sheet.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          ডাউনলোড
                        </a>

                        <button
                          onClick={() => handleToggleSheetLock(sheet)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                            sheet.is_locked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {sheet.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => handleDeleteSheet(sheet.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSheetModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. SUPABASE SQL CODE MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Supabase Course Tables SQL Schema</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              সুপাবেস ড্যাশবোর্ডের <span className="text-emerald-400 font-bold">SQL Editor</span>-এ নিচের কোডটি পেস্ট করে{' '}
              <span className="text-white font-bold">Run</span> বাটনে ক্লিক করুন। এটি সরাসরি{' '}
              <code className="text-emerald-300 font-mono">public.courses</code>,{' '}
              <code className="text-emerald-300 font-mono">public.course_exams</code> এবং{' '}
              <code className="text-emerald-300 font-mono">public.course_sheets</code> টেবিল তৈরি করে দিবে।
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-emerald-300 max-h-72 overflow-y-auto scrollbar-thin">
              <pre>{sqlCode}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                এক ক্লিকে কপি করে আপনার Supabase এ পেস্ট করুন।
              </span>

              <button
                onClick={copyToClipboard}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    কপি হয়েছে!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    কোড কপি করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
