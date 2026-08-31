// Central Subject Post & Syllabus Topic Manager for Tamreen Academy
// Fully integrated with Supabase table: `subject_posts`
// Handles CRUD: Create, Read, Update, Delete with realtime sync and resilient fallback.

import { SubjectPost, SyllabusTopic } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY = 'tamreen_subject_posts_v1';

export const THEME_COLOR_MAP: Record<string, { hex: string; gradient_class: string; label: string }> = {
  '#10B981': {
    hex: '#10B981',
    gradient_class: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/25',
    label: 'পান্না সবুজ (Emerald)',
  },
  '#6366F1': {
    hex: '#6366F1',
    gradient_class: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
    label: 'ইন্ডিগো পার্পল (Indigo)',
  },
  '#0D9488': {
    hex: '#0D9488',
    gradient_class: 'bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 shadow-teal-500/25',
    label: 'টিয়াল সায়ান (Teal)',
  },
  '#8B5CF6': {
    hex: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    label: 'রয়েল পার্পল (Purple)',
  },
  '#F59E0B': {
    hex: '#F59E0B',
    gradient_class: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 shadow-amber-500/25',
    label: 'অ্যাম্বার গোল্ড (Amber)',
  },
  '#F43F5E': {
    hex: '#F43F5E',
    gradient_class: 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-rose-500/25',
    label: 'গোলাপী লাল (Rose)',
  },
  '#0284C7': {
    hex: '#0284C7',
    gradient_class: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-blue-500/25',
    label: 'স্কাই ব্লু (Sky Blue)',
  },
};

export const INITIAL_SUBJECT_POSTS: SubjectPost[] = [
  {
    id: 'arabic_lecturer',
    name: 'আরবি প্রভাষক প্রস্তুতি',
    code: '৩০০',
    tagline: 'মাদ্রাসা ও কলেজ পর্যায়',
    badge: 'প্রভাষক আরবি • কোড: ৩০০',
    subtitle: 'আরবি সাহিত্য, বালাগাত, নাহু ও উলুমুল কুরআন প্রস্তুতি',
    description: 'মাদ্রাসা আলিয়া ও ফাজিল-কামিল পর্যায়ের আরবি প্রভাষক পদের পূর্ণাঙ্গ বিষয়ভিত্তিক প্রস্তুতি ও সিলেবাস।',
    theme_color: '#10B981',
    gradient_class: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/25',
    gradient: 'from-emerald-600 to-teal-500',
    icon_name: 'BookOpenCheck',
    status: 'active',
    order_index: 1,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-arb-1', name: 'আল কুরআন ও উলুমুল কুরআন', description: 'কুরআনের মূলনীতি, নাযিল, মাক্কি-মাদানি সূরা ও তাফসির শাস্ত্র', order_index: 1 },
      { id: 'top-arb-2', name: 'হাদিস ও উসুলুল হাদিস', description: 'সহিহ হাদিস, রাবি ও সনদের প্রকারভেদ, সিহাহ সিত্তাহ পরিচিতি', order_index: 2 },
      { id: 'top-arb-3', name: 'ফিকহ ও উসুলুল ফিকহ', description: 'চার মাযহাবের মূলনীতি, কিয়াস, ইজমা ও আধুনিক মাসায়িল', order_index: 3 },
      { id: 'top-arb-4', name: 'আরবি ব্যাকরণ (নাহু ও সরফ)', description: 'এরআব, জুমলাহ ইসমিয়্যাহ-ফিলিয়্যাহ, বাব ও ছিগাহ নির্ণয়', order_index: 4 },
      { id: 'top-arb-5', name: 'আরবি সাহিত্য ও ইতিহাস (আদবুল আরাবি)', description: 'জাহিলি, ইসলামি ও উমাইয়া-আব্বাসিয় যুগের সাহিত্যিক ও কবিতা', order_index: 5 },
      { id: 'top-arb-6', name: 'বালাঘাত ও মানতিক (অলঙ্কারশাস্ত্র ও যুক্তিবিদ্যা)', description: 'ইলমুল বায়ান, মাআনি, বাদি এবং মানতিকের প্রাথমিক ধারণা', order_index: 6 },
    ],
  },
  {
    id: 'asst_moulvi',
    name: 'সহকারী মৌলভী',
    code: '৩১১',
    tagline: 'দাখিল ও আলিম পর্যায়',
    badge: 'সহকারী মৌলভী • কোড: ৩১১',
    subtitle: 'কুরআন, হাদিস, ফিকহ ও আকাইদ',
    description: 'দাখিল ও আলিম মাদ্রাসার শিক্ষক নিয়োগে সহকারী মৌলভী পদের স্পেশাল সিলেবাস ও মডেল টেস্ট।',
    theme_color: '#0D9488',
    gradient_class: 'bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 shadow-teal-500/25',
    gradient: 'from-teal-600 to-cyan-500',
    icon_name: 'ScrollText',
    status: 'active',
    order_index: 2,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-mou-1', name: 'কুরআন মাজিদ ও তাজবিদ', description: 'মাখরাজ, সিফাত, তারতিল এবং নির্বাচিত সূরার শানে নুযুল ও তরজমা', order_index: 1 },
      { id: 'top-mou-2', name: 'হাদিস শরিফ ও মাসায়িল', description: 'মিশকাতুল মাসাবিহ ও রিয়াদুস সালিহিন থেকে নির্বাচিত হাদিসের ব্যাখ্যা', order_index: 2 },
      { id: 'top-mou-3', name: 'ফিকহ (ইবাদাত ও মুয়ামালাত)', description: 'তাহরাত, সালাত, সাওম, যাকাত, হজ্জ এবং লেনদেন সংক্রান্ত আহকাম', order_index: 3 },
      { id: 'top-mou-4', name: 'আকাইদ ও কালাম', description: 'তাওহিদ, রিসালাত, আখিরাত, তাকদির ও মূলধারার বিশ্বাসসমূহ', order_index: 4 },
      { id: 'top-mou-5', name: 'আরবি প্রথম ও দ্বিতীয় পত্র', description: 'সহজ আরবি গদ্য-পদ্য ও ব্যাকরণগত নিয়মাবলী', order_index: 5 },
      { id: 'top-mou-6', name: 'ইসলামিক ঐতিহ্য ও সভ্যতা', description: 'খোলাফায়ে রাশেদিন ও মুসলিম মনীষীদের অবদান', order_index: 6 },
    ],
  },
  {
    id: 'asst_qari',
    name: 'সহকারী মৌলভী (কারী)',
    code: '৩১২',
    tagline: 'মাদ্রাসা কেরাত ও তাজবিদ স্পেশাল',
    badge: 'সহকারী কারী • কোড: ৩১২',
    subtitle: 'ইলমুত তাজবিদ, কেরাত ও হাদিস',
    description: 'কেরাত ও তাজবিদ স্পেশাল সহকারী মৌলভী কারী পদের সম্পূর্ণ সিলেবাস ও প্রশ্নব্যাংক।',
    theme_color: '#F59E0B',
    gradient_class: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 shadow-amber-500/25',
    gradient: 'from-amber-600 to-yellow-500',
    icon_name: 'BookMarked',
    status: 'active',
    order_index: 3,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-qar-1', name: 'ইলমুত তাজবিদ ও কেরাত শাস্ত্র', description: 'নুন সাকিন, তানউইন, মাদ্দের প্রকারভেদ ও কেরাতে সাবআ পরিচিতি', order_index: 1 },
      { id: 'top-qar-2', name: 'হাদিস ও সুন্নাহ চর্চা', description: 'নবীজির (সা.) তিলাওয়াত পদ্ধতি ও সুন্নাত অনুযায়ী পাঠের নিয়ম', order_index: 2 },
      { id: 'top-qar-3', name: 'আরবি ভাষা ও তরজমা', description: 'কুরআনিক শব্দার্থ, বাক্য গঠন ও সহজ তরজমার নিয়ম', order_index: 3 },
      { id: 'top-qar-4', name: 'জরুরি মাসায়িল ও সালাতের আহকাম', description: 'ইমামতি, কিরাত ভুল হলে করণীয় (সাহু সিজদা) ও দৈনন্দিন মাসয়ালা', order_index: 4 },
      { id: 'top-qar-5', name: 'ইসলামিক ইতিহাস ও সংস্কৃতি', description: 'মাদ্রাসার ইতিহাস ও প্রখ্যাত কারীদের জীবনী', order_index: 5 },
    ],
  },
  {
    id: 'ebt_moulvi',
    name: 'ইবতেদায়ী মৌলভী',
    code: '৩১৩',
    tagline: 'ইবতেদায়ী মাদ্রাসা পর্যায়',
    badge: 'ইবতেদায়ী মৌলভী • কোড: ৩১৩',
    subtitle: 'প্রাথমিক দ্বীনিয়াহ ও আরবি ব্যাকরণ',
    description: 'ইবতেদায়ী মাদ্রাসার শিক্ষার্থীদের পাঠদানের জন্য প্রয়োজনীয় মৌলভী শিক্ষক নিয়োগের সিলেবাস।',
    theme_color: '#6366F1',
    gradient_class: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
    gradient: 'from-indigo-600 to-purple-500',
    icon_name: 'GraduationCap',
    status: 'active',
    order_index: 4,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-ebtm-1', name: 'প্রাথমিক আরবি ব্যাকরণ ও পাঠ', description: 'হুরুফ, কালেমা, সহজ বাক্য তৈরি ও অর্থবোধক পাঠ', order_index: 1 },
      { id: 'top-ebtm-2', name: 'কুরআন তিলাওয়াত ও মাসয়ালা', description: 'আমপারা মুখস্থ, মাখরাজ ও শিশুদের তিলাওয়াত শিক্ষা পদ্ধতি', order_index: 2 },
      { id: 'top-ebtm-3', name: 'দ্বীনিয়াত ও আখলাক', description: 'ইসলামিক আচরণবিধি, দোয়া-দরূদ ও চরিত্র গঠন', order_index: 3 },
      { id: 'top-ebtm-4', name: 'বাংলা ভাষা ও সাহিত্য (প্রাথমিক)', description: 'বর্ণমালা, ব্যাকরণ ও বাংলা রচয়িতাদের প্রাথমিক পরিচয়', order_index: 4 },
      { id: 'top-ebtm-5', name: 'প্রাথমিক গণিত ও সাধারণ জ্ঞান', description: 'মৌলিক হিসাব, বাংলাদেশ ও সাধারণ বিজ্ঞান', order_index: 5 },
    ],
  },
  {
    id: 'ebt_qari',
    name: 'ইবতেদায়ী কারী',
    code: '৩১৪',
    tagline: 'ইবতেদায়ী কুরআন ও তাজবিদ শিক্ষক',
    badge: 'ইবতেদায়ী কারী • কোড: ৩১৪',
    subtitle: 'তাজবিদ ও বিশুদ্ধ কুরআন পাঠ',
    description: 'ছোটদের বিশুদ্ধ কুরআন পাঠদান ও তিলাওয়াতের জন্য ইবতেদায়ী কারী পদের বিষয়ভিত্তিক প্রস্তুতি।',
    theme_color: '#F43F5E',
    gradient_class: 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-rose-500/25',
    gradient: 'from-rose-600 to-pink-500',
    icon_name: 'Library',
    status: 'active',
    order_index: 5,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-ebtq-1', name: 'তাজবিদ ও বিশুদ্ধ তিলাওয়াত', description: 'নূরানি কায়দা, মাখরাজ ও সিফাতের ব্যবহারিক প্রয়োগ', order_index: 1 },
      { id: 'top-ebtq-2', name: 'কুরআন হিফজ ও কেরাত পদ্ধতি', description: 'হিফজের পদ্ধতি, পুনরাবৃত্তি ও সুন্দর কণ্ঠে তিলাওয়াত', order_index: 2 },
      { id: 'top-ebtq-3', name: 'আরবি শব্দার্থ ও অনুবাদ', description: 'কুরআনের ছোট সূরার শব্দভিত্তিক তরজমা ও মূলভাব', order_index: 3 },
      { id: 'top-ebtq-4', name: 'ধর্মীয় শিক্ষা ও শিক্ষাদান পদ্ধতি (Pedagogy)', description: 'মাদ্রাসার প্রাথমিক স্তরের পাঠদান কৌশল ও শিশু মনস্তত্ত্ব', order_index: 4 },
    ],
  },
  {
    id: 'bangla_lecturer',
    name: 'বাংলা প্রভাষক',
    code: '৩০১',
    tagline: 'কলেজ ও মাদ্রাসা পর্যায়',
    badge: 'বাংলা প্রভাষক • কোড: ৩০১',
    subtitle: 'বাংলা ভাষা ও সাহিত্যের পূর্ণাঙ্গ প্রস্তুতি',
    description: 'বাংলা প্রভাষক শিক্ষক নিবন্ধন ও কলেজ লেভেলের জন্য বিশেষ সিলেবাস।',
    theme_color: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    gradient: 'from-purple-600 to-indigo-500',
    icon_name: 'BookOpen',
    status: 'active',
    order_index: 6,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-bng-1', name: 'প্রাচীন ও মধ্যযুগীয় বাংলা সাহিত্য', description: 'চর্যাপদ, মঙ্গলকাব্য ও বৈষ্ণব পদাবলী', order_index: 1 },
      { id: 'top-bng-2', name: 'আধুনিক বাংলা সাহিত্য ও রচয়িতাগণ', description: 'মাইকেল, বঙ্কিম, রবীন্দ্রনাথ, নজরুল ও জীবনানন্দ', order_index: 2 },
      { id: 'top-bng-3', name: 'বাংলা ব্যাকরণ ও ধ্বনিতত্ত্ব', description: 'সন্ধি, সমাস, কারক, প্রত্যয় ও উপসর্গ', order_index: 3 },
      { id: 'top-bng-4', name: 'ভাষা বিজ্ঞান ও উপভাষা', description: 'বাংলা ভাষার উৎপত্তি, ক্রমবিকাশ ও সাধু-চলিত রীতি', order_index: 4 },
    ],
  },
];

/**
 * Normalizes topics from various Supabase formats (JSON string, string[], or object[])
 */
export const normalizeTopicsFromDb = (rawTopics: any): SyllabusTopic[] => {
  if (!rawTopics) return [];

  let parsed = rawTopics;
  if (typeof rawTopics === 'string') {
    try {
      parsed = JSON.parse(rawTopics);
    } catch {
      parsed = rawTopics.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any, idx: number): SyllabusTopic => {
    if (typeof item === 'string') {
      return {
        id: `top-${idx + 1}-${Date.now().toString(36)}`,
        name: item.trim(),
        order_index: idx + 1,
      };
    }
    if (item && typeof item === 'object') {
      return {
        id: item.id || `top-${idx + 1}`,
        name: item.name || item.title || `টপিক ${idx + 1}`,
        description: item.description || '',
        order_index: typeof item.order_index === 'number' ? item.order_index : idx + 1,
        estimated_questions: item.estimated_questions || 0,
      };
    }
    return {
      id: `top-${idx + 1}`,
      name: String(item),
      order_index: idx + 1,
    };
  });
};

/**
 * Formats topics array to JSON array of strings for Supabase `subject_posts.topics`
 */
export const formatTopicsForDb = (topics: SyllabusTopic[] | string[]): string[] => {
  if (!Array.isArray(topics)) return [];
  return topics
    .map((t) => (typeof t === 'string' ? t.trim() : t.name?.trim()))
    .filter((n): n is string => Boolean(n && n.length > 0));
};

/**
 * Get all subject posts from local storage (or fallback to initial)
 */
export const getLocalSubjectPosts = (): SubjectPost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBJECT_POSTS));
      return INITIAL_SUBJECT_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBJECT_POSTS));
    return INITIAL_SUBJECT_POSTS;
  } catch (err) {
    console.warn('Error reading subject posts from localStorage:', err);
    return INITIAL_SUBJECT_POSTS;
  }
};

/**
 * Save subject posts to local storage and dispatch real-time event
 */
export const saveLocalSubjectPosts = (posts: SubjectPost[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Error writing subject posts to localStorage:', e);
  }
  window.dispatchEvent(new CustomEvent('subject_posts_updated', { detail: posts }));
};

/**
 * Fetch all Subject Posts from Supabase `subject_posts` table (with resilient local fallback)
 */
export const fetchSubjectPosts = async (): Promise<{
  posts: SubjectPost[];
  source: 'supabase' | 'local';
  error?: string;
}> => {
  const localPosts = getLocalSubjectPosts();
  const client = getSupabaseClient();

  if (!client) {
    return { posts: localPosts, source: 'local' };
  }

  try {
    const { data, error } = await client
      .from('subject_posts')
      .select('*');

    if (!error && Array.isArray(data) && data.length > 0) {
      const formatted: SubjectPost[] = data.map((row: any, idx: number) => {
        const themeConfig = THEME_COLOR_MAP[row.theme_color] || THEME_COLOR_MAP['#10B981'];
        return {
          id: String(row.id),
          name: row.name || row.title || 'অনুরোধকৃত পদ',
          code: row.code || '',
          tagline: row.tagline || '',
          badge: row.badge || (row.name ? `${row.name} • কোড: ${row.code || 'আবশ্যিক'}` : ''),
          subtitle: row.subtitle || row.description || '',
          description: row.description || '',
          theme_color: row.theme_color || themeConfig.hex,
          gradient_class: row.gradient_class || themeConfig.gradient_class,
          gradient: row.gradient || 'from-emerald-600 to-teal-500',
          icon_name: row.icon_name || 'BookOpenCheck',
          status: row.status === 'draft' ? 'draft' : 'active',
          order_index: typeof row.order_index === 'number' ? row.order_index : idx + 1,
          topics: normalizeTopicsFromDb(row.topics),
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        };
      });

      // Sort by order_index ascending
      formatted.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      saveLocalSubjectPosts(formatted);
      return { posts: formatted, source: 'supabase' };
    }

    if (error) {
      console.warn('Supabase fetch subject_posts warning (using local store):', error.message);
    }
  } catch (err: any) {
    console.info('Using local subject posts store:', err?.message || err);
  }

  return { posts: localPosts, source: 'local' };
};

/**
 * Generate clean slug ID from name or custom input
 */
export const generateSlugId = (name: string, customId?: string): string => {
  if (customId && customId.trim()) {
    return (customId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }
  const clean = (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
  return clean ? `${clean}_${Date.now().toString(36).slice(-4)}` : `post_${Date.now()}`;
};

/**
 * Create a new Subject Post directly in Supabase `subject_posts`
 */
export const createSubjectPost = async (
  newPost: Omit<SubjectPost, 'created_at' | 'updated_at'> & { custom_slug?: string }
): Promise<{ success: boolean; post: SubjectPost; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const themeConfig = THEME_COLOR_MAP[newPost.theme_color || '#10B981'] || THEME_COLOR_MAP['#10B981'];

  const generatedId = newPost.id && newPost.id.trim()
    ? newPost.id.trim()
    : generateSlugId(newPost.name, newPost.custom_slug);

  const post: SubjectPost = {
    ...newPost,
    id: generatedId,
    code: newPost.code || '',
    tagline: newPost.tagline || '',
    badge: newPost.badge || `${newPost.name} • কোড: ${newPost.code || 'আবশ্যিক'}`,
    subtitle: newPost.subtitle || newPost.tagline || '',
    description: newPost.description || '',
    theme_color: newPost.theme_color || themeConfig.hex,
    gradient_class: newPost.gradient_class || themeConfig.gradient_class,
    icon_name: newPost.icon_name || 'BookOpenCheck',
    status: newPost.status || 'active',
    order_index: newPost.order_index || currentPosts.length + 1,
    topics: newPost.topics || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Update local cache immediately
  const updatedPosts = [...currentPosts.filter((p) => p.id !== post.id), post];
  saveLocalSubjectPosts(updatedPosts);

  // 2. Direct Supabase insert / upsert into `subject_posts`
  const client = getSupabaseClient();
  if (client) {
    try {
      const dbPayload = {
        id: post.id,
        name: post.name,
        code: post.code,
        tagline: post.tagline,
        badge: post.badge,
        subtitle: post.subtitle,
        description: post.description,
        topics: formatTopicsForDb(post.topics),
        icon_name: post.icon_name,
        theme_color: post.theme_color,
        gradient_class: post.gradient_class,
      };

      const { error } = await client
        .from('subject_posts')
        .upsert([dbPayload], { onConflict: 'id' });

      if (error) {
        console.warn('Supabase subject_posts insert note:', error.message);
      }
    } catch (e: any) {
      console.warn('Could not sync created post to Supabase:', e?.message || e);
    }
  }

  return { success: true, post };
};

/**
 * Update an existing Subject Post directly in Supabase `subject_posts` (eq('id', id))
 */
export const updateSubjectPost = async (
  id: string,
  updates: Partial<SubjectPost>
): Promise<{ success: boolean; post?: SubjectPost; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const index = currentPosts.findIndex((p) => p.id === id);

  const existingPost: SubjectPost = index !== -1
    ? currentPosts[index]
    : {
        id,
        name: updates.name || 'নতুন পদ',
        code: updates.code || '',
        status: 'active',
        topics: [],
      };

  const themeConfig = updates.theme_color
    ? (THEME_COLOR_MAP[updates.theme_color] || THEME_COLOR_MAP['#10B981'])
    : (THEME_COLOR_MAP[existingPost.theme_color || '#10B981'] || THEME_COLOR_MAP['#10B981']);

  const updatedPost: SubjectPost = {
    ...existingPost,
    ...updates,
    theme_color: updates.theme_color || existingPost.theme_color || themeConfig.hex,
    gradient_class: updates.gradient_class || existingPost.gradient_class || themeConfig.gradient_class,
    badge: updates.badge || existingPost.badge || `${updates.name || existingPost.name} • কোড: ${updates.code || existingPost.code || 'আবশ্যিক'}`,
    subtitle: updates.subtitle || existingPost.subtitle || updates.tagline || existingPost.tagline || '',
    updated_at: new Date().toISOString(),
  };

  // 1. Update local cache immediately
  const updatedList = [...currentPosts];
  if (index !== -1) {
    updatedList[index] = updatedPost;
  } else {
    updatedList.push(updatedPost);
  }
  saveLocalSubjectPosts(updatedList);

  // 2. Direct Supabase update / upsert in `subject_posts` table
  const client = getSupabaseClient();
  if (client) {
    try {
      const dbPayload = {
        id: updatedPost.id,
        name: updatedPost.name,
        code: updatedPost.code,
        tagline: updatedPost.tagline || '',
        badge: updatedPost.badge || '',
        subtitle: updatedPost.subtitle || '',
        description: updatedPost.description || '',
        topics: formatTopicsForDb(updatedPost.topics),
        icon_name: updatedPost.icon_name || 'BookOpenCheck',
        theme_color: updatedPost.theme_color || '#10B981',
        gradient_class: updatedPost.gradient_class || themeConfig.gradient_class,
      };

      const { error } = await client
        .from('subject_posts')
        .upsert(dbPayload, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase subject_posts update note:', error.message);
      }
    } catch (e: any) {
      console.warn('Could not sync post update to Supabase:', e?.message || e);
    }
  }

  return { success: true, post: updatedPost };
};

/**
 * Delete a Subject Post directly from Supabase `subject_posts`
 */
export const deleteSubjectPost = async (id: string): Promise<{ success: boolean; error?: string }> => {
  // 1. Remove from local cache
  const currentPosts = getLocalSubjectPosts();
  const updatedList = currentPosts.filter((p) => p.id !== id);
  saveLocalSubjectPosts(updatedList);

  // 2. Delete row from Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('subject_posts').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete note:', error.message);
      }
    } catch (e: any) {
      console.warn('Could not delete post from Supabase:', e?.message || e);
    }
  }

  return { success: true };
};

/**
 * Add a Syllabus Topic to a Post and sync topics array to Supabase
 */
export const addTopicToPost = async (
  postId: string,
  topicData: Omit<SyllabusTopic, 'id' | 'order_index'>
): Promise<{ success: boolean; topic?: SyllabusTopic; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const post = currentPosts.find((p) => p.id === postId);

  if (!post) {
    return { success: false, error: 'পদটি পাওয়া যায়নি।' };
  }

  const newTopic: SyllabusTopic = {
    id: `top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: topicData.name.trim(),
    description: topicData.description?.trim() || '',
    estimated_questions: topicData.estimated_questions || 0,
    order_index: (post.topics?.length || 0) + 1,
    subject_id: postId,
  };

  const updatedTopics = [...(post.topics || []), newTopic];
  return updateSubjectPost(postId, { topics: updatedTopics }).then((res) => ({
    success: res.success,
    topic: newTopic,
    error: res.error,
  }));
};

/**
 * Update a Topic inside a Post and sync to Supabase
 */
export const updateTopicInPost = async (
  postId: string,
  topicId: string,
  updates: Partial<SyllabusTopic>
): Promise<{ success: boolean; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const post = currentPosts.find((p) => p.id === postId);

  if (!post) {
    return { success: false, error: 'পদটি পাওয়া যায়নি।' };
  }

  const updatedTopics = (post.topics || []).map((t) =>
    t.id === topicId ? { ...t, ...updates } : t
  );

  return updateSubjectPost(postId, { topics: updatedTopics }).then((res) => ({
    success: res.success,
    error: res.error,
  }));
};

/**
 * Delete a Topic from a Post and sync to Supabase
 */
export const deleteTopicFromPost = async (
  postId: string,
  topicId: string
): Promise<{ success: boolean; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const post = currentPosts.find((p) => p.id === postId);

  if (!post) {
    return { success: false, error: 'পদটি পাওয়া যায়নি।' };
  }

  const updatedTopics = (post.topics || []).filter((t) => t.id !== topicId);
  return updateSubjectPost(postId, { topics: updatedTopics }).then((res) => ({
    success: res.success,
    error: res.error,
  }));
};

/**
 * Reorder Topics in a Post and sync to Supabase
 */
export const reorderTopicsInPost = async (
  postId: string,
  orderedTopics: SyllabusTopic[]
): Promise<{ success: boolean; error?: string }> => {
  const indexed = orderedTopics.map((t, idx) => ({ ...t, order_index: idx + 1 }));
  return updateSubjectPost(postId, { topics: indexed }).then((res) => ({
    success: res.success,
    error: res.error,
  }));
};

/**
 * Get topics list for a given post name or id
 */
export const getTopicsForPostName = (
  postNameOrId?: string | null,
  postsList?: SubjectPost[]
): string[] => {
  if (!postNameOrId) return [];
  const posts = postsList || getLocalSubjectPosts();
  const target = postNameOrId.trim().toLowerCase();

  const found = posts.find(
    (p) =>
      p.name.toLowerCase() === target ||
      p.id.toLowerCase() === target ||
      p.code.toLowerCase() === target
  );

  if (found && Array.isArray(found.topics)) {
    return found.topics.map((t) => (typeof t === 'string' ? t : t.name));
  }

  return [];
};
