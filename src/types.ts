export type QuestionStatus = 'published' | 'draft';

export interface Question {
  id: string | number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // 'option_a' | 'option_b' | 'option_c' | 'option_d' or 'a' | 'b' | 'c' | 'd' or exact option text
  explanation?: string | null;
  slug?: string | null;
  status: QuestionStatus;
  subject?: string | null; // বিষয় (যেমন: বাংলা, ইংরেজি, ইত্যাদি)
  topic?: string | null; // টপিক (যেমন: কারক ও বিভক্তি, ব্যাকরণ)
  post?: string | null; // পদ / পদের নাম (যেমন: সহকারী শিক্ষক, প্রভাষক)
  exam_id?: string | number | null; // এই প্রশ্নটি নির্দিষ্ট কোনো মডেল টেস্টের অন্তর্ভুক্ত কি না
  created_at?: string;
  updated_at?: string;
}

export type ExamBadgeType = 'free' | 'daily' | 'weekly' | 'live';
export type ExamStatus = 'active' | 'draft' | 'upcoming';

export interface Exam {
  id: string;
  title: string;
  badge: string;
  badge_type: ExamBadgeType;
  subject: string;
  topic?: string | null;
  post?: string | null;
  pass_mark?: number;
  exam_type?: 'free' | 'course' | string;
  exam_format?: string | null; // e.g. 'MCQ (বহুনির্বাচনি)'
  category?: string;
  question_count: number;
  time_minutes: number;
  negative_marks: number;
  has_negative_marking?: boolean;
  marks_per_question?: number;
  total_marks: number;
  start_date?: string | null;
  end_date?: string | null;
  max_attempts?: number | null;
  instructions?: string | null;
  description?: string | null;
  id_pattern?: string | null; // e.g. 'Q-BANGLA-'
  status: ExamStatus;
  question_ids?: (string | number)[];
  questions?: Question[];
  created_at?: string;
  updated_at?: string;
}

export const EXAM_CATEGORIES = [
  'ফ্রি ট্রায়াল টেস্ট (Free Test)',
  'দৈনিক মডেল টেস্ট (Daily Test)',
  'সাপ্তাহিক মেগা টেস্ট (Weekly Mega)',
  'বিষয়ভিত্তিক টেস্ট (Subject-wise)',
  'লাইভ পরীক্ষা (Live Exam)',
  'চাকরি প্রস্তুতি স্পেশাল',
];

export const QUICK_SUBJECT_SUGGESTIONS = [
  'আল কুরআন ও তাফসির',
  'হাদিস শরিফ ও উসুলুল হাদিস',
  'ফিকহুল ইসলামী ও ফরায়েজ',
  'আরবি ব্যাকরণ (নাহু ও সরফ)',
  'আরবি সাহিত্য ও তরজমা',
  'বাংলা সাহিত্য ও ব্যাকরণ',
  'ইংরেজি ভাষা ও সাহিত্য',
  'গণিত ও মানসিক দক্ষতা',
  'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)',
  'তথ্যপ্রযুক্তি ও কম্পিউটার',
];

export const QUICK_POST_SUGGESTIONS = [
  'সহকারী শিক্ষক',
  'প্রভাষক',
  'সহকারী মৌলভী',
  'জুনিয়র মৌলভী',
  'ইবতেদায়ী প্রধান',
  'অফিস সহকারী',
  'বিসিএস ও সরকারি চাকরি',
  'সাধারণ',
];

export const EXAM_BADGE_OPTIONS: { type: ExamBadgeType; label: string; defaultBadgeText: string }[] = [
  { type: 'free', label: 'ফ্রি পরীক্ষা (Free)', defaultBadgeText: 'ফ্রি পরীক্ষা' },
  { type: 'daily', label: 'দৈনিক মডেল টেস্ট (Daily)', defaultBadgeText: 'দৈনিক মডেল টেস্ট' },
  { type: 'weekly', label: 'সাপ্তাহিক মডেল টেস্ট (Weekly)', defaultBadgeText: 'সাপ্তাহিক মডেল টেস্ট' },
  { type: 'live', label: 'লাইভ পরীক্ষা (Live)', defaultBadgeText: 'লাইভ টেস্ট' },
];

export const DEFAULT_SUBJECTS = [
  'বাংলা',
  'বাংলা ভাষা ও সাহিত্য',
  'ইংরেজি',
  'গণিত',
  'সাধারণ জ্ঞান',
  'বাংলাদেশ বিষয়াবলী',
  'আন্তর্জাতিক বিষয়াবলী',
  'বিজ্ঞান',
  'কম্পিউটার ও তথ্যপ্রযুক্তি',
  'ভূগোল ও পরিবেশ',
  'নৈতিকতা ও সুশাসন',
  'আল কুরআন ও হাদিস',
  'আল কুরআন ও তাফসির',
  'ইসলাম শিক্ষা',
  'আরবি',
  'সহকারী মৌলভী',
  'ইবতেদায়ী মৌলবি',
  'অন্যান্য',
];

export const DEFAULT_TOPICS = [
  'কারক ও বিভক্তি',
  'সমাস ও সন্ধি',
  'শব্দ ও বাক্য',
  'বাংলা সাহিত্য',
  'Parts of Speech & Tense',
  'Vocabulary & Synonyms',
  'পাটিগণিত (শতকরা, লাভ-ক্ষতি)',
  'বীজগণিত (মান নির্ণয়)',
  'জ্যামিতি ও পরিমিতি',
  'মুক্তিযুদ্ধ ও বাংলা ঐতিহ্য',
  'আন্তর্জাতিক অঙ্গন',
  'সাধারণ বিজ্ঞান ও প্রযুক্তি',
  'আল কুরআন ও হাদিস',
  'অন্যান্য',
];

export const DEFAULT_POSTS = [
  'সহকারী শিক্ষক (প্রাইমারি)',
  'প্রভাষক (NTRCA)',
  'সহকারী শিক্ষক (হাইস্কুল)',
  'বিসিএস ক্যাডার (BCS)',
  '১০ম - ২০তম গ্রেড',
  'ব্যাংক কর্মকর্তা (Officer)',
  'অফিস সহকারী',
  'অন্যান্য',
];

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface CourseExamQuestion {
  id?: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string | null;
  subject?: string;
  topic?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string; // 'আরবি প্রভাষক' | 'সহকারী মৌলভী' | 'ইবতেদায়ী মৌলবি' | 'জেনারেল বিষয়' | etc
  badge: string; // 'রেকর্ড ব্যাচ' | 'এক্সাম ব্যাচ-১' | 'ফ্রি ব্যাচ'
  badge_subtitle?: string | null;
  instructor_name: string;
  price: string;
  enrolled_count: number;
  total_classes: number;
  total_sheets: number;
  total_exams: number;
  theme_color: 'emerald' | 'purple' | 'amber' | 'indigo' | 'rose' | string;
  features: string[]; // List of key features/highlights
  status: 'published' | 'draft' | 'archived';

  // আপকামিং ও সময় সেটিংস (Upcoming Course Settings)
  is_upcoming?: boolean;
  upcoming_date?: string; // Launch or class start date-time (ISO format, e.g. '2026-09-01T20:00')
  upcoming_badge_text?: string; // Custom badge e.g. 'আপকামিং ব্যাচ' | 'শীঘ্রই আসছে'
  upcoming_note?: string; // e.g. '১ সেপ্টেম্বর থেকে লাইভ ক্লাস শুরু'

  // 1. কোর্স সম্পর্কে বিস্তারিত (Course Details & Description)
  description?: string;
  about_text?: string;

  // 2. রুটিন (Routine - Text & PDF)
  routine_text?: string;
  routine_pdf_url?: string;
  routine_pdf_name?: string;

  // 3. সিলেবাস (Syllabus - Text & PDF)
  syllabus_text?: string;
  syllabus_pdf_url?: string;
  syllabus_pdf_name?: string;

  // 4. লিডারবোর্ড ও অন্যান্য সেটিংস
  leaderboard_enabled?: boolean;
  leaderboard_info?: string;

  // বাটন ও লিংকসমূহ
  details_button_text?: string;
  details_button_link?: string;
  enroll_button_text?: string;
  enroll_button_link?: string;
  enter_button_text?: string;
  sheet_button_text?: string;
  helpline_contact?: string;

  is_synced_to_supabase?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseExam {
  id: string;
  course_id: string;
  title: string;
  subject: string;
  topic?: string;
  question_count: number;
  time_minutes: number;
  total_marks: number;
  pass_marks?: number;
  negative_marks: number;
  is_locked: boolean;
  position?: number;
  exam_id?: string | null;
  questions?: CourseExamQuestion[];
  instructions?: string;
  is_synced_to_supabase?: boolean;
  created_at?: string;
}

export interface CourseSheet {
  id: string;
  course_id: string;
  title: string;
  subject?: string;
  topic?: string;
  pdf_url: string;
  pdf_name?: string;
  file_size: string;
  page_count: string;
  badge_text?: string;
  is_locked: boolean;
  position?: number;
  is_synced_to_supabase?: boolean;
  created_at?: string;
}

export const COURSE_CATEGORIES = [
  'আরবি প্রভাষক',
  'সহকারী মৌলভী',
  'ইবতেদায়ী মৌলবি',
  'জেনারেল বিষয়',
  'বিসিএস ও প্রাইমারি',
  'অন্যান্য',
];

export const COURSE_THEMES = [
  { id: 'emerald', label: 'এমেরাল্ড (Emerald Green)', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badgeBg: 'bg-emerald-500 text-slate-950' },
  { id: 'purple', label: 'পার্পল (Purple Royal)', border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400', badgeBg: 'bg-purple-500 text-white' },
  { id: 'amber', label: 'অ্যাম্বার (Amber Gold)', border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-300', badgeBg: 'bg-amber-500 text-slate-950' },
  { id: 'indigo', label: 'ইন্ডিগো (Indigo Deep)', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-400', badgeBg: 'bg-indigo-500 text-white' },
  { id: 'rose', label: 'রোজ (Rose Pink)', border: 'border-rose-500/40', bg: 'bg-rose-500/10', text: 'text-rose-400', badgeBg: 'bg-rose-500 text-white' },
];

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface CourseApplication {
  id: string;
  student_name: string;
  phone_number: string;
  course_title: string;
  course_id?: string | null;
  payment_method: string; // 'bKash' | 'Nagad' | 'Rocket' | 'Upay' etc
  amount: number;
  transaction_id: string;
  status: ApplicationStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  totalExams?: number;
  activeExams?: number;
}

export interface StudentUser {
  id: string; // Unique student ID e.g. AT-2026-XXXX or UUID
  student_id_code: string; // Formatted student ID (e.g. AT-2026-9814)
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  target_exam?: string; // e.g. 'NTRCA প্রভাষক (আরবি)' | 'সহকারী মৌলভী'
  enrolled_courses?: string[];
  total_exams_taken?: number;
  avg_score?: number;
  study_streak_days?: number;
  total_study_minutes?: number;
}

export interface SubjectPerformance {
  subject: string;
  total_questions: number;
  correct_count: number;
  accuracy_pct: number;
  mastery_level: 'weak' | 'moderate' | 'strong';
}

export interface ExamAttemptRecord {
  id: string;
  exam_id: string;
  exam_title: string;
  subject: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  total_marks: number;
  date: string;
}

export interface StudentDashboardGrowthData {
  student: StudentUser;
  totalExamsTaken: number;
  totalQuestionsSolved: number;
  overallAccuracyPct: number;
  avgScore: number;
  studyStreakDays: number;
  totalStudyHours: number;
  subjectPerformances: SubjectPerformance[];
  recentAttempts: ExamAttemptRecord[];
  strengths: string[];
  weaknesses: string[];
}

export interface SyllabusTopic {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  estimated_questions?: number;
  subject_id?: string;
}

export interface SubjectPost {
  id: string; // Unique identifier slug (e.g. 'arabic_lecturer', 'math_teacher' or UUID)
  name: string; // Subject/Post title (e.g. "আরবি প্রভাষক প্রস্তুতি", "বাংলা প্রভাষক")
  code: string; // Post/Subject Code (e.g. "৩০০", "৩১১", "আবশ্যিক")
  tagline?: string; // Short badge/level label (e.g. "মাদ্রাসা ও কলেজ পর্যায়")
  badge?: string; // e.g. "প্রভাষক আরবি • কোড: ৩০০"
  subtitle?: string; // Summary of topics or subject coverage
  description?: string; // Detailed post description
  theme_color?: string; // e.g. '#6366F1' or theme identifier
  gradient?: string; // e.g. 'from-emerald-600 to-teal-500'
  gradient_class?: string; // Tailwind class e.g. 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25'
  icon_name?: string; // Lucide icon name (e.g. 'BookOpenCheck', 'GraduationCap', 'BookMarked', 'ScrollText', 'Library')
  status: 'active' | 'draft';
  order_index?: number;
  topics: SyllabusTopic[];
  created_at?: string;
  updated_at?: string;
}




