import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question, SupabaseConfig, DashboardStats } from '../types';

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
      stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0 },
      error: 'সুপাবেস কানেক্ট করা নেই। অনুগ্রহ করে URL ও Key প্রদান করুন।',
    };
  }

  try {
    const { data, error } = await client
      .from('questions')
      .select('id, status');

    if (error) {
      return {
        stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0 },
        error: `ডাটাবেস ত্রুটি: ${error.message}`,
      };
    }

    const totalQuestions = data?.length || 0;
    const publishedQuestions = data?.filter((q: any) => q.status === 'published').length || 0;
    const draftQuestions = data?.filter((q: any) => q.status === 'draft').length || 0;

    return {
      stats: { totalQuestions, publishedQuestions, draftQuestions },
      error: null,
    };
  } catch (err: any) {
    return {
      stats: { totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0 },
      error: err?.message || 'ডেটা লোড করতে সমস্যা হয়েছে।',
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
