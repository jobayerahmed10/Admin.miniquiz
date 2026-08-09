import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question, SupabaseConfig, DashboardStats, Exam, ExamBadgeType, ExamStatus } from '../types';

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
    subject: row.subject || row.category || row.topic || row.subject_name || 'সাধারণ',
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
      subject: newQuestion.subject || 'সাধারণ',
    };

    let { data, error } = await client
      .from('questions')
      .insert([payload])
      .select()
      .single();

    // If 'subject' column doesn't exist in Supabase table schema, retry without 'subject'
    if (error && (error.message.includes('subject') || error.code === 'PGRST204')) {
      delete payload.subject;
      const retryResult = await client
        .from('questions')
        .insert([payload])
        .select()
        .single();
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
      subject: q.subject || 'সাধারণ',
      ...(q.exam_id ? { exam_id: q.exam_id } : {}),
    }));

    let { data, error } = await client
      .from('questions')
      .insert(payload)
      .select();

    if (error && (error.message.includes('subject') || error.message.includes('exam_id') || error.code === 'PGRST204')) {
      const fallbackPayload = payload.map((p: any) => {
        const { subject, exam_id, ...rest } = p;
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

    let { data, error } = await client
      .from('questions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.message.includes('subject') || error.code === 'PGRST204')) {
      delete payload.subject;
      const retryResult = await client
        .from('questions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
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

