// Central Subject Post & Syllabus Topic Manager for Tamreen Academy
// Fully integrated with Supabase table: `subject_posts`
// Handles CRUD: Create, Read, Update, Delete with realtime sync and resilient fallback.

import { SubjectPost, SyllabusTopic } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY = 'tamreen_subject_posts_v4';

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
    id: 'current_affairs',
    name: 'কারেন্ট অ্যাফেয়ার্স',
    code: '১০১',
    tagline: 'সাম্প্রতিক বাংলাদেশ ও বিশ্বপ্রসঙ্গ',
    badge: 'কারেন্ট অ্যাফেয়ার্স',
    subtitle: 'সাম্প্রতিক খবরাখবর, অর্থনৈতিক সমীক্ষা ও গুরুত্বপূর্ণ ঘটনাপ্রবাহ',
    description: 'সাম্প্রতিক ঘটনাপ্রবাহ, আন্তর্জাতিক চুক্তি, বাজেট, পুরস্কার ও সাম্প্রতিক খবরাখবরের প্রশ্নাবলি।',
    theme_color: '#0284C7',
    gradient_class: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-sky-500/25',
    gradient: 'from-sky-600 to-blue-500',
    icon_name: 'Globe',
    status: 'active',
    order_index: 1,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-ca-1', name: 'সাম্প্রতিক বাংলাদেশ ও অর্থনৈতিক সমীক্ষা', description: 'মেগা প্রজেক্ট, বাজেট, আদমশুমারি ও গুরুত্বপূর্ণ ব্যক্তিত্ব', order_index: 1 },
      { id: 'top-ca-2', name: 'সাম্প্রতিক আন্তর্জাতিক ঘটনাবলি', description: 'বৈশ্বিক সম্মেলন, নির্বাচন, চুক্তি ও চলমান যুদ্ধ/সংকট', order_index: 2 },
      { id: 'top-ca-3', name: 'জলবায়ু, নোবেল ও পুরস্কার', description: 'নোবেল বিজয়ী, আন্তর্জাতিক সম্মাননা ও পরিবেশ সম্মেলন', order_index: 3 },
      { id: 'top-ca-4', name: 'ক্রীড়া ও জাতীয় অর্জন', description: 'বিশ্বকাপ, অলিম্পিক, ক্রিকেট ও জাতীয় খেলাধুলার খবর', order_index: 4 },
    ],
  },
  {
    id: 'bangla_literature',
    name: 'বাংলা সাহিত্য',
    code: '১০২',
    tagline: 'প্রাচীন, মধ্য ও আধুনিক যুগ',
    badge: 'বাংলা সাহিত্য',
    subtitle: 'চর্যাপদ, মঙ্গলকাব্য, রবীন্দ্র-নজরুল ও আধুনিক সাহিত্য',
    description: 'বাংলা সাহিত্যের প্রাচীন, মধ্য ও আধুনিক যুগের প্রখ্যাত রচয়িতাদের সাহিত্যকর্ম ও জীবনী।',
    theme_color: '#F59E0B',
    gradient_class: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 shadow-amber-500/25',
    gradient: 'from-amber-600 to-yellow-500',
    icon_name: 'BookOpen',
    status: 'active',
    order_index: 2,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-blit-1', name: 'প্রাচীন ও মধ্যযুগ', description: 'চর্যাপদ, শ্রীকৃষ্ণকীর্তন, মঙ্গলকাব্য ও বৈষ্ণব পদাবলী', order_index: 1 },
      { id: 'top-blit-2', name: 'আধুনিক যুগের প্রসূতি ও রচয়িতা', description: 'মাইকেল মধুসূদন, বঙ্কিমচন্দ্র, ঈশ্বরচন্দ্র বিদ্যাসাগর', order_index: 2 },
      { id: 'top-blit-3', name: 'রবীন্দ্র ও নজরুল সাহিত্য', description: 'রবীন্দ্রনাথ ঠাকুর ও কাজী নজরুল ইসলামের জীবন ও সাহিত্যকর্ম', order_index: 3 },
      { id: 'top-blit-4', name: 'বিখ্যাত নাটক, উপন্যাস ও পত্রিকা', description: 'মুক্তিযুদ্ধভিত্তিক সাহিত্য, সাময়িকপত্র ও ছদ্মনাম', order_index: 4 },
    ],
  },
  {
    id: 'bangla_language',
    name: 'বাংলা ভাষা ও ব্যাকরণ',
    code: '১০৩',
    tagline: 'ধ্বনিতত্ত্ব, শব্দ, সমাস ও সমার্থক শব্দ',
    badge: 'বাংলা ভাষা ও ব্যাকরণ',
    subtitle: 'ধ্বনিতত্ত্ব, শব্দ গঠন, কারক, সমাস ও ব্যাকরণিক নিয়মাবলি',
    description: 'বাংলা ব্যাকরণের খুঁটিনাটি, প্রয়োগ-অপপ্রয়োগ, বানান ও বাক্য শুদ্ধি সংক্রান্ত প্রস্তুতি।',
    theme_color: '#F43F5E',
    gradient_class: 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-rose-500/25',
    gradient: 'from-rose-600 to-pink-500',
    icon_name: 'Languages',
    status: 'active',
    order_index: 3,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-blang-1', name: 'ধ্বনিতত্ত্ব ও ভাষা', description: 'ধ্বনি, বর্ণ, ণ-ত্ব ও ষ-ত্ব বিধান, উচ্চারণ', order_index: 1 },
      { id: 'top-blang-2', name: 'শব্দ ও সমাস', description: 'শব্দের শ্রেণিবিভাগ, সন্ধি, সমাস ও উপসর্গ-প্রত্যয়', order_index: 2 },
      { id: 'top-blang-3', name: 'কারক, বিভক্তি ও পদ', description: 'কারক নির্ণয়, পদের প্রকারভেদ ও প্রয়োগ-অপপ্রয়োগ', order_index: 3 },
      { id: 'top-blang-4', name: 'শব্দার্থ ও বাগধারা', description: 'এক কথায় প্রকাশ, সমার্থক-বিপরীতার্থক শব্দ ও বাক্য সংক্ষেপণ', order_index: 4 },
    ],
  },
  {
    id: 'english_literature',
    name: 'English Literature',
    code: '১০৪',
    tagline: 'Periods, Authors, Works & Literary Terms',
    badge: 'English Literature',
    subtitle: 'Shakespeare, Romantic Age, Victorian & Modern Literature',
    description: 'Comprehensive English literature guide covering literary periods, famous titles, quotes and authors.',
    theme_color: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    gradient: 'from-purple-600 to-indigo-500',
    icon_name: 'BookMarked',
    status: 'active',
    order_index: 4,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-elit-1', name: 'Old & Middle English to Renaissance', description: 'Beowulf, Chaucer, Shakespeare and Elizabethan drama', order_index: 1 },
      { id: 'top-elit-2', name: 'Romantic & Victorian Era', description: 'Wordsworth, Keats, Shelley, Charles Dickens, Hardy', order_index: 2 },
      { id: 'top-elit-3', name: 'Modern & Post-Modern Literature', description: 'T.S. Eliot, George Orwell, Virginia Woolf, Hemingway', order_index: 3 },
      { id: 'top-elit-4', name: 'Literary Terms, Quotations & Characters', description: 'Metaphor, Elegy, Tragedy, Epic, Soliloquy & famous lines', order_index: 4 },
    ],
  },
  {
    id: 'english_language',
    name: 'English Language',
    code: '১০৫',
    tagline: 'Grammar, Vocabulary, Usage & Correction',
    badge: 'English Language',
    subtitle: 'Parts of Speech, Tense, Voice, Preposition & Idioms',
    description: 'Master English grammar fundamentals, sentence structures, vocabulary and grammatical corrections.',
    theme_color: '#6366F1',
    gradient_class: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
    gradient: 'from-indigo-600 to-purple-500',
    icon_name: 'ALargeSmall',
    status: 'active',
    order_index: 5,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-elang-1', name: 'Parts of Speech & Determiners', description: 'Nouns, Pronouns, Adjectives, Verbs & Adverbs', order_index: 1 },
      { id: 'top-elang-2', name: 'Tense, Voice & Narration', description: 'Right forms of verbs, Subject-Verb agreement, Conditionals', order_index: 2 },
      { id: 'top-elang-3', name: 'Preposition, Idioms & Phrases', description: 'Appropriate prepositions, Group verbs & Phrasal expressions', order_index: 3 },
      { id: 'top-elang-4', name: 'Vocabulary & Sentence Correction', description: 'Synonyms, Antonyms, Spelling & Pinpoint errors', order_index: 4 },
    ],
  },
  {
    id: 'mathematical_reasoning',
    name: 'গাণিতিক যুক্তি',
    code: '১০৬',
    tagline: 'পাটিগণিত, বীজগণিত, জ্যামিতি ও সম্ভাবনা',
    badge: 'গাণিতিক যুক্তি',
    subtitle: 'শতকরা, লাভ-ক্ষতি, অনুপাত, বীজগণিতীয় মান নির্ণয় ও জ্যামিতি',
    description: 'সহজ কৌশলে পাটিগণিত, বীজগণিত ও জ্যামিতির সমস্যা সমাধানের টিপস ও প্র্যাকটিস।',
    theme_color: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    gradient: 'from-purple-600 to-indigo-500',
    icon_name: 'Calculator',
    status: 'active',
    order_index: 6,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-math-1', name: 'পাটিগণিত (সংখ্যা, শতকরা, লাভ-ক্ষতি)', description: 'লসাগু-গসাগু, ঐকিক নিয়ম, অনুপাত, সুদকষা ও চৌবাচ্চা', order_index: 1 },
      { id: 'top-math-2', name: 'বীজগণিত (মান নির্ণয়, সূচক ও লগ)', description: 'বীজগণিতীয় সূত্রাবলি, উৎপাদক, সেট ও অসমতা', order_index: 2 },
      { id: 'top-math-3', name: 'জ্যামিতি ও পরিমিতি', description: 'রেখা, কোণ, ত্রিভুজ, বৃত্ত, চতুর্ভুজ ও ক্ষেত্রফল', order_index: 3 },
      { id: 'top-math-4', name: 'বিন্যাস, সমাবেশ ও সম্ভাবনা', description: 'পরিসংখ্যান, সমাবেশ, বিন্যাস ও সম্ভাবনার হিসাব', order_index: 4 },
    ],
  },
  {
    id: 'general_science',
    name: 'সাধারণ বিজ্ঞান',
    code: '১০৭',
    tagline: 'ভৌত, জীববিজ্ঞান ও দৈনন্দিন বিজ্ঞান',
    badge: 'সাধারণ বিজ্ঞান',
    subtitle: 'পদার্থ, রসায়ন, জীববিজ্ঞান, চিকিৎসা ও খাদ্যবিজ্ঞান',
    description: 'দৈনন্দিন জীবনের বিজ্ঞান, পদার্থ, রসায়ন, জীববিজ্ঞান ও পুষ্টিবিদ্যার গুরুত্বপূর্ণ প্রশ্নোত্তর।',
    theme_color: '#10B981',
    gradient_class: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/25',
    gradient: 'from-emerald-600 to-teal-500',
    icon_name: 'Atom',
    status: 'active',
    order_index: 7,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-sci-1', name: 'ভৌত বিজ্ঞান ও পদার্থ', description: 'আলো, শব্দ, তাপ, বিদ্যুৎ, চুম্বক ও বলবিদ্যা', order_index: 1 },
      { id: 'top-sci-2', name: 'রসায়ন ও আধুনিক বিজ্ঞান', description: 'পর্যায় সারণী, এসিড-ক্ষার, বায়ুমণ্ডল ও পারমাণবিক শক্তি', order_index: 2 },
      { id: 'top-sci-3', name: 'জীববিজ্ঞান ও উদ্ভিদবিজ্ঞান', description: 'কোষ, সালোকসংশ্লেষণ, হরমোন ও রক্ত সংবহনতন্ত্র', order_index: 3 },
      { id: 'top-sci-4', name: 'চিকিৎসাবিজ্ঞান, খাদ্য ও পুষ্টি', description: 'ভিটামিন, রোগব্যাধি, টিকাদান ও স্বাস্থ্য সচেতনতা', order_index: 4 },
    ],
  },
  {
    id: 'bangladesh_affairs',
    name: 'বাংলাদেশ বিষয়াবলি',
    code: '১০৮',
    tagline: 'ইতিহাস, সংস্কৃতি, সংবিধান ও অর্থনীতি',
    badge: 'বাংলাদেশ বিষয়াবলি',
    subtitle: 'মুক্তিযুদ্ধ, সংবিধান, ইতিহাস, অর্থনীতি ও ভূ-প্রকৃতি',
    description: 'প্রাচীনকাল থেকে বাংলাদেশের স্বাধীনতা সংগ্রাম, সংবিধান, সরকার ব্যবস্থা ও অর্থনীতির বিস্তারিত।',
    theme_color: '#10B981',
    gradient_class: 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-800 shadow-emerald-600/25',
    gradient: 'from-emerald-600 to-green-600',
    icon_name: 'Flag',
    status: 'active',
    order_index: 8,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-bd-1', name: 'প্রাচীনকাল থেকে ভাষা আন্দোলন ও মুক্তিযুদ্ধ', description: '১৯৫২, ৬৬, ৬৯, ৭১-এর মুক্তিযুদ্ধ ও ৭ই মার্চের ভাষণ', order_index: 1 },
      { id: 'top-bd-2', name: 'বাংলাদেশের সংবিধান ও সরকার ব্যবস্থা', description: 'সংবিধানের অনুচ্ছেদ, সংশোধন, প্রশাসন ও বিচার বিভাগ', order_index: 2 },
      { id: 'top-bd-3', name: 'অর্থনীতি, সম্পদ ও বাজেট', description: 'কৃষি, শিল্প, মেগা প্রজেক্ট, রপ্তানি ও জিডিপি', order_index: 3 },
      { id: 'top-bd-4', name: 'ভৌগোলিক অবস্থান, পরিবেশ ও উপজাতি', description: 'নদ-নদী, সীমানা, পাহাড়ি জনগোষ্ঠী ও জাতীয় বিষয়াবলি', order_index: 4 },
    ],
  },
  {
    id: 'international_affairs',
    name: 'আন্তর্জাতিক বিষয়াবলি',
    code: '১০৯',
    tagline: 'বৈশ্বিক ইতিহাস, রাজনীতি, সংস্থা ও আন্তর্জাতিক পরিবেশ',
    badge: 'আন্তর্জাতিক বিষয়াবলি',
    subtitle: 'জাতিসংঘ, আঞ্চলিক জোট, বৈশ্বিক নিরাপত্তা ও চুক্তি',
    description: 'বিশ্ব রাজনীতি, ভূ-রাজনৈতিক সংকট, আন্তর্জাতিক সংস্থাসমূহ, অর্থনৈতিক জোট ও বৈশ্বিক পরিবেশ।',
    theme_color: '#F43F5E',
    gradient_class: 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-700 shadow-rose-500/25',
    gradient: 'from-rose-600 to-pink-500',
    icon_name: 'Globe2',
    status: 'active',
    order_index: 9,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-int-1', name: 'জাতিসংঘ ও আন্তর্জাতিক সংস্থাসমূহ', description: 'UN, WB, IMF, WHO, UNESCO, WTO ইত্যাদি', order_index: 1 },
      { id: 'top-int-2', name: 'আঞ্চলিক ও অর্থনৈতিক জোট', description: 'SAARC, ASEAN, EU, NATO, BRICS, BIMSTEC', order_index: 2 },
      { id: 'top-int-3', name: 'আন্তর্জাতিক পরিবেশ, নিরাপত্তা ও চুক্তি', description: 'জলবায়ু চুক্তি, পারমাণবিক চুক্তি ও প্রোটোকল', order_index: 3 },
      { id: 'top-int-4', name: 'বিশ্ব ইতিহাস ও সাম্প্রতিক ভূ-রাজনীতি', description: 'বিশ্বযুদ্ধ, বিখ্যাত প্রণালী, সীমারেখা ও রাজধানী', order_index: 4 },
    ],
  },
  {
    id: 'geography_disaster',
    name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা',
    code: '১১০',
    tagline: 'জলবায়ু, মানচিত্র, প্রাকৃতিক পরিবেশ ও দুর্যোগ',
    badge: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা',
    subtitle: 'বাংলাদেশ ও বিশ্বের ভূগোল, জলবায়ু পরিবর্তন ও প্রাকৃতিক দুর্যোগ',
    description: 'ভৌগোলিক অবস্থান, ভূমিরূপ, আবহাওয়া, জলবায়ু পরিবর্তন ও দুর্যোগ মোকাবেলা কৌশল।',
    theme_color: '#0284C7',
    gradient_class: 'bg-gradient-to-br from-sky-500 via-cyan-600 to-blue-700 shadow-sky-500/25',
    gradient: 'from-sky-600 to-cyan-500',
    icon_name: 'Compass',
    status: 'active',
    order_index: 10,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-geo-1', name: 'বাংলাদেশ ও বিশ্বের ভৌগোলিক অবস্থান', description: 'অক্ষরেখা, দ্রাঘিমারেখা, ভূ-প্রকৃতি ও অঞ্চলসমূহ', order_index: 1 },
      { id: 'top-geo-2', name: 'জলবায়ু পরিবর্তন ও বায়ুমণ্ডল', description: 'গ্রিনহাউস প্রভাব, গ্লোবাল ওয়ার্মিং ও আবহাওয়ার উপাদান', order_index: 2 },
      { id: 'top-geo-3', name: 'প্রাকৃতিক দুর্যোগ ও ঝুঁকি হ্রাস', description: 'ঘূর্ণিঝড়, বন্যা, ভূমিকম্প, সুনামি ও আগ্নেয়গিরি', order_index: 3 },
      { id: 'top-geo-4', name: 'দুর্যোগ ব্যবস্থাপনা নীতি ও সম্পদ', description: 'দুর্যোগ প্রশমন, পূর্বপ্রস্তুতি ও প্রাকৃতিক সম্পদ', order_index: 4 },
    ],
  },
  {
    id: 'ethics_good_governance',
    name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন',
    code: '১১১',
    tagline: 'সততা, নাগরিক কর্তব্য, আইনের শাসন ও ই-গভর্নেন্স',
    badge: 'নৈতিকতা, মূল্যবোধ ও সুশাসন',
    subtitle: 'নৈতিক মূল্যবোধের ধারণা, সুশাসনের উপাদান ও নাগরিক দায়িত্ব',
    description: 'ব্যক্তিগত ও সামাজিক নৈতিকতা, আইনের শাসন প্রতিষ্ঠা, দুর্নীতি প্রতিরোধ ও সুশাসনের স্তম্ভ।',
    theme_color: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 shadow-purple-600/25',
    gradient: 'from-purple-600 to-indigo-600',
    icon_name: 'Scale',
    status: 'active',
    order_index: 11,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-eth-1', name: 'মূল্যবোধের ধারণা ও উপাদান', description: 'সামাজিক, সাংস্কৃতিক ও নৈতিক মূল্যবোধের বৈশিষ্ট্য', order_index: 1 },
      { id: 'top-eth-2', name: 'সুশাসনের ধারণা ও প্রধান স্তম্ভ', description: 'স্বচ্ছতা, জবাবদিহিতা, অংশগ্রহণ ও আইনের শাসন', order_index: 2 },
      { id: 'top-eth-3', name: 'ই-গভর্নেন্স ও তথ্য অধিকার', description: 'তথ্য অধিকার আইন, দুর্নীতি দমন ও ই-সেবা', order_index: 3 },
      { id: 'top-eth-4', name: 'নাগরিক দায়িত্ব ও সামাজিক ন্যায়বিচার', description: 'অধিকার ও কর্তব্য, মানবসেবা ও মানবিক গুণাবলি', order_index: 4 },
    ],
  },
  {
    id: 'ict_computer',
    name: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
    code: '১১২',
    tagline: 'হার্ডওয়্যার, সফটওয়্যার, নেটওয়ার্ক ও সাইবার নিরাপত্তা',
    badge: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
    subtitle: 'কম্পিউটার অঙ্গসংস্থান, ইন্টারনেট, ডাটাবেজ ও ক্লাউড কম্পিউটিং',
    description: 'কম্পিউটার সংগঠন, পেরিফেরালস, অপারেটিং সিস্টেম, ইন্টারনেট, সাইবার নিরাপত্তা ও মোবাইল প্রযুক্তি।',
    theme_color: '#8B5CF6',
    gradient_class: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 shadow-purple-600/25',
    gradient: 'from-purple-600 to-indigo-600',
    icon_name: 'Monitor',
    status: 'active',
    order_index: 12,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-ict-1', name: 'কম্পিউটার হার্ডওয়্যার ও অঙ্গসংস্থান', description: 'ইনপুট/আউটপুট ডিভাইস, সিপিইউ, মেমোরি ও বাস', order_index: 1 },
      { id: 'top-ict-2', name: 'সফটওয়্যার, ওএস ও ডাটাবেজ', description: 'অপারেটিং সিস্টেম, প্রোগ্রামিং ভাষা, সংখ্যা পদ্ধতি ও SQL', order_index: 2 },
      { id: 'top-ict-3', name: 'ইন্টারনেট, নেটওয়ার্ক ও ক্লাউড', description: 'IP ঠিকানা, রাউটার, আইওটি, ক্লাউড কম্পিউটিং ও সোশ্যাল মিডিয়া', order_index: 3 },
      { id: 'top-ict-4', name: 'সাইবার নিরাপত্তা ও ই-কমার্স', description: 'ফায়ারওয়াল, ম্যালওয়্যার, ক্রিপ্টোকারেন্সি ও ডিজিটাল নিরাপত্তা', order_index: 4 },
    ],
  },
  {
    id: 'mental_ability',
    name: 'মানসিক দক্ষতা',
    code: '১১৩',
    tagline: 'ভাষাগত যুক্তি, সমীকরণ, কোডিং ও স্থানিক সম্পর্ক',
    badge: 'মানসিক দক্ষতা',
    subtitle: 'যৌক্তিক বিচার, চিত্র ধাঁধা, দিক নির্ণয় ও গাণিতিক সিরিজ',
    description: 'আইকিউ ও মানসিক দক্ষতার সমস্যা, কোডিং-ডিকোডিং, পাজল, দিক নির্ণয় ও যৌক্তিক বিশ্লেষণ।',
    theme_color: '#F59E0B',
    gradient_class: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 shadow-amber-500/25',
    gradient: 'from-amber-600 to-orange-500',
    icon_name: 'Brain',
    status: 'active',
    order_index: 13,
    created_at: new Date().toISOString(),
    topics: [
      { id: 'top-men-1', name: 'ভাষাগত যৌক্তিক বিচার ও বানান', description: 'শব্দ সম্পর্ক, অমিল শব্দ নির্ণয় ও সঠিক রূপ', order_index: 1 },
      { id: 'top-men-2', name: 'সংখ্যার সিরিজ ও গাণিতিক ধাঁধা', description: 'ধারাবাহিক সংখ্যা, লুপ্ত সংখ্যা ও গাণিতিক প্যাটার্ন', order_index: 2 },
      { id: 'top-men-3', name: 'দিক নির্ণয়, সময় ও অবস্থান', description: 'মানচিত্র দিক, ঘড়ির কোণ, ক্যালেন্ডার ও স্থানাঙ্ক', order_index: 3 },
      { id: 'top-men-4', name: 'কোডিং-ডিকোডিং ও চিত্র বিশ্লেষণ', description: 'জ্যামিতিক চিত্র গণনা, আয়না প্রতিবিম্ব ও সম্পর্ক নির্ণয়', order_index: 4 },
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
