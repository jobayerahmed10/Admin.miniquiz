import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Code,
  Check,
  Copy,
  X,
  Sparkles,
  Layers,
  FileText,
  Award,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import {
  Course,
  CourseExam,
  CourseSheet,
  COURSE_CATEGORIES,
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
  syncAllCoursesToSupabase,
  syncSingleCourseToSupabase,
  checkSupabaseHealth,
} from '../lib/supabase';
import { CourseCard } from '../components/course/CourseCard';
import { CourseModal } from '../components/course/CourseModal';
import { CourseExamsModal } from '../components/course/CourseExamsModal';
import { CourseSheetsModal } from '../components/course/CourseSheetsModal';
import { CourseDetailsModal } from '../components/course/CourseDetailsModal';
import { Cloud, CloudOff, Database, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';

export const CoursesManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingCourseId, setSyncingCourseId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalCourse, setDetailsModalCourse] = useState<Course | null>(null);
  const [detailsModalInitialTab, setDetailsModalInitialTab] = useState<'details' | 'routine' | 'syllabus' | 'exams' | 'sheets'>('details');

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

  const loadCourses = async () => {
    setLoading(true);
    const result = await fetchAllCourses();
    setCourses(result.courses);
    setIsTableMissing(!!result.isTableMissing);
    setIsSupabaseConnected(result.isSupabaseConnected !== false);
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Sync all courses to Supabase
  const handleSyncAllCourses = async () => {
    setIsSyncingAll(true);
    const res = await syncAllCoursesToSupabase();
    setIsSyncingAll(false);

    if (res.failed === 0) {
      showToast(`অভিনন্দন! মোট ${res.synced} টি কোর্স সফলভাবে সুপাবেজ ক্লাউডে আপলোড ও সিঙ্ক হয়েছে! এখন স্টুডেন্ট অ্যাপে দেখা যাবে।`, 'success');
    } else if (res.synced > 0) {
      showToast(`${res.synced} টি কোর্স সিঙ্ক হয়েছে, তবে ${res.failed} টি ব্যর্থ হয়েছে। SQL কোড চেক করুন।`, 'info');
      if (res.errors.length > 0) {
        setIsTableMissing(true);
      }
    } else {
      showToast(`সুপাবেজে সিঙ্ক ব্যর্থ: ${res.errors[0] || 'SQL স্কিমা চেক করুন'}`, 'error');
      setIsTableMissing(true);
      setShowSqlModal(true);
    }
    await loadCourses();
  };

  // Sync a single course to Supabase
  const handleSyncSingleCourse = async (course: Course) => {
    setSyncingCourseId(course.id);
    const res = await syncSingleCourseToSupabase(course);
    setSyncingCourseId(null);

    if (res.success) {
      showToast(`"${course.title}" কোর্সটি সফলভাবে সুপাবেজে আপলোড হয়েছে! স্টুডেন্ট অ্যাপে এখন দেখা যাবে।`, 'success');
    } else {
      showToast(`সিঙ্ক ব্যর্থ: ${res.error || 'SQL স্কিমা চেক করুন'}`, 'error');
      setShowSqlModal(true);
    }
    await loadCourses();
  };

  // Open Course Create Modal
  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setShowCourseModal(true);
  };

  // Open Course Edit Modal
  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  // Handle Save Course (Create or Update)
  const handleSaveCourse = async (coursePayload: any) => {
    if (editingCourse) {
      const res = await updateCourse(editingCourse.id, coursePayload);
      if (res.error) {
        showToast(res.error, 'error');
        if (res.error.includes('টেবিল তৈরি করা নেই') || res.error.includes('does not exist') || res.error.includes('courses')) {
          setIsTableMissing(true);
          setShowSqlModal(true);
        }
      } else {
        showToast('কোর্স ও বাটন কন্টেন্ট সফলভাবে সুপাবেজে আপডেট করা হয়েছে!', 'success');
      }
    } else {
      const res = await insertCourse(coursePayload);
      if (!res.success && res.error) {
        showToast(res.error, 'error');
        if (res.error.includes('টেবিল তৈরি করা নেই') || res.error.includes('does not exist') || res.error.includes('courses')) {
          setIsTableMissing(true);
          setShowSqlModal(true);
        }
      } else {
        showToast('নতুন কোর্স সফলভাবে সুপাবেজ (Supabase) ডাটাবেসে সেভ হয়েছে!', 'success');
      }
    }
    await loadCourses();
  };

  // Handle Delete Course
  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${title}" কোর্সটি মুছে ফেলতে চান?`)) {
      await deleteCourse(courseId);
      showToast('কোর্সটি মুছে ফেলা হয়েছে', 'info');
      await loadCourses();
    }
  };

  // Open Course Details Inside Modal
  const handleOpenDetailsModal = (
    course: Course,
    tab: 'details' | 'routine' | 'syllabus' | 'exams' | 'sheets' = 'details'
  ) => {
    setDetailsModalCourse(course);
    setDetailsModalInitialTab(tab);
    setShowDetailsModal(true);
  };

  // Toggle Publish Status
  const handleToggleCourseStatus = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    const res = await updateCourse(course.id, { status: newStatus });
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(newStatus === 'published' ? 'কোর্সটি পাবলিশ করা হয়েছে' : 'কোর্সটি ড্রাফট করা হয়েছে', 'success');
    }
    await loadCourses();
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
  };

  const handleAddCourseExam = async (examData: Omit<CourseExam, 'id' | 'created_at'>) => {
    if (!activeCourseForExams) return;
    const res = await insertCourseExam(examData);
    if (!res.success && res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('নতুন মডেল টেস্ট পরীক্ষা সফলভাবে সুপাবেজে যুক্ত হয়েছে!', 'success');
    }
    const examRes = await fetchCourseExams(activeCourseForExams.id);
    setCourseExams(examRes.exams);
    await updateCourse(activeCourseForExams.id, { total_exams: examRes.exams.length });
    loadCourses();
  };

  const handleUpdateCourseExam = async (id: string, updatedFields: Partial<CourseExam>) => {
    if (!activeCourseForExams) return;
    const res = await updateCourseExam(id, activeCourseForExams.id, updatedFields);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('পরীক্ষার তথ্য আপডেট হয়েছে!', 'success');
    }
    const examRes = await fetchCourseExams(activeCourseForExams.id);
    setCourseExams(examRes.exams);
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
      await updateCourse(activeCourseForExams.id, { total_exams: res.exams.length });
      loadCourses();
      showToast('পরীক্ষাটি মুছে ফেলা হয়েছে', 'info');
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
  };

  const handleAddCourseSheet = async (sheetData: Omit<CourseSheet, 'id' | 'created_at'>) => {
    if (!activeCourseForSheets) return;
    const res = await insertCourseSheet(sheetData);
    if (!res.success && res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('পিডিএফ লেকচার শিট সফলভাবে সুপাবেজে যুক্ত হয়েছে!', 'success');
    }
    const sheetRes = await fetchCourseSheets(activeCourseForSheets.id);
    setCourseSheets(sheetRes.sheets);
    await updateCourse(activeCourseForSheets.id, { total_sheets: sheetRes.sheets.length });
    loadCourses();
  };

  const handleUpdateCourseSheet = async (id: string, updatedFields: Partial<CourseSheet>) => {
    if (!activeCourseForSheets) return;
    const res = await updateCourseSheet(id, activeCourseForSheets.id, updatedFields);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('শিটের তথ্য আপডেট হয়েছে!', 'success');
    }
    const sheetRes = await fetchCourseSheets(activeCourseForSheets.id);
    setCourseSheets(sheetRes.sheets);
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
      await updateCourse(activeCourseForSheets.id, { total_sheets: res.sheets.length });
      loadCourses();
      showToast('শিট মুছে ফেলা হয়েছে', 'info');
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

  const sqlCode = `-- ==========================================
-- TAMREEN ACADEMY - SUPABASE COURSES SQL SCHEMA
-- (Creates new tables AND automatically adds any missing columns)
-- ==========================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'আরবি প্রভাষক',
  badge TEXT DEFAULT 'রেকর্ড ব্যাচ',
  badge_subtitle TEXT,
  instructor_name TEXT DEFAULT 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
  price TEXT DEFAULT '৳৯৫০',
  enrolled_count INTEGER DEFAULT 0,
  total_classes INTEGER DEFAULT 0,
  total_sheets INTEGER DEFAULT 0,
  total_exams INTEGER DEFAULT 0,
  theme_color TEXT DEFAULT 'emerald',
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'published',
  description TEXT,
  about_text TEXT,
  routine_text TEXT,
  routine_pdf_url TEXT,
  routine_pdf_name TEXT,
  syllabus_text TEXT,
  syllabus_pdf_url TEXT,
  syllabus_pdf_name TEXT,
  leaderboard_enabled BOOLEAN DEFAULT true,
  leaderboard_info TEXT,
  helpline_contact TEXT,
  details_button_text TEXT DEFAULT 'বিস্তারিত',
  details_button_link TEXT DEFAULT '#',
  enroll_button_text TEXT DEFAULT 'এখনই ভর্তি হন',
  enroll_button_link TEXT DEFAULT '#',
  enter_button_text TEXT DEFAULT 'প্রবেশ করুন',
  sheet_button_text TEXT DEFAULT 'শিট ডাউনলোড',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ADD ALL MISSING COLUMNS IF 'courses' TABLE ALREADY EXISTS
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'আরবি প্রভাষক';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'রেকর্ড ব্যাচ';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS badge_title TEXT DEFAULT 'রেকর্ড ব্যাচ';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS badge_subtitle TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name TEXT DEFAULT 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price TEXT DEFAULT '৳৯৫০';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_classes INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS classes_count INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_sheets INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sheets_count INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_exams INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS exams_count INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'emerald';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine_text TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine_description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine_pdf_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine_pdf TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS routine_pdf_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus_text TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus_description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus_pdf_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus_pdf TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus_pdf_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS leaderboard_info TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS helpline_contact TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS details_button_text TEXT DEFAULT 'বিস্তারিত';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS details_text TEXT DEFAULT 'বিস্তারিত';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS details_button_link TEXT DEFAULT '#';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS details_link TEXT DEFAULT '#';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enroll_button_text TEXT DEFAULT 'এখনই ভর্তি হন';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enroll_text TEXT DEFAULT 'এখনই ভর্তি হন';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enroll_button_link TEXT DEFAULT '#';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enroll_link TEXT DEFAULT '#';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enter_button_text TEXT DEFAULT 'প্রবেশ করুন';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enter_text TEXT DEFAULT 'প্রবেশ করুন';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sheet_button_text TEXT DEFAULT 'শিট ডাউনলোড';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sheet_text TEXT DEFAULT 'শিট ডাউনলোড';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. COURSE EXAMS TABLE (With Question Builder)
CREATE TABLE IF NOT EXISTS public.course_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT DEFAULT 'আরবি',
  topic TEXT,
  question_count INTEGER DEFAULT 20,
  time_minutes INTEGER DEFAULT 15,
  total_marks INTEGER DEFAULT 20,
  pass_marks INTEGER DEFAULT 10,
  negative_marks NUMERIC DEFAULT 0.25,
  is_locked BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 1,
  instructions TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  exam_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ADD ALL MISSING COLUMNS IF 'course_exams' TABLE ALREADY EXISTS
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'আরবি';
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 20;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 20;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS time_minutes INTEGER DEFAULT 15;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 15;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 15;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS total_marks INTEGER DEFAULT 20;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS full_marks INTEGER DEFAULT 20;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS pass_marks INTEGER DEFAULT 10;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS pass_mark INTEGER DEFAULT 10;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS negative_marks NUMERIC DEFAULT 0.25;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS negative_mark NUMERIC DEFAULT 0.25;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS serial INTEGER DEFAULT 1;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS exam_id TEXT;
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.course_exams ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 3. COURSE SHEETS TABLE (PDF Handnotes & Lectures)
CREATE TABLE IF NOT EXISTS public.course_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'আরবি প্রভাষক',
  badge TEXT DEFAULT 'লেকচার শিট',
  pdf_url TEXT,
  file_name TEXT,
  file_size TEXT DEFAULT '১.২ মেগাবাইট',
  total_pages INTEGER DEFAULT 12,
  is_locked BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ADD ALL MISSING COLUMNS IF 'course_sheets' TABLE ALREADY EXISTS
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'আরবি';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'আরবি প্রভাষক';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'লেকচার শিট';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'লেকচার শিট';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS pdf_link TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS pdf_name TEXT;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS file_size TEXT DEFAULT '১.২ মেগাবাইট';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 12;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS page_count TEXT DEFAULT '১২ পেজ';
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1;
ALTER TABLE public.course_sheets ADD COLUMN IF NOT EXISTS serial INTEGER DEFAULT 1;

-- 4. COURSE APPLICATIONS TABLE (Enrollment & Payments)
CREATE TABLE IF NOT EXISTS public.course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  course_title TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'bKash',
  amount NUMERIC DEFAULT 0,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS POLICIES (Full Access)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on courses" ON public.courses;
CREATE POLICY "Allow public all access on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on course_exams" ON public.course_exams;
CREATE POLICY "Allow public all access on course_exams" ON public.course_exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on course_sheets" ON public.course_sheets;
CREATE POLICY "Allow public all access on course_sheets" ON public.course_sheets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on course_applications" ON public.course_applications;
CREATE POLICY "Allow public all access on course_applications" ON public.course_applications FOR ALL USING (true) WITH CHECK (true);

-- 6. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a111e] border border-slate-800/80 p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                কোর্স ও বাটন কনফিগারেশন প্যানেল
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                লাইভ মোড
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              কোর্সের প্রতিটি বাটন (বিস্তারিত টেক্সট, রুটিন PDF, সিলেবাস PDF, পরীক্ষা ও লেকচার শিট) আলাদাভাবে সাজান
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap z-10">
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Supabase SQL স্কিমা</span>
          </button>

          <button
            onClick={handleSyncAllCourses}
            disabled={isSyncingAll}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            title="সব কোর্স সুপাবেজে আপলোড ও সিঙ্ক করুন"
          >
            <Cloud className={`w-4 h-4 text-emerald-400 ${isSyncingAll ? 'animate-bounce' : ''}`} />
            <span>{isSyncingAll ? 'সুপাবেজে সিঙ্ক হচ্ছে...' : 'সব কোর্স সুপাবেজে সিঙ্ক করুন'}</span>
          </button>

          <button
            onClick={loadCourses}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কোর্স তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* Supabase Live App Sync Diagnostic Banner */}
      <div className="bg-[#0b1322] border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">স্টুডেন্ট অ্যাপ ও সুপাবেজ ক্লাউড সংযোগ:</span>
              {isSupabaseConnected && !isTableMissing ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  সুপাবেজ ক্লাউড সংযুক্ত
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  সুপাবেজে টেবিল তৈরি বা কানেকশন প্রয়োজন
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              মোট কোর্স: <strong className="text-white">{courses.length}</strong> টি &bull;{' '}
              সুপাবেজ ক্লাউডে সক্রিয়: <strong className="text-emerald-400">{courses.filter((c) => c.is_synced_to_supabase !== false).length}</strong> টি &bull;{' '}
              লোকাল ব্রাউজারে: <strong className="text-amber-400">{courses.filter((c) => c.is_synced_to_supabase === false).length}</strong> টি
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {courses.some((c) => c.is_synced_to_supabase === false) && (
            <button
              onClick={handleSyncAllCourses}
              disabled={isSyncingAll}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>লোকাল কোর্সগুলো অ্যাপে সিঙ্ক করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Database Setup Notice if tables missing */}
      {isTableMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-amber-200 text-xs space-y-3">
          <div className="flex items-center gap-3 font-bold text-amber-300 text-sm">
            <span>⚠️ Supabase-এ কোর্স টেবিল তৈরি করা প্রয়োজন (অ্যাপে ডাটা না যাওয়ার কারণ)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            এডমিন প্যানেলে তৈরি করা কোর্স মোবাইল অ্যাপে প্রদর্শিত হওয়ার জন্য আপনার Supabase ডাটাবেসে{' '}
            <code className="text-amber-400 font-mono">public.courses</code>,{' '}
            <code className="text-amber-400 font-mono">public.course_exams</code> এবং{' '}
            <code className="text-amber-400 font-mono">public.course_sheets</code> টেবিল তৈরি থাকতে হবে।
            নিচের বাটনে ক্লিক করে প্রস্তুতকৃত SQL কোডটি কপি করে Supabase ড্যাশবোর্ডের <strong>SQL Editor</strong> এ গিয়ে <strong>Run</strong> বাটনে চাপ দিন।
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              SQL কোড দেখুন ও কপি করুন
            </button>
            <button
              onClick={handleSyncAllCourses}
              disabled={isSyncingAll}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-emerald-400' : ''}`} />
              SQL রান করার পর এখানে ক্লিক করুন
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0a111e] border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="কোর্স বা শিক্ষকের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['সকল', ...COURSE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span>কোর্স লোড হচ্ছে...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center bg-[#0a111e] rounded-3xl border border-slate-800/80 space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">কোনো কোর্স পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            আপনার অ্যাকাউন্টে নতুন কোর্স তৈরি করতে উপরের "নতুন কোর্স তৈরি করুন" বাটনে ক্লিক করুন।
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            প্রথম কোর্স তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEditCourse={handleOpenEditModal}
              onDeleteCourse={handleDeleteCourse}
              onToggleStatus={handleToggleCourseStatus}
              onManageExams={handleOpenExamsModal}
              onManageSheets={handleOpenSheetsModal}
              onViewDetails={handleOpenDetailsModal}
              onSyncCourse={handleSyncSingleCourse}
              isSyncing={syncingCourseId === course.id}
            />
          ))}
        </div>
      )}

      {/* Course Inside Content & Details Modal */}
      {detailsModalCourse && (
        <CourseDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsModalCourse(null);
          }}
          course={detailsModalCourse}
          initialTab={detailsModalInitialTab}
          onEditCourse={(course) => {
            setShowDetailsModal(false);
            handleOpenEditModal(course);
          }}
          onManageExams={(course) => {
            setShowDetailsModal(false);
            handleOpenExamsModal(course);
          }}
          onManageSheets={(course) => {
            setShowDetailsModal(false);
            handleOpenSheetsModal(course);
          }}
        />
      )}

      {/* Course Edit/Create Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
      />

      {/* Exams Management & Question Builder Modal */}
      {activeCourseForExams && (
        <CourseExamsModal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            setActiveCourseForExams(null);
          }}
          course={activeCourseForExams}
          exams={courseExams}
          loading={examLoading}
          onAddExam={handleAddCourseExam}
          onUpdateExam={handleUpdateCourseExam}
          onDeleteExam={handleDeleteExam}
          onToggleLock={handleToggleExamLock}
        />
      )}

      {/* Sheets Management Modal */}
      {activeCourseForSheets && (
        <CourseSheetsModal
          isOpen={showSheetModal}
          onClose={() => {
            setShowSheetModal(false);
            setActiveCourseForSheets(null);
          }}
          course={activeCourseForSheets}
          sheets={courseSheets}
          loading={sheetLoading}
          onAddSheet={handleAddCourseSheet}
          onUpdateSheet={handleUpdateCourseSheet}
          onDeleteSheet={handleDeleteSheet}
          onToggleLock={handleToggleSheetLock}
        />
      )}

      {/* Supabase SQL Schema Modal */}
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
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border text-white shadow-2xl animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-[#1e0a0a] border-rose-500/50 text-rose-100'
              : toastMessage.type === 'info'
              ? 'bg-[#0a1526] border-sky-500/50 text-sky-100'
              : 'bg-slate-900 border-emerald-500/30 text-emerald-100'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toastMessage.type === 'error'
                ? 'bg-rose-500/20 text-rose-400'
                : toastMessage.type === 'info'
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
