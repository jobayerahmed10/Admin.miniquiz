import { Question, QuestionStatus } from '../types';

export type QuestionBankView =
  | 'dashboard' // Interface 01
  | 'manual_step1' // Interface 02
  | 'manual_step2' // Interface 03
  | 'copypaste_step1' // Interface 04
  | 'copypaste_step2' // Interface 05
  | 'autogen_step1' // Interface 06
  | 'autogen_step2'; // Interface 07

export interface MCQOption {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  text: string;
}

export interface WorkingQuestion {
  tempId: string;
  id?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
    F?: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  explanation: string;
  reference?: string;
  subject: string;
  topic: string;
  post: string;
  language: 'বাংলা' | 'English' | 'العربية';
  questionType: string;
  difficulty: 'সহজ' | 'মাঝারি' | 'কঠিন';
  status: QuestionStatus;
  isDuplicate?: boolean;
  duplicateReason?: string;
  duplicateMatchId?: string | number;
  duplicateScore?: number;
  hasErrors?: boolean;
  errorMessage?: string;
  isArabic?: boolean;
  prefix?: string;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicateCount: number;
  exactMatchCount: number;
  similarMatchCount: number;
  emptyQuestionCount: number;
  missingOptionCount: number;
  missingAnswerCount: number;
  noExplanationCount: number;
  validCount: number;
  details: {
    tempId: string;
    type: 'exact' | 'similar' | 'empty_q' | 'empty_opt' | 'no_ans';
    message: string;
    matchedWith?: string;
  }[];
}

export interface AiAutoGenerateConfig {
  subject: string;
  topic: string;
  post: string;
  language: 'বাংলা' | 'English' | 'العربية';
  questionType: string;
  difficulty: 'সহজ' | 'মাঝারি' | 'কঠিন';
  questionCount: number;
  questionsPerTopic: number;
  features: {
    generalKnowledge: boolean;
    conceptual: boolean;
    analytical: boolean;
    applied: boolean;
  };
  additionalInstructions: string;
  prefix: string;
  startNumber: number;
}
