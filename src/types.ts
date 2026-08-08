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
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface DashboardStats {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
}
