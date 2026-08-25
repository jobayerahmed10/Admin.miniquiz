// Central Subject Post & Syllabus Topic Manager for Tamreen Academy
// Manages Posts (যেমন: আরবি প্রভাষক, সহকারী মৌলভী, সহকারী মৌলভী কারী, ইবতেদায়ী মৌলভী, ইবতেদায়ী কারী, জেনারেল ইত্যাদি)
// and their Syllabus Topics. Supports Supabase persistence with instant LocalStorage sync.

import { SubjectPost, SyllabusTopic } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY = 'tamreen_subject_posts_v1';

export const INITIAL_SUBJECT_POSTS: SubjectPost[] = [
  {
    id: 'post-arb-lec',
    name: 'আরবি প্রভাষক',
    code: 'ARB-LEC',
    tagline: '১৮তম ও ১৯তম শিক্ষক নিবন্ধন ও মাদ্রাসা প্রভাষক প্রস্তুতি',
    description: 'মাদ্রাসা আলিয়া ও ফাজিল-কামিল পর্যায়ের আরবি প্রভাষক পদের পূর্ণাঙ্গ বিষয়ভিত্তিক প্রস্তুতি ও সিলেবাস।',
    theme_color: 'emerald',
    gradient: 'from-emerald-600 to-teal-500',
    icon_name: 'Languages',
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
    id: 'post-asst-moulvi',
    name: 'সহকারী মৌলভী',
    code: 'ASST-MOU',
    tagline: 'দাখিল ও আলিম স্তরের সহকারী মৌলভী নিয়োগ প্রস্তুতি',
    description: 'দাখিল ও আলিম মাদ্রাসার শিক্ষক নিয়োগে সহকারী মৌলভী পদের স্পেশাল সিলেবাস ও মডেল টেস্ট।',
    theme_color: 'teal',
    gradient: 'from-teal-600 to-cyan-500',
    icon_name: 'BookOpen',
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
    id: 'post-asst-qari',
    name: 'সহকারী মৌলভী (কারী)',
    code: 'ASST-QAR',
    tagline: 'মাদ্রাসার সহকারী মৌলভী ও কারী শিক্ষক নিয়োগ স্পেশাল',
    description: 'কেরাত ও তাজবিদ স্পেশাল সহকারী মৌলভী কারী পদের সম্পূর্ণ সিলেবাস ও প্রশ্নব্যাংক।',
    theme_color: 'amber',
    gradient: 'from-amber-600 to-yellow-500',
    icon_name: 'Award',
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
    id: 'post-ebt-moulvi',
    name: 'ইবতেদায়ী মৌলভী',
    code: 'EBT-MOU',
    tagline: 'প্রাথমিক ও ইবতেদায়ী মাদ্রাসা মৌলভী প্রস্তুতি',
    description: 'ইবতেদায়ী মাদ্রাসার শিক্ষার্থীদের পাঠদানের জন্য প্রয়োজনীয় মৌলভী শিক্ষক নিয়োগের সিলেবাস।',
    theme_color: 'indigo',
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
    id: 'post-ebt-qari',
    name: 'ইবতেদায়ী কারী',
    code: 'EBT-QAR',
    tagline: 'ইবতেদায়ী কারী ও কুরআন শিক্ষক নিয়োগ প্রস্তুতি',
    description: 'ছোটদের বিশুদ্ধ কুরআন পাঠদান ও তিলাওয়াতের জন্য ইবতেদায়ী কারী পদের বিষয়ভিত্তিক প্রস্তুতি।',
    theme_color: 'rose',
    gradient: 'from-rose-600 to-pink-500',
    icon_name: 'Sparkles',
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
    id: 'post-asst-teacher',
    name: 'সহকারী শিক্ষক (প্রাইমারি ও হাইস্কুল)',
    code: 'ASST-TEA',
    tagline: 'প্রাইমারি সহকারী শিক্ষক ও এনটিআরসিএ হাইস্কুল লেভেল',
    description: 'প্রাইমারি শিক্ষক নিয়োগ ও ১৮তম-১৯তম শিক্ষক নিবন্ধনে সহকারী শিক্ষক পদের পূর্ণাঙ্গ বিষয়ভিত্তিক প্রস্তুতি।',
    theme_color: 'purple',
    gradient: 'from-purple-600 to-indigo-500',
    icon_name: 'Briefcase',
    status: 'active',
    order_index: 6,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-tea-1', name: 'বাংলা সাহিত্য ও ব্যাকরণ', description: 'ধ্বনি, বর্ণ, সমাস, কারক, বাক্য ও বাংলা সাহিত্যের গুরুত্বপূর্ণ কবি-সাহিত্যিক', order_index: 1 },
      { id: 'top-tea-2', name: 'English Grammar & Vocabulary', description: 'Tense, Parts of Speech, Prepositions, Voice, Synonyms & Antonyms', order_index: 2 },
      { id: 'top-tea-3', name: 'গণিত ও মানসিক দক্ষতা', description: 'পাটিগণিত (লাভ-ক্ষতি, শতকরা, সুদকষা), বীজগণিত ও জ্যামিতি', order_index: 3 },
      { id: 'top-tea-4', name: 'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী', description: 'মুক্তিযুদ্ধ, সংবিধান, ইতিহাস, ভৌগোলিক সীমানা ও সাম্প্রতিক বিশ্ব', order_index: 4 },
      { id: 'top-tea-5', name: 'সাধারণ বিজ্ঞান ও তথ্যপ্রযুক্তি', description: 'দৈনন্দিন বিজ্ঞান, কম্পিউটার বেসিক ও মোবাইল প্রযুক্তি', order_index: 5 },
    ],
  },
  {
    id: 'post-bcs-general',
    name: 'বিসিএস ও ১০ম-২০তম গ্রেড জেনারেল',
    code: 'BCS-GEN',
    tagline: 'বিসিএস প্রিলিমিনারি ও সকল গ্রেডের সাধারণ নিয়োগ প্রস্তুতি',
    description: 'বিসিএস, পিএসসি নন-ক্যাডার, মন্ত্রণালয় ও অধিদপ্তর নিয়োগ পরীক্ষার পূর্ণাঙ্গ বিষয়ভিত্তিক প্রস্তুতি।',
    theme_color: 'blue',
    gradient: 'from-blue-600 to-indigo-500',
    icon_name: 'Award',
    status: 'active',
    order_index: 7,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-gen-1', name: 'বাংলা ভাষা ও সাহিত্য (BCS)', description: 'চর্যাপদ থেকে আধুনিক যুগ, বানান শুদ্ধি, বাগধারা ও অনুবাদ', order_index: 1 },
      { id: 'top-gen-2', name: 'English Language & Literature', description: 'Clauses, Idioms, Literary Works & Authors', order_index: 2 },
      { id: 'top-gen-3', name: 'গাণিতিক যুক্তি ও মানসিক দক্ষতা', description: 'সংখ্যার ধারণা, সেট, লগারিদম, বিন্যাস-সমাবেশ ও লজিকাল রিজনিং', order_index: 3 },
      { id: 'top-gen-4', name: 'বাংলাদেশ বিষয়াবলী (বিস্তারিত)', description: 'প্রাচীন কাল থেকে আধুনিক বাংলাদেশ, অর্থনীতি, শিল্প ও বাজেট', order_index: 4 },
      { id: 'top-gen-5', name: 'আন্তর্জাতিক বিষয়াবলী ও ভূগোল', description: 'আন্তর্জাতিক নিরাপত্তা, সংস্থা, পরিবেশ পরিবর্তন ও দুর্যোগ ব্যবস্থাপনা', order_index: 5 },
      { id: 'top-gen-6', name: 'বিজ্ঞান, কম্পিউটার ও সুশাসন', description: 'ভৌত বিজ্ঞান, তথ্যপ্রযুক্তি ও নৈতিকতা-মূল্যবোধ', order_index: 6 },
    ],
  },
];

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
 * Fetch all Subject Posts (attempts Supabase table, falls back gracefully)
 */
export const fetchSubjectPosts = async (): Promise<{ posts: SubjectPost[]; source: 'supabase' | 'local' }> => {
  const localPosts = getLocalSubjectPosts();
  const client = getSupabaseClient();

  if (!client) {
    return { posts: localPosts, source: 'local' };
  }

  try {
    const { data, error } = await client
      .from('subject_posts')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const formatted: SubjectPost[] = data.map((row: any) => ({
        id: String(row.id),
        name: row.name || row.title || 'অনুরোধকৃত পদ',
        code: row.code || 'CODE',
        tagline: row.tagline || '',
        description: row.description || '',
        theme_color: row.theme_color || 'emerald',
        gradient: row.gradient || 'from-emerald-600 to-teal-500',
        icon_name: row.icon_name || 'BookOpen',
        status: row.status === 'draft' ? 'draft' : 'active',
        order_index: typeof row.order_index === 'number' ? row.order_index : 0,
        topics: Array.isArray(row.topics)
          ? row.topics
          : typeof row.topics === 'string'
          ? JSON.parse(row.topics || '[]')
          : [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      saveLocalSubjectPosts(formatted);
      return { posts: formatted, source: 'supabase' };
    }
  } catch (err) {
    console.info('Using local subject posts store:', err);
  }

  return { posts: localPosts, source: 'local' };
};

/**
 * Create a new Subject Post
 */
export const createSubjectPost = async (
  newPost: Omit<SubjectPost, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; post: SubjectPost; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const post: SubjectPost = {
    ...newPost,
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedPosts = [...currentPosts, post];
  saveLocalSubjectPosts(updatedPosts);

  // Sync to Supabase if table exists
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('subject_posts').insert([
        {
          id: post.id,
          name: post.name,
          code: post.code,
          tagline: post.tagline,
          description: post.description,
          theme_color: post.theme_color,
          gradient: post.gradient,
          icon_name: post.icon_name,
          status: post.status,
          order_index: post.order_index,
          topics: post.topics,
          created_at: post.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Could not sync created post to Supabase:', e);
    }
  }

  return { success: true, post };
};

/**
 * Update an existing Subject Post
 */
export const updateSubjectPost = async (
  id: string,
  updates: Partial<SubjectPost>
): Promise<{ success: boolean; post?: SubjectPost; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const index = currentPosts.findIndex((p) => p.id === id);

  if (index === -1) {
    return { success: false, error: 'পদটি পাওয়া যায়নি।' };
  }

  const updatedPost: SubjectPost = {
    ...currentPosts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const updatedList = [...currentPosts];
  updatedList[index] = updatedPost;
  saveLocalSubjectPosts(updatedList);

  // Sync to Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('subject_posts')
        .update({
          name: updatedPost.name,
          code: updatedPost.code,
          tagline: updatedPost.tagline,
          description: updatedPost.description,
          theme_color: updatedPost.theme_color,
          gradient: updatedPost.gradient,
          icon_name: updatedPost.icon_name,
          status: updatedPost.status,
          order_index: updatedPost.order_index,
          topics: updatedPost.topics,
          updated_at: updatedPost.updated_at,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Could not sync post update to Supabase:', e);
    }
  }

  return { success: true, post: updatedPost };
};

/**
 * Delete a Subject Post
 */
export const deleteSubjectPost = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const currentPosts = getLocalSubjectPosts();
  const updatedList = currentPosts.filter((p) => p.id !== id);
  saveLocalSubjectPosts(updatedList);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('subject_posts').delete().eq('id', id);
    } catch (e) {
      console.warn('Could not delete post from Supabase:', e);
    }
  }

  return { success: true };
};

/**
 * Add a Syllabus Topic to a Post
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
 * Update a Topic inside a Post
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
 * Delete a Topic from a Post
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
 * Reorder Topics in a Post
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
    (p) => p.name.toLowerCase() === target || p.id === postNameOrId || p.code.toLowerCase() === target
  );

  if (found && Array.isArray(found.topics)) {
    return found.topics.map((t) => t.name);
  }

  return [];
};
