import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Question,
  SupabaseConfig,
  DashboardStats,
  Exam,
  ExamBadgeType,
  ExamStatus,
  Course,
  CourseExam,
  CourseSheet,
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

// Helper function to map database row to Question interface cleanly
function normalizeQuestionRow(row: any): Question {
  return {
    id: row.id,
    question: row.question || row.question_text || row.title || '',
    option_a: row.option_a || (Array.isArray(row.options) ? row.options[0] : '') || '',
    option_b: row.option_b || (Array.isArray(row.options) ? row.options[1] : '') || '',
    option_c: row.option_c || (Array.isArray(row.options) ? row.options[2] : '') || '',
    option_d: row.option_d || (Array.isArray(row.options) ? row.options[3] : '') || '',
    correct_answer: row.correct_answer || row.correct_option || row.answer || 'option_a',
    explanation: row.explanation || row.description || '',
    status: row.status === 'published' ? 'published' : 'draft',
    subject: row.subject || row.category || row.subject_name || 'ইংরেজি',
    topic: row.topic || row.topic_name || '',
    post: row.post || row.post_name || row.designation || row.position || '',
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
      // Check if table doesn't exist or permissions issue
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
  const client = getSupabaseClient();
  if (!client) {
    return {
      stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0, totalExams: 0, activeExams: 0 },
      error: 'সুপাবেস কানেক্ট করা নেই। অনুগ্রহ করে URL ও Key প্রদান করুন।',
    };
  }

  try {
    const { data: questionsData, error: qError } = await client
      .from('questions')
      .select('id, status');

    if (qError) {
      return {
        stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0, totalExams: 0, activeExams: 0 },
        error: `ডাটাবেস ত্রুটি: ${qError.message}`,
      };
    }

    const totalQuestions = questionsData ? questionsData.length : 0;
    const publishedQuestions = questionsData ? questionsData.filter((q) => q.status === 'published').length : 0;
    const draftQuestions = questionsData ? questionsData.filter((q) => q.status === 'draft').length : 0;

    let totalExams = 0;
    let activeExams = 0;

    // Fetch exams count if exams table exists
    const { data: examsData } = await client.from('exams').select('id, status');
    if (examsData) {
      totalExams = examsData.length;
      activeExams = examsData.filter((e) => e.status === 'active').length;
    }

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
    return {
      stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0, totalExams: 0, activeExams: 0 },
      error: err?.message || 'পরিসংখ্যান লোড করতে সমস্যা হয়েছে।',
    };
  }
};

// Fetch All Questions from public.questions
export const fetchAllQuestions = async (): Promise<{ questions: Question[]; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      questions: [],
      error: 'সুপাবেস কনফিগার করা নেই।',
    };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        questions: [],
        error: `প্রশ্ন লোড করতে সমস্যা হয়েছে: ${error.message}`,
      };
    }

    const normalized = (data || []).map(normalizeQuestionRow);
    return { questions: normalized, error: null };
  } catch (err: any) {
    return {
      questions: [],
      error: err?.message || 'অজানা ত্রুটি ঘটেছে।',
    };
  }
};

// Fetch Single Question by ID
export const fetchQuestionById = async (id: string | number): Promise<{ question: Question | null; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { question: null, error: 'সুপাবেস কানেক্ট করা নেই।' };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { question: null, error: `প্রশ্ন পাওয়া যায়নি: ${error.message}` };
    }

    return { question: normalizeQuestionRow(data), error: null };
  } catch (err: any) {
    return { question: null, error: err?.message || 'প্রশ্ন আনতে ত্রুটি হয়েছে।' };
  }
};

// Insert New Question into public.questions
export const insertQuestion = async (
  newQuestion: Omit<Question, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Question; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কনফিগারেশন অনুপস্থিত।' };
  }

  try {
    const payload: any = {
      question: newQuestion.question,
      option_a: newQuestion.option_a,
      option_b: newQuestion.option_b,
      option_c: newQuestion.option_c,
      option_d: newQuestion.option_d,
      correct_answer: newQuestion.correct_answer,
      explanation: newQuestion.explanation || '',
      status: newQuestion.status,
      subject: newQuestion.subject || 'ইংরেজি',
      topic: newQuestion.topic || '',
      post: newQuestion.post || '',
    };

    let { data, error } = await client
      .from('questions')
      .insert([payload])
      .select()
      .single();

    // If 'subject', 'topic', or 'post' column doesn't exist in Supabase table schema, retry gracefully
    if (error && (error.message.includes('subject') || error.message.includes('topic') || error.message.includes('post') || error.code === 'PGRST204')) {
      delete payload.topic;
      delete payload.post;
      let retryResult = await client
        .from('questions')
        .insert([payload])
        .select()
        .single();
      if (retryResult.error && retryResult.error.message.includes('subject')) {
        delete payload.subject;
        retryResult = await client
          .from('questions')
          .insert([payload])
          .select()
          .single();
      }
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: `প্রশ্ন সংরক্ষণ করা যায়নি: ${error.message} (${error.code || ''})`,
      };
    }

    return {
      success: true,
      data: normalizeQuestionRow(data),
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'প্রশ্ন তৈরি করতে ত্রুটি ঘটেছে।',
    };
  }
};

// Batch Insert Multiple Questions
export const insertBatchQuestions = async (
  questionsToInsert: Omit<Question, 'id' | 'created_at' | 'updated_at'>[]
): Promise<{ success: boolean; data?: Question[]; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কনফিগারেশন অনুপস্থিত।' };
  }

  try {
    const payload = questionsToInsert.map((q) => ({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      status: q.status || 'published',
      subject: q.subject || 'ইংরেজি',
      topic: q.topic || '',
      post: q.post || '',
      ...(q.exam_id ? { exam_id: q.exam_id } : {}),
    }));

    let { data, error } = await client
      .from('questions')
      .insert(payload)
      .select();

    if (error && (error.message.includes('subject') || error.message.includes('topic') || error.message.includes('post') || error.message.includes('exam_id') || error.code === 'PGRST204')) {
      const fallbackPayload = payload.map((p: any) => {
        const { subject, topic, post, exam_id, ...rest } = p;
        return rest;
      });
      const retryResult = await client
        .from('questions')
        .insert(fallbackPayload)
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase insertBatchQuestions error:', error);
      return { success: false, error: error.message };
    }

    const normalized = (data || []).map(normalizeQuestionRow);
    return { success: true, data: normalized, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ব্যাচ প্রশ্ন করতে সমস্যা হয়েছে।' };
  }
};

// Fetch questions linked to a specific exam or list of IDs
export const fetchQuestionsByExamId = async (
  examId: string | number
): Promise<{ questions: Question[]; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { questions: [], error: 'সুপাবেস কনফিগার করা নেই।' };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (error) {
      return { questions: [], error: error.message };
    }

    return { questions: (data || []).map(normalizeQuestionRow), error: null };
  } catch (err: any) {
    return { questions: [], error: err?.message || 'পরীক্ষার প্রশ্ন দেখতে ব্যর্থ।' };
  }
};

// Update Question in public.questions
export const updateQuestion = async (
  id: string | number,
  updatedFields: Partial<Omit<Question, 'id' | 'created_at'>>
): Promise<{ success: boolean; data?: Question; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কনফিগারেশন পাওয়া যায়নি।' };
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
    if (updatedFields.subject !== undefined) payload.subject = updatedFields.subject;
    if (updatedFields.topic !== undefined) payload.topic = updatedFields.topic;
    if (updatedFields.post !== undefined) payload.post = updatedFields.post;

    let { data, error } = await client
      .from('questions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.message.includes('subject') || error.message.includes('topic') || error.message.includes('post') || error.code === 'PGRST204')) {
      delete payload.topic;
      delete payload.post;
      let retryResult = await client
        .from('questions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (retryResult.error && retryResult.error.message.includes('subject')) {
        delete payload.subject;
        retryResult = await client
          .from('questions')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
      }
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update error:', error);
      return {
        success: false,
        error: `প্রশ্ন আপডেট ব্যর্থ হয়েছে: ${error.message}`,
      };
    }

    return {
      success: true,
      data: normalizeQuestionRow(data),
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'প্রশ্ন হালনাগাদ করা যায়নি।',
    };
  }
};

// Delete Question from public.questions
export const deleteQuestion = async (id: string | number): Promise<{ success: boolean; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const { error } = await client
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: `প্রশ্ন মোছা সম্ভব হয়নি: ${error.message}`,
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'প্রশ্ন মুছতে সমস্যা হয়েছে।',
    };
  }
};

/* ==========================================================================
   PUBLIC.EXAMS TABLE CRUD FUNCTIONS
   ========================================================================== */

export const normalizeExamRow = (row: any): Exam => {
  return {
    id: String(row.id),
    title: row.title || 'শিরোনাম ছাড়া পরীক্ষা',
    badge: row.badge || 'মডেল টেস্ট',
    badge_type: (row.badge_type || 'daily') as ExamBadgeType,
    subject: row.subject || 'সকল বিষয়',
    question_count: typeof row.question_count === 'number' ? row.question_count : Number(row.question_count || 0),
    time_minutes: typeof row.time_minutes === 'number' ? row.time_minutes : Number(row.time_minutes || 0),
    negative_marks: typeof row.negative_marks === 'number' ? row.negative_marks : Number(row.negative_marks || 0),
    total_marks: typeof row.total_marks === 'number' ? row.total_marks : Number(row.total_marks || 0),
    description: row.description || '',
    status: (row.status === 'active' ? 'active' : 'draft') as ExamStatus,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
};

// Fetch All Exams
export const fetchAllExams = async (): Promise<{ exams: Exam[]; error: string | null; isTableMissing?: boolean }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { exams: [], error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const { data, error } = await client
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchAllExams error:', error);
      const isMissing = error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('exams');
      return {
        exams: [],
        error: `পরীক্ষার তালিকা লোড ব্যর্থ: ${error.message}`,
        isTableMissing: isMissing,
      };
    }

    const normalized = (data || []).map(normalizeExamRow);
    return { exams: normalized, error: null };
  } catch (err: any) {
    return { exams: [], error: err?.message || 'পরীক্ষার তালিকা লোড হতে সমস্যা হয়েছে।' };
  }
};

// Fetch Exam By ID
export const fetchExamById = async (id: string): Promise<{ exam: Exam | null; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { exam: null, error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const { data, error } = await client
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { exam: null, error: `পরীক্ষার তথ্য পাওয়া যায়নি: ${error.message}` };
    }

    return { exam: normalizeExamRow(data), error: null };
  } catch (err: any) {
    return { exam: null, error: err?.message || 'পরীক্ষা লোড করতে সমস্যা হয়েছে।' };
  }
};

// Insert New Exam
export const insertExam = async (
  newExam: Omit<Exam, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Exam; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const payload = {
      title: newExam.title,
      badge: newExam.badge,
      badge_type: newExam.badge_type,
      subject: newExam.subject,
      question_count: newExam.question_count,
      time_minutes: newExam.time_minutes,
      negative_marks: newExam.negative_marks,
      total_marks: newExam.total_marks,
      description: newExam.description || '',
      status: newExam.status,
    };

    const { data, error } = await client
      .from('exams')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insertExam error:', error);
      return {
        success: false,
        error: `পরীক্ষা তৈরি ব্যর্থ হয়েছে: ${error.message}`,
      };
    }

    return {
      success: true,
      data: normalizeExamRow(data),
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'পরীক্ষা তৈরি করতে ব্যর্থ হয়েছে।',
    };
  }
};

// Update Exam
export const updateExam = async (
  id: string,
  updatedFields: Partial<Exam>
): Promise<{ success: boolean; data?: Exam; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const payload: any = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.badge !== undefined) payload.badge = updatedFields.badge;
    if (updatedFields.badge_type !== undefined) payload.badge_type = updatedFields.badge_type;
    if (updatedFields.subject !== undefined) payload.subject = updatedFields.subject;
    if (updatedFields.question_count !== undefined) payload.question_count = updatedFields.question_count;
    if (updatedFields.time_minutes !== undefined) payload.time_minutes = updatedFields.time_minutes;
    if (updatedFields.negative_marks !== undefined) payload.negative_marks = updatedFields.negative_marks;
    if (updatedFields.total_marks !== undefined) payload.total_marks = updatedFields.total_marks;
    if (updatedFields.description !== undefined) payload.description = updatedFields.description;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;

    const { data, error } = await client
      .from('exams')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateExam error:', error);
      return {
        success: false,
        error: `পরীক্ষা আপডেট ব্যর্থ হয়েছে: ${error.message}`,
      };
    }

    return {
      success: true,
      data: normalizeExamRow(data),
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'পরীক্ষা তথ্য পরিবর্তন করা যায়নি।',
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
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'সুপাবেস কানেকশন পাওয়া যায়নি।' };
  }

  try {
    const { error } = await client
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteExam error:', error);
      return {
        success: false,
        error: `পরীক্ষা মুছে ফেলা সম্ভব হয়নি: ${error.message}`,
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'পরীক্ষা মুছতে সমস্যা হয়েছে।',
    };
  }
};

/* ==========================================================================
   PUBLIC.COURSES, PUBLIC.COURSE_EXAMS, PUBLIC.COURSE_SHEETS CRUD FUNCTIONS
   ========================================================================== */

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: '১৮তম NTRCA ক্যাডার আরবি প্রভাষক বিশেষ স্পেশাল মডেল টেস্ট ব্যাচ',
    category: 'আরবি প্রভাষক',
    badge: 'এক্সাম ও প্রাকটিস ব্যাচ',
    badge_subtitle: 'প্রিলি ও লিখিত পূর্ণাঙ্গ প্রস্তুতি',
    instructor_name: 'মুফতি শফিক উল্লাহ ও NTRCA প্যানেল',
    price: '৳৯৫০',
    enrolled_count: 1450,
    total_classes: 48,
    total_sheets: 35,
    total_exams: 30,
    theme_color: 'emerald',
    features: [
      'সম্পূর্ণ লিখিত ও প্রিলি সিলেবাস কভারিং',
      'অধ্যায়ভিত্তিক ৩০টি স্পেশাল মডেল টেস্ট',
      'পিডিএফ সাজেশন ও হ্যান্ডনোট ডাউনলোড',
      'উত্তরপত্র পর্যালোচনা ও লাইভ সাপোর্ট',
    ],
    status: 'published',
    details_button_text: 'কোর্স বিবরণী দেখুন',
    details_button_link: 'https://t.me/tamreen_academy',
    enroll_button_text: 'এখনই ভর্তি হন',
    enroll_button_link: 'https://tamreen.academy/enroll/arabic-lecturer',
    enter_button_text: 'ক্লাসরুমে প্রবেশ করুন',
    sheet_button_text: 'সকল শিট ডাউনলোড',
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: 'সহকারী মৌলভী ও ইবতেদায়ী ক্যাডার মাস্টার কোর্স ২০২৬',
    category: 'সহকারী মৌলভী',
    badge: 'রেকর্ড ব্যাচ-২',
    badge_subtitle: 'মাদ্রাসা ও ইবতেদায়ী কারিকুলাম',
    instructor_name: 'হাফেজ মাওলানা তানভীর আহমেদ',
    price: '৳৭৫০',
    enrolled_count: 980,
    total_classes: 36,
    total_sheets: 25,
    total_exams: 20,
    theme_color: 'purple',
    features: [
      'ফিকাহ ও আরবি ব্যাকরণ স্পেশাল ক্লাস',
      '২০টি অধ্যায়ভিত্তিক প্রাকটিস পরীক্ষা',
      'প্রিমিয়াম টাইপকৃত পিডিএফ লেকচার শিট',
    ],
    status: 'published',
    details_button_text: 'বিস্তারিত জানুন',
    details_button_link: 'https://t.me/tamreen_academy',
    enroll_button_text: 'ভর্তি নিশ্চিত করুন',
    enroll_button_link: 'https://tamreen.academy/enroll/assistant-moulvi',
    enter_button_text: 'পড়াশোনা শুরু করুন',
    sheet_button_text: 'শিট সংগ্রহ করুন',
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-3',
    title: 'NTRCA সাধারণ বিষয় (বাংলা, ইংরেজি, গণিত, জেন নলেজ) ফ্রি ব্যাচ',
    category: 'জেনারেল বিষয়',
    badge: 'ফ্রি অলিম্পিয়াড ব্যাচ',
    badge_subtitle: 'সকল ক্যাডারের জন্য প্রযোজ্য',
    instructor_name: 'বিসিএস ও শিক্ষক নিবন্ধন গবেষক টিম',
    price: '৳০ (ফ্রি)',
    enrolled_count: 3200,
    total_classes: 24,
    total_sheets: 20,
    total_exams: 15,
    theme_color: 'amber',
    features: [
      'শর্টকাট ম্যাথ টেকনিক',
      'ইংরেজি ব্যাকরণ সুপার ট্রিকস',
      'ফ্রি এক্সাম ও পিডিএফ নোটস',
    ],
    status: 'published',
    details_button_text: 'ফ্রি কোর্সটি দেখুন',
    details_button_link: '#',
    enroll_button_text: 'ফ্রি যুক্ত হন',
    enroll_button_link: '#',
    enter_button_text: 'পরীক্ষা দিন',
    sheet_button_text: 'ফ্রি শিট নিন',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_COURSE_EXAMS: Record<string, CourseExam[]> = {
  'course-1': [
    {
      id: 'ce-101',
      course_id: 'course-1',
      title: 'মডেল টেস্ট ০১: আল কুরআন ও তাফসির বিশেষ পরীক্ষা',
      subject: 'আল কুরআন',
      question_count: 25,
      time_minutes: 20,
      total_marks: 25,
      negative_marks: 0.25,
      is_locked: false,
      position: 1,
    },
    {
      id: 'ce-102',
      course_id: 'course-1',
      title: 'মডেল টেস্ট ০২: আরবি ভাষা ও নহু-সরফ স্পেশাল',
      subject: 'আরবি ভাষা',
      question_count: 30,
      time_minutes: 25,
      total_marks: 30,
      negative_marks: 0.25,
      is_locked: true,
      position: 2,
    },
  ],
};

export const INITIAL_COURSE_SHEETS: Record<string, CourseSheet[]> = {
  'course-1': [
    {
      id: 'cs-101',
      course_id: 'course-1',
      title: 'অধ্যায় ১: আল কুরআন ও তাফসির স্পেশাল হ্যান্ডনোট',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '৩.৫ মেগাবাইট',
      page_count: '২৪ পেজ',
      badge_text: 'লেকচার নোট-০১',
      is_locked: false,
      position: 1,
    },
    {
      id: 'cs-102',
      course_id: 'course-1',
      title: 'অধ্যায় ২: আরবি নহু-সরফ গুরুত্বপূর্ণ কায়দা ও উদাহরণ',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '৪.২ মেগাবাইট',
      page_count: '৩২ পেজ',
      badge_text: 'লেকচার নোট-০২',
      is_locked: true,
      position: 2,
    },
  ],
};

// Normalize Course Row from Supabase
function normalizeCourseRow(row: any): Course {
  let parsedFeatures: string[] = [];
  if (Array.isArray(row.features)) {
    parsedFeatures = row.features;
  } else if (typeof row.features === 'string') {
    try {
      parsedFeatures = JSON.parse(row.features);
    } catch (e) {
      parsedFeatures = [row.features];
    }
  }

  return {
    id: String(row.id),
    title: row.title || 'শিরোনাম ছাড়া কোর্স',
    category: row.category || 'আরবি প্রভাষক',
    badge: row.badge || 'বিশেষ ব্যাচ',
    badge_subtitle: row.badge_subtitle || '',
    instructor_name: row.instructor_name || 'তামরীন ইনস্ট্রাক্টর টিম',
    price: row.price || '৳০',
    enrolled_count: Number(row.enrolled_count || 0),
    total_classes: Number(row.total_classes || 0),
    total_sheets: Number(row.total_sheets || 0),
    total_exams: Number(row.total_exams || 0),
    theme_color: row.theme_color || 'emerald',
    features: parsedFeatures,
    status: row.status || 'published',
    details_button_text: row.details_button_text || 'বিস্তারিত',
    details_button_link: row.details_button_link || '#',
    enroll_button_text: row.enroll_button_text || 'এখনই ভর্তি হন',
    enroll_button_link: row.enroll_button_link || '#',
    enter_button_text: row.enter_button_text || 'প্রবেশ করুন',
    sheet_button_text: row.sheet_button_text || 'শিট ডাউনলোড',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
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

// Fetch All Courses from public.courses with graceful local fallback
export const fetchAllCourses = async (): Promise<{
  courses: Course[];
  error: string | null;
  isTableMissing?: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { courses: getLocalCoursesCache(), error: null, isTableMissing: true };
  }

  try {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllCourses warning:', error.message);
      const isMissing = error.code === '42P01' || error.message.includes('does not exist');
      return {
        courses: getLocalCoursesCache(),
        error: isMissing ? null : error.message,
        isTableMissing: isMissing,
      };
    }

    const normalized = (data || []).map(normalizeCourseRow);
    setLocalCoursesCache(normalized);
    return { courses: normalized, error: null };
  } catch (err: any) {
    return { courses: getLocalCoursesCache(), error: err?.message || null, isTableMissing: true };
  }
};

// Insert New Course
export const insertCourse = async (
  newCourse: Omit<Course, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Course; error: string | null }> => {
  const client = getSupabaseClient();
  const id = `course-${Date.now()}`;
  const courseData: Course = {
    ...newCourse,
    id,
    created_at: new Date().toISOString(),
  };

  if (!client) {
    const current = getLocalCoursesCache();
    const updated = [courseData, ...current];
    setLocalCoursesCache(updated);
    return { success: true, data: courseData, error: null };
  }

  try {
    const payload = {
      title: newCourse.title,
      category: newCourse.category,
      badge: newCourse.badge,
      badge_subtitle: newCourse.badge_subtitle || '',
      instructor_name: newCourse.instructor_name,
      price: newCourse.price,
      enrolled_count: newCourse.enrolled_count || 0,
      total_classes: newCourse.total_classes || 0,
      total_sheets: newCourse.total_sheets || 0,
      total_exams: newCourse.total_exams || 0,
      theme_color: newCourse.theme_color || 'emerald',
      features: newCourse.features || [],
      status: newCourse.status || 'published',
      details_button_text: newCourse.details_button_text || 'বিস্তারিত',
      details_button_link: newCourse.details_button_link || '#',
      enroll_button_text: newCourse.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_button_link: newCourse.enroll_button_link || '#',
      enter_button_text: newCourse.enter_button_text || 'প্রবেশ করুন',
      sheet_button_text: newCourse.sheet_button_text || 'শিট ডাউনলোড',
    };

    const { data, error } = await client
      .from('courses')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insertCourse failed, falling back to local storage cache:', error.message);
      const current = getLocalCoursesCache();
      const updated = [courseData, ...current];
      setLocalCoursesCache(updated);
      return { success: true, data: courseData, error: null };
    }

    const inserted = normalizeCourseRow(data);
    const current = getLocalCoursesCache();
    setLocalCoursesCache([inserted, ...current]);
    return { success: true, data: inserted, error: null };
  } catch (err: any) {
    const current = getLocalCoursesCache();
    const updated = [courseData, ...current];
    setLocalCoursesCache(updated);
    return { success: true, data: courseData, error: null };
  }
};

// Update Course
export const updateCourse = async (
  id: string,
  updatedFields: Partial<Course>
): Promise<{ success: boolean; data?: Course; error: string | null }> => {
  const client = getSupabaseClient();

  // Always update local cache first
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
    const payload: any = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.category !== undefined) payload.category = updatedFields.category;
    if (updatedFields.badge !== undefined) payload.badge = updatedFields.badge;
    if (updatedFields.badge_subtitle !== undefined) payload.badge_subtitle = updatedFields.badge_subtitle;
    if (updatedFields.instructor_name !== undefined) payload.instructor_name = updatedFields.instructor_name;
    if (updatedFields.price !== undefined) payload.price = updatedFields.price;
    if (updatedFields.enrolled_count !== undefined) payload.enrolled_count = updatedFields.enrolled_count;
    if (updatedFields.total_classes !== undefined) payload.total_classes = updatedFields.total_classes;
    if (updatedFields.total_sheets !== undefined) payload.total_sheets = updatedFields.total_sheets;
    if (updatedFields.total_exams !== undefined) payload.total_exams = updatedFields.total_exams;
    if (updatedFields.theme_color !== undefined) payload.theme_color = updatedFields.theme_color;
    if (updatedFields.features !== undefined) payload.features = updatedFields.features;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if (updatedFields.details_button_text !== undefined) payload.details_button_text = updatedFields.details_button_text;
    if (updatedFields.details_button_link !== undefined) payload.details_button_link = updatedFields.details_button_link;
    if (updatedFields.enroll_button_text !== undefined) payload.enroll_button_text = updatedFields.enroll_button_text;
    if (updatedFields.enroll_button_link !== undefined) payload.enroll_button_link = updatedFields.enroll_button_link;
    if (updatedFields.enter_button_text !== undefined) payload.enter_button_text = updatedFields.enter_button_text;
    if (updatedFields.sheet_button_text !== undefined) payload.sheet_button_text = updatedFields.sheet_button_text;

    const { data, error } = await client
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateCourse fallback:', error.message);
      return { success: true, data: updatedCourse, error: null };
    }

    const norm = normalizeCourseRow(data);
    return { success: true, data: norm, error: null };
  } catch (err: any) {
    return { success: true, data: updatedCourse, error: null };
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

    const norm: CourseExam[] = (data || []).map((row) => ({
      id: String(row.id),
      course_id: String(row.course_id),
      title: row.title || '',
      subject: row.subject || 'আরবি',
      question_count: Number(row.question_count || 0),
      time_minutes: Number(row.time_minutes || 0),
      total_marks: Number(row.total_marks || 0),
      negative_marks: Number(row.negative_marks || 0),
      is_locked: Boolean(row.is_locked),
      position: Number(row.position || 1),
      exam_id: row.exam_id ? String(row.exam_id) : null,
      created_at: row.created_at || new Date().toISOString(),
    }));

    localMap[courseId] = norm;
    setLocalCourseExamsCache(localMap);
    return { exams: norm, error: null };
  } catch (e: any) {
    return { exams: defaultList, error: null };
  }
};

export const insertCourseExam = async (
  newExam: Omit<CourseExam, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: CourseExam; error: string | null }> => {
  const client = getSupabaseClient();
  const id = `ce-${Date.now()}`;
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
    const payload = {
      course_id: newExam.course_id,
      title: newExam.title,
      subject: newExam.subject,
      question_count: newExam.question_count,
      time_minutes: newExam.time_minutes,
      total_marks: newExam.total_marks,
      negative_marks: newExam.negative_marks,
      is_locked: newExam.is_locked,
      position: newExam.position || existing.length + 1,
      ...(newExam.exam_id ? { exam_id: newExam.exam_id } : {}),
    };

    const { data, error } = await client
      .from('course_exams')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insertCourseExam fallback:', error.message);
      return { success: true, data: examObj, error: null };
    }

    const inserted: CourseExam = {
      id: String(data.id),
      course_id: String(data.course_id),
      title: data.title,
      subject: data.subject,
      question_count: Number(data.question_count),
      time_minutes: Number(data.time_minutes),
      total_marks: Number(data.total_marks),
      negative_marks: Number(data.negative_marks),
      is_locked: Boolean(data.is_locked),
      position: Number(data.position || 1),
      exam_id: data.exam_id ? String(data.exam_id) : null,
      created_at: data.created_at,
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
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    localMap[courseId] = [...list];
    setLocalCourseExamsCache(localMap);
  }

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    const { error } = await client
      .from('course_exams')
      .update(updatedFields)
      .eq('id', id);

    if (error) console.warn('Supabase updateCourseExam warning:', error.message);
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
    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
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

    const norm: CourseSheet[] = (data || []).map((row) => ({
      id: String(row.id),
      course_id: String(row.course_id),
      title: row.title || '',
      pdf_url: row.pdf_url || '#',
      file_size: row.file_size || '১.৫ মেগাবাইট',
      page_count: row.page_count || '১০ পেজ',
      badge_text: row.badge_text || 'লেকচার নোট',
      is_locked: Boolean(row.is_locked),
      position: Number(row.position || 1),
      created_at: row.created_at || new Date().toISOString(),
    }));

    localMap[courseId] = norm;
    setLocalCourseSheetsCache(localMap);
    return { sheets: norm, error: null };
  } catch (e: any) {
    return { sheets: defaultList, error: null };
  }
};

export const insertCourseSheet = async (
  newSheet: Omit<CourseSheet, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: CourseSheet; error: string | null }> => {
  const client = getSupabaseClient();
  const id = `cs-${Date.now()}`;
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
    const payload = {
      course_id: newSheet.course_id,
      title: newSheet.title,
      pdf_url: newSheet.pdf_url,
      file_size: newSheet.file_size,
      page_count: newSheet.page_count,
      badge_text: newSheet.badge_text || 'লেকচার নোট',
      is_locked: newSheet.is_locked,
      position: newSheet.position || existing.length + 1,
    };

    const { data, error } = await client
      .from('course_sheets')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insertCourseSheet fallback:', error.message);
      return { success: true, data: sheetObj, error: null };
    }

    const inserted: CourseSheet = {
      id: String(data.id),
      course_id: String(data.course_id),
      title: data.title,
      pdf_url: data.pdf_url,
      file_size: data.file_size,
      page_count: data.page_count,
      badge_text: data.badge_text,
      is_locked: Boolean(data.is_locked),
      position: Number(data.position || 1),
      created_at: data.created_at,
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
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    localMap[courseId] = [...list];
    setLocalCourseSheetsCache(localMap);
  }

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    const { error } = await client
      .from('course_sheets')
      .update(updatedFields)
      .eq('id', id);

    if (error) console.warn('Supabase updateCourseSheet warning:', error.message);
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
    return { success: true, error: null };
  } catch (e) {
    return { success: true, error: null };
  }
};

