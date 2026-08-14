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
    description: row.description || row.about_text || '',
    about_text: row.about_text || row.description || '',
    routine_text: row.routine_text || '',
    routine_pdf_url: row.routine_pdf_url || '',
    routine_pdf_name: row.routine_pdf_name || '',
    syllabus_text: row.syllabus_text || '',
    syllabus_pdf_url: row.syllabus_pdf_url || '',
    syllabus_pdf_name: row.syllabus_pdf_name || '',
    leaderboard_enabled: row.leaderboard_enabled !== undefined ? Boolean(row.leaderboard_enabled) : true,
    leaderboard_info: row.leaderboard_info || '',
    helpline_contact: row.helpline_contact || '',
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

// Fetch Published Courses specifically for Student App / Student Portal
export const fetchPublishedCoursesForStudent = async (): Promise<{
  courses: Course[];
  error: string | null;
  isTableMissing?: boolean;
  isSupabaseConnected: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    const publishedOnly = getLocalCoursesCache().filter((c) => c.status === 'published');
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
      const publishedOnly = getLocalCoursesCache().filter((c) => c.status === 'published');
      return {
        courses: publishedOnly,
        error: error.message,
        isTableMissing: isMissing,
        isSupabaseConnected: true,
      };
    }

    const normalized = (data || []).map(normalizeCourseRow);
    return { courses: normalized, error: null, isSupabaseConnected: true };
  } catch (err: any) {
    const publishedOnly = getLocalCoursesCache().filter((c) => c.status === 'published');
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
        error: isMissing ? 'সুপাবেজে "courses" টেবিল পাওয়া যায়নি' : error.message,
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
  const fallbackId = generateStandardUUID();

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
    let payload: any = {
      title: newCourse.title,
      category: newCourse.category || 'আরবি প্রভাষক',
      badge: newCourse.badge || 'রেকর্ড ব্যাচ',
      badge_subtitle: newCourse.badge_subtitle || '',
      instructor_name: newCourse.instructor_name || 'মুফতি শফিক উল্লাহ ও তামরীন প্যানেল',
      price: newCourse.price || '৳৯৫০',
      enrolled_count: Number(newCourse.enrolled_count) || 0,
      total_classes: Number(newCourse.total_classes) || 0,
      total_sheets: Number(newCourse.total_sheets) || 0,
      total_exams: Number(newCourse.total_exams) || 0,
      theme_color: newCourse.theme_color || 'emerald',
      features: Array.isArray(newCourse.features) ? newCourse.features : [],
      status: newCourse.status || 'published',
      description: newCourse.description || '',
      about_text: newCourse.about_text || '',
      routine_text: newCourse.routine_text || '',
      routine_pdf_url: newCourse.routine_pdf_url || '',
      routine_pdf_name: newCourse.routine_pdf_name || '',
      syllabus_text: newCourse.syllabus_text || '',
      syllabus_pdf_url: newCourse.syllabus_pdf_url || '',
      syllabus_pdf_name: newCourse.syllabus_pdf_name || '',
      leaderboard_enabled: newCourse.leaderboard_enabled !== undefined ? Boolean(newCourse.leaderboard_enabled) : true,
      leaderboard_info: newCourse.leaderboard_info || '',
      helpline_contact: newCourse.helpline_contact || '',
      details_button_text: newCourse.details_button_text || 'বিস্তারিত',
      details_button_link: newCourse.details_button_link || '#',
      enroll_button_text: newCourse.enroll_button_text || 'এখনই ভর্তি হন',
      enroll_button_link: newCourse.enroll_button_link || '#',
      enter_button_text: newCourse.enter_button_text || 'প্রবেশ করুন',
      sheet_button_text: newCourse.sheet_button_text || 'শিট ডাউনলোড',
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 15; attempt++) {
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

      // If postgres requires explicit ID
      if (errMsg.includes('null value in column "id"') || (errMsg.includes('id') && errMsg.includes('not-null'))) {
        payload.id = generateStandardUUID();
        stripped = true;
      }

      // Extract missing column name if mentioned in Supabase error
      const matches = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']?|find the ["']?([a-zA-Z0-9_]+)["']? column/i);
      if (matches) {
        const colName = matches[1] || matches[2];
        if (colName && colName !== 'title' && colName in payload) {
          delete payload[colName];
          stripped = true;
        }
      }

      // If JSONB issue with features
      if (errMsg.includes('features') && Array.isArray(payload.features)) {
        payload.features = JSON.stringify(payload.features);
        stripped = true;
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist'))) {
        const optionalKeys = [
          'routine_pdf_name', 'syllabus_pdf_name', 'helpline_contact', 'leaderboard_info',
          'leaderboard_enabled', 'routine_text', 'routine_pdf_url', 'syllabus_text', 'syllabus_pdf_url',
          'description', 'about_text', 'badge_subtitle', 'sheet_button_text', 'enter_button_text',
          'enroll_button_link', 'enroll_button_text', 'details_button_link', 'details_button_text',
          'features', 'theme_color', 'total_exams', 'total_sheets', 'total_classes', 'enrolled_count',
          'instructor_name', 'badge', 'price', 'status', 'category'
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
    let payload: any = {};
    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.category !== undefined) payload.category = updatedFields.category;
    if (updatedFields.badge !== undefined) payload.badge = updatedFields.badge;
    if (updatedFields.badge_subtitle !== undefined) payload.badge_subtitle = updatedFields.badge_subtitle;
    if (updatedFields.instructor_name !== undefined) payload.instructor_name = updatedFields.instructor_name;
    if (updatedFields.price !== undefined) payload.price = updatedFields.price;
    if (updatedFields.enrolled_count !== undefined) payload.enrolled_count = Number(updatedFields.enrolled_count) || 0;
    if (updatedFields.total_classes !== undefined) payload.total_classes = Number(updatedFields.total_classes) || 0;
    if (updatedFields.total_sheets !== undefined) payload.total_sheets = Number(updatedFields.total_sheets) || 0;
    if (updatedFields.total_exams !== undefined) payload.total_exams = Number(updatedFields.total_exams) || 0;
    if (updatedFields.theme_color !== undefined) payload.theme_color = updatedFields.theme_color;
    if (updatedFields.features !== undefined) payload.features = updatedFields.features;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if (updatedFields.description !== undefined) payload.description = updatedFields.description;
    if (updatedFields.about_text !== undefined) payload.about_text = updatedFields.about_text;
    if (updatedFields.routine_text !== undefined) payload.routine_text = updatedFields.routine_text;
    if (updatedFields.routine_pdf_url !== undefined) payload.routine_pdf_url = updatedFields.routine_pdf_url;
    if (updatedFields.routine_pdf_name !== undefined) payload.routine_pdf_name = updatedFields.routine_pdf_name;
    if (updatedFields.syllabus_text !== undefined) payload.syllabus_text = updatedFields.syllabus_text;
    if (updatedFields.syllabus_pdf_url !== undefined) payload.syllabus_pdf_url = updatedFields.syllabus_pdf_url;
    if (updatedFields.syllabus_pdf_name !== undefined) payload.syllabus_pdf_name = updatedFields.syllabus_pdf_name;
    if (updatedFields.leaderboard_enabled !== undefined) payload.leaderboard_enabled = Boolean(updatedFields.leaderboard_enabled);
    if (updatedFields.leaderboard_info !== undefined) payload.leaderboard_info = updatedFields.leaderboard_info;
    if (updatedFields.helpline_contact !== undefined) payload.helpline_contact = updatedFields.helpline_contact;
    if (updatedFields.details_button_text !== undefined) payload.details_button_text = updatedFields.details_button_text;
    if (updatedFields.details_button_link !== undefined) payload.details_button_link = updatedFields.details_button_link;
    if (updatedFields.enroll_button_text !== undefined) payload.enroll_button_text = updatedFields.enroll_button_text;
    if (updatedFields.enroll_button_link !== undefined) payload.enroll_button_link = updatedFields.enroll_button_link;
    if (updatedFields.enter_button_text !== undefined) payload.enter_button_text = updatedFields.enter_button_text;
    if (updatedFields.sheet_button_text !== undefined) payload.sheet_button_text = updatedFields.sheet_button_text;

    let lastError: any = null;
    let updatedRow: any = null;

    for (let attempt = 0; attempt < 15; attempt++) {
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
      const matches = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']?|find the ["']?([a-zA-Z0-9_]+)["']? column/i);
      if (matches) {
        const colName = matches[1] || matches[2];
        if (colName && colName in payload) {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist'))) {
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

    return { success: true, data: updatedRow || updatedCourse, error: null };
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
    const payload: any = {
      course_id: newExam.course_id,
      title: newExam.title,
      subject: newExam.subject,
      topic: newExam.topic || '',
      question_count: newExam.question_count,
      time_minutes: newExam.time_minutes,
      total_marks: newExam.total_marks,
      pass_marks: newExam.pass_marks || 10,
      negative_marks: newExam.negative_marks,
      is_locked: newExam.is_locked,
      position: newExam.position || existing.length + 1,
      instructions: newExam.instructions || '',
      questions: newExam.questions || [],
      ...(newExam.exam_id ? { exam_id: newExam.exam_id } : {}),
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await client
        .from('course_exams')
        .insert([payload])
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
        if (colName && colName in payload) {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('does not exist'))) {
        const optKeys = ['questions', 'instructions', 'pass_marks', 'topic', 'negative_marks', 'is_locked', 'position', 'exam_id'];
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
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    localMap[courseId] = [...list];
    setLocalCourseExamsCache(localMap);
  }

  const client = getSupabaseClient();
  if (!client) return { success: true, error: null };

  try {
    const payload: any = { ...updatedFields };
    const { error } = await client
      .from('course_exams')
      .update(payload)
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

    const norm: CourseSheet[] = (data || []).map((row) => {
      const localSheet = defaultList.find((s) => s.id === String(row.id));
      return {
        id: String(row.id),
        course_id: String(row.course_id),
        title: row.title || '',
        subject: row.subject || localSheet?.subject || 'আরবি',
        topic: row.topic || localSheet?.topic || '',
        pdf_url: row.pdf_url || '#',
        pdf_name: row.pdf_name || localSheet?.pdf_name || '',
        file_size: row.file_size || '১.৫ মেগাবাইট',
        page_count: row.page_count || '১০ পেজ',
        badge_text: row.badge_text || 'লেকচার নোট',
        is_locked: Boolean(row.is_locked),
        position: Number(row.position || 1),
        created_at: row.created_at || new Date().toISOString(),
      };
    });

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
    const payload: any = {
      course_id: newSheet.course_id,
      title: newSheet.title,
      subject: newSheet.subject || 'আরবি',
      topic: newSheet.topic || '',
      pdf_url: newSheet.pdf_url,
      pdf_name: newSheet.pdf_name || '',
      file_size: newSheet.file_size,
      page_count: newSheet.page_count,
      badge_text: newSheet.badge_text || 'লেকচার নোট',
      is_locked: newSheet.is_locked,
      position: newSheet.position || existing.length + 1,
    };

    let lastError: any = null;
    let insertedRow: any = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await client
        .from('course_sheets')
        .insert([payload])
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
        if (colName && colName in payload) {
          delete payload[colName];
          stripped = true;
        }
      }

      if (!stripped && (errMsg.includes('column') || errMsg.includes('does not exist'))) {
        const optKeys = ['pdf_name', 'topic', 'subject', 'badge_text', 'page_count', 'file_size', 'is_locked', 'position'];
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

