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
  subject?: string | null; // বিষয় (যেমন: বাংলা, ইংরেজি, গণিত, ইত্যাদি)
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

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface DashboardStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  totalExams?: number;
  activeExams?: number;
}


