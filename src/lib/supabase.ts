import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { saveSubjectPrefixMapping } from './subjectPrefixManager';
import { sanitizeSubjectName } from './subjectManager';
import {
  Question,
  SupabaseConfig,
  DashboardStats,
  Exam,
  ExamBadgeType,
  ExamStatus,
  Course,
  CourseExam,
  CourseExamQuestion,
  CourseSheet,
  CourseApplication,
  ApplicationStatus,
} from '../types';

const STORAGE_KEY_URL = 'miniquiz_supabase_url';
const STORAGE_KEY_KEY = 'miniquiz_supabase_anon_key';

// Default environment variable lookup
export const getEnvSupabaseUrl = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    localStorage.getItem(STORAGE_KEY_URL) ||
    ''
  );
};

export const getEnvSupabaseAnonKey = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    localStorage.getItem(STORAGE_KEY_KEY) ||
    ''
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const url = getEnvSupabaseUrl();
  const anonKey = getEnvSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Supabase init error:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const updateSupabaseCredentials = (url: string, anonKey: string): SupabaseClient | null => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  
  try {
    supabaseInstance = createClient(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
};

export const clearCustomCredentials = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  supabaseInstance = null;
};

const LOCAL_QUESTIONS_KEY = 'miniquiz_cached_questions';
const LOCAL_EXAMS_KEY = 'miniquiz_cached_exams';

export const getLocalCachedQuestions = (): Question[] => {
  try {
    const raw = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const setLocalCachedQuestions = (questions: Question[]) => {
  try {
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('Failed to save questions to localStorage:', e);
  }
};

import { INITIAL_SEED_EXAMS } from './examSeedData';

export const getLocalCachedExams = (): Exam[] => {
  try {
    const raw = localStorage.getItem(LOCAL_EXAMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const setLocalCachedExams = (exams: Exam[]) => {
  try {
    localStorage.setItem(LOCAL_EXAMS_KEY, JSON.stringify(exams));
  } catch (e) {
    console.warn('Failed to save exams to localStorage:', e);
  }
};

export const clearAllExams = async (): Promise<{ success: boolean; error: string | null }> => {
  setLocalCachedExams([]);
  setLocalCachedQuestions([]);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    // 1. First delete all questions from Supabase questions table
    const { error: questionsError } = await client
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (questionsError) {
      console.warn('Supabase clearAllQuestions warning:', questionsError);
    }

    // 2. Then delete all exams
    const { error: examsError } = await client
      .from('exams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (examsError) {
      console.warn('Supabase clearAllExams warning:', examsError);
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: true, error: null };
  }
};

/**
 * SEO Dynamic Slug Generator for Question Title
 */
export const generateQuestionSlug = (questionText: string, customPrefix?: string): string => {
  if (!questionText || !questionText.trim()) {
    const defaultPrefix = customPrefix ? customPrefix.toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
    return defaultPrefix ? `${defaultPrefix}-question` : 'question-item';
  }

  // Strip HTML tags if present
  let cleanText = questionText.replace(/<[^>]*>/g, '').trim().toLowerCase();

  // Keep Bengali letters (\u0980-\u09FF), English letters, numbers, spaces & hyphens
  let slug = cleanText
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = 'question-item';
  }

  if (slug.length > 90) {
    slug = slug.substring(0, 90).replace(/-[^-]*$/, '');
  }

  if (customPrefix) {
    const cleanPrefix = customPrefix.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (cleanPrefix) {
      return `${cleanPrefix}-${slug}`;
    }
  }

  return slug;
};

/**
 * Maps subject name to standard sequential ID prefix (e.g. বাংলা -> Q-BANGLA-, ইসলাম -> Q-ISLAM-)
 */
export const getDefaultSubjectPrefix = (subjectName?: string): string => {
  if (!subjectName || !subjectName.trim()) return 'Q-BANGLA-';
  const sub = subjectName.trim().toLowerCase();

  if (sub.includes('বাংলা') || sub.includes('bangla') || sub.includes('bengali')) return 'Q-BANGLA-';
  if (sub.includes('ইংরেজি') || sub.includes('english') || sub.includes('ingreji')) return 'Q-ENGLISH-';
  if (sub.includes('গণিত') || sub.includes('math') || sub.includes('gonit')) return 'Q-MATH-';
  if (sub.includes('সাধারণ জ্ঞান') || sub.includes('সাধারন জ্ঞান') || sub.includes('gk') || sub.includes('general knowledge')) return 'Q-GK-';
  if (sub.includes('আইসিটি') || sub.includes('কম্পিউটার') || sub.includes('ict') || sub.includes('computer')) return 'Q-ICT-';
  if (sub.includes('ইসলাম') || sub.includes('দ্বীন') || sub.includes('ধর্ম') || sub.includes('islam')) return 'Q-ISLAM-';
  if (sub.includes('আরবি') || sub.includes('arabic') || sub.includes('arbi') || sub.includes('কুরআন') || sub.includes('হাদিস') || sub.includes('মৌলভী')) return 'Q-ARABIC-';
  if (sub.includes('বিজ্ঞান') || sub.includes('science')) return 'Q-SCIENCE-';
  if (sub.includes('ভূগোল') || sub.includes('geography')) return 'Q-GEO-';
  if (sub.includes('পদার্থ') || sub.includes('physics')) return 'Q-PHYSICS-';
  if (sub.includes('রসায়ন') || sub.includes('chemistry')) return 'Q-CHEM-';
  if (sub.includes('জীব') || sub.includes('biology')) return 'Q-BIO-';
  if (sub.includes('হিসাব') || sub.includes('accounting')) return 'Q-ACCOUNTING-';
  if (sub.includes('অর্থনীতি') || sub.includes('economics')) return 'Q-ECONOMICS-';
  if (sub.includes('পৌরনীতি') || sub.includes('রাষ্ট্র') || sub.includes('civics')) return 'Q-CIVICS-';
  if (sub.includes('ইতিহাস') || sub.includes('history')) return 'Q-HISTORY-';

  // Fallback: create clean uppercase Latin tag or transliterate
  const ascii = sub.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (ascii.length >= 2) {
    return `Q-${ascii.substring(0, 10)}-`;
  }

  return 'Q-BANGLA-';
};

/**
 * Automatic Sequential ID Generator for Questions (e.g. Q-BANGLA-0001, Q-BANGLA-0002)
 */
export const generateSequentialQuestionId = (
  prefixPattern: string,
  existingQuestionsOrIds: (Question | string | number)[] = [],
  indexOffset = 0,
  startNumberOverride?: number
): string => {
  if (!prefixPattern || !prefixPattern.trim()) {
    return `q_${Date.now()}_${indexOffset}_${Math.random().toString(36).substring(2, 6)}`;
  }

  let cleanPrefix = prefixPattern.trim().toUpperCase();
  if (!/[-\_:\.]$/.test(cleanPrefix)) {
    cleanPrefix += '-';
  }

  let baseNum: number;

  if (typeof startNumberOverride === 'number' && startNumberOverride >= 1) {
    baseNum = startNumberOverride;
  } else {
    let maxNum = 0;
    existingQuestionsOrIds.forEach((item) => {
      const idStr = typeof item === 'object' && item !== null ? String(item.id) : String(item);
      if (idStr.toUpperCase().startsWith(cleanPrefix)) {
        const suffix = idStr.substring(cleanPrefix.length);
        const match = suffix.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    baseNum = maxNum + 1;
  }

  const nextNum = baseNum + indexOffset;
  const paddedNum = String(nextNum).padStart(4, '0');
  return `${cleanPrefix}${paddedNum}`;
};

export const CATEGORY_PREFIX_MAP: Record<string, string> = {
  'ফ্রি পরীক্ষা': 'EXAM-FREE-',
  'দৈনিক মডেল টেস্ট': 'MODEL-DAILY-',
  'সাপ্তাহিক মডেল টেস্ট': 'MODEL-WEEKLY-',
  'মাসিক মডেল টেস্ট': 'MODEL-MONTHLY-',
  'ফিকহ': 'EXAM-FIQH-',
  'উসূলুল ফিকহ': 'EXAM-U-FIQH-',
  'হাদিস': 'EXAM-HADITH-',
  'উসূলুল হাদিস': 'EXAM-U-HADITH-',
  'কুরআন': 'EXAM-QURAN-',
  'উসূলুল কুরআন': 'EXAM-U-QURAN-',
  'আরবি': 'EXAM-ARABIC-',
  'আরবি ব্যাকরণ': 'EXAM-ARABIC-GRM-',
  'আরবি সাহিত্য': 'EXAM-ARABIC-LIT-',
  'বাংলা ব্যাকরণ': 'EXAM-BANGLA-GRM-',
  'বাংলা সাহিত্য': 'EXAM-BANGLA-LIT-',
  'ইংরেজি Grammar': 'EXAM-ENG-GRM-',
  'ইংরেজি Literature': 'EXAM-ENG-LIT-',
  'সাধারণ জ্ঞান (বাংলাদেশ)': 'EXAM-GK-BN-',
  'সাধারণ জ্ঞান (আন্তর্জাতিক)': 'EXAM-GK-INT-',
};

/**
 * Maps subject name and exam format to standard sequential ID prefix for exams (e.g. EXAM-FREE-0001, EXAM-BANGLA-0001)
 */
export const getDefaultExamPrefix = (subjectName?: string, examFormat?: string): string => {
  const sub = (subjectName || '').trim().toLowerCase();
  const fmt = (examFormat || '').trim().toLowerCase();

  // Try direct matches from CATEGORY_PREFIX_MAP
  for (const [key, prefix] of Object.entries(CATEGORY_PREFIX_MAP)) {
    const lowerKey = key.toLowerCase();
    if (sub === lowerKey || sub.includes(lowerKey) || fmt === lowerKey || fmt.includes(lowerKey)) {
      return prefix;
    }
  }

  if (examFormat) {
    const f = examFormat.toLowerCase();
    if (f.includes('free') || f.includes('ফ্রি')) return 'EXAM-FREE-';
    if (f.includes('daily') || f.includes('দৈনিক')) return 'MODEL-DAILY-';
    if (f.includes('weekly') || f.includes('সাপ্তাহিক')) return 'MODEL-WEEKLY-';
    if (f.includes('monthly') || f.includes('মাসিক')) return 'MODEL-MONTHLY-';
    if (f.includes('model') || f.includes('মডেল')) return 'EXAM-MODEL-';
    if (f.includes('live') || f.includes('লাইভ')) return 'EXAM-LIVE-';
  }

  if (!subjectName || !subjectName.trim()) return 'EXAM-BANGLA-';

  if (sub.includes('ফিকহ') || sub.includes('fiqh')) {
    if (sub.includes('উসূল') || sub.includes('usul') || sub.includes('u-fiqh')) return 'EXAM-U-FIQH-';
    return 'EXAM-FIQH-';
  }
  if (sub.includes('হাদিস') || sub.includes('hadith')) {
    if (sub.includes('উসূল') || sub.includes('usul') || sub.includes('u-hadith')) return 'EXAM-U-HADITH-';
    return 'EXAM-HADITH-';
  }
  if (sub.includes('কুরআন') || sub.includes('quran')) {
    if (sub.includes('উসূল') || sub.includes('usul') || sub.includes('u-quran')) return 'EXAM-U-QURAN-';
    return 'EXAM-QURAN-';
  }
  if (sub.includes('আরবি') || sub.includes('arabic')) {
    if (sub.includes('ব্যাকরণ') || sub.includes('grammar') || sub.includes('grm')) return 'EXAM-ARABIC-GRM-';
    if (sub.includes('সাহিত্য') || sub.includes('literature') || sub.includes('lit')) return 'EXAM-ARABIC-LIT-';
    return 'EXAM-ARABIC-';
  }
  if (sub.includes('বাংলা') || sub.includes('bangla')) {
    if (sub.includes('ব্যাকরণ') || sub.includes('grammar') || sub.includes('grm')) return 'EXAM-BANGLA-GRM-';
    if (sub.includes('সাহিত্য') || sub.includes('literature') || sub.includes('lit')) return 'EXAM-BANGLA-LIT-';
    return 'EXAM-BANGLA-';
  }
  if (sub.includes('ইংরেজি') || sub.includes('english') || sub.includes('eng')) {
    if (sub.includes('ব্যাকরণ') || sub.includes('grammar') || sub.includes('grm')) return 'EXAM-ENG-GRM-';
    if (sub.includes('সাহিত্য') || sub.includes('literature') || sub.includes('lit')) return 'EXAM-ENG-LIT-';
    return 'EXAM-ENG-';
  }
  if (sub.includes('সাধারণ জ্ঞান') || sub.includes('gk') || sub.includes('general knowledge')) {
    if (sub.includes('বাংলাদেশ') || sub.includes('bangladesh') || sub.includes('bn')) return 'EXAM-GK-BN-';
    if (sub.includes('আন্তর্জাতিক') || sub.includes('international') || sub.includes('int')) return 'EXAM-GK-INT-';
    return 'EXAM-GK-';
  }
  if (sub.includes('গণিত') || sub.includes('math')) return 'EXAM-MATH-';
  if (sub.includes('ইসলাম') || sub.includes('islam')) return 'EXAM-ISLAM-';

  const ascii = sub.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (ascii.length >= 2) {
    return `EXAM-${ascii.substring(0, 8)}-`;
  }
  return 'EXAM-TEST-';
};

/**
 * Automatic Sequential ID Generator for Exams (e.g. EXAM-FREE-0001, EXAM-BANGLA-0001)
 */
export const generateSequentialExamId = (
  prefixPattern: string,
  existingExams: (Exam | string | number)[] = []
): string => {
  if (!prefixPattern || !prefixPattern.trim()) {
    return `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  let cleanPrefix = prefixPattern.trim().toUpperCase();
  if (!/[-\_:\.]$/.test(cleanPrefix)) {
    cleanPrefix += '-';
  }

  let maxNum = 0;
  existingExams.forEach((item) => {
    const idStr = typeof item === 'object' && item !== null ? String(item.id) : String(item);
    if (idStr.toUpperCase().startsWith(cleanPrefix)) {
      const suffix = idStr.substring(cleanPrefix.length);
      const match = suffix.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(4, '0');
  return `${cleanPrefix}${paddedNum}`;
};


// Helper function to map database row to Question interface cleanly
function normalizeQuestionRow(row: any): Question {
  const qText = row.question || row.question_text || row.title || '';
  const rawSub = row.subject || row.category || row.subject_name || 'বাংলা';
  const cleanSubject = sanitizeSubjectName(rawSub);
  const cleanTopic = (row.topic || row.topic_name || '').replace(/\s+/g, ' ').trim();
  const cleanPost = (row.post || row.post_name || row.designation || row.position || '').replace(/\s+/g, ' ').trim();
  const qId = row.id || row.question_code || `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const qCode = row.question_code || (typeof qId === 'string' ? qId : undefined);

  return {
    id: qId,
    question_code: qCode,
    question: qText,
    option_a: row.option_a || (Array.isArray(row.options) ? row.options[0] : '') || '',
    option_b: row.option_b || (Array.isArray(row.options) ? row.options[1] : '') || '',
    option_c: row.option_c || (Array.isArray(row.options) ? row.options[2] : '') || '',
    option_d: row.option_d || (Array.isArray(row.options) ? row.options[3] : '') || '',
    correct_answer: row.correct_answer || row.correct_option || row.answer || 'option_a',
    explanation: row.explanation || row.description || '',
    slug: row.slug || generateQuestionSlug(qText),
    status: row.status === 'published' ? 'published' : 'draft',
    subject: cleanSubject,
    topic: cleanTopic,
    post: cleanPost,
    exam_id: row.exam_id || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
}

// Helper to check Supabase configuration status
export const isSupabaseConfigured = (): boolean => {
  const url = getEnvSupabaseUrl();
  const anonKey = getEnvSupabaseAnonKey();
  return Boolean(url && anonKey && url.startsWith('http'));
};

// Test connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'সুপাবেস ইউআরএল (SUPABASE_URL) এবং অ্যানন কী (ANON_KEY) প্রদান করা হয়নি।',
    };
  }

  try {
    const { data, error, count } = await client
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: `সুপাবেস কানেকশন ত্রুটি: ${error.message} (${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      success: true,
      message: 'সুপাবেস ডাটাবেসে সফলভাবে সংযুক্ত হয়েছে! (public.questions টেবিল প্রস্তুত)',
      count: count || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `কানেকশন ব্যর্থ হয়েছে: ${err?.message || 'অজানা ত্রুটি'}`,
    };
  }
};

// Fetch Dashboard Stats
export const fetchDashboardStats = async (): Promise<{ stats: DashboardStats; error: string | null }> => {
  try {
    const { questions } = await fetchAllQuestions();
    const localExams = getLocalCachedExams();
    const client = getSupabaseClient();
    let examsList = localExams;
    if (client) {
      try {
        const { data } = await client.from('exams').select('*');
        if (data && data.length > 0) {
          examsList = data;
        }
      } catch (e) {}
    }

    const totalQuestions = questions.length;
    const publishedQuestions = questions.filter((q) => q.status === 'published' || !q.status).length;
    const draftQuestions = questions.filter((q) => q.status === 'draft').length;
    const totalExams = examsList.length;
    const activeExams = examsList.filter((e) => e.status === 'active' || !e.status).length;

    return {
      stats: {
        totalQuestions,
        publishedQuestions,
        draftQuestions,
        totalExams,
        activeExams,
      },
      error: null,
    };
  } catch (err: any) {
    const localQuestions = getLocalCachedQuestions();
    const localExams = getLocalCachedExams();
    return {
      stats: {
        totalQuestions: localQuestions.length,
        publishedQuestions: localQuestions.filter((q) => q.status === 'published' || !q.status).length,
        draftQuestions: localQuestions.filter((q) => q.status === 'draft').length,
        totalExams: localExams.length,
        activeExams: localExams.filter((e) => e.status === 'active' || !e.status).length,
      },
      error: err?.message || null,
    };
  }
};

// Fetch All Questions from public.questions
export const fetchAllQuestions = async (): Promise<{ questions: Question[]; error: string | null; isSynced?: boolean }> => {
  const localQuestions = getLocalCachedQuestions();
  const client = getSupabaseClient();

  if (!client) {
    return {
      questions: localQuestions,
      error: null,
      isSynced: false,
    };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllQuestions error, returning local cache:', error);
      return {
        questions: localQuestions,
        error: null,
        isSynced: false,
      };
    }

    const normalized = (data || []).map(normalizeQuestionRow);

    // Merge Supabase questions with any local-only questions
    const mergedMap = new Map<string | number, Question>();
    localQuestions.forEach((q) => mergedMap.set(String(q.id), q));
    normalized.forEach((q) => mergedMap.set(String(q.id), q));

    const finalQuestions = Array.from(mergedMap.values());
    setLocalCachedQuestions(finalQuestions);

    return { questions: finalQuestions, error: null, isSynced: true };
  } catch (err: any) {
    return {
      questions: localQuestions,
      error: null,
      isSynced: false,
    };
  }
};

// Fetch Single Question by ID
export const fetchQuestionById = async (id: string | number): Promise<{ question: Question | null; error: string | null }> => {
  const client = getSupabaseClient();
  const localQuestions = getLocalCachedQuestions();
  const localFound = localQuestions.find((q) => String(q.id) === String(id));

  if (!client) {
    return { question: localFound || null, error: null };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { question: localFound || null, error: null };
    }

    return { question: normalizeQuestionRow(data), error: null };
  } catch (err: any) {
    return { question: localFound || null, error: null };
  }
};

// Insert New Question into public.questions + local cache
export const insertQuestion = async (
  newQuestion: Omit<Question, 'id' | 'created_at' | 'updated_at'> & {
    id?: string | number;
    custom_id?: string | number;
    custom_id_pattern?: string;
    custom_prefix?: string;
    slug?: string;
  }
): Promise<{ success: boolean; data?: Question; error: string | null; syncedToSupabase?: boolean }> => {
  const currentQuestions = getLocalCachedQuestions();

  let finalId = newQuestion.custom_id || newQuestion.id;
  const pattern = newQuestion.custom_id_pattern || newQuestion.custom_prefix;

  if (!finalId && pattern) {
    finalId = generateSequentialQuestionId(pattern, currentQuestions);
  }

  if (!finalId) {
    finalId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  const generatedSlug = newQuestion.slug || generateQuestionSlug(newQuestion.question);
  const cleanSubject = sanitizeSubjectName(newQuestion.subject);
  const cleanTopic = (newQuestion.topic || '').replace(/\s+/g, ' ').trim();
  const cleanPost = (newQuestion.post || '').replace(/\s+/g, ' ').trim();

  const localItem: Question = {
    id: finalId,
    question: newQuestion.question,
    option_a: newQuestion.option_a,
    option_b: newQuestion.option_b,
    option_c: newQuestion.option_c,
    option_d: newQuestion.option_d,
    correct_answer: newQuestion.correct_answer,
    explanation: newQuestion.explanation || '',
    slug: generatedSlug,
    status: newQuestion.status || 'published',
    subject: cleanSubject,
    topic: cleanTopic,
    post: cleanPost,
    exam_id: newQuestion.exam_id || null,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      data: localItem,
      error: 'সুপাবেস কানেকশন সেট করা নেই। হেডার থেকে Supabase সেটিংস আইকন চাপুন এবং URL ও Key দিন।',
      syncedToSupabase: false,
    };
  }

  try {
    const payload: any = {
      id: String(finalId),
      question: newQuestion.question,
      option_a: newQuestion.option_a,
      option_b: newQuestion.option_b,
      option_c: newQuestion.option_c,
      option_d: newQuestion.option_d,
      correct_answer: newQuestion.correct_answer,
      explanation: newQuestion.explanation || '',
      slug: generatedSlug,
      status: newQuestion.status || 'published',
      subject: cleanSubject,
      topic: cleanTopic,
      post: cleanPost,
      ...(newQuestion.exam_id !== undefined && newQuestion.exam_id !== null ? { exam_id: String(newQuestion.exam_id) } : {}),
    };

    console.log('Payload: Question insert', JSON.stringify(payload, null, 2));

    let { data, error } = await client
      .from('questions')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .single();

    // If optional columns fail or don't exist in DB, retry gracefully
    if (error) {
      console.warn('Supabase insertQuestion error (attempting safe fallback):', error);
      const errStr = ((error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '')).toLowerCase();
      const isExamIdError = errStr.includes('exam_id') || errStr.includes('schema cache') || error.code === 'PGRST204' || error.code === '42703';
      const isSlugError = errStr.includes('slug');

      const sanitizedPayload = { ...payload };
      if (isSlugError) {
        delete sanitizedPayload.slug;
      }
      if (isExamIdError) {
        delete sanitizedPayload.exam_id;
      }

      let retryResult = await client
        .from('questions')
        .upsert([sanitizedPayload], { onConflict: 'id' })
        .select()
        .single();

      if (retryResult.error) {
        const retryErrStr = ((retryResult.error.message || '') + ' ' + (retryResult.error.details || '')).toLowerCase();
        if (retryErrStr.includes('topic')) delete sanitizedPayload.topic;
        if (retryErrStr.includes('post')) delete sanitizedPayload.post;
        if (retryErrStr.includes('slug')) delete sanitizedPayload.slug;
        if (retryErrStr.includes('exam_id')) delete sanitizedPayload.exam_id;

        retryResult = await client
          .from('questions')
          .upsert([sanitizedPayload], { onConflict: 'id' })
          .select()
          .single();
      }

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Supabase insertQuestion failed:', error);
      return {
        success: false,
        data: localItem,
        error: error?.message || 'সুপাবেসে প্রশ্ন সংরক্ষণ করতে ব্যর্থ হয়েছে।',
        syncedToSupabase: false,
      };
    }

    const normalized = normalizeQuestionRow({
      ...data,
      id: data.id || localItem.id,
      explanation: data.explanation || localItem.explanation,
      slug: data.slug || localItem.slug,
      exam_id: data.exam_id || newQuestion.exam_id,
      topic: data.topic || newQuestion.topic,
      post: data.post || newQuestion.post,
      subject: data.subject || newQuestion.subject,
    });

    // Update local cache
    const updatedCache = [normalized, ...currentQuestions.filter((q) => String(q.id) !== String(normalized.id))];
    setLocalCachedQuestions(updatedCache);

    return {
      success: true,
      data: normalized,
      error: null,
      syncedToSupabase: true,
    };
  } catch (err: any) {
    console.error('Supabase insertQuestion exception:', err);
    return {
      success: false,
      data: localItem,
      error: err?.message || 'সুপাবেসে প্রশ্ন সংরক্ষণে ত্রুটি ঘটেছে।',
      syncedToSupabase: false,
    };
  }
};

// Batch Insert Multiple Questions
export const insertBatchQuestions = async (
  questionsToInsert: (Omit<Question, 'id' | 'created_at' | 'updated_at'> & {
    id?: string | number;
    custom_id?: string | number;
    slug?: string;
  })[],
  options?: {
    custom_id_pattern?: string;
    custom_prefix?: string;
    custom_start_number?: number;
    startNumber?: number;
  }
): Promise<{ success: boolean; data?: Question[]; error: string | null; syncedToSupabase?: boolean }> => {
  if (!questionsToInsert || questionsToInsert.length === 0) {
    return { success: true, data: [], error: null };
  }

  const currentQuestions = getLocalCachedQuestions();
  const pattern =
    options?.custom_id_pattern ||
    options?.custom_prefix ||
    getDefaultSubjectPrefix(questionsToInsert[0]?.subject);

  const startNum = options?.custom_start_number ?? options?.startNumber;

  // Auto-save subject prefix mapping if custom prefix is used
  if (pattern) {
    const subjectsMap = new Set<string>();
    questionsToInsert.forEach((q) => {
      if (q.subject && q.subject.trim()) {
        subjectsMap.add(q.subject.trim());
      }
    });
    subjectsMap.forEach((subj) => {
      saveSubjectPrefixMapping(subj, pattern);
    });
  }

  const localItems: Question[] = questionsToInsert.map((q, idx) => {
    let finalId = q.custom_id || q.id;
    if (!finalId && pattern) {
      finalId = generateSequentialQuestionId(pattern, currentQuestions, idx, startNum);
    }
    if (!finalId) {
      finalId = `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const generatedSlug = q.slug || generateQuestionSlug(q.question);
    const cleanSub = sanitizeSubjectName(q.subject);
    const cleanTop = (q.topic || '').replace(/\s+/g, ' ').trim();
    const cleanPost = (q.post || '').replace(/\s+/g, ' ').trim();

    return {
      id: finalId,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      slug: generatedSlug,
      status: q.status || 'published',
      subject: cleanSub,
      topic: cleanTop,
      post: cleanPost,
      exam_id: q.exam_id || null,
      created_at: new Date().toISOString(),
    };
  });

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      data: localItems,
      error: 'সুপাবেস কানেকশন সেট করা নেই। হেডার থেকে Supabase সেটিংস আইকন চাপুন এবং URL ও Key দিন।',
      syncedToSupabase: false,
    };
  }

  try {
    const payload = localItems.map((q) => {
      const qText = q.question || (q as any).question_text || '';
      const optA = q.option_a || '';
      const optB = q.option_b || '';
      const optC = q.option_c || '';
      const optD = q.option_d || '';

      const item: any = {
        id: String(q.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
        question: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_answer: q.correct_answer || (q as any).correctAnswer || 'option_a',
        explanation: q.explanation || '',
        status: q.status || 'published',
        subject: sanitizeSubjectName(q.subject),
        topic: (q.topic || '').replace(/\s+/g, ' ').trim(),
        post: (q.post || '').replace(/\s+/g, ' ').trim(),
      };
      if (q.slug) {
        item.slug = q.slug;
      }
      if (q.exam_id) {
        item.exam_id = String(q.exam_id);
      }
      return item;
    });

    console.log('Payload: Questions batch insert', JSON.stringify(payload, null, 2));

    let { data, error } = await client
      .from('questions')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Questions Insert Error (initial attempt failed):', error);
      const errStr = ((error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '')).toLowerCase();
      const isExamIdError = errStr.includes('exam_id') || errStr.includes('schema cache') || error.code === 'PGRST204' || error.code === '42703';
      const isSlugError = errStr.includes('slug');

      // Fallback 1: Keep topic and post, remove slug or exam_id if problematic
      const fallbackPayload = payload.map((p: any) => {
        const copy = { ...p };
        if (isExamIdError) delete copy.exam_id;
        if (isSlugError) delete copy.slug;
        return copy;
      });

      console.log('Payload: Retry batch insert fallback 1', JSON.stringify(fallbackPayload, null, 2));

      let retryResult = await client
        .from('questions')
        .upsert(fallbackPayload, { onConflict: 'id' })
        .select();

      if (retryResult.error) {
        console.error('Questions Insert Error (retry 1 failed):', retryResult.error);
        const retryErrStr = ((retryResult.error.message || '') + ' ' + (retryResult.error.details || '')).toLowerCase();
        
        // Fallback 2: Remove only missing schema fields
        const minimalPayload = payload.map((p: any) => {
          const minItem: any = {
            id: p.id,
            question: p.question,
            option_a: p.option_a,
            option_b: p.option_b,
            option_c: p.option_c,
            option_d: p.option_d,
            correct_answer: p.correct_answer,
            explanation: p.explanation || '',
            subject: p.subject || 'সাধারণ',
            status: p.status || 'published',
          };
          if (!retryErrStr.includes('topic')) minItem.topic = p.topic || '';
          if (!retryErrStr.includes('post')) minItem.post = p.post || '';
          return minItem;
        });

        retryResult = await client
          .from('questions')
          .upsert(minimalPayload, { onConflict: 'id' })
          .select();
      }

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Questions Insert Error:', error);
      return {
        success: false,
        data: localItems,
        error: error?.message || 'সুপাবেসে প্রশ্নগুলো সেভ করতে ব্যর্থ হয়েছে।',
        syncedToSupabase: false,
      };
    }

    const normalized = (data || []).map((row, idx) =>
      normalizeQuestionRow({
        ...row,
        exam_id: row.exam_id || questionsToInsert[idx]?.exam_id,
        topic: row.topic || questionsToInsert[idx]?.topic,
        post: row.post || questionsToInsert[idx]?.post,
        subject: row.subject || questionsToInsert[idx]?.subject,
      })
    );

    const current = getLocalCachedQuestions();
    setLocalCachedQuestions([...normalized, ...current]);

    return { success: true, data: normalized, error: null, syncedToSupabase: true };
  } catch (err: any) {
    console.error('Supabase batch insert questions exception:', err);
    return {
      success: false,
      data: localItems,
      error: err?.message || 'সুপাবেসে প্রশ্ন সংরক্ষণ করার সময় ত্রুটি ঘটেছে।',
      syncedToSupabase: false,
    };
  }
};

// Fetch questions linked to a specific exam or list of IDs
export const fetchQuestionsByExamId = async (
  examId: string | number
): Promise<{ questions: Question[]; error: string | null; isSynced?: boolean }> => {
  const localQuestions = getLocalCachedQuestions();
  const localMatched = localQuestions.filter(
    (q) => String(q.exam_id) === String(examId) || String(q.exam_id) === String(Number(examId))
  );

  const client = getSupabaseClient();
  if (!client) {
    return { questions: localMatched, error: null, isSynced: false };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const normalized = data.map(normalizeQuestionRow);
      // Merge with local matched
      const map = new Map<string | number, Question>();
      localMatched.forEach((q) => map.set(String(q.id), q));
      normalized.forEach((q) => map.set(String(q.id), q));
      return { questions: Array.from(map.values()), error: null, isSynced: true };
    }

    // Fallback: check all questions
    const all = await fetchAllQuestions();
    const matched = all.questions.filter((q) => String(q.exam_id) === String(examId));
    return { questions: matched.length > 0 ? matched : localMatched, error: null, isSynced: all.isSynced };
  } catch (err: any) {
    return { questions: localMatched, error: null, isSynced: false };
  }
};

// Update Question in public.questions + local cache
export const updateQuestion = async (
  id: string | number,
  updatedFields: Partial<Omit<Question, 'id' | 'created_at'>>
): Promise<{ success: boolean; data?: Question; error: string | null; syncedToSupabase?: boolean }> => {
  // Update in local cache first
  const current = getLocalCachedQuestions();
  let updatedLocal: Question | null = null;
  const sanitizedUpdatedSubject = updatedFields.subject !== undefined ? sanitizeSubjectName(updatedFields.subject) : undefined;

  const updatedCache = current.map((q) => {
    if (String(q.id) === String(id)) {
      updatedLocal = {
        ...q,
        ...updatedFields,
        ...(sanitizedUpdatedSubject !== undefined ? { subject: sanitizedUpdatedSubject } : {}),
        updated_at: new Date().toISOString(),
      };
      return updatedLocal;
    }
    return q;
  });
  if (updatedLocal) {
    setLocalCachedQuestions(updatedCache);
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      data: updatedLocal || undefined,
      error: 'সুপাবেস কানেকশন সেট করা নেই। হেডার থেকে Supabase সেটিংস আইকন চাপুন এবং URL ও Key দিন।',
      syncedToSupabase: false,
    };
  }

  try {
    const payload: any = {};
    if (updatedFields.question !== undefined) payload.question = updatedFields.question;
    if (updatedFields.option_a !== undefined) payload.option_a = updatedFields.option_a;
    if (updatedFields.option_b !== undefined) payload.option_b = updatedFields.option_b;
    if (updatedFields.option_c !== undefined) payload.option_c = updatedFields.option_c;
    if (updatedFields.option_d !== undefined) payload.option_d = updatedFields.option_d;
    if (updatedFields.correct_answer !== undefined) payload.correct_answer = updatedFields.correct_answer;
    if (updatedFields.explanation !== undefined) payload.explanation = updatedFields.explanation;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if ((updatedFields as any).questions !== undefined) payload.questions = (updatedFields as any).questions;
    if ((updatedFields as any).question_ids !== undefined) payload.question_ids = (updatedFields as any).question_ids;
    if (sanitizedUpdatedSubject !== undefined) payload.subject = sanitizedUpdatedSubject;
    if (updatedFields.topic !== undefined) payload.topic = (updatedFields.topic || '').replace(/\s+/g, ' ').trim();
    if (updatedFields.post !== undefined) payload.post = (updatedFields.post || '').replace(/\s+/g, ' ').trim();
    if (updatedFields.exam_id !== undefined) payload.exam_id = String(updatedFields.exam_id);

    console.log('Payload: Question update', JSON.stringify(payload, null, 2));

    let { data, error } = await client
      .from('questions')
      .update(payload)
      .eq('id', String(id))
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateQuestion error (attempting safe fallback):', error);
      const errStr = ((error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '')).toLowerCase();
      const isExamIdError = errStr.includes('exam_id') || errStr.includes('schema cache') || error.code === 'PGRST204' || error.code === '42703';

      const sanitized = { ...payload };
      delete sanitized.topic;
      delete sanitized.post;
      if (isExamIdError) {
        delete sanitized.exam_id;
      }

      let retryResult = await client
        .from('questions')
        .update(sanitized)
        .eq('id', String(id))
        .select()
        .single();

      if (retryResult.error) {
        delete sanitized.subject;
        delete sanitized.exam_id;
        retryResult = await client
          .from('questions')
          .update(sanitized)
          .eq('id', String(id))
          .select()
          .single();
      }

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Supabase updateQuestion failed:', error);
      return {
        success: false,
        data: updatedLocal || undefined,
        error: error?.message || 'সুপাবেসে প্রশ্ন আপডেট করতে ব্যর্থ হয়েছে।',
        syncedToSupabase: false,
      };
    }

    const normalized = normalizeQuestionRow({
      ...data,
      ...updatedFields,
    });

    return {
      success: true,
      data: normalized,
      error: null,
      syncedToSupabase: true,
    };
  } catch (err: any) {
    console.error('Supabase updateQuestion exception:', err);
    return {
      success: false,
      data: updatedLocal || undefined,
      error: err?.message || 'সুপাবেসে প্রশ্ন আপডেটে ত্রুটি ঘটেছে।',
      syncedToSupabase: false,
    };
  }
};

/**
 * Transfer questions in batch from one subject/topic to another
 */
export const transferQuestionsSubjectTopic = async (
  questionIds: (string | number)[],
  targetSubject: string,
  targetTopic?: string
): Promise<{ success: boolean; count: number; error: string | null }> => {
  if (!questionIds || questionIds.length === 0) {
    return { success: true, count: 0, error: null };
  }

  const cleanTargetSubject = sanitizeSubjectName(targetSubject);
  const cleanTargetTopic = targetTopic !== undefined && targetTopic !== null ? targetTopic.replace(/\s+/g, ' ').trim() : undefined;

  // Update local cache
  const current = getLocalCachedQuestions();
  let transferredCount = 0;
  const updatedCache = current.map((q) => {
    const isMatch = questionIds.some((id) => String(id) === String(q.id));
    if (isMatch) {
      transferredCount++;
      return {
        ...q,
        subject: cleanTargetSubject,
        ...(cleanTargetTopic !== undefined ? { topic: cleanTargetTopic } : {}),
        updated_at: new Date().toISOString(),
      };
    }
    return q;
  });

  setLocalCachedQuestions(updatedCache);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, count: transferredCount, error: null };
  }

  try {
    const stringIds = questionIds.map((id) => String(id));
    const payload: any = { subject: cleanTargetSubject };
    if (cleanTargetTopic !== undefined) {
      payload.topic = cleanTargetTopic;
    }

    console.log(`Payload: Transfer ${stringIds.length} questions to subject=${cleanTargetSubject}, topic=${cleanTargetTopic}`, payload);

    let { error } = await client
      .from('questions')
      .update(payload)
      .in('id', stringIds);

    if (error) {
      console.warn('Supabase batch transfer questions initial error, attempting fallback per question:', error);
      // Fallback: update one by one or without topic
      delete payload.topic;
      const fallbackRes = await client
        .from('questions')
        .update({ subject: cleanTargetSubject })
        .in('id', stringIds);

      if (fallbackRes.error) {
        console.error('Supabase batch transfer fallback error:', fallbackRes.error);
      }
    }

    return { success: true, count: transferredCount, error: null };
  } catch (err: any) {
    console.error('transferQuestionsSubjectTopic exception:', err);
    return { success: true, count: transferredCount, error: null };
  }
};

// Auto-repair and assign proper topics based on question content and subject
export const autoAssignAndRepairQuestionTopics = async (
  customRules?: { subjectMatch: string; targetTopic: string }[]
): Promise<{ success: boolean; updatedCount: number; error: string | null }> => {
  const current = getLocalCachedQuestions();
  let updatedCount = 0;

  const updatedCache = current.map((q) => {
    const cleanSub = (q.subject || '').trim();
    const cleanTop = (q.topic || '').trim();
    const qText = (q.question || '').toLowerCase();
    let newTopic = cleanTop;

    const isTopicGeneric = !cleanTop || cleanTop === 'সাধারণ টপিক' || cleanTop === 'সাধারণ' || cleanTop === 'সাধারণ জ্ঞান ও সাহিত্য' || cleanTop === 'عام' || cleanTop === 'সাহিত্য';

    if (isTopicGeneric) {
      if (cleanSub === 'বাংলা' || qText.includes('বিপরীত') || qText.includes('বিপরীতার্থক')) {
        newTopic = 'বিপরীত শব্দ';
      } else if (cleanSub === 'ইংরেজি' || cleanSub.toLowerCase() === 'english' || qText.includes('preposition') || qText.includes('appropriate')) {
        newTopic = 'Appropriate Preposition';
      } else if (cleanSub.includes('উসূলুল') || cleanSub.includes('ফিকহ') || cleanSub.includes('আরবি') || cleanSub.includes('ইসলাম') || qText.includes('কিতাব') || cleanSub === 'ফিকহ') {
        newTopic = 'কিতাবুল্লাহ';
      } else if (cleanSub === 'গণিত') {
        newTopic = 'পাটিগণিত ও বীজগণিত';
      } else if (cleanSub === 'বিজ্ঞান') {
        newTopic = 'দৈনন্দিন বিজ্ঞান';
      } else {
        newTopic = cleanTop || 'সাধারণ জ্ঞান';
      }
    }

    if (newTopic !== cleanTop) {
      updatedCount++;
      return {
        ...q,
        topic: newTopic,
        updated_at: new Date().toISOString(),
      };
    }
    return q;
  });

  setLocalCachedQuestions(updatedCache);

  const client = getSupabaseClient();
  if (client && updatedCount > 0) {
    try {
      const topicGroups: Record<string, string[]> = {};
      updatedCache.forEach((q) => {
        const top = q.topic || '';
        if (top) {
          if (!topicGroups[top]) topicGroups[top] = [];
          topicGroups[top].push(String(q.id));
        }
      });

      for (const [topName, qIds] of Object.entries(topicGroups)) {
        await client
          .from('questions')
          .update({ topic: topName })
          .in('id', qIds);
      }
    } catch (err) {
      console.warn('autoAssignAndRepairQuestionTopics background update error:', err);
    }
  }

  return { success: true, updatedCount, error: null };
};

// Delete Question from public.questions + local cache
export const deleteQuestion = async (id: string | number): Promise<{ success: boolean; error: string | null }> => {
  // Remove from local cache
  const current = getLocalCachedQuestions();
  setLocalCachedQuestions(current.filter((q) => String(q.id) !== String(id)));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete error (handled):', error);
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: true, error: null };
  }
};

// Delete Batch Questions
export const deleteBatchQuestions = async (
  ids: (string | number)[]
): Promise<{ success: boolean; error: string | null }> => {
  if (!ids || ids.length === 0) return { success: true, error: null };

  const current = getLocalCachedQuestions();
  const idStrSet = new Set(ids.map((id) => String(id)));
  setLocalCachedQuestions(current.filter((q) => !idStrSet.has(String(q.id))));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client
      .from('questions')
      .delete()
      .in('id', ids);

    if (error) {
      console.warn('Supabase deleteBatchQuestions warning:', error);
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: true, error: null };
  }
};

// Clear All Questions
export const clearAllQuestions = async (): Promise<{ success: boolean; error: string | null }> => {
  setLocalCachedQuestions([]);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn('Supabase clearAllQuestions warning:', error);
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: true, error: null };
  }
};

/* ==========================================================================
   PUBLIC.EXAMS TABLE CRUD FUNCTIONS + LOCAL CACHE & RESILIENCE
   ========================================================================== */

export const normalizeExamRow = (row: any): Exam => {
  const cleanSubject = sanitizeSubjectName(row.subject || 'বাংলা');
  let questionCodes: (string | number)[] = [];
  if (Array.isArray(row.selected_question_codes)) {
    questionCodes = row.selected_question_codes;
  } else if (Array.isArray(row.question_ids)) {
    questionCodes = row.question_ids;
  } else if (typeof row.selected_question_codes === 'string') {
    try {
      const parsed = JSON.parse(row.selected_question_codes);
      if (Array.isArray(parsed)) questionCodes = parsed;
    } catch (_) {}
  } else if (typeof row.question_ids === 'string') {
    try {
      const parsed = JSON.parse(row.question_ids);
      if (Array.isArray(parsed)) questionCodes = parsed;
    } catch (_) {}
  }

  return {
    id: String(row.id || `exam_${Date.now()}`),
    title: row.title || 'শিরোনাম ছাড়া পরীক্ষা',
    badge: row.badge || 'মডেল টেস্ট',
    badge_type: (row.badge_type || 'daily') as ExamBadgeType,
    subject: cleanSubject,
    topic: (row.topic || '').replace(/\s+/g, ' ').trim(),
    post: (row.post || '').replace(/\s+/g, ' ').trim(),
    pass_mark: typeof row.pass_mark === 'number' ? row.pass_mark : Number(row.pass_mark || 0),
    exam_type: row.exam_type || 'free',
    category: row.category || 'ফ্রি ট্রায়াল টেস্ট (Free Test)',
    question_count: typeof row.question_count === 'number' ? row.question_count : Number(row.question_count || 0),
    time_minutes: typeof row.time_minutes === 'number' ? row.time_minutes : Number(row.time_minutes || 0),
    negative_marks: typeof row.negative_marks === 'number' ? row.negative_marks : Number(row.negative_marks || 0),
    total_marks: typeof row.total_marks === 'number' ? row.total_marks : Number(row.total_marks || 0),
    description: row.description || '',
    id_pattern: row.id_pattern || null,
    status: (row.status === 'active' ? 'active' : 'draft') as ExamStatus,
    selected_question_codes: questionCodes,
    question_ids: questionCodes,
    questions: Array.isArray(row.questions) ? row.questions : [],
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
};

// Fetch All Exams
export const fetchAllExams = async (): Promise<{ exams: Exam[]; error: string | null; isTableMissing?: boolean; isSynced?: boolean }> => {
  const localExams = getLocalCachedExams();
  const localQuestions = getLocalCachedQuestions();
  const client = getSupabaseClient();

  if (!client) {
    const mergedLocal = localExams.map((ex) => {
      const qMatches = localQuestions.filter((q) => String(q.exam_id) === String(ex.id));
      const finalQs = qMatches.length > 0 ? qMatches : ex.questions || [];
      return {
        ...ex,
        questions: finalQs,
        question_count: finalQs.length || ex.question_count || 0,
      };
    });
    return { exams: mergedLocal, error: null, isSynced: false };
  }

  try {
    const { data, error } = await client
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllExams error, returning local cache:', error);
      const isMissing = error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('exams');
      const mergedLocal = localExams.map((ex) => {
        const qMatches = localQuestions.filter((q) => String(q.exam_id) === String(ex.id));
        const finalQs = qMatches.length > 0 ? qMatches : ex.questions || [];
        return {
          ...ex,
          questions: finalQs,
          question_count: finalQs.length || ex.question_count || 0,
        };
      });
      return {
        exams: mergedLocal,
        error: isMissing ? error.message : null,
        isTableMissing: isMissing,
        isSynced: false,
      };
    }

    const normalized = (data || []).map(normalizeExamRow);
    const map = new Map<string, Exam>();
    localExams.forEach((e) => map.set(String(e.id), e));
    normalized.forEach((e) => map.set(String(e.id), e));
    const merged = Array.from(map.values());

    // Fetch questions for all exams from public.questions table
    const examIds = merged.map((e) => String(e.id));
    if (examIds.length > 0) {
      try {
        const { data: qData } = await client
          .from('questions')
          .select('*')
          .in('exam_id', examIds);

        const questionsByExamId: Record<string, Question[]> = {};
        if (qData && qData.length > 0) {
          qData.forEach((row) => {
            const eid = String(row.exam_id);
            if (!questionsByExamId[eid]) questionsByExamId[eid] = [];
            questionsByExamId[eid].push(normalizeQuestionRow(row));
          });
        }

        // Merge with local questions
        localQuestions.forEach((q) => {
          if (q.exam_id) {
            const eid = String(q.exam_id);
            if (!questionsByExamId[eid]) questionsByExamId[eid] = [];
            if (!questionsByExamId[eid].some((existing) => String(existing.id) === String(q.id))) {
              questionsByExamId[eid].push(q);
            }
          }
        });

        // Attach questions to each exam
        merged.forEach((ex) => {
          const matchedQs = questionsByExamId[String(ex.id)] || [];
          const existingQs = ex.questions || [];
          const combined = [...existingQs];
          const existingIds = new Set(existingQs.map((q) => String(q.id)));
          matchedQs.forEach((mq) => {
            if (!existingIds.has(String(mq.id))) {
              combined.push(mq);
              existingIds.add(String(mq.id));
            }
          });
          ex.questions = combined;
          if (combined.length > 0) {
            ex.question_count = combined.length;
          }
        });
      } catch (qErr) {
        console.warn('Error fetching exam questions in fetchAllExams:', qErr);
      }
    }

    setLocalCachedExams(merged);
    return { exams: merged, error: null, isSynced: true };
  } catch (err: any) {
    return { exams: localExams, error: null, isSynced: false };
  }
};

// Fetch Exam By ID
export const fetchExamById = async (id: string): Promise<{ exam: Exam | null; error: string | null }> => {
  const localExams = getLocalCachedExams();
  const localFound = localExams.find((e) => String(e.id) === String(id));

  const client = getSupabaseClient();
  let baseExam: Exam | null = localFound || null;

  if (client) {
    try {
      const { data, error } = await client
        .from('exams')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        baseExam = normalizeExamRow(data);
      }
    } catch (err: any) {
      console.warn('fetchExamById error:', err);
    }
  }

  if (baseExam) {
    const qRes = await fetchQuestionsByExamId(baseExam.id);
    if (qRes.questions && qRes.questions.length > 0) {
      baseExam.questions = qRes.questions;
      baseExam.question_count = qRes.questions.length;
    }
  }

  return { exam: baseExam, error: null };
};

// Insert New Exam
export const insertExam = async (
  newExam: Omit<Exam, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    custom_id?: string;
    id_pattern?: string;
  }
): Promise<{ success: boolean; data?: Exam; error: string | null; syncedToSupabase?: boolean }> => {
  const customId = (newExam.custom_id || newExam.id || '').trim();
  const examId = customId || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // ID Duplication Protection in Local Cache
  const localExams = getLocalCachedExams();
  if (localExams.some((e) => String(e.id) === String(examId))) {
    return {
      success: false,
      error: `পরীক্ষা আইডি "${examId}" ইতোমধ্যে লোকাল ক্যাশে বিদ্যমান আছে! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন বা নতুন আইডি জেনারেট করুন।`,
      syncedToSupabase: false,
    };
  }

  const localQuestions = getLocalCachedQuestions();
  if (localQuestions.some((q) => String(q.exam_id) === String(examId))) {
    return {
      success: false,
      error: `পরীক্ষা আইডি "${examId}" দিয়ে ইতোমধ্যে লোকাল ক্যাশে প্রশ্ন সংরক্ষিত আছে! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন বা নতুন আইডি জেনারেট করুন।`,
      syncedToSupabase: false,
    };
  }

  const selectedQuestionCodes = Array.from(
    new Set(
      (newExam.selected_question_codes || newExam.question_ids || [])
        .map((code) => String(code).trim())
        .filter(Boolean)
    )
  );

  const localItem: Exam = {
    id: examId,
    title: newExam.title,
    badge: newExam.badge,
    badge_type: newExam.badge_type,
    subject: newExam.subject,
    topic: newExam.topic || '',
    post: newExam.post || '',
    pass_mark: newExam.pass_mark || 0,
    exam_type: newExam.exam_type || 'free',
    category: newExam.category || 'ফ্রি ট্রায়াল টেস্ট (Free Test)',
    question_count: newExam.question_count || selectedQuestionCodes.length,
    time_minutes: newExam.time_minutes,
    negative_marks: newExam.negative_marks,
    total_marks: newExam.total_marks,
    description: newExam.description || '',
    id_pattern: newExam.id_pattern || null,
    status: newExam.status,
    selected_question_codes: selectedQuestionCodes,
    question_ids: selectedQuestionCodes,
    questions: newExam.questions || [],
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      data: localItem,
      error: 'সুপাবেস কানেকশন সেট করা নেই। হেডার থেকে Supabase সেটিংস আইকন চাপুন এবং URL ও Key দিন।',
      syncedToSupabase: false,
    };
  }

  try {
    // ID Duplication Protection in Supabase Database
    const { data: existingExam, error: examCheckErr } = await client
      .from('exams')
      .select('id')
      .eq('id', String(examId))
      .maybeSingle();

    if (existingExam) {
      return {
        success: false,
        error: `পরীক্ষা আইডি "${examId}" ইতোমধ্যে 'exams' টেবিলে বিদ্যমান আছে! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন বা নতুন আইডি জেনারেট করুন।`,
        syncedToSupabase: false,
      };
    }

    const { data: existingQuestions, error: questionCheckErr } = await client
      .from('questions')
      .select('id')
      .eq('exam_id', String(examId))
      .limit(1);

    if (existingQuestions && existingQuestions.length > 0) {
      return {
        success: false,
        error: `পরীক্ষা আইডি "${examId}" দিয়ে ইতোমধ্যে 'questions' টেবিলে প্রশ্ন সংরক্ষিত আছে! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন বা নতুন আইডি জেনারেট করুন।`,
        syncedToSupabase: false,
      };
    }

    const payload: any = {
      id: String(customId || examId),
      title: newExam.title,
      badge: newExam.badge,
      badge_type: newExam.badge_type,
      subject: newExam.subject,
      topic: newExam.topic || '',
      post: newExam.post || '',
      pass_mark: newExam.pass_mark || 0,
      exam_type: newExam.exam_type || 'free',
      category: newExam.category || 'ফ্রি ট্রায়াল টেস্ট (Free Test)',
      question_count: newExam.question_count || selectedQuestionCodes.length,
      time_minutes: newExam.time_minutes,
      negative_marks: newExam.negative_marks,
      total_marks: newExam.total_marks,
      description: newExam.description || '',
      ...(newExam.id_pattern ? { id_pattern: newExam.id_pattern } : {}),
      status: newExam.status,
      selected_question_codes: selectedQuestionCodes,
      question_ids: selectedQuestionCodes,
    };

    console.log('Payload: Exam insert', JSON.stringify(payload, null, 2));

    let { data, error } = await client
      .from('exams')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase insertExam error:', error);
      const basicPayload = {
        id: String(customId || examId),
        title: newExam.title,
        badge: newExam.badge,
        badge_type: newExam.badge_type,
        subject: newExam.subject,
        question_count: newExam.question_count || selectedQuestionCodes.length,
        time_minutes: newExam.time_minutes,
        negative_marks: newExam.negative_marks,
        total_marks: newExam.total_marks,
        description: newExam.description || '',
        status: newExam.status,
      };

      console.log('Payload: Exam retry basicPayload', JSON.stringify(basicPayload, null, 2));

      const retryResult = await client
        .from('exams')
        .upsert([basicPayload], { onConflict: 'id' })
        .select()
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Supabase insertExam final error:', error);
      return {
        success: false,
        data: localItem,
        error: error?.message || 'সুপাবেসে পরীক্ষা সংরক্ষণ করতে ব্যর্থ হয়েছে।',
        syncedToSupabase: false,
      };
    }

    const finalExamId = String(customId || examId);

    // Sync question linkages in Supabase questions table
    if (selectedQuestionCodes.length > 0) {
      try {
        await client
          .from('questions')
          .update({ exam_id: finalExamId })
          .in('id', selectedQuestionCodes);
      } catch (syncErr) {
        console.warn('Could not update questions exam_id on insertExam:', syncErr);
      }
    }

    const normalized = normalizeExamRow({
      ...data,
      topic: data.topic || newExam.topic,
      post: data.post || newExam.post,
      pass_mark: data.pass_mark || newExam.pass_mark,
      category: data.category || newExam.category,
      exam_type: data.exam_type || newExam.exam_type,
      questions: newExam.questions || [],
      selected_question_codes: selectedQuestionCodes,
      question_ids: selectedQuestionCodes,
      question_count: newExam.question_count || (newExam.questions ? newExam.questions.length : selectedQuestionCodes.length),
    });

    const current = getLocalCachedExams();
    setLocalCachedExams([normalized, ...current]);

    return {
      success: true,
      data: normalized,
      error: null,
      syncedToSupabase: true,
    };
  } catch (err: any) {
    console.error('Supabase insertExam exception:', err);
    return {
      success: false,
      data: localItem,
      error: err?.message || 'সুপাবেসে পরীক্ষা সংরক্ষণে ত্রুটি ঘটেছে।',
      syncedToSupabase: false,
    };
  }
};

// Update Exam
export const updateExam = async (
  id: string,
  updatedFields: Partial<Exam>
): Promise<{ success: boolean; data?: Exam; error: string | null; syncedToSupabase?: boolean }> => {
  const current = getLocalCachedExams();
  let updatedLocal: Exam | null = null;
  const updatedCache = current.map((e) => {
    if (String(e.id) === String(id)) {
      updatedLocal = { ...e, ...updatedFields, updated_at: new Date().toISOString() };
      return updatedLocal;
    }
    return e;
  });
  if (updatedLocal) {
    setLocalCachedExams(updatedCache);
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      data: updatedLocal || undefined,
      error: 'সুপাবেস কানেকশন সেট করা নেই। হেডার থেকে Supabase সেটিংস আইকন চাপুন এবং URL ও Key দিন।',
      syncedToSupabase: false,
    };
  }

  try {
    const payload: any = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.badge !== undefined) payload.badge = updatedFields.badge;
    if (updatedFields.badge_type !== undefined) payload.badge_type = updatedFields.badge_type;
    if (updatedFields.subject !== undefined) payload.subject = updatedFields.subject;
    if (updatedFields.topic !== undefined) payload.topic = updatedFields.topic;
    if (updatedFields.post !== undefined) payload.post = updatedFields.post;
    if (updatedFields.pass_mark !== undefined) payload.pass_mark = updatedFields.pass_mark;
    if (updatedFields.category !== undefined) payload.category = updatedFields.category;
    if (updatedFields.exam_type !== undefined) payload.exam_type = updatedFields.exam_type;
    if (updatedFields.question_count !== undefined) payload.question_count = updatedFields.question_count;
    if (updatedFields.time_minutes !== undefined) payload.time_minutes = updatedFields.time_minutes;
    if (updatedFields.negative_marks !== undefined) payload.negative_marks = updatedFields.negative_marks;
    if (updatedFields.total_marks !== undefined) payload.total_marks = updatedFields.total_marks;
    if (updatedFields.description !== undefined) payload.description = updatedFields.description;
    if (updatedFields.id_pattern !== undefined) payload.id_pattern = updatedFields.id_pattern;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;

    const hasQuestionCodes =
      updatedFields.selected_question_codes !== undefined ||
      updatedFields.question_ids !== undefined;

    let selectedCodes: string[] = [];
    if (hasQuestionCodes) {
      selectedCodes = Array.from(
        new Set(
          (updatedFields.selected_question_codes || updatedFields.question_ids || [])
            .map((code) => String(code).trim())
            .filter(Boolean)
        )
      );
      payload.selected_question_codes = selectedCodes;
      payload.question_ids = selectedCodes;
    }

    console.log('Payload: Exam update', JSON.stringify(payload, null, 2));

    let { data, error } = await client
      .from('exams')
      .update(payload)
      .eq('id', String(id))
      .select()
      .single();

    if (error && (
      error.message?.includes('topic') ||
      error.message?.includes('post') ||
      error.message?.includes('pass_mark') ||
      error.message?.includes('category') ||
      error.message?.includes('exam_type') ||
      error.message?.includes('selected_question_codes') ||
      error.message?.includes('question_ids') ||
      error.code === 'PGRST204' ||
      error.code === '42703'
    )) {
      const basicPayload = { ...payload };
      delete basicPayload.topic;
      delete basicPayload.post;
      delete basicPayload.pass_mark;
      delete basicPayload.category;
      delete basicPayload.exam_type;
      delete basicPayload.selected_question_codes;
      delete basicPayload.question_ids;

      let retryResult = await client
        .from('exams')
        .update(basicPayload)
        .eq('id', String(id))
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Supabase updateExam failed:', error);
      return {
        success: false,
        data: updatedLocal || undefined,
        error: error?.message || 'সুপাবেসে পরীক্ষা আপডেট করতে ব্যর্থ হয়েছে।',
        syncedToSupabase: false,
      };
    }

    // Sync question linkages in Supabase questions table
    if (hasQuestionCodes) {
      try {
        // 1. Link selected questions to this exam
        if (selectedCodes.length > 0) {
          await client
            .from('questions')
            .update({ exam_id: String(id) })
            .in('id', selectedCodes);
        }

        // 2. Selection Integrity: Detach questions previously attached to this exam that are no longer selected
        const { data: previousAttached } = await client
          .from('questions')
          .select('id')
          .eq('exam_id', String(id));

        if (previousAttached && previousAttached.length > 0) {
          const selectedSet = new Set(selectedCodes);
          const toDetach = previousAttached
            .map((q) => String(q.id))
            .filter((qId) => !selectedSet.has(qId));

          if (toDetach.length > 0) {
            await client
              .from('questions')
              .update({ exam_id: null })
              .in('id', toDetach);
          }
        }
      } catch (syncErr) {
        console.warn('Could not sync question linkages on updateExam:', syncErr);
      }
    }

    const normalized = normalizeExamRow({
      ...data,
      ...updatedFields,
      questions: updatedFields.questions || (updatedLocal ? updatedLocal.questions : []),
      selected_question_codes: hasQuestionCodes ? selectedCodes : (updatedFields.selected_question_codes || (updatedLocal ? updatedLocal.selected_question_codes : [])),
      question_ids: hasQuestionCodes ? selectedCodes : (updatedFields.question_ids || (updatedLocal ? updatedLocal.question_ids : [])),
      question_count: updatedFields.question_count ?? (updatedFields.questions ? updatedFields.questions.length : (updatedLocal ? updatedLocal.question_count : selectedCodes.length)),
    });

    return {
      success: true,
      data: normalized,
      error: null,
      syncedToSupabase: true,
    };
  } catch (err: any) {
    console.error('Supabase updateExam exception:', err);
    return {
      success: false,
      data: updatedLocal || undefined,
      error: err?.message || 'সুপাবেসে পরীক্ষা আপডেটে ত্রুটি ঘটেছে।',
      syncedToSupabase: false,
    };
  }
};

// Toggle Exam Status (active <-> draft)
export const toggleExamStatus = async (
  id: string,
  currentStatus: ExamStatus
): Promise<{ success: boolean; newStatus?: ExamStatus; error: string | null }> => {
  const newStatus: ExamStatus = currentStatus === 'active' ? 'draft' : 'active';
  const result = await updateExam(id, { status: newStatus });
  if (result.success) {
    return { success: true, newStatus, error: null };
  }
  return { success: false, error: result.error };
};

// Delete Exam
export const deleteExam = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalCachedExams();
  setLocalCachedExams(current.filter((e) => String(e.id) !== String(id)));

  // Also clear linked questions from the local cache
  const localQuestions = getLocalCachedQuestions();
  setLocalCachedQuestions(localQuestions.filter((q) => String(q.exam_id) !== String(id)));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    // 1. First, delete questions associated with this exam from the 'questions' table
    const { error: questionsDeleteError } = await client
      .from('questions')
      .delete()
      .eq('exam_id', id);

    if (questionsDeleteError) {
      console.warn('Supabase delete associated questions error (handled):', questionsDeleteError);
    }

    // 2. Then, delete the exam from the 'exams' table
    const { error: examDeleteError } = await client
      .from('exams')
      .delete()
      .eq('id', id);

    if (examDeleteError) {
      console.error('Supabase deleteExam error:', examDeleteError);
      return { success: false, error: examDeleteError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception in deleteExam manual cascade:', err);
    return { success: false, error: err?.message || String(err) };
  }
};

/* ==========================================================================
   PUBLIC.COURSES, PUBLIC.COURSE_EXAMS, PUBLIC.COURSE_SHEETS CRUD FUNCTIONS
   ========================================================================== */

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'আরবি প্রভাষক স্পেশাল কোর্স',
    category: 'আরবি প্রভাষক',
    badge: 'প্রিলিমিনারি ব্যাচ',
    badge_subtitle: '৯ম শিক্ষক নিয়োগ • ওস্তাদ আহমেদ',
    instructor_name: 'ওস্তাদ আহমেদ ও তামরীন টিম',
    price: '৳৮৫০',
    enrolled_count: 500,
    total_classes: 45,
    total_sheets: 45,
    total_exams: 30,
    theme_color: 'emerald',
    features: [
      'সম্পূর্ণ আরবি সিলেবাস কাভারেজ',
      'অধ্যায়ভিত্তিক ৩০টি স্পেশাল মডেল টেস্ট',
      '৪৫টি প্রিমিয়াম পিডিএফ লেকচার শিট',
      '৭টি পূর্ণাঙ্গ লাইভ ফুল মডেল টেস্ট',
      'লাইভ ও রেকর্ডেড ক্লাস সুবিধা',
    ],
    status: 'published',
    description: `আরবি প্রভাষক স্পেশাল কোর্স পদ মূলত এনটিআরসিএ এবং শিক্ষক নিয়োগ পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ কোর্স। এই পদের জন্য একটি পূর্ণাঙ্গ কোর্সে নিচের বিষয়গুলো থাকলে পরীক্ষা ও চাকরি—দুই ক্ষেত্রেই সর্বোচ্চ কার্যকারিতা পাওয়া যাবে।

১. বিষয়ভিত্তিক মূল বিষয়াদি
• অধ্যায়ভিত্তিক বিস্তারিত আলোচনা ও কুইজ
• আল কুরআন ও হাদিসের প্রয়োজনীয় ব্যাখ্যা
• আরবি ব্যাকরণ: নহু ও সরফ এর খুঁটিনাটি নিয়ম
• আরবি সাহিত্য ও ইতিহাসের গুরুত্বপূর্ণ অধ্যায়সমূহ

২. পরীক্ষার প্রস্তুতি ও বিশেষ কৌশল
• বিগত বছরের প্রশ্নের বিশদ সমাধান ও বিশ্লেষণ
• সময় সচেতন পরীক্ষা গ্রহণ পদ্ধতি
• নেগেটিভ মার্কিং এড়ানোর শর্টকাট টেকনিক
• বিষয়ভিত্তিক নিয়মিত লাইভ ও মেগা মডেল টেস্ট

৩. স্পেশাল শিট ও সাপোর্টিং মেটেরিয়ালস
• প্রতিটি ক্লাসের সাথে গোছানো রঙিন পিডিএফ শিট
• সাজেস্টিভ প্রশ্ন ও ব্যাখ্যা সংবলিত নোট
• গুরুত্বপূর্ণ পরিভাষা ও শব্দার্থ তালিকা`,
    about_text: `আরবি প্রভাষক স্পেশাল কোর্স পদ মূলত এনটিআরসিএ এবং শিক্ষক নিয়োগ পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ কোর্স।`,
    routine_text: `সাপ্তাহিক ক্লাস ও পরীক্ষা রুটিন:

📅 শনি ও সোমবার:
• রাত ৮:৩০ - আরবি ব্যাকরণ (নহু ও সরফ) লাইভ ক্লাস
• রাত ৯:৪৫ - অধ্যায়ভিত্তিক কুইজ ও প্রশ্ন সমাধান

📅 বুধ ও শুক্রবার:
• রাত ৮:৩০ - আল কুরআন, হাদিস ও আরবি সাহিত্য
• রাত ৯:৪৫ - স্পেশাল প্রিলিমিনারি মডেল টেস্ট

📅 প্রতি মাসের শেষ শুক্রবার:
• রাত ৯:০০ - মেগা লাইভ ফুল মডেল টেস্ট ও লিডারবোর্ড র‍্যাঙ্কিং`,
    routine_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    routine_pdf_name: 'Arabic_Lecturer_Routine.pdf',
    syllabus_text: `আরবি প্রভাষক পদের পূর্ণাঙ্গ সিলেবাস ও মানবন্টন:

১. আরবি ভাষা ও ব্যাকরণ (নহু ও সরফ) — ৩৫ নম্বর
• তারিফে ইলমে নহু ও সরফ, কালিমার প্রকারভেদ
• এরাব ও মাবনি, মারফুআত, মানসুবাত, মাজরুরাত
• বাহাস, সিগাহ, বাবের পরিচয় ও তারকিব

২. আল কুরআন ও উলুমুল কুরআন — ২৫ নম্বর
• সূরা আল বাকারাহ ও নির্বাচিত আয়াতসমূহের শানে নুযুল ও তাফসির

৩. হাদিস ও উলুমুল হাদিস — ২০ নম্বর
• মিশকাতুল মাসাবিহ ও নির্বাচিত সহিহ হাদিস
• মুস্তালাহুল হাদিস ও সনদের প্রকারভেদ

৪. আরবি সাহিত্য ও ইসলামের ইতিহাস — ২০ নম্বর
• জাহেলি ও ইসলামি যুগের বিখ্যাত কবি ও সাহিত্যিক
• খিলাফতে রাশেদা ও উমাইয়া-আব্বাসীয় ইতিহাস`,
    syllabus_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    syllabus_pdf_name: 'Arabic_Lecturer_Syllabus.pdf',
    leaderboard_enabled: true,
    leaderboard_info: 'সকল মডেল টেস্টের প্রাপ্ত নম্বরের ভিত্তিতে সাপ্তাহিক ও মাসিক লিডারবোর্ড তৈরি হবে।',
    details_button_text: 'বিস্তারিত',
    details_button_link: 'https://t.me/tamreen_academy',
    enroll_button_text: 'ভর্তি হন (৳৮৫০)',
    enroll_button_link: '#',
    enter_button_text: 'প্রবেশ করুন',
    sheet_button_text: 'শিট ডাউনলোড',
    helpline_contact: '018XXXXXXXX',
    is_upcoming: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: 'সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স',
    category: 'সহকারী মৌলভী',
    badge: 'রেকর্ড ব্যাচ',
    badge_subtitle: 'মাদ্রাসা ও ইবতেদায়ী কারিকুলাম',
    instructor_name: 'মাওলানা আব্দুল্লাহ আল-মামুন',
    price: '৳৭৫০',
    enrolled_count: 380,
    total_classes: 36,
    total_sheets: 30,
    total_exams: 25,
    theme_color: 'purple',
    features: [
      'সহকারী মৌলভী পদের শতভাগ সিলেবাস',
      '৩০টি এক্সক্লুসিভ হ্যান্ডনোট',
      '২৫টি অধ্যায়ভিত্তিক পরীক্ষা',
      'স্পেশাল লাইভ সলভ ক্লাস',
    ],
    status: 'published',
    is_upcoming: true,
    upcoming_date: '2026-09-15T20:00',
    upcoming_badge_text: 'আপকামিং স্পেশাল ব্যাচ',
    upcoming_note: '১৫ সেপ্টেম্বর থেকে লাইভ ওরিয়েন্টেশন ক্লাস শুরু হতে যাচ্ছে।',
    description: `সহকারী মৌলভী পদের জন্য এনটিআরসিএ ও মাদ্রাসা শিক্ষক নিয়োগ পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি কোর্স।`,
    routine_text: `রবি, মঙ্গল, বৃহস্পতি রাত ৯:০০ টায় ক্লাস ও পরীক্ষা।`,
    syllabus_text: `কুরআন মাজিদ, হাদিস শরিফ, ফিকহুল ইসলাম ও আরবি ব্যাকরণ।`,
    details_button_text: 'বিস্তারিত',
    details_button_link: '#',
    enroll_button_text: 'ভর্তি হন (৳৭৫০)',
    enroll_button_link: '#',
    enter_button_text: 'প্রবেশ করুন',
    sheet_button_text: 'শিট ডাউনলোড',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_COURSE_EXAMS: Record<string, CourseExam[]> = {
  'course-1': [
    {
      id: 'ce-101',
      course_id: 'course-1',
      title: 'মডেল টেস্ট ০১: আল কুরআন ও উলুমুল কুরআন বিশেষ পরীক্ষা',
      subject: 'আল কুরআন',
      topic: 'সূরা আল বাকারাহ ও উলুমুল কুরআন',
      question_count: 25,
      time_minutes: 20,
      total_marks: 25,
      pass_marks: 10,
      negative_marks: 0.25,
      is_locked: false,
      position: 1,
      instructions: 'প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর এবং ভুল উত্তরের জন্য ০.২৫ কাটা যাবে।',
      questions: [
        {
          id: 'q-1',
          question: 'কুরআন মজিদের সবচেয়ে বড় সূরার নাম কী?',
          option_a: 'সূরা আল ইমরান',
          option_b: 'সূরা আল বাকারাহ',
          option_c: 'সূরা আন নিসা',
          option_d: 'সূরা আল মায়িদাহ',
          correct_answer: 'option_b',
          explanation: 'সূরা আল বাকারাহ কুরআন মজিদের দীর্ঘতম সূরা, যাতে মোট ২৮৬টি আয়াত রয়েছে।',
          subject: 'আল কুরআন',
          topic: 'সূরা আল বাকারাহ',
        },
        {
          id: 'q-2',
          question: 'কোন সূরায় বিসমিল্লাহ দুইবার এসেছে?',
          option_a: 'সূরা আন-নামল',
          option_b: 'সূরা আত-তাওবাহ',
          option_c: 'সূরা আর-রহমান',
          option_d: 'সূরা আল-ইখলাস',
          correct_answer: 'option_a',
          explanation: 'সূরা আন-নামল এর ৩০ নম্বর আয়াতে সুলাইমান (আঃ) এর চিঠির শুরুতে বিসমিল্লাহ উল্লেখ থাকায় এই সূরায় দুইবার বিসমিল্লাহ এসেছে।',
          subject: 'আল কুরআন',
          topic: 'উলুমুল কুরআন',
        },
      ],
    },
    {
      id: 'ce-102',
      course_id: 'course-1',
      title: 'মডেল টেস্ট ০২: আরবি ব্যাকরণ (নহু ও সরফ) স্পেশাল টেস্ট',
      subject: 'আরবি ব্যাকরণ',
      topic: 'কালিমার প্রকারভেদ ও এরাব',
      question_count: 30,
      time_minutes: 25,
      total_marks: 30,
      pass_marks: 12,
      negative_marks: 0.25,
      is_locked: true,
      position: 2,
      instructions: 'লকড টেস্ট: শুধুমাত্র ভর্তি হওয়া শিক্ষার্থীরা এই পরীক্ষা দিতে পারবে।',
      questions: [],
    },
  ],
};

export const INITIAL_COURSE_SHEETS: Record<string, CourseSheet[]> = {
  'course-1': [
    {
      id: 'cs-101',
      course_id: 'course-1',
      title: 'অধ্যায় ১: আল কুরআন ও তাফসির স্পেশাল হ্যান্ডনোট',
      subject: 'আল কুরআন',
      topic: 'উলুমুল কুরআন',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pdf_name: 'Chapter_1_Al_Quran_Notes.pdf',
      file_size: '৩.৫ মেগাবাইট',
      page_count: '২৪ পেজ',
      badge_text: 'ফ্রি ডেমো শিট',
      is_locked: false,
      position: 1,
    },
    {
      id: 'cs-102',
      course_id: 'course-1',
      title: 'অধ্যায় ২: আরবি নহু-সরফ গুরুত্বপূর্ণ কায়দা ও উদাহরণ',
      subject: 'আরবি ব্যাকরণ',
      topic: 'নহু ও সরফ',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pdf_name: 'Chapter_2_Nahu_Saraf_Rules.pdf',
      file_size: '৪.২ মেগাবাইট',
      page_count: '৩২ পেজ',
      badge_text: 'ভিআইপি লেকচার নোট',
      is_locked: true,
      position: 2,
    },
  ],
};

// Normalize Course Row from Supabase
function normalizeCourseRow(row: any, fallbackLocalCourse?: Course): Course {
  let parsedFeatures: string[] = [];
  if (Array.isArray(row.features)) {
    parsedFeatures = row.features;
  } else if (typeof row.features === 'string') {
    try {
      parsedFeatures = JSON.parse(row.features);
    } catch (e) {
      parsedFeatures = [row.features];
    }
  } else if (fallbackLocalCourse?.features) {
    parsedFeatures = fallbackLocalCourse.features;
  }

  // Parse counts with all possible column variations from Supabase schema
  const totalClasses = Number(
    row.total_classes !== undefined && row.total_classes !== null ? row.total_classes :
    row.classes_count !== undefined && row.classes_count !== null ? row.classes_count :
    fallbackLocalCourse?.total_classes ?? 0
  );

  const totalSheets = Number(
    row.total_sheets !== undefined && row.total_sheets !== null ? row.total_sheets :
    row.sheets_count !== undefined && row.sheets_count !== null ? row.sheets_count :
    fallbackLocalCourse?.total_sheets ?? 0
  );

  const totalExams = Number(
    row.total_exams !== undefined && row.total_exams !== null ? row.total_exams :
    row.exams_count !== undefined && row.exams_count !== null ? row.exams_count :
    fallbackLocalCourse?.total_exams ?? 0
  );

  const enrolledCount = Number(
    row.enrolled_count !== undefined && row.enrolled_count !== null ? row.enrolled_count :
    fallbackLocalCourse?.enrolled_count ?? 0
  );

  // Description / About text parsing
  const rawAbout = row.about_text || row.description || row.about || row.details;
  const finalAbout = (rawAbout && rawAbout.trim() !== '') ? rawAbout : (fallbackLocalCourse?.about_text || fallbackLocalCourse?.description || '');

  // Routine text parsing
  const rawRoutine = row.routine_text || row.routine || row.routine_description;
  const finalRoutine = (rawRoutine && rawRoutine.trim() !== '') ? rawRoutine : (fallbackLocalCourse?.routine_text || '');

  // Routine PDF URL parsing
  const rawRoutinePdf = row.routine_pdf_url || row.routine_pdf || row.pdf_url || row.file_url;
  const finalRoutinePdf = rawRoutinePdf || fallbackLocalCourse?.routine_pdf_url || '';

  // Syllabus text parsing
  const rawSyllabus = row.syllabus_text || row.syllabus || row.syllabus_description;
  const finalSyllabus = (rawSyllabus && rawSyllabus.trim() !== '') ? rawSyllabus : (fallbackLocalCourse?.syllabus_text || '');

  // Syllabus PDF URL parsing
  const rawSyllabusPdf = row.syllabus_pdf_url || row.syllabus_pdf || row.pdf_url || row.file_url;
  const finalSyllabusPdf = rawSyllabusPdf || fallbackLocalCourse?.syllabus_pdf_url || '';

  return {
    id: String(row.id),
    title: row.title || fallbackLocalCourse?.title || 'শিরোনাম ছাড়া কোর্স',
    category: row.category || fallbackLocalCourse?.category || 'আরবি প্রভাষক',
    badge: row.badge || row.badge_title || fallbackLocalCourse?.badge || 'বিশেষ ব্যাচ',
    badge_subtitle: row.badge_subtitle || fallbackLocalCourse?.badge_subtitle || '',
    instructor_name: row.instructor_name || row.instructor || row.teacher || fallbackLocalCourse?.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
    price: row.price || fallbackLocalCourse?.price || '৳০',
    enrolled_count: enrolledCount,
    total_classes: totalClasses,
    total_sheets: totalSheets,
    total_exams: totalExams,
    theme_color: row.theme_color || fallbackLocalCourse?.theme_color || 'emerald',
    features: parsedFeatures.length > 0 ? parsedFeatures : (fallbackLocalCourse?.features || []),
    status: row.status || fallbackLocalCourse?.status || 'published',
    is_upcoming: row.is_upcoming !== undefined ? Boolean(row.is_upcoming) : (fallbackLocalCourse?.is_upcoming ?? false),
    upcoming_date: row.upcoming_date || row.upcoming_time || row.start_date || fallbackLocalCourse?.upcoming_date || '',
    upcoming_badge_text: row.upcoming_badge_text || fallbackLocalCourse?.upcoming_badge_text || '',
    upcoming_note: row.upcoming_note || row.upcoming_description || fallbackLocalCourse?.upcoming_note || '',
    description: finalAbout,
    about_text: finalAbout,
    routine_text: finalRoutine,
    routine_pdf_url: finalRoutinePdf,
    routine_pdf_name: row.routine_pdf_name || row.file_name || fallbackLocalCourse?.routine_pdf_name || '',
    syllabus_text: finalSyllabus,
    syllabus_pdf_url: finalSyllabusPdf,
    syllabus_pdf_name: row.syllabus_pdf_name || row.file_name || fallbackLocalCourse?.syllabus_pdf_name || '',
    leaderboard_enabled: row.leaderboard_enabled !== undefined ? Boolean(row.leaderboard_enabled) : (fallbackLocalCourse?.leaderboard_enabled ?? true),
    leaderboard_info: row.leaderboard_info || fallbackLocalCourse?.leaderboard_info || '',
    helpline_contact: row.helpline_contact || fallbackLocalCourse?.helpline_contact || '',
    details_button_text: row.details_button_text || row.details_text || fallbackLocalCourse?.details_button_text || 'বিস্তারিত',
    details_button_link: row.details_button_link || row.details_link || fallbackLocalCourse?.details_button_link || '#',
    enroll_button_text: row.enroll_button_text || row.enroll_text || fallbackLocalCourse?.enroll_button_text || 'এখনই ভর্তি হন',
    enroll_button_link: row.enroll_button_link || row.enroll_link || fallbackLocalCourse?.enroll_button_link || '#',
    enter_button_text: row.enter_button_text || row.enter_text || fallbackLocalCourse?.enter_button_text || 'প্রবেশ করুন',
    sheet_button_text: row.sheet_button_text || row.sheet_text || fallbackLocalCourse?.sheet_button_text || 'শিট ডাউনলোড',
    created_at: row.created_at || fallbackLocalCourse?.created_at || new Date().toISOString(),
    updated_at: row.updated_at || fallbackLocalCourse?.updated_at,
  };
}

// LocalStorage Local Cache for Courses
const COURSE_CACHE_KEY = 'miniquiz_admin_courses_cache';
const COURSE_EXAMS_CACHE_KEY = 'miniquiz_admin_course_exams_cache';
const COURSE_SHEETS_CACHE_KEY = 'miniquiz_admin_course_sheets_cache';

const getLocalCoursesCache = (): Course[] => {
  const local = localStorage.getItem(COURSE_CACHE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(INITIAL_COURSES));
  return INITIAL_COURSES;
};

const setLocalCoursesCache = (courses: Course[]) => {
  localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(courses));
};

const getLocalCourseExamsCache = (): Record<string, CourseExam[]> => {
  const local = localStorage.getItem(COURSE_EXAMS_CACHE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(COURSE_EXAMS_CACHE_KEY, JSON.stringify(INITIAL_COURSE_EXAMS));
  return INITIAL_COURSE_EXAMS;
};

const setLocalCourseExamsCache = (data: Record<string, CourseExam[]>) => {
  localStorage.setItem(COURSE_EXAMS_CACHE_KEY, JSON.stringify(data));
};

const getLocalCourseSheetsCache = (): Record<string, CourseSheet[]> => {
  const local = localStorage.getItem(COURSE_SHEETS_CACHE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(COURSE_SHEETS_CACHE_KEY, JSON.stringify(INITIAL_COURSE_SHEETS));
  return INITIAL_COURSE_SHEETS;
};

const setLocalCourseSheetsCache = (data: Record<string, CourseSheet[]>) => {
  localStorage.setItem(COURSE_SHEETS_CACHE_KEY, JSON.stringify(data));
};

// Fetch Published Courses specifically for Student App / Student Portal
export const fetchPublishedCoursesForStudent = async (): Promise<{
  courses: Course[];
  error: string | null;
  isTableMissing?: boolean;
  isSupabaseConnected: boolean;
}> => {
  const client = getSupabaseClient();
  const localList = getLocalCoursesCache();

  if (!client) {
    const publishedOnly = localList.filter((c) => c.status === 'published');
    return {
      courses: publishedOnly,
      error: 'Supabase URL & Anon Key কানেক্ট করা নেই। কেবল এডমিনের স্থানীয় ব্রাউজার ডাটা ফিল্টার করা হয়েছে।',
      isTableMissing: true,
      isSupabaseConnected: false,
    };
  }

  try {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchPublishedCoursesForStudent warning:', error.message);
      const isMissing = error.code === '42P01' || error.message.includes('does not exist');
      const publishedOnly = localList.filter((c) => c.status === 'published');
      return {
        courses: publishedOnly,
        error: error.message,
        isTableMissing: isMissing,
        isSupabaseConnected: true,
      };
    }

    if (!data || data.length === 0) {
      const publishedOnly = localList.filter((c) => c.status === 'published');
      return { courses: publishedOnly, error: null, isSupabaseConnected: true };
    }

    const normalized = data.map((row) => {
      const localCourse = localList.find((c) => String(c.id) === String(row.id));
      return normalizeCourseRow(row, localCourse);
    });

    return { courses: normalized, error: null, isSupabaseConnected: true };
  } catch (err: any) {
    const publishedOnly = localList.filter((c) => c.status === 'published');
    return {
      courses: publishedOnly,
      error: err?.message || 'অজানা ত্রুটি',
      isTableMissing: true,
      isSupabaseConnected: true,
    };
  }
};

// Helper UUID generator (RFC4122 compliant)
export const generateStandardUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper: Format ISO timestamp or return null for PostgreSQL timestamp columns
export const formatTimestampOrNull = (val?: string | null): string | null => {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) return null;
  try {
    return new Date(parsed).toISOString();
  } catch (e) {
    return null;
  }
};

// Fetch All Courses from public.courses with graceful local fallback
export const fetchAllCourses = async (): Promise<{
  courses: Course[];
  error: string | null;
  isTableMissing?: boolean;
  isSupabaseConnected?: boolean;
}> => {
  const client = getSupabaseClient();
  const localList = getLocalCoursesCache();

  if (!client) {
    const unflagged = localList.map((c) => ({ ...c, is_synced_to_supabase: false }));
    return { courses: unflagged, error: null, isTableMissing: true, isSupabaseConnected: false };
  }

  try {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllCourses warning:', error.message);
      const isMissing = error.code === '42P01' || error.message.includes('does not exist');
      const unflagged = localList.map((c) => ({ ...c, is_synced_to_supabase: false }));
      return {
        courses: unflagged,
        error: isMissing ? 'সুপাবেজে "courses" টেবিল পাওয়া যায়নি' : error.message,
        isTableMissing: isMissing,
        isSupabaseConnected: true,
      };
    }

    if (!data || data.length === 0) {
      const unflagged = localList.map((c) => ({ ...c, is_synced_to_supabase: false }));
      return { courses: unflagged, error: null, isSupabaseConnected: true };
    }

    const normalized = data.map((row) => {
      const localCourse = localList.find((c) => String(c.id) === String(row.id));
      const norm = normalizeCourseRow(row, localCourse);
      return {
        ...norm,
        is_synced_to_supabase: true,
      };
    });

    // Merge any purely local courses that might not yet be in Supabase
    const supabaseIds = new Set(normalized.map((c) => c.id));
    const merged = [
      ...normalized,
      ...localList
        .filter((c) => !supabaseIds.has(c.id))
        .map((c) => ({ ...c, is_synced_to_supabase: false })),
    ];

    setLocalCoursesCache(merged);
    return { courses: merged, error: null, isSupabaseConnected: true };
  } catch (err: any) {
    const unflagged = localList.map((c) => ({ ...c, is_synced_to_supabase: false }));
    return { courses: unflagged, error: err?.message || null, isTableMissing: true, isSupabaseConnected: true };
  }
};

// Helper to sync course sub-tables (course_details, course_routines, Coure_routine, course_syllabus)
export const syncCourseSubTables = async (course: Partial<Course> & { id: string }) => {
  const client = getSupabaseClient();
  if (!client || !course.id) return;

  const desc = course.about_text || course.description || '';
  const rout = course.routine_text || '';
  const routPdf = course.routine_pdf_url || '';
  const syll = course.syllabus_text || '';
  const syllPdf = course.syllabus_pdf_url || '';

  // 1. Sync to course_details if table exists
  try {
    const detailsPayload: any = {
      id: course.id,
      course_id: course.id,
      title: course.title || '',
      about_text: desc,
      description: desc,
      about: desc,
      details: desc,
      features: Array.isArray(course.features) ? course.features : [],
      helpline_contact: course.helpline_contact || '',
      details_button_link: course.details_button_link || '',
      enroll_button_link: course.enroll_button_link || '',
      updated_at: new Date().toISOString(),
    };
    await client.from('course_details').upsert([detailsPayload], { onConflict: 'id' });
  } catch (e) {
    // Graceful silent fallback
  }

  // 2. Sync to course_routines
  const routinePayload: any = {
    id: course.id,
    course_id: course.id,
    title: course.title ? `${course.title} - রুটিন` : 'রুটিন',
    routine_text: rout,
    routine_description: rout,
    routine: rout,
    routine_pdf_url: routPdf,
    pdf_url: routPdf,
    pdf_link: routPdf,
    file_url: routPdf,
    routine_pdf_name: course.routine_pdf_name || '',
    file_name: course.routine_pdf_name || '',
    updated_at: new Date().toISOString(),
  };

  try {
    await client.from('course_routines').upsert([routinePayload], { onConflict: 'id' });
  } catch (e) {}

  // Also support Coure_routine (as created in some Supabase projects)
  try {
    await client.from('Coure_routine').upsert([routinePayload], { onConflict: 'id' });
  } catch (e) {}

  try {
    await client.from('course_routine').upsert([routinePayload], { onConflict: 'id' });
  } catch (e) {}

  // 3. Sync to course_syllabus if table exists
  try {
    const syllabusPayload: any = {
      id: course.id,
      course_id: course.id,
      title: course.title ? `${course.title} - সিলেবাস` : 'সিলেবাস',
      syllabus_text: syll,
      syllabus_description: syll,
      syllabus: syll,
      syllabus_pdf_url: syllPdf,
      pdf_url: syllPdf,
      pdf_link: syllPdf,
      file_url: syllPdf,
      syllabus_pdf_name: course.syllabus_pdf_name || '',
      file_name: course.syllabus_pdf_name || '',
      updated_at: new Date().toISOString(),
    };
    await client.from('course_syllabus').upsert([syllabusPayload], { onConflict: 'id' });
  } catch (e) {
    // Graceful silent fallback
  }
};

// Insert New Course
export const insertCourse = async (
  newCourse: Omit<Course, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    custom_id?: string;
  }
): Promise<{ success: boolean; data?: Course; error: string | null }> => {
  const client = getSupabaseClient();
  const customId = (newCourse.custom_id || newCourse.id || '').trim();
  const fallbackId = customId || generateStandardUUID();

  const courseData: Course = {
    ...newCourse,
    id: fallbackId,
    created_at: new Date().toISOString(),
  };

  if (!client) {
    const current = getLocalCoursesCache();
    setLocalCoursesCache([courseData, ...current]);
    return {
      success: false,
      data: courseData,
      error: 'সুপাবেস কনফিগার করা নেই। সেটিংস থেকে SUPABASE_URL এবং SUPABASE_ANON_KEY সেট করুন।',
    };
  }

  try {
    const descText = newCourse.about_text || newCourse.description || '';
    const routText = newCourse.routine_text || '';
    const syllText = newCourse.syllabus_text || '';

    let payload: any = {
      id: fallbackId,
      title: newCourse.title,
      category: newCourse.category || 'আরবি প্রভাষক',
      badge: newCourse.badge || 'রেকর্ড ব্যাচ',
      badge_title: newCourse.badge || 'রেকর্ড ব্যাচ',
      badge_subtitle: newCourse.badge_subtitle || '',
      instructor_name: newCourse.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
      instructor: newCourse.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
      price: newCourse.price || '৳৯৫০',
      enrolled_count: Number(newCourse.enrolled_count) || 0,
      total_classes: Number(newCourse.total_classes) || 0,
      classes_count: Number(newCourse.total_classes) || 0,
      total_sheets: Number(newCourse.total_sheets) || 0,
      sheets_count: Number(newCourse.total_sheets) || 0,
      total_exams: Number(newCourse.total_exams) || 0,
      exams_count: Number(newCourse.total_exams) || 0,
      theme_color: newCourse.theme_color || 'emerald',
      features: Array.isArray(newCourse.features) ? newCourse.features : [],
      status: newCourse.status || 'published',
      is_upcoming: newCourse.is_upcoming !== undefined ? Boolean(newCourse.is_upcoming) : false,
      ...(formatTimestampOrNull(newCourse.upcoming_date) ? { upcoming_date: formatTimestampOrNull(newCourse.upcoming_date) } : {}),
      upcoming_badge_text: newCourse.upcoming_badge_text || '',
      upcoming_note: newCourse.upcoming_note || '',
      description: descText,
      about_text: descText,
      about: descText,
      details: descText,
      routine_text: routText,
      routine: routText,
      routine_description: routText,
      routine_pdf_url: newCourse.routine_pdf_url || '',
      routine_pdf: newCourse.routine_pdf_url || '',
      routine_pdf_name: newCourse.routine_pdf_name || '',
      syllabus_text: syllText,
      syllabus: syllText,
      syllabus_description: syllText,
      syllabus_pdf_url: newCourse.syllabus_pdf_url || '',
      syllabus_pdf: newCourse.syllabus_pdf_url || '',
      syllabus_pdf_name: newCourse.syllabus_pdf_name || '',
      leaderboard_enabled: newCourse.leaderboard_enabled !== undefined ? Boolean(newCourse.leaderboard_enabled) : true,
      leaderboard_info: newCourse.leaderboard_info || '',
      helpline_contact: newCourse.helpline_contact || '',
      details_button_text: newCourse.details_button_text || 'বিস্তারিত',
      details_text: newCourse.details_button_text || 'বিস্তারিত',
      details_button_link: newCourse.details_button_link || '#',
      details_link: newCourse.details_button_link || '#',
      enroll_button_text: newCourse.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_text: newCourse.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_button_link: newCourse.enroll_button_link || '#',
      enroll_link: newCourse.enroll_button_link || '#',
      enter_button_text: newCourse.enter_button_text || 'প্রবেশ করুন',
      enter_text: newCourse.enter_button_text || 'প্রবেশ করুন',
      sheet_button_text: newCourse.sheet_button_text || 'শিট ডাউনলোড',
      sheet_text: newCourse.sheet_button_text || 'শিট ডাউনলোড',
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      const { data, error } = await client
        .from('courses')
        .insert([payload])
        .select();

      if (!error) {
        if (data && data.length > 0) {
          insertedRow = normalizeCourseRow(data[0]);
        } else {
          insertedRow = courseData;
        }
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      // 1. Check if any key in payload is explicitly named in the error message
      const payloadKeys = Object.keys(payload);
      for (const key of payloadKeys) {
        if (errMsg.includes(key.toLowerCase()) && key !== 'title' && key !== 'id') {
          delete payload[key];
          stripped = true;
        }
      }

      // 2. Extract column name via regex patterns
      const regexPatterns = [
        /find the ['"]?([a-zA-Z0-9_]+)['"]? column/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? of relation/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]?/i,
      ];

      for (const pattern of regexPatterns) {
        const match = error.message.match(pattern);
        if (match && match[1]) {
          const colName = match[1];
          if (colName in payload && colName !== 'title' && colName !== 'id') {
            delete payload[colName];
            stripped = true;
            break;
          }
        }
      }

      // 3. If JSONB issue with features
      if (errMsg.includes('features') && Array.isArray(payload.features)) {
        payload.features = JSON.stringify(payload.features);
        stripped = true;
      }

      // 4. If timestamp or timezone syntax error
      if (errMsg.includes('timestamp') || errMsg.includes('time zone') || errMsg.includes('date') || errMsg.includes('invalid input syntax')) {
        if ('upcoming_date' in payload) {
          delete payload.upcoming_date;
          stripped = true;
        }
        if ('updated_at' in payload) {
          delete payload.updated_at;
          stripped = true;
        }
        if ('created_at' in payload) {
          delete payload.created_at;
          stripped = true;
        }
        for (const k of Object.keys(payload)) {
          if (payload[k] === '' && (k.includes('date') || k.includes('time') || k.includes('routine') || k.includes('syllabus'))) {
            delete payload[k];
            stripped = true;
          }
        }
      }

      // 5. Fallback sequential strip
      if (!stripped) {
        const optionalKeys = [
          'upcoming_date', 'upcoming_badge_text', 'upcoming_note', 'is_upcoming',
          'routine_pdf_url', 'routine_pdf', 'routine_pdf_name', 'routine_text', 'routine', 'routine_description',
          'syllabus_pdf_url', 'syllabus_pdf', 'syllabus_pdf_name', 'syllabus_text', 'syllabus', 'syllabus_description',
          'leaderboard_info', 'leaderboard_enabled', 'helpline_contact',
          'details_button_text', 'details_text', 'details_button_link', 'details_link',
          'enroll_button_text', 'enroll_text', 'enroll_button_link', 'enroll_link',
          'enter_button_text', 'enter_text', 'sheet_button_text', 'sheet_text',
          'badge_subtitle', 'badge_title', 'about_text', 'about', 'details',
          'description', 'features', 'theme_color', 'total_exams', 'exams_count',
          'total_sheets', 'sheets_count', 'total_classes', 'classes_count',
          'enrolled_count', 'instructor_name', 'instructor', 'badge', 'price', 'status', 'category'
        ];
        for (const key of optionalKeys) {
          if (key in payload) {
            delete payload[key];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) {
        break;
      }
    }

    if (lastError) {
      console.error('Supabase insertCourse error:', lastError);
      const isMissing = lastError.code === '42P01' || lastError.message.includes('does not exist');
      const isRls = lastError.code === '42501' || lastError.message.includes('row-level security');
      const errorMsg = isMissing
        ? 'সুপাবেজে "public.courses" টেবিল তৈরি করা নেই! "Supabase SQL স্কিমা" বাটনে ক্লিক করে SQL কোড রান করুন।'
        : isRls
        ? 'সুপাবেজে RLS পারমিশন ত্রুটি! SQL স্কিমা রান করে RLS Allow All পলিসি নিশ্চিত করুন।'
        : `সুপাবেজে সেভ হয়নি: ${lastError.message}`;

      const current = getLocalCoursesCache();
      setLocalCoursesCache([courseData, ...current.filter((c) => c.id !== courseData.id)]);

      return { success: false, data: courseData, error: errorMsg };
    }

    const finalInserted = insertedRow || courseData;
    const latestLocal = getLocalCoursesCache();
    setLocalCoursesCache([finalInserted, ...latestLocal.filter((c) => c.id !== finalInserted.id)]);

    // Also sync sub-tables (course_details, course_routines, course_syllabus)
    syncCourseSubTables(finalInserted).catch(() => {});

    return { success: true, data: finalInserted, error: null };
  } catch (err: any) {
    return { success: false, data: courseData, error: err?.message || 'কোর্স তৈরি ব্যর্থ হয়েছে' };
  }
};

// Update Course
export const updateCourse = async (
  id: string,
  updatedFields: Partial<Course>
): Promise<{ success: boolean; data?: Course; error: string | null }> => {
  const client = getSupabaseClient();

  const current = getLocalCoursesCache();
  const index = current.findIndex((c) => c.id === id);
  let updatedCourse: Course | undefined;
  if (index !== -1) {
    updatedCourse = { ...current[index], ...updatedFields, updated_at: new Date().toISOString() };
    current[index] = updatedCourse;
    setLocalCoursesCache([...current]);
  }

  if (!client) {
    return { success: true, data: updatedCourse, error: null };
  }

  try {
    const descText = updatedFields.about_text ?? updatedFields.description;
    const routText = updatedFields.routine_text;
    const syllText = updatedFields.syllabus_text;

    let payload: any = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.category !== undefined) payload.category = updatedFields.category;
    if (updatedFields.badge !== undefined) {
      payload.badge = updatedFields.badge;
      payload.badge_title = updatedFields.badge;
    }
    if (updatedFields.badge_subtitle !== undefined) payload.badge_subtitle = updatedFields.badge_subtitle;
    if (updatedFields.instructor_name !== undefined) {
      payload.instructor_name = updatedFields.instructor_name;
      payload.instructor = updatedFields.instructor_name;
    }
    if (updatedFields.price !== undefined) payload.price = updatedFields.price;
    if (updatedFields.enrolled_count !== undefined) payload.enrolled_count = Number(updatedFields.enrolled_count) || 0;
    if (updatedFields.total_classes !== undefined) {
      payload.total_classes = Number(updatedFields.total_classes) || 0;
      payload.classes_count = Number(updatedFields.total_classes) || 0;
    }
    if (updatedFields.total_sheets !== undefined) {
      payload.total_sheets = Number(updatedFields.total_sheets) || 0;
      payload.sheets_count = Number(updatedFields.total_sheets) || 0;
    }
    if (updatedFields.total_exams !== undefined) {
      payload.total_exams = Number(updatedFields.total_exams) || 0;
      payload.exams_count = Number(updatedFields.total_exams) || 0;
    }
    if (updatedFields.theme_color !== undefined) payload.theme_color = updatedFields.theme_color;
    if (updatedFields.features !== undefined) payload.features = updatedFields.features;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if ((updatedFields as any).questions !== undefined) payload.questions = (updatedFields as any).questions;
    if ((updatedFields as any).question_ids !== undefined) payload.question_ids = (updatedFields as any).question_ids;
    if (updatedFields.is_upcoming !== undefined) payload.is_upcoming = Boolean(updatedFields.is_upcoming);
    if (updatedFields.upcoming_date !== undefined) {
      const formattedDate = formatTimestampOrNull(updatedFields.upcoming_date);
      if (formattedDate) {
        payload.upcoming_date = formattedDate;
      }
    }
    if (updatedFields.upcoming_badge_text !== undefined) payload.upcoming_badge_text = updatedFields.upcoming_badge_text;
    if (updatedFields.upcoming_note !== undefined) payload.upcoming_note = updatedFields.upcoming_note;
    if (descText !== undefined) {
      payload.description = descText;
      payload.about_text = descText;
      payload.about = descText;
      payload.details = descText;
    }
    if (routText !== undefined) {
      payload.routine_text = routText;
      payload.routine = routText;
      payload.routine_description = routText;
    }
    if (updatedFields.routine_pdf_url !== undefined) {
      payload.routine_pdf_url = updatedFields.routine_pdf_url;
      payload.routine_pdf = updatedFields.routine_pdf_url;
    }
    if (updatedFields.routine_pdf_name !== undefined) payload.routine_pdf_name = updatedFields.routine_pdf_name;
    if (syllText !== undefined) {
      payload.syllabus_text = syllText;
      payload.syllabus = syllText;
      payload.syllabus_description = syllText;
    }
    if (updatedFields.syllabus_pdf_url !== undefined) {
      payload.syllabus_pdf_url = updatedFields.syllabus_pdf_url;
      payload.syllabus_pdf = updatedFields.syllabus_pdf_url;
    }
    if (updatedFields.syllabus_pdf_name !== undefined) payload.syllabus_pdf_name = updatedFields.syllabus_pdf_name;
    if (updatedFields.leaderboard_enabled !== undefined) payload.leaderboard_enabled = Boolean(updatedFields.leaderboard_enabled);
    if (updatedFields.leaderboard_info !== undefined) payload.leaderboard_info = updatedFields.leaderboard_info;
    if (updatedFields.helpline_contact !== undefined) payload.helpline_contact = updatedFields.helpline_contact;
    if (updatedFields.details_button_text !== undefined) {
      payload.details_button_text = updatedFields.details_button_text;
      payload.details_text = updatedFields.details_button_text;
    }
    if (updatedFields.details_button_link !== undefined) {
      payload.details_button_link = updatedFields.details_button_link;
      payload.details_link = updatedFields.details_button_link;
    }
    if (updatedFields.enroll_button_text !== undefined) {
      payload.enroll_button_text = updatedFields.enroll_button_text;
      payload.enroll_text = updatedFields.enroll_button_text;
    }
    if (updatedFields.enroll_button_link !== undefined) {
      payload.enroll_button_link = updatedFields.enroll_button_link;
      payload.enroll_link = updatedFields.enroll_button_link;
    }
    if (updatedFields.enter_button_text !== undefined) {
      payload.enter_button_text = updatedFields.enter_button_text;
      payload.enter_text = updatedFields.enter_button_text;
    }
    if (updatedFields.sheet_button_text !== undefined) {
      payload.sheet_button_text = updatedFields.sheet_button_text;
      payload.sheet_text = updatedFields.sheet_button_text;
    }

    payload.updated_at = new Date().toISOString();

    let lastError: any = null;
    let updatedRow: any = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      if (Object.keys(payload).length === 0) {
        break;
      }

      const { data, error } = await client
        .from('courses')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error) {
        if (data && data.length > 0) {
          updatedRow = normalizeCourseRow(data[0]);
        } else {
          updatedRow = updatedCourse;
        }
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      // 1. Check if any key in payload is named in error message
      const payloadKeys = Object.keys(payload);
      for (const key of payloadKeys) {
        if (errMsg.includes(key.toLowerCase()) && key !== 'title') {
          delete payload[key];
          stripped = true;
        }
      }

      // 2. Extract column name via regex patterns
      const regexPatterns = [
        /find the ['"]?([a-zA-Z0-9_]+)['"]? column/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? of relation/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]?/i,
      ];

      for (const pattern of regexPatterns) {
        const match = error.message.match(pattern);
        if (match && match[1]) {
          const colName = match[1];
          if (colName in payload && colName !== 'title') {
            delete payload[colName];
            stripped = true;
            break;
          }
        }
      }

      // 3. If features is JSON or string issue
      if (errMsg.includes('features') && Array.isArray(payload.features)) {
        payload.features = JSON.stringify(payload.features);
        stripped = true;
      }

      // 4. If timestamp or timezone syntax error
      if (errMsg.includes('timestamp') || errMsg.includes('time zone') || errMsg.includes('date') || errMsg.includes('invalid input syntax')) {
        if ('upcoming_date' in payload) {
          delete payload.upcoming_date;
          stripped = true;
        }
        if ('updated_at' in payload) {
          delete payload.updated_at;
          stripped = true;
        }
        for (const k of Object.keys(payload)) {
          if (payload[k] === '' && (k.includes('date') || k.includes('time') || k.includes('routine') || k.includes('syllabus'))) {
            delete payload[k];
            stripped = true;
          }
        }
      }

      // 5. Fallback sequential strip
      if (!stripped) {
        const keys = Object.keys(payload);
        if (keys.length > 0) {
          const keyToDelete = keys.find((k) => k !== 'title') || keys[0];
          delete payload[keyToDelete];
          stripped = true;
        }
      }

      if (!stripped) {
        break;
      }
    }

    if (lastError) {
      console.warn('Supabase updateCourse fallback:', lastError.message);
      return { success: false, data: updatedCourse, error: lastError.message };
    }

    const finalCourse = updatedRow || updatedCourse;
    if (finalCourse) {
      syncCourseSubTables(finalCourse).catch(() => {});
    }

    return { success: true, data: finalCourse, error: null };
  } catch (err: any) {
    return { success: false, data: updatedCourse, error: err?.message || null };
  }
};

// Delete Course
export const deleteCourse = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalCoursesCache();
  const filtered = current.filter((c) => c.id !== id);
  setLocalCoursesCache(filtered);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client.from('courses').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteCourse warning:', error.message);
    }
    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

// Sync a single Course to Supabase
export const syncSingleCourseToSupabase = async (
  course: Course
): Promise<{ success: boolean; data?: Course; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase URL ও Anon Key পাওয়া যায়নি। সেটিংস পেজে গিয়ে যুক্ত করুন।',
    };
  }

  try {
    const descText = course.about_text || course.description || '';
    const routText = course.routine_text || '';
    const syllText = course.syllabus_text || '';

    let payload: any = {
      id: course.id,
      title: course.title,
      category: course.category || 'আরবি প্রভাষক',
      badge: course.badge || 'রেকর্ড ব্যাচ',
      badge_title: course.badge || 'রেকর্ড ব্যাচ',
      badge_subtitle: course.badge_subtitle || '',
      instructor_name: course.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
      instructor: course.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
      price: course.price || '৳৯৫০',
      enrolled_count: Number(course.enrolled_count) || 0,
      total_classes: Number(course.total_classes) || 0,
      classes_count: Number(course.total_classes) || 0,
      total_sheets: Number(course.total_sheets) || 0,
      sheets_count: Number(course.total_sheets) || 0,
      total_exams: Number(course.total_exams) || 0,
      exams_count: Number(course.total_exams) || 0,
      theme_color: course.theme_color || 'emerald',
      features: Array.isArray(course.features) ? course.features : [],
      status: course.status || 'published',
      is_upcoming: course.is_upcoming !== undefined ? Boolean(course.is_upcoming) : false,
      ...(formatTimestampOrNull(course.upcoming_date) ? { upcoming_date: formatTimestampOrNull(course.upcoming_date) } : {}),
      upcoming_badge_text: course.upcoming_badge_text || '',
      upcoming_note: course.upcoming_note || '',
      description: descText,
      about_text: descText,
      about: descText,
      details: descText,
      routine_text: routText,
      routine: routText,
      routine_description: routText,
      routine_pdf_url: course.routine_pdf_url || '',
      routine_pdf: course.routine_pdf_url || '',
      routine_pdf_name: course.routine_pdf_name || '',
      syllabus_text: syllText,
      syllabus: syllText,
      syllabus_description: syllText,
      syllabus_pdf_url: course.syllabus_pdf_url || '',
      syllabus_pdf: course.syllabus_pdf_url || '',
      syllabus_pdf_name: course.syllabus_pdf_name || '',
      leaderboard_enabled: course.leaderboard_enabled !== undefined ? Boolean(course.leaderboard_enabled) : true,
      leaderboard_info: course.leaderboard_info || '',
      helpline_contact: course.helpline_contact || '',
      details_button_text: course.details_button_text || 'বিস্তারিত',
      details_text: course.details_button_text || 'বিস্তারিত',
      details_button_link: course.details_button_link || '#',
      details_link: course.details_button_link || '#',
      enroll_button_text: course.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_text: course.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_button_link: course.enroll_button_link || '#',
      enroll_link: course.enroll_button_link || '#',
      enter_button_text: course.enter_button_text || 'প্রবেশ করুন',
      enter_text: course.enter_button_text || 'প্রবেশ করুন',
      sheet_button_text: course.sheet_button_text || 'শিট ডাউনলোড',
      sheet_text: course.sheet_button_text || 'শিট ডাউনলোড',
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      const { data, error } = await client
        .from('courses')
        .upsert([payload], { onConflict: 'id' })
        .select();

      if (!error) {
        if (data && data.length > 0) {
          insertedRow = normalizeCourseRow(data[0]);
        } else {
          insertedRow = { ...course, is_synced_to_supabase: true };
        }
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      // Strip missing columns if old schema
      const payloadKeys = Object.keys(payload);
      for (const key of payloadKeys) {
        if (errMsg.includes(key.toLowerCase()) && key !== 'title' && key !== 'id') {
          delete payload[key];
          stripped = true;
        }
      }

      // Regex column matching
      const regexPatterns = [
        /find the ['"]?([a-zA-Z0-9_]+)['"]? column/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? of relation/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]?/i,
      ];

      for (const pattern of regexPatterns) {
        const match = error.message.match(pattern);
        if (match && match[1]) {
          const colName = match[1];
          if (colName in payload && colName !== 'title' && colName !== 'id') {
            delete payload[colName];
            stripped = true;
            break;
          }
        }
      }

      if (errMsg.includes('features') && Array.isArray(payload.features)) {
        payload.features = JSON.stringify(payload.features);
        stripped = true;
      }

      // If timestamp or timezone syntax error
      if (errMsg.includes('timestamp') || errMsg.includes('time zone') || errMsg.includes('date') || errMsg.includes('invalid input syntax')) {
        if ('upcoming_date' in payload) {
          delete payload.upcoming_date;
          stripped = true;
        }
        if ('updated_at' in payload) {
          delete payload.updated_at;
          stripped = true;
        }
        if ('created_at' in payload) {
          delete payload.created_at;
          stripped = true;
        }
        for (const k of Object.keys(payload)) {
          if (payload[k] === '' && (k.includes('date') || k.includes('time') || k.includes('routine') || k.includes('syllabus'))) {
            delete payload[k];
            stripped = true;
          }
        }
      }

      if (!stripped) {
        const optionalKeys = [
          'upcoming_date', 'upcoming_badge_text', 'upcoming_note', 'is_upcoming',
          'routine_pdf_url', 'routine_pdf', 'routine_pdf_name', 'routine_text', 'routine', 'routine_description',
          'syllabus_pdf_url', 'syllabus_pdf', 'syllabus_pdf_name', 'syllabus_text', 'syllabus', 'syllabus_description',
          'leaderboard_info', 'leaderboard_enabled', 'helpline_contact',
          'details_button_text', 'details_text', 'details_button_link', 'details_link',
          'enroll_button_text', 'enroll_text', 'enroll_button_link', 'enroll_link',
          'enter_button_text', 'enter_text', 'sheet_button_text', 'sheet_text',
          'badge_subtitle', 'badge_title', 'about_text', 'about', 'details',
          'description', 'features', 'theme_color', 'total_exams', 'exams_count',
          'total_sheets', 'sheets_count', 'total_classes', 'classes_count',
          'enrolled_count', 'instructor_name', 'instructor', 'badge', 'price', 'status', 'category'
        ];
        for (const key of optionalKeys) {
          if (key in payload) {
            delete payload[key];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }

    if (lastError) {
      return { success: false, error: lastError.message };
    }

    // Update local cache
    const current = getLocalCoursesCache();
    const updated = current.map((c) =>
      c.id === course.id ? { ...c, is_synced_to_supabase: true } : c
    );
    setLocalCoursesCache(updated);

    // Sync sub-tables (course_details, course_routines, course_syllabus)
    try {
      await syncCourseSubTables(course);
    } catch (e) {
      console.warn('Sync sub-tables warning:', e);
    }

    // 2. Also Sync Related course_exams to Supabase
    try {
      const allExamsMap = getLocalCourseExamsCache();
      const courseExamsList = allExamsMap[course.id] || [];
      for (const exam of courseExamsList) {
        const examPayload: any = {
          id: exam.id,
          course_id: course.id,
          title: exam.title,
          subject: exam.subject || 'আরবি',
          topic: exam.topic || '',
          question_count: Number(exam.question_count) || 20,
          total_questions: Number(exam.question_count) || 20,
          time_minutes: Number(exam.time_minutes) || 15,
          duration_minutes: Number(exam.time_minutes) || 15,
          duration: Number(exam.time_minutes) || 15,
          total_marks: Number(exam.total_marks) || 20,
          full_marks: Number(exam.total_marks) || 20,
          pass_marks: Number(exam.pass_marks) || 10,
          pass_mark: Number(exam.pass_marks) || 10,
          negative_marks: Number(exam.negative_marks) || 0.25,
          negative_mark: Number(exam.negative_marks) || 0.25,
          is_locked: Boolean(exam.is_locked),
          locked: Boolean(exam.is_locked),
          position: Number(exam.position) || 1,
          order: Number(exam.position) || 1,
          serial: Number(exam.position) || 1,
          instructions: exam.instructions || '',
          questions: Array.isArray(exam.questions) ? exam.questions : [],
          status: 'published',
          is_published: true,
          ...(exam.exam_id ? { exam_id: exam.exam_id } : {}),
        };

        for (let att = 0; att < 12; att++) {
          const { error: exErr } = await client
            .from('course_exams')
            .upsert([examPayload], { onConflict: 'id' });
          if (!exErr) break;
          const exErrMsg = (exErr.message || '').toLowerCase();
          let exStripped = false;
          for (const k of Object.keys(examPayload)) {
            if (exErrMsg.includes(k.toLowerCase()) && k !== 'title' && k !== 'course_id' && k !== 'id') {
              delete examPayload[k];
              exStripped = true;
            }
          }
          if (exErrMsg.includes('questions') && Array.isArray(examPayload.questions)) {
            examPayload.questions = JSON.stringify(examPayload.questions);
            exStripped = true;
          }
          if (!exStripped) {
            const optExKeys = [
              'is_published', 'status', 'serial', 'order', 'locked', 'negative_mark',
              'pass_mark', 'full_marks', 'duration', 'duration_minutes', 'total_questions',
              'questions', 'instructions', 'pass_marks', 'topic', 'negative_marks',
              'is_locked', 'position', 'exam_id', 'subject', 'time_minutes', 'total_marks', 'question_count'
            ];
            for (const k of optExKeys) {
              if (k in examPayload) {
                delete examPayload[k];
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Sync course exams warning:', e);
    }

    // 3. Also Sync Related course_sheets to Supabase
    try {
      const allSheetsMap = getLocalCourseSheetsCache();
      const courseSheetsList = allSheetsMap[course.id] || [];
      for (const sheet of courseSheetsList) {
        const sheetPayload: any = {
          id: sheet.id,
          course_id: course.id,
          title: sheet.title,
          subject: sheet.subject || 'আরবি',
          topic: sheet.topic || '',
          pdf_url: sheet.pdf_url,
          file_url: sheet.pdf_url,
          pdf_link: sheet.pdf_url,
          pdf_name: sheet.pdf_name || '',
          file_size: sheet.file_size || '১.৫ মেগাবাইট',
          page_count: sheet.page_count || '১০ পেজ',
          total_pages: sheet.page_count || '১০ পেজ',
          badge_text: sheet.badge_text || 'লেকচার নোট',
          badge: sheet.badge_text || 'লেকচার নোট',
          is_locked: Boolean(sheet.is_locked),
          locked: Boolean(sheet.is_locked),
          position: Number(sheet.position) || 1,
          order: Number(sheet.position) || 1,
          serial: Number(sheet.position) || 1,
        };

        for (let att = 0; att < 10; att++) {
          const { error: shErr } = await client
            .from('course_sheets')
            .upsert([sheetPayload], { onConflict: 'id' });
          if (!shErr) break;
          const shErrMsg = (shErr.message || '').toLowerCase();
          let shStripped = false;
          for (const k of Object.keys(sheetPayload)) {
            if (shErrMsg.includes(k.toLowerCase()) && k !== 'title' && k !== 'course_id' && k !== 'id') {
              delete sheetPayload[k];
              shStripped = true;
            }
          }
          if (!shStripped) {
            const optShKeys = [
              'serial', 'order', 'locked', 'badge', 'total_pages', 'pdf_link', 'file_url',
              'pdf_name', 'topic', 'subject', 'badge_text', 'page_count', 'file_size', 'is_locked', 'position'
            ];
            for (const k of optShKeys) {
              if (k in sheetPayload) {
                delete sheetPayload[k];
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Sync course sheets warning:', e);
    }

    return {
      success: true,
      data: insertedRow || { ...course, is_synced_to_supabase: true },
      error: null,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'সিঙ্ক ব্যর্থ হয়েছে' };
  }
};

// Sync All Local Courses to Supabase
export const syncAllCoursesToSupabase = async (): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}> => {
  const localList = getLocalCoursesCache();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const course of localList) {
    const res = await syncSingleCourseToSupabase(course);
    if (res.success) {
      synced++;
    } else {
      failed++;
      if (res.error && !errors.includes(res.error)) {
        errors.push(`"${course.title}": ${res.error}`);
      }
    }
  }

  return {
    total: localList.length,
    synced,
    failed,
    errors,
  };
};

// Check Full Supabase Health and Tables existence
export const checkSupabaseHealth = async (): Promise<{
  isConnected: boolean;
  coursesTableExists: boolean;
  courseExamsTableExists: boolean;
  courseSheetsTableExists: boolean;
  questionsTableExists: boolean;
  examsTableExists: boolean;
  totalLiveCourses: number;
  totalLiveQuestions: number;
  totalLiveExams: number;
  error: string | null;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      isConnected: false,
      coursesTableExists: false,
      courseExamsTableExists: false,
      courseSheetsTableExists: false,
      questionsTableExists: false,
      examsTableExists: false,
      totalLiveCourses: 0,
      totalLiveQuestions: 0,
      totalLiveExams: 0,
      error: 'Supabase credentials missing',
    };
  }

  let coursesTableExists = false;
  let courseExamsTableExists = false;
  let courseSheetsTableExists = false;
  let questionsTableExists = false;
  let examsTableExists = false;

  let totalLiveCourses = 0;
  let totalLiveQuestions = 0;
  let totalLiveExams = 0;
  let lastError: string | null = null;

  // 1. Check courses
  try {
    const { count, error } = await client.from('courses').select('*', { count: 'exact', head: true });
    if (!error) {
      coursesTableExists = true;
      totalLiveCourses = count || 0;
    } else {
      lastError = error.message;
    }
  } catch (e: any) {
    lastError = e?.message;
  }

  // 2. Check course_exams
  try {
    const { error } = await client.from('course_exams').select('*', { count: 'exact', head: true });
    if (!error) {
      courseExamsTableExists = true;
    }
  } catch (e: any) {}

  // 3. Check course_sheets
  try {
    const { error } = await client.from('course_sheets').select('*', { count: 'exact', head: true });
    if (!error) {
      courseSheetsTableExists = true;
    }
  } catch (e: any) {}

  // 4. Check questions
  try {
    const { count, error } = await client.from('questions').select('*', { count: 'exact', head: true });
    if (!error) {
      questionsTableExists = true;
      totalLiveQuestions = count || 0;
    }
  } catch (e: any) {}

  // 5. Check exams
  try {
    const { count, error } = await client.from('exams').select('*', { count: 'exact', head: true });
    if (!error) {
      examsTableExists = true;
      totalLiveExams = count || 0;
    }
  } catch (e: any) {}

  return {
    isConnected: true,
    coursesTableExists,
    courseExamsTableExists,
    courseSheetsTableExists,
    questionsTableExists,
    examsTableExists,
    totalLiveCourses,
    totalLiveQuestions,
    totalLiveExams,
    error: lastError,
  };
};

/* ==========================================================================
   PUBLIC.COURSE_EXAMS FUNCTIONS
   ========================================================================== */

export const fetchCourseExams = async (courseId: string): Promise<{ exams: CourseExam[]; error: string | null }> => {
  const client = getSupabaseClient();
  const localMap = getLocalCourseExamsCache();
  const defaultList = localMap[courseId] || [];

  if (!client) {
    return { exams: defaultList, error: null };
  }

  try {
    const { data, error } = await client
      .from('course_exams')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    if (error) {
      return { exams: defaultList, error: null };
    }

    const norm: CourseExam[] = (data || []).map((row) => {
      let parsedQuestions: any[] = [];
      if (Array.isArray(row.questions)) {
        parsedQuestions = row.questions;
      } else if (typeof row.questions === 'string') {
        try {
          parsedQuestions = JSON.parse(row.questions);
        } catch (e) {
          parsedQuestions = [];
        }
      }

      // Check if local cache has questions for this exam
      const localExam = defaultList.find((e) => e.id === String(row.id));
      if (parsedQuestions.length === 0 && localExam?.questions && localExam.questions.length > 0) {
        parsedQuestions = localExam.questions;
      }

      return {
        id: String(row.id),
        course_id: String(row.course_id),
        title: row.title || '',
        subject: row.subject || 'আরবি',
        topic: row.topic || localExam?.topic || '',
        question_count: Number(row.question_count || parsedQuestions.length || 0),
        time_minutes: Number(row.time_minutes || 15),
        total_marks: Number(row.total_marks || 20),
        pass_marks: Number(row.pass_marks || 10),
        negative_marks: Number(row.negative_marks || 0.25),
        is_locked: Boolean(row.is_locked),
        position: Number(row.position || 1),
        exam_id: row.exam_id ? String(row.exam_id) : null,
        instructions: row.instructions || localExam?.instructions || '',
        questions: parsedQuestions,
        created_at: row.created_at || new Date().toISOString(),
      };
    });

    // Automatically check public.questions table for questions linked by exam_id or id
    const examIdsToCheck = Array.from(new Set([
      ...norm.map((e) => String(e.id)),
      ...norm.filter((e) => e.exam_id).map((e) => String(e.exam_id)),
    ]));

    if (examIdsToCheck.length > 0 && client) {
      try {
        const { data: qData } = await client
          .from('questions')
          .select('*')
          .in('exam_id', examIdsToCheck);

        if (qData && qData.length > 0) {
          const questionsByExamId: Record<string, CourseExamQuestion[]> = {};
          qData.forEach((qRow) => {
            const eid = String(qRow.exam_id);
            if (!questionsByExamId[eid]) questionsByExamId[eid] = [];
            questionsByExamId[eid].push({
              id: String(qRow.id),
              question: qRow.question || '',
              option_a: qRow.option_a || 'ক. অপশন ১',
              option_b: qRow.option_b || 'খ. অপশন ২',
              option_c: qRow.option_c || 'গ. অপশন ৩',
              option_d: qRow.option_d || 'ঘ. অপশন ৪',
              correct_answer: (qRow.correct_answer || 'option_a') as any,
              explanation: qRow.explanation || undefined,
              subject: qRow.subject || '',
              topic: qRow.topic || '',
            });
          });

          norm.forEach((ex) => {
            const matchedQs = questionsByExamId[ex.id] || (ex.exam_id ? questionsByExamId[String(ex.exam_id)] : []);
            if (matchedQs && matchedQs.length > 0) {
              if (!ex.questions || ex.questions.length === 0) {
                ex.questions = matchedQs;
              } else {
                const existingText = new Set(ex.questions.map((q) => q.question.trim()));
                for (const mq of matchedQs) {
                  if (!existingText.has(mq.question.trim())) {
                    ex.questions.push(mq);
                    existingText.add(mq.question.trim());
                  }
                }
              }
              ex.question_count = ex.questions.length;
              ex.total_marks = ex.questions.length;
            }
          });
        }
      } catch (err) {
        console.warn('Could not batch fetch questions for course exams:', err);
      }
    }

    const supabaseExamIds = new Set((data || []).map((r) => String(r.id)));
    const mergedExams = [
      ...norm,
      ...defaultList.filter((e) => !supabaseExamIds.has(e.id)),
    ];

    localMap[courseId] = mergedExams;
    setLocalCourseExamsCache(localMap);
    return { exams: mergedExams, error: null };
  } catch (e: any) {
    return { exams: defaultList, error: null };
  }
};

// Fetch questions for a specific course exam with multi-tier fallback
export const fetchQuestionsForCourseExam = async (
  examId: string,
  courseId?: string,
  subject?: string,
  topic?: string
): Promise<{ questions: CourseExamQuestion[]; error: string | null }> => {
  const client = getSupabaseClient();
  const localMap = getLocalCourseExamsCache();

  // 1. Check local cache
  if (courseId && localMap[courseId]) {
    const cachedExam = localMap[courseId].find((e) => e.id === examId || e.exam_id === examId);
    if (cachedExam && cachedExam.questions && cachedExam.questions.length > 0) {
      return { questions: cachedExam.questions, error: null };
    }
  }

  if (!client) {
    return { questions: [], error: null };
  }

  try {
    // 2. Query public.questions by exam_id
    const { data: qData, error: qErr } = await client
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (!qErr && qData && qData.length > 0) {
      const qs: CourseExamQuestion[] = qData.map((qRow) => ({
        id: String(qRow.id),
        question: qRow.question || '',
        option_a: qRow.option_a || 'ক. অপশন ১',
        option_b: qRow.option_b || 'খ. অপশন ২',
        option_c: qRow.option_c || 'গ. অপশন ৩',
        option_d: qRow.option_d || 'ঘ. অপশন ৪',
        correct_answer: (qRow.correct_answer || 'option_a') as any,
        explanation: qRow.explanation || undefined,
        subject: qRow.subject || subject || '',
        topic: qRow.topic || topic || '',
      }));
      return { questions: qs, error: null };
    }

    // 3. Check course_exams row directly
    const { data: examRow } = await client
      .from('course_exams')
      .select('questions, exam_id')
      .eq('id', examId)
      .maybeSingle();

    if (examRow) {
      let parsed: any[] = [];
      if (Array.isArray(examRow.questions)) parsed = examRow.questions;
      else if (typeof examRow.questions === 'string') {
        try {
          parsed = JSON.parse(examRow.questions);
        } catch (e) {}
      }
      if (parsed.length > 0) {
        return { questions: parsed, error: null };
      }
      if (examRow.exam_id) {
        const { data: linkedQData } = await client
          .from('questions')
          .select('*')
          .eq('exam_id', examRow.exam_id);
        if (linkedQData && linkedQData.length > 0) {
          const qs: CourseExamQuestion[] = linkedQData.map((qRow) => ({
            id: String(qRow.id),
            question: qRow.question || '',
            option_a: qRow.option_a || 'ক. অপশন ১',
            option_b: qRow.option_b || 'খ. অপশন ২',
            option_c: qRow.option_c || 'গ. অপশন ৩',
            option_d: qRow.option_d || 'ঘ. অপশন ৪',
            correct_answer: (qRow.correct_answer || 'option_a') as any,
            explanation: qRow.explanation || undefined,
            subject: qRow.subject || subject || '',
            topic: qRow.topic || topic || '',
          }));
          return { questions: qs, error: null };
        }
      }
    }

    // 4. Fallback by Subject if specified
    if (subject && subject !== 'সকল') {
      const { data: subjectQuestions } = await client
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .limit(20);

      if (subjectQuestions && subjectQuestions.length > 0) {
        const qs: CourseExamQuestion[] = subjectQuestions.map((qRow) => ({
          id: String(qRow.id),
          question: qRow.question || '',
          option_a: qRow.option_a || 'ক. অপশন ১',
          option_b: qRow.option_b || 'খ. অপশন ২',
          option_c: qRow.option_c || 'গ. অপশন ৩',
          option_d: qRow.option_d || 'ঘ. অপশন ৪',
          correct_answer: (qRow.correct_answer || 'option_a') as any,
          explanation: qRow.explanation || undefined,
          subject: qRow.subject || subject || '',
          topic: qRow.topic || topic || '',
        }));
        return { questions: qs, error: null };
      }
    }

    return { questions: [], error: null };
  } catch (err: any) {
    return { questions: [], error: err?.message || null };
  }
};

export const insertCourseExam = async (
  newExam: Omit<CourseExam, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: CourseExam; error: string | null }> => {
  const client = getSupabaseClient();
  const id = generateStandardUUID();
  const examObj: CourseExam = {
    ...newExam,
    id,
    created_at: new Date().toISOString(),
  };

  const localMap = getLocalCourseExamsCache();
  const existing = localMap[newExam.course_id] || [];
  localMap[newExam.course_id] = [...existing, examObj];
  setLocalCourseExamsCache(localMap);

  if (!client) {
    return { success: true, data: examObj, error: null };
  }

  try {
    const payload: any = {
      id,
      course_id: newExam.course_id,
      title: newExam.title,
      subject: newExam.subject || 'আরবি',
      topic: newExam.topic || '',
      question_count: Number(newExam.question_count) || (Array.isArray(newExam.questions) ? newExam.questions.length : 20),
      total_questions: Number(newExam.question_count) || (Array.isArray(newExam.questions) ? newExam.questions.length : 20),
      time_minutes: Number(newExam.time_minutes) || 15,
      duration_minutes: Number(newExam.time_minutes) || 15,
      duration: Number(newExam.time_minutes) || 15,
      total_marks: Number(newExam.total_marks) || 20,
      full_marks: Number(newExam.total_marks) || 20,
      pass_marks: Number(newExam.pass_marks) || 10,
      pass_mark: Number(newExam.pass_marks) || 10,
      negative_marks: Number(newExam.negative_marks) || 0.25,
      negative_mark: Number(newExam.negative_marks) || 0.25,
      is_locked: Boolean(newExam.is_locked),
      locked: Boolean(newExam.is_locked),
      position: Number(newExam.position) || existing.length + 1,
      order: Number(newExam.position) || existing.length + 1,
      serial: Number(newExam.position) || existing.length + 1,
      instructions: newExam.instructions || '',
      questions: Array.isArray(newExam.questions) ? newExam.questions : [],
      status: 'published',
      is_published: true,
      ...(newExam.exam_id ? { exam_id: newExam.exam_id } : {}),
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 35; attempt++) {
      const { data, error } = await client
        .from('course_exams')
        .upsert([payload], { onConflict: 'id' })
        .select();

      if (!error) {
        if (data && data.length > 0) {
          insertedRow = data[0];
        }
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      // 1. Check if any payload key is explicitly named in error message
      for (const key of Object.keys(payload)) {
        if (errMsg.includes(key.toLowerCase()) && key !== 'title' && key !== 'course_id' && key !== 'id') {
          delete payload[key];
          stripped = true;
        }
      }

      // 2. Regex match
      const regexPatterns = [
        /find the ['"]?([a-zA-Z0-9_]+)['"]? column/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? of relation/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i,
        /column ['"]?([a-zA-Z0-9_]+)['"]?/i,
      ];
      for (const pattern of regexPatterns) {
        const match = error.message.match(pattern);
        if (match && match[1]) {
          const colName = match[1];
          if (colName in payload && colName !== 'title' && colName !== 'course_id' && colName !== 'id') {
            delete payload[colName];
            stripped = true;
            break;
          }
        }
      }

      if (errMsg.includes('questions') && Array.isArray(payload.questions)) {
        payload.questions = JSON.stringify(payload.questions);
        stripped = true;
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist'))) {
        const optKeys = [
          'is_published', 'status', 'serial', 'order', 'locked', 'negative_mark',
          'pass_mark', 'full_marks', 'duration', 'duration_minutes', 'total_questions',
          'questions', 'instructions', 'pass_marks', 'topic', 'negative_marks',
          'is_locked', 'position', 'exam_id', 'subject', 'time_minutes', 'total_marks', 'question_count'
        ];
        for (const k of optKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }

    // Also persist questions into public.questions table for guaranteed redundancy
    if (Array.isArray(newExam.questions) && newExam.questions.length > 0) {
      try {
        const qPayload = newExam.questions.map((q) => ({
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          status: 'published',
          subject: q.subject || newExam.subject || 'আরবি',
          topic: q.topic || newExam.topic || '',
          exam_id: id,
        }));
        await client.from('questions').insert(qPayload);
      } catch (qErr) {
        console.warn('Could not insert course exam questions to questions table:', qErr);
      }
    }

    // Update parent course total_exams in Supabase
    try {
      const allForCourse = localMap[newExam.course_id] || [];
      await client
        .from('courses')
        .update({ total_exams: allForCourse.length })
        .eq('id', newExam.course_id);
    } catch (e) {}

    if (lastError) {
      console.warn('Supabase insertCourseExam fallback:', lastError.message);
      return { success: true, data: examObj, error: null };
    }

    const inserted: CourseExam = {
      ...examObj,
      id: insertedRow?.id ? String(insertedRow.id) : examObj.id,
      title: insertedRow?.title || examObj.title,
    };

    return { success: true, data: inserted, error: null };
  } catch (e: any) {
    return { success: true, data: examObj, error: null };
  }
};

export const updateCourseExam = async (
  id: string,
  courseId: string,
  updatedFields: Partial<CourseExam>
): Promise<{ success: boolean; error: string | null }> => {
  const localMap = getLocalCourseExamsCache();
  const list = localMap[courseId] || [];
  const idx = list.findIndex((e) => e.id === id);
  let currentExam = list[idx];
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    currentExam = list[idx];
    localMap[courseId] = [...list];
    setLocalCourseExamsCache(localMap);
  }

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    const payload: any = {
      id,
      course_id: courseId,
      title: currentExam?.title || updatedFields.title,
      subject: currentExam?.subject || updatedFields.subject || 'আরবি',
      topic: currentExam?.topic || updatedFields.topic || '',
      question_count: Number(updatedFields.question_count ?? currentExam?.question_count ?? (Array.isArray(updatedFields.questions) ? updatedFields.questions.length : 20)),
      total_questions: Number(updatedFields.question_count ?? currentExam?.question_count ?? (Array.isArray(updatedFields.questions) ? updatedFields.questions.length : 20)),
      time_minutes: Number(updatedFields.time_minutes ?? currentExam?.time_minutes ?? 15),
      duration_minutes: Number(updatedFields.time_minutes ?? currentExam?.time_minutes ?? 15),
      duration: Number(updatedFields.time_minutes ?? currentExam?.time_minutes ?? 15),
      total_marks: Number(updatedFields.total_marks ?? currentExam?.total_marks ?? (Array.isArray(updatedFields.questions) ? updatedFields.questions.length : 20)),
      full_marks: Number(updatedFields.total_marks ?? currentExam?.total_marks ?? (Array.isArray(updatedFields.questions) ? updatedFields.questions.length : 20)),
      pass_marks: Number(updatedFields.pass_marks ?? currentExam?.pass_marks ?? 10),
      pass_mark: Number(updatedFields.pass_marks ?? currentExam?.pass_marks ?? 10),
      negative_marks: Number(updatedFields.negative_marks ?? currentExam?.negative_marks ?? 0.25),
      negative_mark: Number(updatedFields.negative_marks ?? currentExam?.negative_marks ?? 0.25),
      is_locked: Boolean(updatedFields.is_locked ?? currentExam?.is_locked),
      locked: Boolean(updatedFields.is_locked ?? currentExam?.is_locked),
      instructions: updatedFields.instructions ?? currentExam?.instructions ?? '',
      ...(updatedFields.questions ? { questions: updatedFields.questions } : currentExam?.questions ? { questions: currentExam.questions } : {}),
    };

    for (let attempt = 0; attempt < 35; attempt++) {
      const { error } = await client
        .from('course_exams')
        .upsert([payload], { onConflict: 'id' });

      if (!error) break;

      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      for (const k of Object.keys(payload)) {
        if (errMsg.includes(k.toLowerCase()) && k !== 'title' && k !== 'course_id' && k !== 'id') {
          delete payload[k];
          stripped = true;
        }
      }

      if (errMsg.includes('questions') && Array.isArray(payload.questions)) {
        payload.questions = JSON.stringify(payload.questions);
        stripped = true;
      }

      if (!stripped) {
        const optKeys = [
          'is_published', 'status', 'serial', 'order', 'locked', 'negative_mark',
          'pass_mark', 'full_marks', 'duration', 'duration_minutes', 'total_questions',
          'questions', 'instructions', 'pass_marks', 'topic', 'negative_marks',
          'is_locked', 'position', 'exam_id', 'subject', 'time_minutes', 'total_marks', 'question_count'
        ];
        for (const k of optKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }

    // Also sync questions to public.questions table for persistence
    if (Array.isArray(updatedFields.questions) && updatedFields.questions.length > 0) {
      try {
        const qPayload = updatedFields.questions.map((q) => ({
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          status: 'published',
          subject: q.subject || currentExam?.subject || 'আরবি',
          topic: q.topic || currentExam?.topic || '',
          exam_id: id,
        }));
        await client.from('questions').insert(qPayload);
      } catch (qErr) {
        console.warn('Could not insert course exam questions to questions table:', qErr);
      }
    }

    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

export const deleteCourseExam = async (
  id: string,
  courseId: string
): Promise<{ success: boolean; error: string | null }> => {
  const localMap = getLocalCourseExamsCache();
  const list = localMap[courseId] || [];
  localMap[courseId] = list.filter((e) => e.id !== id);
  setLocalCourseExamsCache(localMap);

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    await client.from('course_exams').delete().eq('id', id);
    try {
      await client
        .from('courses')
        .update({ total_exams: localMap[courseId].length })
        .eq('id', courseId);
    } catch (e) {}
    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

// Sync All Exams for a specific Course directly to Supabase
export const syncCourseExamsToSupabase = async (
  courseId: string,
  customList?: CourseExam[]
): Promise<{ success: boolean; count: number; error: string | null }> => {
  const client = getSupabaseClient();
  const localMap = getLocalCourseExamsCache();
  const list = customList || localMap[courseId] || [];

  if (!client) {
    return { success: true, count: list.length, error: null };
  }

  let synced = 0;
  let lastErr: string | null = null;

  for (const exam of list) {
    const payload: any = {
      id: exam.id,
      course_id: courseId,
      title: exam.title,
      subject: exam.subject || 'আরবি',
      topic: exam.topic || '',
      question_count: Number(exam.question_count) || (Array.isArray(exam.questions) ? exam.questions.length : 20),
      total_questions: Number(exam.question_count) || (Array.isArray(exam.questions) ? exam.questions.length : 20),
      time_minutes: Number(exam.time_minutes) || 15,
      duration_minutes: Number(exam.time_minutes) || 15,
      duration: Number(exam.time_minutes) || 15,
      total_marks: Number(exam.total_marks) || 20,
      full_marks: Number(exam.total_marks) || 20,
      pass_marks: Number(exam.pass_marks) || 10,
      pass_mark: Number(exam.pass_marks) || 10,
      negative_marks: Number(exam.negative_marks) || 0.25,
      negative_mark: Number(exam.negative_marks) || 0.25,
      is_locked: Boolean(exam.is_locked),
      locked: Boolean(exam.is_locked),
      position: Number(exam.position) || 1,
      order: Number(exam.position) || 1,
      serial: Number(exam.position) || 1,
      instructions: exam.instructions || '',
      questions: Array.isArray(exam.questions) ? exam.questions : [],
      status: 'published',
      is_published: true,
      ...(exam.exam_id ? { exam_id: exam.exam_id } : {}),
    };

    for (let att = 0; att < 35; att++) {
      const { error } = await client
        .from('course_exams')
        .upsert([payload], { onConflict: 'id' });

      if (!error) {
        synced++;
        break;
      }

      lastErr = error.message;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;

      for (const k of Object.keys(payload)) {
        if (errMsg.includes(k.toLowerCase()) && k !== 'title' && k !== 'course_id' && k !== 'id') {
          delete payload[k];
          stripped = true;
        }
      }

      if (errMsg.includes('questions') && Array.isArray(payload.questions)) {
        payload.questions = JSON.stringify(payload.questions);
        stripped = true;
      }

      if (!stripped) {
        const optExKeys = [
          'is_published', 'status', 'serial', 'order', 'locked', 'negative_mark',
          'pass_mark', 'full_marks', 'duration', 'duration_minutes', 'total_questions',
          'questions', 'instructions', 'pass_marks', 'topic', 'negative_marks',
          'is_locked', 'position', 'exam_id', 'subject', 'time_minutes', 'total_marks', 'question_count'
        ];
        for (const k of optExKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }
  }

  try {
    await client
      .from('courses')
      .update({ total_exams: list.length })
      .eq('id', courseId);
  } catch (e) {}

  return { success: true, count: synced, error: lastErr };
};

/* ==========================================================================
   PUBLIC.COURSE_SHEETS FUNCTIONS
   ========================================================================== */

export const fetchCourseSheets = async (courseId: string): Promise<{ sheets: CourseSheet[]; error: string | null }> => {
  const client = getSupabaseClient();
  const localMap = getLocalCourseSheetsCache();
  const defaultList = localMap[courseId] || [];

  if (!client) {
    return { sheets: defaultList, error: null };
  }

  try {
    const { data, error } = await client
      .from('course_sheets')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    if (error) {
      return { sheets: defaultList, error: null };
    }

    const norm: CourseSheet[] = (data || []).map((row) => {
      const localSheet = defaultList.find((s) => s.id === String(row.id));
      return {
        id: String(row.id),
        course_id: String(row.course_id),
        title: row.title || '',
        subject: row.subject || localSheet?.subject || 'আরবি',
        topic: row.topic || localSheet?.topic || '',
        pdf_url: row.pdf_url || row.file_url || row.pdf_link || '#',
        pdf_name: row.pdf_name || localSheet?.pdf_name || '',
        file_size: row.file_size || '১.৫ মেগাবাইট',
        page_count: row.page_count || row.total_pages || '১০ পেজ',
        badge_text: row.badge_text || row.badge || 'লেকচার নোট',
        is_locked: Boolean(row.is_locked || row.locked),
        position: Number(row.position || row.order || 1),
        created_at: row.created_at || new Date().toISOString(),
      };
    });

    const supabaseSheetIds = new Set((data || []).map((r) => String(r.id)));
    const mergedSheets = [
      ...norm,
      ...defaultList.filter((s) => !supabaseSheetIds.has(s.id)),
    ];

    localMap[courseId] = mergedSheets;
    setLocalCourseSheetsCache(localMap);
    return { sheets: mergedSheets, error: null };
  } catch (e: any) {
    return { sheets: defaultList, error: null };
  }
};

export const insertCourseSheet = async (
  newSheet: Omit<CourseSheet, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: CourseSheet; error: string | null }> => {
  const client = getSupabaseClient();
  const id = generateStandardUUID();
  const sheetObj: CourseSheet = {
    ...newSheet,
    id,
    created_at: new Date().toISOString(),
  };

  const localMap = getLocalCourseSheetsCache();
  const existing = localMap[newSheet.course_id] || [];
  localMap[newSheet.course_id] = [...existing, sheetObj];
  setLocalCourseSheetsCache(localMap);

  if (!client) {
    return { success: true, data: sheetObj, error: null };
  }

  try {
    const payload: any = {
      id,
      course_id: newSheet.course_id,
      title: newSheet.title,
      subject: newSheet.subject || 'আরবি',
      topic: newSheet.topic || '',
      pdf_url: newSheet.pdf_url,
      file_url: newSheet.pdf_url,
      pdf_link: newSheet.pdf_url,
      pdf_name: newSheet.pdf_name || '',
      file_size: newSheet.file_size || '১.৫ মেগাবাইট',
      page_count: newSheet.page_count || '১০ পেজ',
      total_pages: newSheet.page_count || '১০ পেজ',
      badge_text: newSheet.badge_text || 'লেকচার নোট',
      badge: newSheet.badge_text || 'লেকচার নোট',
      is_locked: Boolean(newSheet.is_locked),
      locked: Boolean(newSheet.is_locked),
      position: Number(newSheet.position) || existing.length + 1,
      order: Number(newSheet.position) || existing.length + 1,
      serial: Number(newSheet.position) || existing.length + 1,
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 35; attempt++) {
      const { data, error } = await client
        .from('course_sheets')
        .upsert([payload], { onConflict: 'id' })
        .select();

      if (!error) {
        if (data && data.length > 0) {
          insertedRow = data[0];
        }
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;
      const matches = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']?|find the ["']?([a-zA-Z0-9_]+)["']? column/i);
      if (matches) {
        const colName = matches[1] || matches[2];
        if (colName && colName in payload && colName !== 'title' && colName !== 'course_id' && colName !== 'id') {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('does not exist'))) {
        const optKeys = [
          'serial', 'order', 'locked', 'badge', 'total_pages', 'pdf_link', 'file_url',
          'pdf_name', 'topic', 'subject', 'badge_text', 'page_count', 'file_size', 'is_locked', 'position'
        ];
        for (const k of optKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }

    // Update parent course total_sheets in Supabase
    try {
      const allForCourse = localMap[newSheet.course_id] || [];
      await client
        .from('courses')
        .update({ total_sheets: allForCourse.length })
        .eq('id', newSheet.course_id);
    } catch (e) {}

    if (lastError) {
      console.warn('Supabase insertCourseSheet fallback:', lastError.message);
      return { success: true, data: sheetObj, error: null };
    }

    const inserted: CourseSheet = {
      ...sheetObj,
      id: insertedRow?.id ? String(insertedRow.id) : sheetObj.id,
      title: insertedRow?.title || sheetObj.title,
    };

    return { success: true, data: inserted, error: null };
  } catch (e: any) {
    return { success: true, data: sheetObj, error: null };
  }
};

export const updateCourseSheet = async (
  id: string,
  courseId: string,
  updatedFields: Partial<CourseSheet>
): Promise<{ success: boolean; error: string | null }> => {
  const localMap = getLocalCourseSheetsCache();
  const list = localMap[courseId] || [];
  const idx = list.findIndex((s) => s.id === id);
  let currentSheet = list[idx];
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    currentSheet = list[idx];
    localMap[courseId] = [...list];
    setLocalCourseSheetsCache(localMap);
  }

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    const payload: any = {
      id,
      course_id: courseId,
      title: currentSheet?.title || updatedFields.title,
      subject: currentSheet?.subject || updatedFields.subject || 'আরবি',
      topic: currentSheet?.topic || updatedFields.topic || '',
      pdf_url: currentSheet?.pdf_url || updatedFields.pdf_url || '#',
      file_url: currentSheet?.pdf_url || updatedFields.pdf_url || '#',
      pdf_link: currentSheet?.pdf_url || updatedFields.pdf_url || '#',
      pdf_name: currentSheet?.pdf_name || updatedFields.pdf_name || '',
      file_size: currentSheet?.file_size || updatedFields.file_size || '১.৫ মেগাবাইট',
      page_count: currentSheet?.page_count || updatedFields.page_count || '১০ পেজ',
      total_pages: currentSheet?.page_count || updatedFields.page_count || '১০ পেজ',
      badge_text: currentSheet?.badge_text || updatedFields.badge_text || 'লেকচার নোট',
      badge: currentSheet?.badge_text || updatedFields.badge_text || 'লেকচার নোট',
      is_locked: Boolean(updatedFields.is_locked ?? currentSheet?.is_locked),
      locked: Boolean(updatedFields.is_locked ?? currentSheet?.is_locked),
      position: Number(updatedFields.position ?? currentSheet?.position ?? 1),
      order: Number(updatedFields.position ?? currentSheet?.position ?? 1),
      serial: Number(updatedFields.position ?? currentSheet?.position ?? 1),
    };

    for (let attempt = 0; attempt < 35; attempt++) {
      const { error } = await client
        .from('course_sheets')
        .upsert([payload], { onConflict: 'id' });

      if (!error) break;

      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;
      const matches = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']?|find the ["']?([a-zA-Z0-9_]+)["']? column/i);
      if (matches) {
        const colName = matches[1] || matches[2];
        if (colName && colName in payload && colName !== 'title' && colName !== 'course_id' && colName !== 'id') {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('does not exist'))) {
        const optKeys = [
          'serial', 'order', 'locked', 'badge', 'total_pages', 'pdf_link', 'file_url',
          'pdf_name', 'topic', 'subject', 'badge_text', 'page_count', 'file_size', 'is_locked', 'position'
        ];
        for (const k of optKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }

    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

export const deleteCourseSheet = async (
  id: string,
  courseId: string
): Promise<{ success: boolean; error: string | null }> => {
  const localMap = getLocalCourseSheetsCache();
  const list = localMap[courseId] || [];
  localMap[courseId] = list.filter((s) => s.id !== id);
  setLocalCourseSheetsCache(localMap);

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    await client.from('course_sheets').delete().eq('id', id);
    try {
      await client
        .from('courses')
        .update({ total_sheets: localMap[courseId].length })
        .eq('id', courseId);
    } catch (e) {}
    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

// Sync All Sheets for a specific Course directly to Supabase
export const syncCourseSheetsToSupabase = async (
  courseId: string,
  customList?: CourseSheet[]
): Promise<{ success: boolean; count: number; error: string | null }> => {
  const client = getSupabaseClient();
  const localMap = getLocalCourseSheetsCache();
  const list = customList || localMap[courseId] || [];

  if (!client) {
    return { success: true, count: list.length, error: null };
  }

  let synced = 0;
  let lastErr: string | null = null;

  for (const sheet of list) {
    const payload: any = {
      id: sheet.id,
      course_id: courseId,
      title: sheet.title,
      subject: sheet.subject || 'আরবি',
      topic: sheet.topic || '',
      pdf_url: sheet.pdf_url,
      file_url: sheet.pdf_url,
      pdf_link: sheet.pdf_url,
      pdf_name: sheet.pdf_name || '',
      file_size: sheet.file_size || '১.৫ মেগাবাইট',
      page_count: sheet.page_count || '১০ পেজ',
      total_pages: sheet.page_count || '১০ পেজ',
      badge_text: sheet.badge_text || 'লেকচার নোট',
      badge: sheet.badge_text || 'লেকচার নোট',
      is_locked: Boolean(sheet.is_locked),
      locked: Boolean(sheet.is_locked),
      position: Number(sheet.position) || 1,
      order: Number(sheet.position) || 1,
      serial: Number(sheet.position) || 1,
    };

    for (let att = 0; att < 35; att++) {
      const { error } = await client
        .from('course_sheets')
        .upsert([payload], { onConflict: 'id' });

      if (!error) {
        synced++;
        break;
      }

      lastErr = error.message;
      const errMsg = (error.message || '').toLowerCase();
      let stripped = false;
      const matches = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']?|find the ["']?([a-zA-Z0-9_]+)["']? column/i);
      if (matches) {
        const colName = matches[1] || matches[2];
        if (colName && colName in payload && colName !== 'title' && colName !== 'course_id' && colName !== 'id') {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('does not exist'))) {
        const optKeys = [
          'serial', 'order', 'locked', 'badge', 'total_pages', 'pdf_link', 'file_url',
          'pdf_name', 'topic', 'subject', 'badge_text', 'page_count', 'file_size', 'is_locked', 'position'
        ];
        for (const k of optKeys) {
          if (k in payload) {
            delete payload[k];
            stripped = true;
            break;
          }
        }
      }

      if (!stripped) break;
    }
  }

  try {
    await client
      .from('courses')
      .update({ total_sheets: list.length })
      .eq('id', courseId);
  } catch (e) {}

  return { success: true, count: synced, error: lastErr };
};

/* ==========================================================================
   PUBLIC.COURSE_APPLICATIONS (PAYMENT APPROVALS & ENROLLMENT)
   ========================================================================== */

export const INITIAL_COURSE_APPLICATIONS: CourseApplication[] = [
  {
    id: 'app-101',
    student_name: 'আরিফুল ইসলাম',
    phone_number: '01712345678',
    course_title: '১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ',
    course_id: 'course-1',
    payment_method: 'bKash',
    amount: 950,
    transaction_id: 'BK9X2M7P4Q',
    status: 'pending',
    notes: 'বিকাশ পার্সোনাল থেকে পাঠানো হয়েছে',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'app-102',
    student_name: 'মাওলানা কামরুল হাসান',
    phone_number: '01898765432',
    course_title: 'সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স ২০২৬',
    course_id: 'course-2',
    payment_method: 'Nagad',
    amount: 750,
    transaction_id: 'NG8W3L9K2P',
    status: 'approved',
    notes: 'নগদ ক্যাশ ইন',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'app-103',
    student_name: 'তাহমিনা আক্তার',
    phone_number: '01911223344',
    course_title: '১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ',
    course_id: 'course-1',
    payment_method: 'Rocket',
    amount: 950,
    transaction_id: 'RK7M4P2X9Q',
    status: 'approved',
    notes: 'রকেট মার্চেন্ট পেমেন্ট',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'app-104',
    student_name: 'আব্দুল্লাহ আল মাসউদ',
    phone_number: '01555667788',
    course_title: 'সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স ২০২৬',
    course_id: 'course-2',
    payment_method: 'bKash',
    amount: 750,
    transaction_id: 'BK1Z9Y8X7W',
    status: 'rejected',
    notes: 'ভুল ট্রানজেকশন আইডি প্রদান',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
];

const APPLICATION_CACHE_KEY = 'miniquiz_admin_course_applications_cache';

const getLocalApplicationsCache = (): CourseApplication[] => {
  const local = localStorage.getItem(APPLICATION_CACHE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(APPLICATION_CACHE_KEY, JSON.stringify(INITIAL_COURSE_APPLICATIONS));
  return INITIAL_COURSE_APPLICATIONS;
};

const setLocalApplicationsCache = (apps: CourseApplication[]) => {
  localStorage.setItem(APPLICATION_CACHE_KEY, JSON.stringify(apps));
};

function normalizeCourseApplicationRow(row: any): CourseApplication {
  return {
    id: String(row.id),
    student_name: row.student_name || row.name || 'শিক্ষার্থীর নাম পাওয়া যায়নি',
    phone_number: row.phone_number || row.phone || row.mobile || '',
    course_title: row.course_title || row.course_name || 'সাধারণ কোর্স',
    course_id: row.course_id ? String(row.course_id) : null,
    payment_method: row.payment_method || row.gateway || 'bKash',
    amount: Number(row.amount || 0),
    transaction_id: row.transaction_id || row.trx_id || row.trxid || '',
    status: (row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending') as ApplicationStatus,
    notes: row.notes || '',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
}

export const fetchAllCourseApplications = async (): Promise<{
  applications: CourseApplication[];
  error: string | null;
  isTableMissing?: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { applications: getLocalApplicationsCache(), error: null, isTableMissing: true };
  }

  try {
    const { data, error } = await client
      .from('course_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllCourseApplications warning:', error.message);
      const isMissing = error.code === '42P01' || error.message.includes('does not exist');
      return {
        applications: getLocalApplicationsCache(),
        error: isMissing ? null : error.message,
        isTableMissing: isMissing,
      };
    }

    const normalized = (data || []).map(normalizeCourseApplicationRow);
    setLocalApplicationsCache(normalized);
    return { applications: normalized, error: null };
  } catch (err: any) {
    return { applications: getLocalApplicationsCache(), error: err?.message || null, isTableMissing: true };
  }
};

export const updateCourseApplicationStatus = async (
  id: string,
  status: ApplicationStatus
): Promise<{ success: boolean; data?: CourseApplication; error: string | null }> => {
  const current = getLocalApplicationsCache();
  const idx = current.findIndex((a) => a.id === id);
  let updatedApp: CourseApplication | undefined;

  if (idx !== -1) {
    updatedApp = { ...current[idx], status, updated_at: new Date().toISOString() };
    current[idx] = updatedApp;
    setLocalApplicationsCache([...current]);
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, data: updatedApp, error: null };
  }

  try {
    const { data, error } = await client
      .from('course_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateCourseApplicationStatus warning:', error.message);
      return { success: true, data: updatedApp, error: null };
    }

    const norm = normalizeCourseApplicationRow(data);
    return { success: true, data: norm, error: null };
  } catch (err: any) {
    return { success: true, data: updatedApp, error: null };
  }
};

export const deleteCourseApplication = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  const current = getLocalApplicationsCache();
  const filtered = current.filter((a) => a.id !== id);
  setLocalApplicationsCache(filtered);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client.from('course_applications').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteCourseApplication warning:', error.message);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: true, error: null };
  }
};

export const insertCourseApplication = async (
  newApp: Omit<CourseApplication, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: CourseApplication; error: string | null }> => {
  const id = `app-${Date.now()}`;
  const appObj: CourseApplication = {
    ...newApp,
    id,
    created_at: new Date().toISOString(),
  };

  const current = getLocalApplicationsCache();
  setLocalApplicationsCache([appObj, ...current]);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, data: appObj, error: null };
  }

  try {
    const { data, error } = await client
      .from('course_applications')
      .insert([
        {
          student_name: newApp.student_name,
          phone_number: newApp.phone_number,
          course_title: newApp.course_title,
          course_id: newApp.course_id || null,
          payment_method: newApp.payment_method,
          amount: newApp.amount,
          transaction_id: newApp.transaction_id,
          status: newApp.status || 'pending',
          notes: newApp.notes || '',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insertCourseApplication fallback:', error.message);
      return { success: true, data: appObj, error: null };
    }

    const norm = normalizeCourseApplicationRow(data);
    return { success: true, data: norm, error: null };
  } catch (err) {
    return { success: true, data: appObj, error: null };
  }
};

// Supabase Realtime Subscription Listener for course_applications
export const subscribeToCourseApplications = (
  onPayload: (payload: any) => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  try {
    const channel = client
      .channel('public:course_applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_applications' },
        (payload) => {
          onPayload(payload);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to course_applications realtime channel:', err);
    return () => {};
  }
};


// --- Question Reports ---

export const fetchQuestionReports = async (): Promise<{ reports: any[]; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { reports: [], error: 'Supabase client not initialized' };
  }
  
  try {
    const { data, error } = await client
      .from('question_reports')
      .select(`
        *,
        questions (
          id,
          question,
          question_text
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching question reports:', error);
      return { reports: [], error: error.message };
    }
    
    // Normalize question field
    const normalizedData = (data || []).map((report: any) => ({
      ...report,
      question: report.questions ? {
        id: report.questions.id,
        question: report.questions.question || report.questions.question_text || 'Unknown'
      } : undefined
    }));

    return { reports: normalizedData, error: null };
  } catch (err: any) {
    console.error('Exception fetching question reports:', err);
    return { reports: [], error: err.message };
  }
};

export const updateQuestionReportStatus = async (id: string, status: 'resolved'): Promise<{ success: boolean; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { error } = await client
      .from('question_reports')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating report status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception updating report status:', err);
    return { success: false, error: err.message };
  }
};
