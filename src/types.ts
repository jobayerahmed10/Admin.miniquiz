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

export const DEFAULT_SUBJECTS = [
  'বাংলা',
  'ইংরেজি',
  'গণিত',
  'সাধারণ জ্ঞান',
  'বিজ্ঞান',
  'বাংলাদেশ বিষয়াবলী',
  'আন্তর্জাতিক বিষয়াবলী',
  'কম্পিউটার ও তথ্যপ্রযুক্তি',
  'ভূগোল ও পরিবেশ',
  'নৈতিকতা ও সুশাসন',
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
}

