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
  status: QuestionStatus;
  subject?: string | null; // বিষয় (যেমন: বাংলা, ইংরেজি, ইত্যাদি)
  topic?: string | null; // টপিক (যেমন: কারক ও বিভক্তি, ব্যাকরণ)
  post?: string | null; // পদ / পদের নাম (যেমন: সহকারী শিক্ষক, প্রভাষক)
  exam_id?: string | number | null; // এই প্রশ্নটি নির্দিষ্ট কোনো মডেল টেস্টের অন্তর্ভুক্ত কি না
  created_at?: string;
  updated_at?: string;
}

export type ExamBadgeType = 'free' | 'daily' | 'weekly' | 'live';
export type ExamStatus = 'active' | 'draft';

export interface Exam {
  id: string;
  title: string;
  badge: string;
  badge_type: ExamBadgeType;
  subject: string;
  question_count: number;
  time_minutes: number;
  negative_marks: number;
  total_marks: number;
  description?: string | null;
  status: ExamStatus;
  question_ids?: (string | number)[];
  questions?: Question[];
  created_at?: string;
  updated_at?: string;
}

export const EXAM_BADGE_OPTIONS: { type: ExamBadgeType; label: string; defaultBadgeText: string }[] = [
  { type: 'free', label: 'ফ্রি পরীক্ষা (Free)', defaultBadgeText: 'ফ্রি পরীক্ষা' },
  { type: 'daily', label: 'দৈনিক মডেল টেস্ট (Daily)', defaultBadgeText: 'দৈনিক মডেল টেস্ট' },
  { type: 'weekly', label: 'সাপ্তাহিক মডেল টেস্ট (Weekly)', defaultBadgeText: 'সাপ্তাহিক মডেল টেস্ট' },
  { type: 'live', label: 'লাইভ পরীক্ষা (Live)', defaultBadgeText: 'লাইভ টেস্ট' },
];

export const DEFAULT_SUBJECTS = [
  'সকল বিষয়',
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
  'আল কুরআন ও তাফসির',
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
  details_button_text?: string;
  details_button_link?: string;
  enroll_button_text?: string;
  enroll_button_link?: string;
  enter_button_text?: string;
  sheet_button_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseExam {
  id: string;
  course_id: string;
  title: string;
  subject: string;
  question_count: number;
  time_minutes: number;
  total_marks: number;
  negative_marks: number;
  is_locked: boolean;
  position?: number;
  exam_id?: string | null;
  created_at?: string;
}

export interface CourseSheet {
  id: string;
  course_id: string;
  title: string;
  pdf_url: string;
  file_size: string;
  page_count: string;
  badge_text?: string;
  is_locked: boolean;
  position?: number;
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

export interface DashboardStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  totalExams?: number;
  activeExams?: number;
}


