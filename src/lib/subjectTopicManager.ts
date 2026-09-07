import { getSupabaseClient } from './supabase';
import { Question } from '../types';

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface TopicItem {
  id: string;
  subject_id: string;
  parent_id?: string | null;
  title: string;
  code: string;
  created_at?: string;
}

const SUBJECTS_CACHE_KEY = 'miniquiz_subjects_v11';
const TOPICS_CACHE_KEY = 'miniquiz_topics_v11';

/**
 * Standard Presets for Subjects (Official Examination Subjects)
 */
export const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: 'sub_ca', name: 'কারেন্ট অ্যাফেয়ার্স', code: 'CA' },
  { id: 'sub_bangla_lit', name: 'বাংলা সাহিত্য', code: 'BAN-LIT' },
  { id: 'sub_bangla_lang', name: 'বাংলা ভাষা ও ব্যাকরণ', code: 'BNG-LNG' },
  { id: 'sub_eng_grm', name: 'English Grammar', code: 'ENG-GRM' },
  { id: 'sub_eng_lit', name: 'English Literature', code: 'ENG-LIT' },
  { id: 'sub_math', name: 'গাণিতিক যুক্তি', code: 'MATH' },
  { id: 'sub_science', name: 'সাধারণ বিজ্ঞান', code: 'SCIENCE' },
  { id: 'sub_gk_bd', name: 'বাংলাদেশ বিষয়াবলি', code: 'BD' },
  { id: 'sub_gk_int', name: 'আন্তর্জাতিক বিষয়াবলি', code: 'INT' },
  { id: 'sub_geo', name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', code: 'GEO' },
  { id: 'sub_ethics', name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', code: 'ETHICS' },
  { id: 'sub_cs_it', name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', code: 'CS-IT' },
  { id: 'sub_mental', name: 'মানসিক দক্ষতা', code: 'MENTAL' },
];

/**
 * Standard Presets for Main Topics & Sub-Topics Across ALL Subjects
 */
export const DEFAULT_TOPICS: TopicItem[] = [
  // ==========================================
  // 1. কারেন্ট অ্যাফেয়ার্স (CA)
  // ==========================================
  { id: 'top_ca_01', subject_id: 'sub_ca', parent_id: null, title: 'সাম্প্রতিক বাংলাদেশ ও অর্থনৈতিক সমীক্ষা', code: 'CA-01' },
  { id: 'subtop_ca_01_01', subject_id: 'sub_ca', parent_id: 'top_ca_01', title: 'মেগা প্রজেক্ট, বাজেট ও অর্থনৈতিক সমীক্ষা', code: 'CA-01-01' },
  { id: 'subtop_ca_01_02', subject_id: 'sub_ca', parent_id: 'top_ca_01', title: 'আদমশুমারি ও জাতীয় পরিসংখ্যান', code: 'CA-01-02' },
  { id: 'subtop_ca_01_03', subject_id: 'sub_ca', parent_id: 'top_ca_01', title: 'সাম্প্রতিক ব্যক্তিত্ব, পদবী ও রাষ্ট্রীয় নিয়োগ', code: 'CA-01-03' },

  { id: 'top_ca_02', subject_id: 'sub_ca', parent_id: null, title: 'সাম্প্রতিক আন্তর্জাতিক ঘটনাবলি', code: 'CA-02' },
  { id: 'subtop_ca_02_01', subject_id: 'sub_ca', parent_id: 'top_ca_02', title: 'বৈশ্বিক সম্মেলন, চুক্তি ও দ্বিপাক্ষিক সম্পর্ক', code: 'CA-02-01' },
  { id: 'subtop_ca_02_02', subject_id: 'sub_ca', parent_id: 'top_ca_02', title: 'আন্তর্জাতিক নির্বাচন, সরকার পরিবর্তন ও চলমান যুদ্ধ/সংকট', code: 'CA-02-02' },

  { id: 'top_ca_03', subject_id: 'sub_ca', parent_id: null, title: 'পরিবেশ, নোবেল ও আন্তর্জাতিক পুরস্কার', code: 'CA-03' },
  { id: 'subtop_ca_03_01', subject_id: 'sub_ca', parent_id: 'top_ca_03', title: 'নোবেল পুরস্কার ও আন্তর্জাতিক সম্মাননা', code: 'CA-03-01' },
  { id: 'subtop_ca_03_02', subject_id: 'sub_ca', parent_id: 'top_ca_03', title: 'কপ সম্মেলন, জলবায়ু চুক্তি ও পরিবেশ রিপোর্ট', code: 'CA-03-02' },

  { id: 'top_ca_04', subject_id: 'sub_ca', parent_id: null, title: 'ক্রীড়া ও জাতীয়-আন্তর্জাতিক অর্জন', code: 'CA-04' },
  { id: 'subtop_ca_04_01', subject_id: 'sub_ca', parent_id: 'top_ca_04', title: 'বিশ্বকাপ, অলিম্পিক ও আন্তর্জাতিক ক্রিকেট-ফুটবল', code: 'CA-04-01' },
  { id: 'subtop_ca_04_02', subject_id: 'sub_ca', parent_id: 'top_ca_04', title: 'বাংলাদেশের ক্রীড়া সাফল্য ও জাতীয় পুরস্কার', code: 'CA-04-02' },

  // ==========================================
  // 2. বাংলা সাহিত্য (BAN-LIT)
  // ==========================================
  // Main Topic 01: বাংলা সাহিত্যের প্রাচীন যুগ (BAN-LIT-01)
  { id: 'top_bangla_lit_01', subject_id: 'sub_bangla_lit', parent_id: null, title: 'বাংলা সাহিত্যের প্রাচীন যুগ', code: 'BAN-LIT-01' },
  { id: 'subtop_bangla_lit_01_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_01', title: 'চর্যাপদ', code: 'BAN-LIT-01-01' },
  { id: 'subtop_bangla_lit_01_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_01', title: 'চর্যাপদের পদকর্তা', code: 'BAN-LIT-01-02' },
  { id: 'subtop_bangla_lit_01_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_01', title: 'অন্যান্য', code: 'BAN-LIT-01-03' },

  // Main Topic 02: বাংলা সাহিত্যের মধ্যযুগ (BAN-LIT-02)
  { id: 'top_bangla_lit_02', subject_id: 'sub_bangla_lit', parent_id: null, title: 'বাংলা সাহিত্যের মধ্যযুগ', code: 'BAN-LIT-02' },
  { id: 'subtop_bangla_lit_02_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'শ্রীকৃষ্ণকীর্তন কাব্য', code: 'BAN-LIT-02-01' },
  { id: 'subtop_bangla_lit_02_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'মঙ্গলকাব্য', code: 'BAN-LIT-02-02' },
  { id: 'subtop_bangla_lit_02_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'বৈষ্ণব পদাবলি', code: 'BAN-LIT-02-03' },
  { id: 'subtop_bangla_lit_02_04', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'নাথ-মর্সিয়া- লোক সাহিত্য - গীতি', code: 'BAN-LIT-02-04' },
  { id: 'subtop_bangla_lit_02_05', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'আরকান ও অনুবাদ সাহিত্য', code: 'BAN-LIT-02-05' },
  { id: 'subtop_bangla_lit_02_06', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_02', title: 'যুগসন্ধিক্ষণ ১৭৬০-১৮৬০', code: 'BAN-LIT-02-06' },

  // Main Topic 03: বাংলা সাহিত্যের আধুনিক যুগ (BAN-LIT-03)
  { id: 'top_bangla_lit_03', subject_id: 'sub_bangla_lit', parent_id: null, title: 'বাংলা সাহিত্যের আধুনিক যুগ', code: 'BAN-LIT-03' },
  { id: 'subtop_bangla_lit_03_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'বাংলা কাব্য সাহিত্য', code: 'BAN-LIT-03-01' },
  { id: 'subtop_bangla_lit_03_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'পত্রিকা-সাময়িকী ও সম্পাদক', code: 'BAN-LIT-03-02' },
  { id: 'subtop_bangla_lit_03_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'হুমায়ুন আজাদ', code: 'BAN-LIT-03-03' },
  { id: 'subtop_bangla_lit_03_04', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'বাংলা গদ্য সাহিত্যের বিকাশ', code: 'BAN-LIT-03-04' },
  { id: 'subtop_bangla_lit_03_05', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'শরৎচন্দ্র চট্টোপাধ্যায়', code: 'BAN-LIT-03-05' },
  { id: 'subtop_bangla_lit_03_06', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'প্রমথ চৌধুরী', code: 'BAN-LIT-03-06' },
  { id: 'subtop_bangla_lit_03_07', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'মানিক বন্দ্যোপাধ্যায়', code: 'BAN-LIT-03-07' },
  { id: 'subtop_bangla_lit_03_08', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'জহির রায়হান', code: 'BAN-LIT-03-08' },
  { id: 'subtop_bangla_lit_03_09', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'শামসুর রাহমান', code: 'BAN-LIT-03-09' },
  { id: 'subtop_bangla_lit_03_10', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'হুমায়ূন আহমেদ', code: 'BAN-LIT-03-10' },
  { id: 'subtop_bangla_lit_03_11', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'পশ্চিমবঙ্গ এর গুরুত্বপূর্ণ লেখক', code: 'BAN-LIT-03-11' },
  { id: 'subtop_bangla_lit_03_12', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'সাহিত্যিক ছদ্মনাম, উপাধি', code: 'BAN-LIT-03-12' },
  { id: 'subtop_bangla_lit_03_13', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'ভাষা আন্দোলন ও মুক্তিযুদ্ধভিত্তিক সাহিত্য', code: 'BAN-LIT-03-13' },
  { id: 'subtop_bangla_lit_03_14', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'বাংলা সাহিত্যের চরিত্র, উক্তি ও সংলাপ', code: 'BAN-LIT-03-14' },
  { id: 'subtop_bangla_lit_03_15', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_03', title: 'আধুনিক যুগের অন্যান্য গুরুত্বপূর্ণ লেখক', code: 'BAN-LIT-03-15' },

  // Main Topic 04: পিএসসির নির্ধারিত ১১ জন সাহিত্যিক (BAN-LIT-04)
  { id: 'top_bangla_lit_04', subject_id: 'sub_bangla_lit', parent_id: null, title: 'পিএসসির নির্ধারিত ১১ জন সাহিত্যিক', code: 'BAN-LIT-04' },
  { id: 'subtop_bangla_lit_04_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'ফাররুখ আহমদ', code: 'BAN-LIT-04-01' },
  { id: 'subtop_bangla_lit_04_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'কায়কোবাদ', code: 'BAN-LIT-04-02' },
  { id: 'subtop_bangla_lit_04_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'দীনবন্ধু মিত্র', code: 'BAN-LIT-04-03' },
  { id: 'subtop_bangla_lit_04_04', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'রবীন্দ্রনাথ ঠাকুর', code: 'BAN-LIT-04-04' },
  { id: 'subtop_bangla_lit_04_05', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'মাইকেল মধুসূদন দত্ত', code: 'BAN-LIT-04-05' },
  { id: 'subtop_bangla_lit_04_06', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'কাজী নজরুল ইসলাম', code: 'BAN-LIT-04-06' },
  { id: 'subtop_bangla_lit_04_07', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'ঈশ্বরচন্দ্র বিদ্যাসাগর', code: 'BAN-LIT-04-07' },
  { id: 'subtop_bangla_lit_04_08', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়', code: 'BAN-LIT-04-08' },
  { id: 'subtop_bangla_lit_04_09', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'মীর মশাররফ হোসেন', code: 'BAN-LIT-04-09' },
  { id: 'subtop_bangla_lit_04_10', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'জসীম উদ্দীন', code: 'BAN-LIT-04-10' },
  { id: 'subtop_bangla_lit_04_11', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_04', title: 'অন্যান্য সাহিত্যিক', code: 'BAN-LIT-04-11' },

  // Main Topic 05: বাংলা সাহিত্যের পঞ্চপাণ্ডব (BAN-LIT-05)
  { id: 'top_bangla_lit_05', subject_id: 'sub_bangla_lit', parent_id: null, title: 'বাংলা সাহিত্যের পঞ্চপাণ্ডব', code: 'BAN-LIT-05' },
  { id: 'subtop_bangla_lit_05_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_05', title: 'অমিয় চক্রবর্তী (১৯০১ - ১৯৬৭)', code: 'BAN-LIT-05-01' },
  { id: 'subtop_bangla_lit_05_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_05', title: 'সুধীন্দ্রনাথ দত্ত (১৯০১ - ১৯৬০)', code: 'BAN-LIT-05-02' },
  { id: 'subtop_bangla_lit_05_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_05', title: 'বিষ্ণু দে (১৯০৯ - ১৯৮২)', code: 'BAN-LIT-05-03' },
  { id: 'subtop_bangla_lit_05_04', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_05', title: 'জীবনানন্দ দাশ (১৮৯৯ - ১৯৫৪)', code: 'BAN-LIT-05-04' },
  { id: 'subtop_bangla_lit_05_05', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_05', title: 'বুদ্ধদেব বসু (১৯০৮ - ১৯৭৪)', code: 'BAN-LIT-05-05' },

  // Main Topic 06: গুরুত্বপূর্ণ নারী লেখক (BAN-LIT-06)
  { id: 'top_bangla_lit_06', subject_id: 'sub_bangla_lit', parent_id: null, title: 'গুরুত্বপূর্ণ নারী লেখক', code: 'BAN-LIT-06' },
  { id: 'subtop_bangla_lit_06_01', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_06', title: 'সেলিনা হোসেন', code: 'BAN-LIT-06-01' },
  { id: 'subtop_bangla_lit_06_02', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_06', title: 'বেগম রোকেয়া', code: 'BAN-LIT-06-02' },
  { id: 'subtop_bangla_lit_06_03', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_06', title: 'সুফিয়া কামাল', code: 'BAN-LIT-06-03' },
  { id: 'subtop_bangla_lit_06_04', subject_id: 'sub_bangla_lit', parent_id: 'top_bangla_lit_06', title: 'অন্যান্য নারী লেখকগণ', code: 'BAN-LIT-06-04' },

  // ==========================================
  // 3. বাংলা ভাষা ও ব্যাকরণ (BNG-LNG)
  // ==========================================
  // Main Topic 01: অর্থ তত্ত্ব (BNG-LNG-01)
  { id: 'top_bangla_lang_01', subject_id: 'sub_bangla_lang', parent_id: null, title: 'অর্থ তত্ত্ব', code: 'BNG-LNG-01' },
  { id: 'subtop_bangla_lang_01_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_01', title: 'বাগধারা ও প্রবাদ প্রবচন', code: 'BNG-LNG-01-01' },
  { id: 'subtop_bangla_lang_01_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_01', title: 'পরিভাষা ও পারিভাষিক শব্দ', code: 'BNG-LNG-01-02' },
  { id: 'subtop_bangla_lang_01_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_01', title: 'সমার্থক শব্দ/প্রতিশব্দ', code: 'BNG-LNG-01-03' },
  { id: 'subtop_bangla_lang_01_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_01', title: 'বিপরীতার্থক শব্দ', code: 'BNG-LNG-01-04' },
  { id: 'subtop_bangla_lang_01_05', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_01', title: 'শব্দজোড় ও প্রায় সমোচ্চারিত শব্দ', code: 'BNG-LNG-01-05' },

  // Main Topic 02: ভাষাতত্ত্ব (BNG-LNG-02)
  { id: 'top_bangla_lang_02', subject_id: 'sub_bangla_lang', parent_id: null, title: 'ভাষাতত্ত্ব', code: 'BNG-LNG-02' },
  { id: 'subtop_bangla_lang_02_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_02', title: 'বাংলা ব্যাকরণের ইতিহাস', code: 'BNG-LNG-02-01' },
  { id: 'subtop_bangla_lang_02_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_02', title: 'বাংলা ভাষার উৎপত্তি ও বিকাশ', code: 'BNG-LNG-02-02' },
  { id: 'subtop_bangla_lang_02_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_02', title: 'ভাষা ও বাংলা ভাষা রীতি', code: 'BNG-LNG-02-03' },
  { id: 'subtop_bangla_lang_02_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_02', title: 'বাংলা ব্যাকরণের আলোচ্য বিষয়', code: 'BNG-LNG-02-04' },

  // Main Topic 03: ধ্বনিতত্ত্ব (BNG-LNG-03)
  { id: 'top_bangla_lang_03', subject_id: 'sub_bangla_lang', parent_id: null, title: 'ধ্বনিতত্ত্ব', code: 'BNG-LNG-03' },
  { id: 'subtop_bangla_lang_03_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_03', title: 'ধ্বনি ও বর্ণ', code: 'BNG-LNG-03-01' },
  { id: 'subtop_bangla_lang_03_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_03', title: 'উচ্চারণের নিয়ম', code: 'BNG-LNG-03-02' },
  { id: 'subtop_bangla_lang_03_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_03', title: 'ধ্বনি পরিবর্তন', code: 'BNG-LNG-03-03' },
  { id: 'subtop_bangla_lang_03_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_03', title: 'ণ-ত্ব ও ষ-ত্ব বিধান', code: 'BNG-LNG-03-04' },
  { id: 'subtop_bangla_lang_03_05', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_03', title: 'সন্ধি', code: 'BNG-LNG-03-05' },

  // Main Topic 04: রূপ তত্ত্ব (BNG-LNG-04)
  { id: 'top_bangla_lang_04', subject_id: 'sub_bangla_lang', parent_id: null, title: 'রূপ তত্ত্ব', code: 'BNG-LNG-04' },
  { id: 'subtop_bangla_lang_04_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'বাংলা ভাষার শব্দভাণ্ডার ও শব্দ গঠন', code: 'BNG-LNG-04-01' },
  { id: 'subtop_bangla_lang_04_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'শব্দের উৎসমূল', code: 'BNG-LNG-04-02' },
  { id: 'subtop_bangla_lang_04_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'ধাতু, প্রকৃতি ও প্রত্যয়', code: 'BNG-LNG-04-03' },
  { id: 'subtop_bangla_lang_04_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'পুরুষবাচক-স্ত্রীবাচক শব্দ', code: 'BNG-LNG-04-04' },
  { id: 'subtop_bangla_lang_04_05', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'সংখ্যাবাচক শব্দ', code: 'BNG-LNG-04-05' },
  { id: 'subtop_bangla_lang_04_06', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'শব্দ দ্বিত্ব ও দ্বিরুক্ত বাচক শব্দ', code: 'BNG-LNG-04-06' },
  { id: 'subtop_bangla_lang_04_07', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'বচন', code: 'BNG-LNG-04-07' },
  { id: 'subtop_bangla_lang_04_08', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'পদাশ্রিত নির্দেশক', code: 'BNG-LNG-04-08' },
  { id: 'subtop_bangla_lang_04_09', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'সমাস', code: 'BNG-LNG-04-09' },
  { id: 'subtop_bangla_lang_04_10', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_04', title: 'উপসর্গ ও এর প্রকারভেদ', code: 'BNG-LNG-04-10' },

  // Main Topic 05: পদ-প্রকরণ (BNG-LNG-05)
  { id: 'top_bangla_lang_05', subject_id: 'sub_bangla_lang', parent_id: null, title: 'পদ-প্রকরণ', code: 'BNG-LNG-05' },
  { id: 'subtop_bangla_lang_05_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'পদ ও এর শ্রেণিবিভাগ', code: 'BNG-LNG-05-01' },
  { id: 'subtop_bangla_lang_05_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'বিশেষ্য', code: 'BNG-LNG-05-02' },
  { id: 'subtop_bangla_lang_05_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'বিশেষণ', code: 'BNG-LNG-05-03' },
  { id: 'subtop_bangla_lang_05_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'সর্বনাম ও অব্যয় পদ', code: 'BNG-LNG-05-04' },
  { id: 'subtop_bangla_lang_05_05', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'বিশেষ্য, বিশেষণ, সর্বনাম ও অব্যয় পদ', code: 'BNG-LNG-05-05' },
  { id: 'subtop_bangla_lang_05_06', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'ক্রিয়া পদ', code: 'BNG-LNG-05-06' },
  { id: 'subtop_bangla_lang_05_07', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'ক্রিয়ার কাল ও এর প্রয়োগ', code: 'BNG-LNG-05-07' },
  { id: 'subtop_bangla_lang_05_08', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'অনুসর্গ', code: 'BNG-LNG-05-08' },
  { id: 'subtop_bangla_lang_05_09', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_05', title: 'পদ সংক্রান্ত অন্যান্য বিষয়', code: 'BNG-LNG-05-09' },

  // Main Topic 06: বাক্য প্রকরণ (BNG-LNG-06)
  { id: 'top_bangla_lang_06', subject_id: 'sub_bangla_lang', parent_id: null, title: 'বাক্য প্রকরণ', code: 'BNG-LNG-06' },
  { id: 'subtop_bangla_lang_06_01', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাক্য', code: 'BNG-LNG-06-01' },
  { id: 'subtop_bangla_lang_06_02', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাক্যের প্রকারভেদ', code: 'BNG-LNG-06-02' },
  { id: 'subtop_bangla_lang_06_03', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাক্য ও উক্তির পরিবর্তন', code: 'BNG-LNG-06-03' },
  { id: 'subtop_bangla_lang_06_04', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'কারক ও বিভক্তি', code: 'BNG-LNG-06-04' },
  { id: 'subtop_bangla_lang_06_05', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাচ্য ও বাচ্যের পরিবর্তন', code: 'BNG-LNG-06-05' },
  { id: 'subtop_bangla_lang_06_06', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'যতিচিহ্ন ও যতিচিহ্নের ব্যবহার', code: 'BNG-LNG-06-06' },
  { id: 'subtop_bangla_lang_06_07', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'এক কথায় প্রকাশ', code: 'BNG-LNG-06-07' },
  { id: 'subtop_bangla_lang_06_08', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাংলা ভাষার প্রয়োগ -অপপ্রয়োগ', code: 'BNG-LNG-06-08' },
  { id: 'subtop_bangla_lang_06_09', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বানান ও বাক্যশুদ্ধি', code: 'BNG-LNG-06-09' },
  { id: 'subtop_bangla_lang_06_10', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'ছন্দ ও অলঙ্কার', code: 'BNG-LNG-06-10' },
  { id: 'subtop_bangla_lang_06_11', subject_id: 'sub_bangla_lang', parent_id: 'top_bangla_lang_06', title: 'বাক্য প্রকরণ সম্পর্কিত', code: 'BNG-LNG-06-11' },

  // ==========================================
  // 4. English Literature (ENG-LIT)
  // ==========================================
  // Main Topic 01: Anglo-Saxon and Middle English Period (ENG-LIT-01)
  { id: 'top_eng_lit_01', subject_id: 'sub_eng_lit', parent_id: null, title: 'Anglo-Saxon and Middle English Period', code: 'ENG-LIT-01' },
  { id: 'subtop_eng_lit_01_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_01', title: 'Beowulf', code: 'ENG-LIT-01-01' },
  { id: 'subtop_eng_lit_01_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_01', title: 'Geoffrey Chaucer', code: 'ENG-LIT-01-02' },

  // Main Topic 02: The Renaissance Period (ENG-LIT-02)
  { id: 'top_eng_lit_02', subject_id: 'sub_eng_lit', parent_id: null, title: 'The Renaissance Period', code: 'ENG-LIT-02' },
  { id: 'subtop_eng_lit_02_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_02', title: 'Elizabethan Period', code: 'ENG-LIT-02-01' },
  { id: 'subtop_eng_lit_02_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_02', title: 'Jacobean Period', code: 'ENG-LIT-02-02' },
  { id: 'subtop_eng_lit_02_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_02', title: 'Caroline Period', code: 'ENG-LIT-02-03' },
  { id: 'subtop_eng_lit_02_04', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_02', title: 'Commonwealth Period', code: 'ENG-LIT-02-04' },

  // Main Topic 03: The Neo-Classical Period (ENG-LIT-03)
  { id: 'top_eng_lit_03', subject_id: 'sub_eng_lit', parent_id: null, title: 'The Neo-Classical Period', code: 'ENG-LIT-03' },
  { id: 'subtop_eng_lit_03_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_03', title: 'The Restoration Period', code: 'ENG-LIT-03-01' },
  { id: 'subtop_eng_lit_03_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_03', title: 'The Augustan Period/The Age of Pope', code: 'ENG-LIT-03-02' },
  { id: 'subtop_eng_lit_03_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_03', title: 'The Age of Sensibility/The Age of Johnson', code: 'ENG-LIT-03-03' },

  // Main Topic 04: The Romantic Period (ENG-LIT-04)
  { id: 'top_eng_lit_04', subject_id: 'sub_eng_lit', parent_id: null, title: 'The Romantic Period', code: 'ENG-LIT-04' },
  { id: 'subtop_eng_lit_04_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'William Wordsworth', code: 'ENG-LIT-04-01' },
  { id: 'subtop_eng_lit_04_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'S. T Coleridge', code: 'ENG-LIT-04-02' },
  { id: 'subtop_eng_lit_04_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'John Keats', code: 'ENG-LIT-04-03' },
  { id: 'subtop_eng_lit_04_04', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'P. B Shelley', code: 'ENG-LIT-04-04' },
  { id: 'subtop_eng_lit_04_05', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'Lord Byron', code: 'ENG-LIT-04-05' },
  { id: 'subtop_eng_lit_04_06', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'Jane Austen', code: 'ENG-LIT-04-06' },
  { id: 'subtop_eng_lit_04_07', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_04', title: 'Other Romantic Writers', code: 'ENG-LIT-04-07' },

  // Main Topic 05: The Victorian Period (ENG-LIT-05)
  { id: 'top_eng_lit_05', subject_id: 'sub_eng_lit', parent_id: null, title: 'The Victorian Period', code: 'ENG-LIT-05' },
  { id: 'subtop_eng_lit_05_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Robert Browning', code: 'ENG-LIT-05-01' },
  { id: 'subtop_eng_lit_05_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Charles Dickens', code: 'ENG-LIT-05-02' },
  { id: 'subtop_eng_lit_05_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Karl Marx', code: 'ENG-LIT-05-03' },
  { id: 'subtop_eng_lit_05_04', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Oscar Wilde and George Eliot', code: 'ENG-LIT-05-04' },
  { id: 'subtop_eng_lit_05_05', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Thomas Hardy', code: 'ENG-LIT-05-05' },
  { id: 'subtop_eng_lit_05_06', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Lord Alfred Tennyson', code: 'ENG-LIT-05-06' },
  { id: 'subtop_eng_lit_05_07', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_05', title: 'Other Victorian Writers', code: 'ENG-LIT-05-07' },

  // Main Topic 06: Modern Period (ENG-LIT-06)
  { id: 'top_eng_lit_06', subject_id: 'sub_eng_lit', parent_id: null, title: 'Modern Period', code: 'ENG-LIT-06' },
  { id: 'subtop_eng_lit_06_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'G. B Shaw', code: 'ENG-LIT-06-01' },
  { id: 'subtop_eng_lit_06_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'Rudyard Kipling', code: 'ENG-LIT-06-02' },
  { id: 'subtop_eng_lit_06_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'W. B Yeats', code: 'ENG-LIT-06-03' },
  { id: 'subtop_eng_lit_06_04', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'Bertrand Russell', code: 'ENG-LIT-06-04' },
  { id: 'subtop_eng_lit_06_05', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'T. S Eliot', code: 'ENG-LIT-06-05' },
  { id: 'subtop_eng_lit_06_06', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'Ernest Hemingway', code: 'ENG-LIT-06-06' },
  { id: 'subtop_eng_lit_06_07', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'D. H Lawrence', code: 'ENG-LIT-06-07' },
  { id: 'subtop_eng_lit_06_08', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'Virginia Woolf', code: 'ENG-LIT-06-08' },
  { id: 'subtop_eng_lit_06_09', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'William Somerset Maugham', code: 'ENG-LIT-06-09' },
  { id: 'subtop_eng_lit_06_10', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'E.M Forster', code: 'ENG-LIT-06-10' },
  { id: 'subtop_eng_lit_06_11', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_06', title: 'Other Modern Writers', code: 'ENG-LIT-06-11' },

  // Main Topic 07: Post Modern Period (1939 — Present) (ENG-LIT-07)
  { id: 'top_eng_lit_07', subject_id: 'sub_eng_lit', parent_id: null, title: 'Post Modern Period (1939 — Present)', code: 'ENG-LIT-07' },
  { id: 'subtop_eng_lit_07_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_07', title: 'George Orwell', code: 'ENG-LIT-07-01' },
  { id: 'subtop_eng_lit_07_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_07', title: 'Samuel Beckett and Harold Pinter', code: 'ENG-LIT-07-02' },
  { id: 'subtop_eng_lit_07_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_07', title: 'Other Postmodern Writers', code: 'ENG-LIT-07-03' },

  // Main Topic 08: Other Country\'s Literature (ENG-LIT-08)
  { id: 'top_eng_lit_08', subject_id: 'sub_eng_lit', parent_id: null, title: "Other Country's Literature", code: 'ENG-LIT-08' },
  { id: 'subtop_eng_lit_08_01', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'French Literature', code: 'ENG-LIT-08-01' },
  { id: 'subtop_eng_lit_08_02', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'Irish Literature', code: 'ENG-LIT-08-02' },
  { id: 'subtop_eng_lit_08_03', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'Scottish Literature', code: 'ENG-LIT-08-03' },
  { id: 'subtop_eng_lit_08_04', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'American Literature', code: 'ENG-LIT-08-04' },
  { id: 'subtop_eng_lit_08_05', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'Russian Literature', code: 'ENG-LIT-08-05' },
  { id: 'subtop_eng_lit_08_06', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'South Asian Literature', code: 'ENG-LIT-08-06' },
  { id: 'subtop_eng_lit_08_07', subject_id: 'sub_eng_lit', parent_id: 'top_eng_lit_08', title: 'Miscellaneous Countries', code: 'ENG-LIT-08-07' },

  // Main Topic 09: Literary Terms and Genres (ENG-LIT-09)
  { id: 'top_eng_lit_09', subject_id: 'sub_eng_lit', parent_id: null, title: 'Literary Terms and Genres', code: 'ENG-LIT-09' },

  // Main Topic 10: Characters and Quotations (ENG-LIT-10)
  { id: 'top_eng_lit_10', subject_id: 'sub_eng_lit', parent_id: null, title: 'Characters and Quotations', code: 'ENG-LIT-10' },

  // Main Topic 11: Literary Periods, Title and Titles (ENG-LIT-11)
  { id: 'top_eng_lit_11', subject_id: 'sub_eng_lit', parent_id: null, title: 'Literary Periods, Title and Titles', code: 'ENG-LIT-11' },

  // Main Topic 12: Poetry/Poems (ENG-LIT-12)
  { id: 'top_eng_lit_12', subject_id: 'sub_eng_lit', parent_id: null, title: 'Poetry/Poems', code: 'ENG-LIT-12' },

  // Main Topic 13: Drama/Play (ENG-LIT-13)
  { id: 'top_eng_lit_13', subject_id: 'sub_eng_lit', parent_id: null, title: 'Drama/Play', code: 'ENG-LIT-13' },

  // Main Topic 14: Novel/Story (ENG-LIT-14)
  { id: 'top_eng_lit_14', subject_id: 'sub_eng_lit', parent_id: null, title: 'Novel/Story', code: 'ENG-LIT-14' },

  // ==========================================
  // 5. English Grammar (ENG-GRM)
  // ==========================================
  // 1. Articles (ENG-GRM-01)
  { id: 'top_eng_grm_01', subject_id: 'sub_eng_grm', parent_id: null, title: 'Articles', code: 'ENG-GRM-01' },

  // 2. Sentence Correction (ENG-GRM-02)
  { id: 'top_eng_grm_02', subject_id: 'sub_eng_grm', parent_id: null, title: 'Sentence Correction', code: 'ENG-GRM-02' },

  // 3. Proverbs (ENG-GRM-03)
  { id: 'top_eng_grm_03', subject_id: 'sub_eng_grm', parent_id: null, title: 'Proverbs', code: 'ENG-GRM-03' },

  // 4. Subject-Verb-Agreement (ENG-GRM-04)
  { id: 'top_eng_grm_04', subject_id: 'sub_eng_grm', parent_id: null, title: 'Subject-Verb-Agreement', code: 'ENG-GRM-04' },

  // 5. Difference Between Words (ENG-GRM-05)
  { id: 'top_eng_grm_05', subject_id: 'sub_eng_grm', parent_id: null, title: 'Difference Between Words', code: 'ENG-GRM-05' },

  // 6. Parts of Speech (ENG-GRM-06)
  { id: 'top_eng_grm_06', subject_id: 'sub_eng_grm', parent_id: null, title: 'Parts of Speech', code: 'ENG-GRM-06' },
  { id: 'subtop_eng_grm_06_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Adjective', code: 'ENG-GRM-06-01' },
  { id: 'subtop_eng_grm_06_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Preposition', code: 'ENG-GRM-06-02' },
  { id: 'subtop_eng_grm_06_03', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Noun and Noun Related', code: 'ENG-GRM-06-03' },
  { id: 'subtop_eng_grm_06_04', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Pronoun', code: 'ENG-GRM-06-04' },
  { id: 'subtop_eng_grm_06_05', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Verb', code: 'ENG-GRM-06-05' },
  { id: 'subtop_eng_grm_06_06', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Adverb', code: 'ENG-GRM-06-06' },
  { id: 'subtop_eng_grm_06_07', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Conjunction and Interjection', code: 'ENG-GRM-06-07' },
  { id: 'subtop_eng_grm_06_08', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Usage of Words', code: 'ENG-GRM-06-08' },
  { id: 'subtop_eng_grm_06_09', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_06', title: 'Interchange of Parts of Speech', code: 'ENG-GRM-06-09' },

  // 7. Idioms and Phrases (ENG-GRM-07)
  { id: 'top_eng_grm_07', subject_id: 'sub_eng_grm', parent_id: null, title: 'Idioms and Phrases', code: 'ENG-GRM-07' },
  { id: 'subtop_eng_grm_07_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_07', title: 'Idioms and Phrases', code: 'ENG-GRM-07-01' },
  { id: 'subtop_eng_grm_07_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_07', title: 'Classification of Phrases', code: 'ENG-GRM-07-02' },

  // 8. DERIVATIVES (ENG-GRM-08)
  { id: 'top_eng_grm_08', subject_id: 'sub_eng_grm', parent_id: null, title: 'DERIVATIVES', code: 'ENG-GRM-08' },

  // 9. Tense (ENG-GRM-09)
  { id: 'top_eng_grm_09', subject_id: 'sub_eng_grm', parent_id: null, title: 'Tense', code: 'ENG-GRM-09' },

  // 10. GROUP VERB/PHRASAL VERB (ENG-GRM-10)
  { id: 'top_eng_grm_10', subject_id: 'sub_eng_grm', parent_id: null, title: 'GROUP VERB/PHRASAL VERB', code: 'ENG-GRM-10' },

  // 11. Conditional Sentence (ENG-GRM-11)
  { id: 'top_eng_grm_11', subject_id: 'sub_eng_grm', parent_id: null, title: 'Conditional Sentence', code: 'ENG-GRM-11' },

  // 12. Vocabulary or Words (ENG-GRM-12)
  { id: 'top_eng_grm_12', subject_id: 'sub_eng_grm', parent_id: null, title: 'Vocabulary or Words', code: 'ENG-GRM-12' },
  { id: 'subtop_eng_grm_12_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_12', title: 'Word Meaning and Spelling', code: 'ENG-GRM-12-01' },
  { id: 'subtop_eng_grm_12_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_12', title: 'Synonym and Antonym', code: 'ENG-GRM-12-02' },
  { id: 'subtop_eng_grm_12_03', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_12', title: 'Prefix and Suffix', code: 'ENG-GRM-12-03' },
  { id: 'subtop_eng_grm_12_04', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_12', title: 'One Word Substitution', code: 'ENG-GRM-12-04' },

  // 13. Clause (ENG-GRM-13)
  { id: 'top_eng_grm_13', subject_id: 'sub_eng_grm', parent_id: null, title: 'Clause', code: 'ENG-GRM-13' },

  // 14. Voice, Narration and Degree (ENG-GRM-14)
  { id: 'top_eng_grm_14', subject_id: 'sub_eng_grm', parent_id: null, title: 'Voice, Narration and Degree', code: 'ENG-GRM-14' },
  { id: 'subtop_eng_grm_14_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_14', title: 'Voice', code: 'ENG-GRM-14-01' },
  { id: 'subtop_eng_grm_14_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_14', title: 'Narration', code: 'ENG-GRM-14-02' },
  { id: 'subtop_eng_grm_14_03', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_14', title: 'Degree', code: 'ENG-GRM-14-03' },

  // 15. Fill in the Blanks (ENG-GRM-15)
  { id: 'top_eng_grm_15', subject_id: 'sub_eng_grm', parent_id: null, title: 'Fill in the Blanks', code: 'ENG-GRM-15' },

  // 16. Composition (ENG-GRM-16)
  { id: 'top_eng_grm_16', subject_id: 'sub_eng_grm', parent_id: null, title: 'Composition', code: 'ENG-GRM-16' },
  { id: 'subtop_eng_grm_16_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_16', title: 'Letters and Application', code: 'ENG-GRM-16-01' },
  { id: 'subtop_eng_grm_16_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_16', title: 'Paragraph Related and Others', code: 'ENG-GRM-16-02' },

  // 17. Miscellaneous [Punctuation, Letter writing, etc.] (ENG-GRM-17)
  { id: 'top_eng_grm_17', subject_id: 'sub_eng_grm', parent_id: null, title: 'Miscellaneous [Punctuation, Letter writing, etc.]', code: 'ENG-GRM-17' },

  // 18. WH Question & Embedded Question (ENG-GRM-18)
  { id: 'top_eng_grm_18', subject_id: 'sub_eng_grm', parent_id: null, title: 'WH Question & Embedded Question', code: 'ENG-GRM-18' },

  // 19. Sentence and Transformation (ENG-GRM-19)
  { id: 'top_eng_grm_19', subject_id: 'sub_eng_grm', parent_id: null, title: 'Sentence and Transformation', code: 'ENG-GRM-19' },
  { id: 'subtop_eng_grm_19_01', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_19', title: 'Simple, Complex & Compound', code: 'ENG-GRM-19-01' },
  { id: 'subtop_eng_grm_19_02', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_19', title: 'Translation', code: 'ENG-GRM-19-02' },
  { id: 'subtop_eng_grm_19_03', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_19', title: 'Assertive, Optative, Imperative & Exclamatory', code: 'ENG-GRM-19-03' },
  { id: 'subtop_eng_grm_19_04', subject_id: 'sub_eng_grm', parent_id: 'top_eng_grm_19', title: 'Tag Question', code: 'ENG-GRM-19-04' },

  // ==========================================
  // 6. Mathematics (MATH)
  // ==========================================
  // 1. পাটিগণিত (MATH-ARITH)
  { id: 'top_math_arith', subject_id: 'sub_math', parent_id: null, title: 'পাটিগণিত', code: 'MATH-ARITH' },
  { id: 'subtop_math_arith_01', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'বাস্তব সংখ্যা, গড় ও ভগ্নাংশ', code: 'MATH-ARITH-01' },
  { id: 'subtop_math_arith_02', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'লাভ-ক্ষতি', code: 'MATH-ARITH-02' },
  { id: 'subtop_math_arith_03', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'শতকরা', code: 'MATH-ARITH-03' },
  { id: 'subtop_math_arith_04', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'সরল ও যৌগিক মুনাফা', code: 'MATH-ARITH-04' },
  { id: 'subtop_math_arith_05', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'ল.সা.গু ও গ.সা.গু', code: 'MATH-ARITH-05' },
  { id: 'subtop_math_arith_06', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'অংশীদারী হিসাব, অনুপাত ও সমানুপাত', code: 'MATH-ARITH-06' },
  { id: 'subtop_math_arith_07', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'ঐকিক নিয়ম', code: 'MATH-ARITH-07' },
  { id: 'subtop_math_arith_08', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'বয়স ও পরিমাপ সংক্রান্ত সমস্যা', code: 'MATH-ARITH-08' },
  { id: 'subtop_math_arith_09', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'নৌকা, ট্রেন, সময় ও গতিবেগ সংক্রান্ত সমস্যা', code: 'MATH-ARITH-09' },
  { id: 'subtop_math_arith_10', subject_id: 'sub_math', parent_id: 'top_math_arith', title: 'কাজ, নল ও চৌবাচ্চা সংক্রান্ত সমস্যা', code: 'MATH-ARITH-10' },

  // 2. বীজগণিত (MATH-ALG)
  { id: 'top_math_alg', subject_id: 'sub_math', parent_id: null, title: 'বীজগণিত', code: 'MATH-ALG' },
  { id: 'subtop_math_alg_01', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'বীজগণিতীয় সূত্রাবলি ও এর প্রয়োগ', code: 'MATH-ALG-01' },
  { id: 'subtop_math_alg_02', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'বহুপদী উৎপাদক ও এর বিশ্লেষণ', code: 'MATH-ALG-02' },
  { id: 'subtop_math_alg_03', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'সরল ও দ্বিপদী সমীকরণ এবং সরল সমীকরণ', code: 'MATH-ALG-03' },
  { id: 'subtop_math_alg_04', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'সরল ও দ্বিপদী অসমতা', code: 'MATH-ALG-04' },
  { id: 'subtop_math_alg_05', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'সূচক ও লগারিদম', code: 'MATH-ALG-05' },
  { id: 'subtop_math_alg_06', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'ধারা', code: 'MATH-ALG-06' },
  { id: 'subtop_math_alg_07', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'সেট, ফাংশন ও ভেনচিত্র', code: 'MATH-ALG-07' },
  { id: 'subtop_math_alg_08', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'বিন্যাস ও সমাবেশ', code: 'MATH-ALG-08' },
  { id: 'subtop_math_alg_09', subject_id: 'sub_math', parent_id: 'top_math_alg', title: 'পরিসংখ্যান ও সম্ভাবনা', code: 'MATH-ALG-09' },

  // 3. জ্যামিতি (MATH-GEO)
  { id: 'top_math_geo', subject_id: 'sub_math', parent_id: null, title: 'জ্যামিতি', code: 'MATH-GEO' },
  { id: 'subtop_math_geo_01', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'রেখা, কোণ ও বৃত্ত সম্পর্কিত সমস্যা ও সমাধান', code: 'MATH-GEO-01' },
  { id: 'subtop_math_geo_02', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'ত্রিভুজ সংক্রান্ত সমস্যা ও সমাধান', code: 'MATH-GEO-02' },
  { id: 'subtop_math_geo_03', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'চতুর্ভুজ সংক্রান্ত সমস্যা ও সমাধান', code: 'MATH-GEO-03' },
  { id: 'subtop_math_geo_04', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'পিথাগোরাসের উপপাদ্য এবং অন্যান্য উপপাদ্য', code: 'MATH-GEO-04' },
  { id: 'subtop_math_geo_05', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'ত্রিকোণমিতি', code: 'MATH-GEO-05' },
  { id: 'subtop_math_geo_06', subject_id: 'sub_math', parent_id: 'top_math_geo', title: 'পরিমিতি', code: 'MATH-GEO-06' },

  // ==========================================
  // 7. সাধারণ বিজ্ঞান (SCIENCE)
  // ==========================================
  { id: 'top_science_01', subject_id: 'sub_science', parent_id: null, title: 'ভৌত বিজ্ঞান ও পদার্থবিদ্যা', code: 'SCIENCE-01' },
  { id: 'subtop_science_01_01', subject_id: 'sub_science', parent_id: 'top_science_01', title: 'আলো, প্রতিফলন, প্রতিসরণ ও লেন্স', code: 'SCIENCE-01-01' },
  { id: 'subtop_science_01_02', subject_id: 'sub_science', parent_id: 'top_science_01', title: 'শব্দ, তরঙ্গ, গতি, বল ও চাপ', code: 'SCIENCE-01-02' },
  { id: 'subtop_science_01_03', subject_id: 'sub_science', parent_id: 'top_science_01', title: 'তাপ, তাপমাত্রা ও তাপগতিবিদ্যা', code: 'SCIENCE-01-03' },
  { id: 'subtop_science_01_04', subject_id: 'sub_science', parent_id: 'top_science_01', title: 'বিদ্যুৎ, বর্তনী ও চুম্বকত্ব', code: 'SCIENCE-01-04' },

  { id: 'top_science_02', subject_id: 'sub_science', parent_id: null, title: 'রসায়ন ও আধুনিক বিজ্ঞান', code: 'SCIENCE-02' },
  { id: 'subtop_science_02_01', subject_id: 'sub_science', parent_id: 'top_science_02', title: 'পদার্থের গঠন ও পর্যায় সারণী', code: 'SCIENCE-02-01' },
  { id: 'subtop_science_02_02', subject_id: 'sub_science', parent_id: 'top_science_02', title: 'এসিড, ক্ষার, লবণ ও রাসায়নিক বিক্রিয়া', code: 'SCIENCE-02-02' },
  { id: 'subtop_science_02_03', subject_id: 'sub_science', parent_id: 'top_science_02', title: 'ধাতু, পলিমার ও প্রসাধন রসায়ন', code: 'SCIENCE-02-03' },
  { id: 'subtop_science_02_04', subject_id: 'sub_science', parent_id: 'top_science_02', title: 'তেজস্ক্রিয়তা ও পারমাণবিক শক্তি', code: 'SCIENCE-02-04' },

  { id: 'top_science_03', subject_id: 'sub_science', parent_id: null, title: 'জীববিজ্ঞান ও উদ্ভিদবিজ্ঞান', code: 'SCIENCE-03' },
  { id: 'subtop_science_03_01', subject_id: 'sub_science', parent_id: 'top_science_03', title: 'কোষের গঠন ও কোষ বিভাজন', code: 'SCIENCE-03-01' },
  { id: 'subtop_science_03_02', subject_id: 'sub_science', parent_id: 'top_science_03', title: 'উদ্ভিদের পুষ্টি ও সালোকসংশ্লেষণ', code: 'SCIENCE-03-02' },
  { id: 'subtop_science_03_03', subject_id: 'sub_science', parent_id: 'top_science_03', title: 'মানবদেহ (রক্ত সংবহন, শ্বসন ও পরিপাক)', code: 'SCIENCE-03-03' },
  { id: 'subtop_science_03_04', subject_id: 'sub_science', parent_id: 'top_science_03', title: 'জিনতত্ত্ব ও বংশগতি', code: 'SCIENCE-03-04' },

  { id: 'top_science_04', subject_id: 'sub_science', parent_id: null, title: 'খাদ্য, পুষ্টি ও চিকিৎসাবিজ্ঞান', code: 'SCIENCE-04' },
  { id: 'subtop_science_04_01', subject_id: 'sub_science', parent_id: 'top_science_04', title: 'ভিটামিন, খনিজ লবণ ও পুষ্টিমান', code: 'SCIENCE-04-01' },
  { id: 'subtop_science_04_02', subject_id: 'sub_science', parent_id: 'top_science_04', title: 'সংক্রামক রোগ, ভাইরাস ও ব্যাকটেরিয়া', code: 'SCIENCE-04-02' },
  { id: 'subtop_science_04_03', subject_id: 'sub_science', parent_id: 'top_science_04', title: 'টিকাদান ও স্বাস্থ্য সচেতনতা', code: 'SCIENCE-04-03' },

  // ==========================================
  // 8. বাংলাদেশ বিষয়াবলি (BD / GK-BD)
  // ==========================================
  // 1. বাংলাদেশের জাতীয় বিষয়াবলি (BD-NAT)
  { id: 'top_bd_nat', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের জাতীয় বিষয়াবলি', code: 'BD-NAT' },
  { id: 'subtop_bd_nat_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'ড. মুহাম্মদ ইউনূস', code: 'BD-NAT-01' },
  { id: 'subtop_bd_nat_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'বীরত্বসূচক খেতাব ও মুক্তিযুদ্ধের সাতজন বীরশ্রেষ্ঠ', code: 'BD-NAT-02' },
  { id: 'subtop_bd_nat_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'মুজিবনগর সরকার', code: 'BD-NAT-03' },
  { id: 'subtop_bd_nat_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'জুলাই অভ্যুত্থান -২০২৪', code: 'BD-NAT-04' },
  { id: 'subtop_bd_nat_05', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'বাংলাদেশের ভৌগলিক পরিচয়', code: 'BD-NAT-05' },
  { id: 'subtop_bd_nat_06', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'মুক্তিযুদ্ধ', code: 'BD-NAT-06' },
  { id: 'subtop_bd_nat_07', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'ভাষা আন্দোলন', code: 'BD-NAT-07' },
  { id: 'subtop_bd_nat_08', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'যুক্তফ্রন্ট নির্বাচন ও ১৯৫৬-এর শাসনতন্ত্র আন্দোলন', code: 'BD-NAT-08' },
  { id: 'subtop_bd_nat_09', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: '৬ দফা ও ৬ দফা আন্দোলন', code: 'BD-NAT-09' },
  { id: 'subtop_bd_nat_10', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'আগরতলা ষড়যন্ত্র মামলা ও ১৯৬৯-এর গণঅভ্যুত্থান', code: 'BD-NAT-10' },
  { id: 'subtop_bd_nat_11', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'সত্তরের নির্বাচন ও একাত্তরের অসহযোগ আন্দোলন', code: 'BD-NAT-11' },
  { id: 'subtop_bd_nat_12', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'ইউরোপীয়দের আগমন ও ব্রিটিশ শাসন', code: 'BD-NAT-12' },
  { id: 'subtop_bd_nat_13', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'বাংলায় মুসলিম শাসন', code: 'BD-NAT-13' },
  { id: 'subtop_bd_nat_14', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'মুঘল, সুলতান ও নবাবী আমল', code: 'BD-NAT-14' },
  { id: 'subtop_bd_nat_15', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'প্রাচীন বাংলার ইতিহাস, জনপদ ও বিভিন্ন বংশানুক্রম', code: 'BD-NAT-15' },
  { id: 'subtop_bd_nat_16', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'মুক্তিযুদ্ধ পরবর্তী সময়ের ইতিহাস', code: 'BD-NAT-16' },
  { id: 'subtop_bd_nat_17', subject_id: 'sub_gk_bd', parent_id: 'top_bd_nat', title: 'মুক্তিযুদ্ধভিত্তিক গ্রন্থ, প্রবন্ধ ও চলচ্চিত্র', code: 'BD-NAT-17' },

  // 2. বাংলাদেশের কৃষিজ সম্পদ (BD-AGR)
  { id: 'top_bd_agr', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের কৃষিজ সম্পদ', code: 'BD-AGR' },
  { id: 'subtop_bd_agr_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_agr', title: 'মৎস্য সম্পদ ও প্রাণী সম্পদ', code: 'BD-AGR-01' },
  { id: 'subtop_bd_agr_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_agr', title: 'ফসলের জাত সংক্রান্ত', code: 'BD-AGR-02' },
  { id: 'subtop_bd_agr_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_agr', title: 'কৃষি সংক্রান্ত বিষয়াবলী', code: 'BD-AGR-03' },
  { id: 'subtop_bd_agr_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_agr', title: 'ফসল উৎপাদন', code: 'BD-AGR-04' },

  // 3. বাংলাদেশের সংস্কৃতি ও প্রত্নস্থল (BD-CUL)
  { id: 'top_bd_cul', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের সংস্কৃতি ও প্রত্নস্থল', code: 'BD-CUL' },
  { id: 'subtop_bd_cul_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_cul', title: 'বাঙালির সংস্কৃতি ও শিল্পকলা', code: 'BD-CUL-01' },
  { id: 'subtop_bd_cul_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_cul', title: 'বাংলাদেশের প্রত্নস্থল', code: 'BD-CUL-02' },

  // 4. বাংলাদেশের বৈদেশিক সম্পর্ক (BD-FOR)
  { id: 'top_bd_for', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের বৈদেশিক সম্পর্ক', code: 'BD-FOR' },
  { id: 'subtop_bd_for_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_for', title: 'আন্তর্জাতিক অঙ্গনে বাংলাদেশ', code: 'BD-FOR-01' },
  { id: 'subtop_bd_for_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_for', title: 'দ্বিপাক্ষিক ও আঞ্চলিক সম্পর্ক', code: 'BD-FOR-02' },

  // 5. বাংলাদেশ: ভূ-প্রকৃতি, পরিবেশ ও দুর্যোগ ব্যবস্থা (BD-GEO)
  { id: 'top_bd_geo', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশ: ভূ-প্রকৃতি, পরিবেশ ও দুর্যোগ ব্যবস্থা', code: 'BD-GEO' },
  { id: 'subtop_bd_geo_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_geo', title: 'বাংলাদেশের ভূ-প্রকৃতি', code: 'BD-GEO-01' },
  { id: 'subtop_bd_geo_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_geo', title: 'বন ও পরিবেশ', code: 'BD-GEO-02' },
  { id: 'subtop_bd_geo_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_geo', title: 'বাংলাদেশের জলবায়ু এবং দুর্যোগ', code: 'BD-GEO-03' },

  // 6. বাংলাদেশের অর্থনীতি (BD-ECO)
  { id: 'top_bd_eco', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের অর্থনীতি', code: 'BD-ECO' },
  { id: 'subtop_bd_eco_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_eco', title: 'দারিদ্র্য বিমোচন', code: 'BD-ECO-01' },
  { id: 'subtop_bd_eco_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_eco', title: 'প্রাকৃতিক সম্পদসমূহ', code: 'BD-ECO-02' },
  { id: 'subtop_bd_eco_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_eco', title: 'অর্থনীতির খাতসমূহ', code: 'BD-ECO-03' },
  { id: 'subtop_bd_eco_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_eco', title: 'অর্থনীতির জন্য গুরুত্বপূর্ণ অঞ্চল', code: 'BD-ECO-04' },
  { id: 'subtop_bd_eco_05', subject_id: 'sub_gk_bd', parent_id: 'top_bd_eco', title: 'অন্যান্য আর্থিক প্রতিষ্ঠান', code: 'BD-ECO-05' },

  // 7. বাংলাদেশের শিল্প ও বাণিজ্য (BD-IND)
  { id: 'top_bd_ind', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের শিল্প ও বাণিজ্য', code: 'BD-IND' },
  { id: 'subtop_bd_ind_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ind', title: 'শিল্প ও বাণিজ্য মন্ত্রণালয়', code: 'BD-IND-01' },
  { id: 'subtop_bd_ind_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ind', title: 'শিল্প উৎপাদন সম্পর্কিত', code: 'BD-IND-02' },
  { id: 'subtop_bd_ind_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ind', title: 'আমদানি-রপ্তানি', code: 'BD-IND-03' },

  // 8. বাংলাদেশের যোগাযোগ, শিক্ষা, স্বাস্থ্য ও তথ্যপ্রযুক্তি (BD-COM)
  { id: 'top_bd_com', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের যোগাযোগ, শিক্ষা, স্বাস্থ্য ও তথ্যপ্রযুক্তি', code: 'BD-COM' },
  { id: 'subtop_bd_com_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_com', title: 'বাংলাদেশের যোগাযোগ ব্যবস্থা', code: 'BD-COM-01' },
  { id: 'subtop_bd_com_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_com', title: 'বিজ্ঞান ও যোগাযোগ প্রযুক্তি', code: 'BD-COM-02' },
  { id: 'subtop_bd_com_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_com', title: 'বাংলাদেশের শিক্ষাব্যবস্থা', code: 'BD-COM-03' },
  { id: 'subtop_bd_com_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_com', title: 'বাংলাদেশের স্বাস্থ্যসেবা', code: 'BD-COM-04' },

  // 9. বাংলাদেশের জনগোষ্ঠী ও জনসংখ্যা (BD-POP)
  { id: 'top_bd_pop', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের জনগোষ্ঠী ও জনসংখ্যা', code: 'BD-POP' },
  { id: 'subtop_bd_pop_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_pop', title: 'আদম শুমারি ও জনসংখ্যা সংক্রান্ত', code: 'BD-POP-01' },
  { id: 'subtop_bd_pop_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_pop', title: 'জনগোষ্ঠী, ক্ষুদ্র নৃগোষ্ঠী ও অন্যান্য', code: 'BD-POP-02' },

  // 10. বাংলাদেশের সংবিধান (BD-CONST)
  { id: 'top_bd_const', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের সংবিধান', code: 'BD-CONST' },
  { id: 'subtop_bd_const_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_const', title: 'সাংবিধানিক পদ, প্রতিষ্ঠান ও পদবি', code: 'BD-CONST-01' },
  { id: 'subtop_bd_const_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_const', title: 'সংবিধান এর ইতিহাস', code: 'BD-CONST-02' },
  { id: 'subtop_bd_const_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_const', title: 'অনুচ্ছেদ ও তফসিল', code: 'BD-CONST-03' },
  { id: 'subtop_bd_const_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_const', title: 'সংবিধানের তফসিল ও সংশোধনীসমূহ', code: 'BD-CONST-04' },

  // 11. বাংলাদেশের রাজনৈতিক ব্যবস্থা (BD-POL)
  { id: 'top_bd_pol', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের রাজনৈতিক ব্যবস্থা', code: 'BD-POL' },
  { id: 'subtop_bd_pol_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_pol', title: 'নির্বাচন কমিশন', code: 'BD-POL-01' },
  { id: 'subtop_bd_pol_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_pol', title: 'উপমহাদেশের রাজনৈতিক ব্যক্তিত্ব ও সমাজ সংস্কারক', code: 'BD-POL-02' },
  { id: 'subtop_bd_pol_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_pol', title: 'রাজনৈতিক দল', code: 'BD-POL-03' },

  // 12. বাংলাদেশের সরকার ব্যবস্থা (BD-GOV)
  { id: 'top_bd_gov', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের সরকার ব্যবস্থা', code: 'BD-GOV' },
  { id: 'subtop_bd_gov_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_gov', title: 'বাংলাদেশের প্রশাসনিক কাঠামো', code: 'BD-GOV-01' },
  { id: 'subtop_bd_gov_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_gov', title: 'জাতীয় সংসদ ও আইন বিভাগ', code: 'BD-GOV-02' },
  { id: 'subtop_bd_gov_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_gov', title: 'নির্বাহী বিভাগ', code: 'BD-GOV-03' },
  { id: 'subtop_bd_gov_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_gov', title: 'সুপ্রিমকোর্ট ও বিচার বিভাগ', code: 'BD-GOV-04' },

  // 13. বাংলাদেশের জাতীয় অর্জন ও অন্যান্য (BD-ACH)
  { id: 'top_bd_ach', subject_id: 'sub_gk_bd', parent_id: null, title: 'বাংলাদেশের জাতীয় অর্জন ও অন্যান্য', code: 'BD-ACH' },
  { id: 'subtop_bd_ach_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ach', title: 'বাংলাদেশের খেলাধুলা ও চলচ্চিত্র', code: 'BD-ACH-01' },
  { id: 'subtop_bd_ach_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ach', title: 'জাতীয় পুরস্কার ও পদকসমূহ', code: 'BD-ACH-02' },
  { id: 'subtop_bd_ach_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ach', title: 'জাতীয় অর্জন ও গুরুত্বপূর্ণ ব্যক্তিগত অর্জন', code: 'BD-ACH-03' },
  { id: 'subtop_bd_ach_04', subject_id: 'sub_gk_bd', parent_id: 'top_bd_ach', title: 'গুরুত্বপূর্ণ জাতীয় স্থাপনা সমূহ', code: 'BD-ACH-04' },

  // 14. অর্থনৈতিক সমীক্ষা, বাজেট ও অন্যান্য (BD-BUD)
  { id: 'top_bd_bud', subject_id: 'sub_gk_bd', parent_id: null, title: 'অর্থনৈতিক সমীক্ষা, বাজেট ও অন্যান্য', code: 'BD-BUD' },
  { id: 'subtop_bd_bud_01', subject_id: 'sub_gk_bd', parent_id: 'top_bd_bud', title: 'অন্যান্য সমীক্ষা', code: 'BD-BUD-01' },
  { id: 'subtop_bd_bud_02', subject_id: 'sub_gk_bd', parent_id: 'top_bd_bud', title: 'বাজেট', code: 'BD-BUD-02' },
  { id: 'subtop_bd_bud_03', subject_id: 'sub_gk_bd', parent_id: 'top_bd_bud', title: 'অর্থনৈতিক সমীক্ষা', code: 'BD-BUD-03' },

  // ==========================================
  // 9. আন্তর্জাতিক বিষয়াবলি (INT / GK-INT)
  // ==========================================
  // 1. বৈশ্বিক ইতিহাস, আঞ্চলিক ও আন্তর্জাতিক ব্যবস্থা (INT-HIS)
  { id: 'top_int_his', subject_id: 'sub_gk_int', parent_id: null, title: 'বৈশ্বিক ইতিহাস, আঞ্চলিক ও আন্তর্জাতিক ব্যবস্থা', code: 'INT-HIS' },
  { id: 'subtop_int_his_01', subject_id: 'sub_gk_int', parent_id: 'top_int_his', title: 'বৈশ্বিক ইতিহাস', code: 'INT-HIS-01' },
  { id: 'subtop_int_his_02', subject_id: 'sub_gk_int', parent_id: 'top_int_his', title: 'আঞ্চলিক ও আন্তর্জাতিক ব্যবস্থা', code: 'INT-HIS-02' },
  { id: 'subtop_int_his_03', subject_id: 'sub_gk_int', parent_id: 'top_int_his', title: 'গুরুত্বপূর্ণ মহাদেশ, দেশ (রাজধানী, মুদ্রা)', code: 'INT-HIS-03' },
  { id: 'subtop_int_his_04', subject_id: 'sub_gk_int', parent_id: 'top_int_his', title: 'যুদ্ধ ও বিপ্লবসমূহ', code: 'INT-HIS-04' },
  { id: 'subtop_int_his_05', subject_id: 'sub_gk_int', parent_id: 'top_int_his', title: 'ইতিহাসের গুরুত্বপূর্ণ ব্যক্তি, ধর্মের ইতিহাস', code: 'INT-HIS-05' },

  // 2. আন্তর্জাতিক নিরাপত্তা ও আন্তঃরাষ্ট্রীয় ক্ষমতা সম্পর্ক (INT-SEC)
  { id: 'top_int_sec', subject_id: 'sub_gk_int', parent_id: null, title: 'আন্তর্জাতিক নিরাপত্তা ও আন্তঃরাষ্ট্রীয় ক্ষমতা সম্পর্ক', code: 'INT-SEC' },
  { id: 'subtop_int_sec_01', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'NATO', code: 'INT-SEC-01' },
  { id: 'subtop_int_sec_02', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'আন্তর্জাতিক গুরুত্বপূর্ণ অঞ্চল, সীমারেখা', code: 'INT-SEC-02' },
  { id: 'subtop_int_sec_03', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'অন্যান্য নিরাপত্তা জোট ও বাহিনী', code: 'INT-SEC-03' },
  { id: 'subtop_int_sec_04', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'আন্তর্জাতিক বিভিন্ন গেরিলা, বিদ্রোহী ও অন্যান্য দল', code: 'INT-SEC-04' },
  { id: 'subtop_int_sec_05', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'আন্তর্জাতিক চুক্তি সংক্রান্ত সনদ', code: 'INT-SEC-05' },
  { id: 'subtop_int_sec_06', subject_id: 'sub_gk_int', parent_id: 'top_int_sec', title: 'রাষ্ট্র ও সরকার', code: 'INT-SEC-06' },

  // 3. আন্তর্জাতিক পরিবেশগত ইস্যু ও কূটনীতি (INT-ENV)
  { id: 'top_int_env', subject_id: 'sub_gk_int', parent_id: null, title: 'আন্তর্জাতিক পরিবেশগত ইস্যু ও কূটনীতি', code: 'INT-ENV' },
  { id: 'subtop_int_env_01', subject_id: 'sub_gk_int', parent_id: 'top_int_env', title: 'পরিবেশগত বিভিন্ন ইস্যু', code: 'INT-ENV-01' },
  { id: 'subtop_int_env_02', subject_id: 'sub_gk_int', parent_id: 'top_int_env', title: 'পরিবেশ বিষয়ক সংস্থা ও জোট', code: 'INT-ENV-02' },
  { id: 'subtop_int_env_03', subject_id: 'sub_gk_int', parent_id: 'top_int_env', title: 'পরিবেশ বিষয়ক চুক্তি ও সম্মেলন', code: 'INT-ENV-03' },
  { id: 'subtop_int_env_04', subject_id: 'sub_gk_int', parent_id: 'top_int_env', title: 'আইন', code: 'INT-ENV-04' },

  // 4. আন্তর্জাতিক সংগঠন এবং বৈশ্বিক অর্থনৈতিক প্রতিষ্ঠান (INT-ORG)
  { id: 'top_int_org', subject_id: 'sub_gk_int', parent_id: null, title: 'আন্তর্জাতিক সংগঠন এবং বৈশ্বিক অর্থনৈতিক প্রতিষ্ঠান', code: 'INT-ORG' },
  { id: 'subtop_int_org_01', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'আন্তর্জাতিক বিভিন্ন সংস্থাসমূহ', code: 'INT-ORG-01' },
  { id: 'subtop_int_org_02', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'আন্তর্জাতিক রাজনৈতিক সংগঠন ও জোট', code: 'INT-ORG-02' },
  { id: 'subtop_int_org_03', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'জাতিসংঘ', code: 'INT-ORG-03' },
  { id: 'subtop_int_org_04', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'আন্তর্জাতিক সেবা, মানবাধিকার ও দুর্নীতি বিষয়ক সংস্থা', code: 'INT-ORG-04' },
  { id: 'subtop_int_org_05', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'আঞ্চলিক সহযোগিতা সংগঠন ও জোট', code: 'INT-ORG-05' },
  { id: 'subtop_int_org_06', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'বিশ্বব্যাংক ও IMF', code: 'INT-ORG-06' },
  { id: 'subtop_int_org_07', subject_id: 'sub_gk_int', parent_id: 'top_int_org', title: 'আন্তর্জাতিক বিভিন্ন অর্থনৈতিক সংস্থাসমূহ', code: 'INT-ORG-07' },

  // 5. বিশ্বের সাম্প্রতিক ও চলমান ঘটনা প্রবাহ (INT-CUR)
  { id: 'top_int_cur', subject_id: 'sub_gk_int', parent_id: null, title: 'বিশ্বের সাম্প্রতিক ও চলমান ঘটনা প্রবাহ', code: 'INT-CUR' },
  { id: 'subtop_int_cur_01', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'নোবেল এবং অন্যান্য আন্তর্জাতিক পুরস্কার', code: 'INT-CUR-01' },
  { id: 'subtop_int_cur_02', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'আন্তর্জাতিক খেলাধুলা সম্পর্কিত', code: 'INT-CUR-02' },
  { id: 'subtop_int_cur_03', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'আন্তর্জাতিক গুরুত্বপূর্ণ জরিপ ও সমীক্ষা', code: 'INT-CUR-03' },
  { id: 'subtop_int_cur_04', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'সাম্প্রতিক সম্মেলন', code: 'INT-CUR-04' },
  { id: 'subtop_int_cur_05', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'সাম্প্রতিক বৈশ্বিক সংকট ও যুদ্ধ', code: 'INT-CUR-05' },
  { id: 'subtop_int_cur_06', subject_id: 'sub_gk_int', parent_id: 'top_int_cur', title: 'সাম্প্রতিক বিশ্ব', code: 'INT-CUR-06' },

  // 6. গুরুত্বপূর্ণ আন্তর্জাতিক বিষয়সমূহ (INT-MISC)
  { id: 'top_int_misc', subject_id: 'sub_gk_int', parent_id: null, title: 'গুরুত্বপূর্ণ আন্তর্জাতিক বিষয়সমূহ', code: 'INT-MISC' },
  { id: 'subtop_int_misc_01', subject_id: 'sub_gk_int', parent_id: 'top_int_misc', title: 'মহাবিশ্ব', code: 'INT-MISC-01' },
  { id: 'subtop_int_misc_02', subject_id: 'sub_gk_int', parent_id: 'top_int_misc', title: 'সংস্কৃতি ও শিল্পকলা', code: 'INT-MISC-02' },
  { id: 'subtop_int_misc_03', subject_id: 'sub_gk_int', parent_id: 'top_int_misc', title: 'আন্তর্জাতিক দিবসসমূহ', code: 'INT-MISC-03' },

  // ==========================================
  // 10. ভূগোল ও দুর্যোগ ব্যবস্থাপনা (GEO)
  // ==========================================
  { id: 'top_geo_01', subject_id: 'sub_geo', parent_id: null, title: 'বাংলাদেশ ও বৈশ্বিক প্রাকৃতিক ভূগোল', code: 'GEO-01' },
  { id: 'subtop_geo_01_01', subject_id: 'sub_geo', parent_id: 'top_geo_01', title: 'ভূ-প্রকৃতি, নদ-নদী ও জলবায়ু', code: 'GEO-01-01' },
  { id: 'subtop_geo_01_02', subject_id: 'sub_geo', parent_id: 'top_geo_01', title: 'পৃথিবীর গঠন, অক্ষাংশ ও দ্রাঘিমাংশ', code: 'GEO-01-02' },

  { id: 'top_geo_02', subject_id: 'sub_geo', parent_id: null, title: 'প্রাকৃতিক সম্পদ ও অর্থনৈতিক ভূগোল', code: 'GEO-02' },
  { id: 'subtop_geo_02_01', subject_id: 'sub_geo', parent_id: 'top_geo_02', title: 'খনিজ, বনজ ও পানি সম্পদ', code: 'GEO-02-01' },

  { id: 'top_geo_03', subject_id: 'sub_geo', parent_id: null, title: 'দুর্যোগ ব্যবস্থাপনা ও জলবায়ু ঝুঁকি', code: 'GEO-03' },
  { id: 'subtop_geo_03_01', subject_id: 'sub_geo', parent_id: 'top_geo_03', title: 'ঘূর্ণিঝড়, বন্যা ও ভূমিকম্প মোকাবেলা', code: 'GEO-03-01' },
  { id: 'subtop_geo_03_02', subject_id: 'sub_geo', parent_id: 'top_geo_03', title: 'দুর্যোগ প্রশমন ও টেকসই উন্নয়ন', code: 'GEO-03-02' },

  // ==========================================
  // 11. নৈতিকতা, মূল্যবোধ ও সুশাসন (ETHICS)
  // ==========================================
  { id: 'top_ethics_01', subject_id: 'sub_ethics', parent_id: null, title: 'মূল্যবোধের ধারণা ও উপাদান', code: 'ETHICS-01' },
  { id: 'subtop_ethics_01_01', subject_id: 'sub_ethics', parent_id: 'top_ethics_01', title: 'সামাজিক, সাংস্কৃতিক ও নৈতিক মূল্যবোধ', code: 'ETHICS-01-01' },
  { id: 'subtop_ethics_01_02', subject_id: 'sub_ethics', parent_id: 'top_ethics_01', title: 'গণতান্ত্রিক মূল্যবোধ ও নাগরিক শিষ্টাচার', code: 'ETHICS-01-02' },

  { id: 'top_ethics_02', subject_id: 'sub_ethics', parent_id: null, title: 'সুশাসনের ধারণা ও প্রধান স্তম্ভ', code: 'ETHICS-02' },
  { id: 'subtop_ethics_02_01', subject_id: 'sub_ethics', parent_id: 'top_ethics_02', title: 'স্বচ্ছতা, জবাবদিহিতা ও আইনের শাসন', code: 'ETHICS-02-01' },
  { id: 'subtop_ethics_02_02', subject_id: 'sub_ethics', parent_id: 'top_ethics_02', title: 'দুর্নীতি প্রতিরোধ ও জাতীয় শুদ্ধাচার কৌশল', code: 'ETHICS-02-02' },

  { id: 'top_ethics_03', subject_id: 'sub_ethics', parent_id: null, title: 'ই-গভর্নেন্স ও তথ্য অধিকার', code: 'ETHICS-03' },
  { id: 'subtop_ethics_03_01', subject_id: 'sub_ethics', parent_id: 'top_ethics_03', title: 'তথ্য অধিকার আইন ও নাগরিক সেবা', code: 'ETHICS-03-01' },

  // ==========================================
  // 12. কম্পিউটার ও তথ্যপ্রযুক্তি (CS-IT)
  // ==========================================
  // 1. কম্পিউটার (CS-IT-CMP)
  { id: 'top_cs_it_cmp', subject_id: 'sub_cs_it', parent_id: null, title: 'কম্পিউটার', code: 'CS-IT-CMP' },
  { id: 'subtop_cs_it_cmp_01', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের অঙ্গসংগঠন ও হার্ডওয়্যার', code: 'CS-IT-CMP-01' },
  { id: 'subtop_cs_it_cmp_02', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের অঙ্গসংগঠন (ইনপুট ও আউটপুট ডিভাইস)', code: 'CS-IT-CMP-02' },
  { id: 'subtop_cs_it_cmp_03', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'দৈনন্দিন জীবনে কম্পিউটার', code: 'CS-IT-CMP-03' },
  { id: 'subtop_cs_it_cmp_04', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটার অপারেটিং সিস্টেম', code: 'CS-IT-CMP-04' },
  { id: 'subtop_cs_it_cmp_05', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের ইতিহাস', code: 'CS-IT-CMP-05' },
  { id: 'subtop_cs_it_cmp_06', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের প্রকারভেদ', code: 'CS-IT-CMP-06' },
  { id: 'subtop_cs_it_cmp_07', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটার নম্বর সিস্টেম ও লজিক গেট', code: 'CS-IT-CMP-07' },
  { id: 'subtop_cs_it_cmp_08', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'ডাটাবেজ সিস্টেম', code: 'CS-IT-CMP-08' },
  { id: 'subtop_cs_it_cmp_09', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের শর্টকাট কমান্ড', code: 'CS-IT-CMP-09' },
  { id: 'subtop_cs_it_cmp_10', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_cmp', title: 'কম্পিউটারের পারঙ্গমতা', code: 'CS-IT-CMP-10' },

  // 2. তথ্য ও যোগাযোগ প্রযুক্তি (CS-IT-ICT)
  { id: 'top_cs_it_ict', subject_id: 'sub_cs_it', parent_id: null, title: 'তথ্য ও যোগাযোগ প্রযুক্তি', code: 'CS-IT-ICT' },
  { id: 'subtop_cs_it_ict_01', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'ই-কমার্স', code: 'CS-IT-ICT-01' },
  { id: 'subtop_cs_it_ict_02', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'তথ্য প্রযুক্তির বড় প্রতিষ্ঠান ও তাদের সেবা', code: 'CS-IT-ICT-02' },
  { id: 'subtop_cs_it_ict_03', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'সাইবার অপরাধ', code: 'CS-IT-ICT-03' },
  { id: 'subtop_cs_it_ict_04', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'ইন্টারনেট ও ইন্টারনেট সংক্রান্ত বিষয়', code: 'CS-IT-ICT-04' },
  { id: 'subtop_cs_it_ict_05', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'কম্পিউটার নেটওয়ার্কিং ও সেলুলার ডাটা', code: 'CS-IT-ICT-05' },
  { id: 'subtop_cs_it_ict_06', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'দৈনন্দিন জীবনে তথ্য-প্রযুক্তি', code: 'CS-IT-ICT-06' },
  { id: 'subtop_cs_it_ict_07', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'ক্লায়েন্ট সার্ভার ম্যানেজমেন্ট ও ক্লাউড কম্পিউটিং', code: 'CS-IT-ICT-07' },
  { id: 'subtop_cs_it_ict_08', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'স্মার্টফোন ও এর বৈশিষ্ট্য', code: 'CS-IT-ICT-08' },
  { id: 'subtop_cs_it_ict_09', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'সোশ্যাল নেটওয়ার্কিং', code: 'CS-IT-ICT-09' },
  { id: 'subtop_cs_it_ict_10', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'রোবটিক্স', code: 'CS-IT-ICT-10' },
  { id: 'subtop_cs_it_ict_11', subject_id: 'sub_cs_it', parent_id: 'top_cs_it_ict', title: 'তথ্য-প্রযুক্তি সংক্রান্ত বিবিধ বিষয়', code: 'CS-IT-ICT-11' },

  // ==========================================
  // 13. মানসিক দক্ষতা (MENTAL)
  // ==========================================
  { id: 'top_mental_ar', subject_id: 'sub_mental', parent_id: null, title: 'ভাবমূলক যুক্তিবিন্যাস', code: 'MENTAL-AR' },
  { id: 'top_mental_vr', subject_id: 'sub_mental', parent_id: null, title: 'ভাষাগত যৌক্তিক বিচার', code: 'MENTAL-VR' },
  { id: 'top_mental_ps', subject_id: 'sub_mental', parent_id: null, title: 'সমস্যা সমাধান', code: 'MENTAL-PS' },
  { id: 'top_mental_sl', subject_id: 'sub_mental', parent_id: null, title: 'বানান ও ভাষা', code: 'MENTAL-SL' },
  { id: 'top_mental_mr', subject_id: 'sub_mental', parent_id: null, title: 'যান্ত্রিক দক্ষতা', code: 'MENTAL-MR' },
  { id: 'top_mental_sr', subject_id: 'sub_mental', parent_id: null, title: 'স্থানাঙ্ক সম্পর্ক', code: 'MENTAL-SR' },
  { id: 'top_mental_na', subject_id: 'sub_mental', parent_id: null, title: 'সংখ্যাগত ক্ষমতা', code: 'MENTAL-NA' },
  { id: 'top_mental_abr', subject_id: 'sub_mental', parent_id: null, title: 'বিমূর্ত যুক্তি', code: 'MENTAL-ABR' },
];

/**
 * LocalStorage caching helpers
 */
export const getCachedSubjects = (): SubjectItem[] => {
  try {
    const raw = localStorage.getItem(SUBJECTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading subjects cache:', e);
  }
  return DEFAULT_SUBJECTS;
};

export const setCachedSubjects = (subjects: SubjectItem[]) => {
  try {
    localStorage.setItem(SUBJECTS_CACHE_KEY, JSON.stringify(subjects));
  } catch (e) {
    console.warn('Error saving subjects cache:', e);
  }
};

export const getCachedTopics = (): TopicItem[] => {
  try {
    const raw = localStorage.getItem(TOPICS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading topics cache:', e);
  }
  return DEFAULT_TOPICS;
};

export const setCachedTopics = (topics: TopicItem[]) => {
  try {
    localStorage.setItem(TOPICS_CACHE_KEY, JSON.stringify(topics));
  } catch (e) {
    console.warn('Error saving topics cache:', e);
  }
};

/**
 * Clean & normalize a code string (Uppercase, alphanumeric + dashes only, no spaces)
 */
export const normalizeCodeString = (rawCode: string): string => {
  if (!rawCode) return '';
  return rawCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Auto-suggest Subject Code from Subject Name
 */
export const suggestSubjectCode = (name: string, existingSubjects: SubjectItem[] = []): string => {
  const clean = (name || '').trim();
  if (!clean) return 'SUB';

  // Check known mapping presets
  for (const s of DEFAULT_SUBJECTS) {
    if (s.name.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().includes(s.name.toLowerCase())) {
      return s.code;
    }
  }

  // Generate ASCII code based on roman transliteration or letters
  const letters = clean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let baseCode = letters.length >= 2 ? letters.substring(0, 6) : '';
  if (!baseCode) {
    baseCode = `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  // Ensure uniqueness
  let code = baseCode;
  let counter = 1;
  while (existingSubjects.some((s) => s.code === code)) {
    code = `${baseCode}-${counter}`;
    counter++;
  }
  return code;
};

/**
 * Auto-suggest Main Topic Code e.g. GK-INT-01
 */
export const suggestMainTopicCode = (
  subjectCode: string,
  existingTopics: TopicItem[] = []
): string => {
  const cleanSubCode = normalizeCodeString(subjectCode) || 'SUB';
  const mainTopicsForSub = existingTopics.filter(
    (t) => (!t.parent_id || t.parent_id === null) && t.code.startsWith(cleanSubCode)
  );

  let maxNum = 0;
  mainTopicsForSub.forEach((t) => {
    const suffix = t.code.substring(cleanSubCode.length).replace(/^[_-]+/, '');
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(2, '0');
  return `${cleanSubCode}-${padded}`;
};

/**
 * Auto-suggest Sub-Topic Code e.g. GK-INT-01-01
 */
export const suggestSubTopicCode = (
  parentTopicCode: string,
  existingTopics: TopicItem[] = []
): string => {
  const cleanParentCode = normalizeCodeString(parentTopicCode) || 'TOP';
  const subTopicsForParent = existingTopics.filter((t) => t.code.startsWith(cleanParentCode));

  let maxNum = 0;
  subTopicsForParent.forEach((t) => {
    const suffix = t.code.substring(cleanParentCode.length).replace(/^[_-]+/, '');
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(2, '0');
  return `${cleanParentCode}-${padded}`;
};

/**
 * Fetch Subjects from Supabase (with fallback to local cache & presets)
 */
export const fetchSubjects = async (): Promise<SubjectItem[]> => {
  const cached = getCachedSubjects();
  const client = getSupabaseClient();
  if (!client) return cached;

  try {
    const { data, error } = await client.from('subjects').select('*').order('name', { ascending: true });
    if (error || !data || data.length === 0) {
      return cached;
    }

    const items: SubjectItem[] = data.map((row: any) => ({
      id: String(row.id),
      name: String(row.name || ''),
      code: normalizeCodeString(String(row.code || suggestSubjectCode(row.name, cached))),
      created_at: row.created_at,
    }));

    // Merge Supabase subjects with default subjects to ensure full curriculum availability
    const map = new Map<string, SubjectItem>();
    DEFAULT_SUBJECTS.forEach((s) => map.set(s.name.trim().toLowerCase(), s));
    items.forEach((s) => map.set(s.name.trim().toLowerCase(), s));

    const finalSubjects = Array.from(map.values());
    setCachedSubjects(finalSubjects);
    return finalSubjects;
  } catch (e) {
    console.warn('Supabase fetchSubjects error, using cache:', e);
    return cached;
  }
};

/**
 * Filter topics for a specific subject ID or Code
 */
export const filterTopicsForSubject = (topics: TopicItem[], subjectId?: string): TopicItem[] => {
  if (!subjectId) return topics;
  const cleanId = String(subjectId).trim().toLowerCase();
  
  // Find matching subject to get its code
  const cachedSubs = getCachedSubjects();
  const matchedSub = cachedSubs.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.code.toLowerCase() === cleanId ||
      s.name.toLowerCase() === cleanId
  );

  const targetCodes: string[] = [];
  const targetIds = new Set<string>([cleanId, subjectId]);

  if (matchedSub) {
    targetIds.add(matchedSub.id.toLowerCase());
    targetCodes.push(matchedSub.code.toUpperCase());
    
    // Add default aliases
    if (matchedSub.code === 'BNG-LNG' || matchedSub.code === 'BANGLA-LANG' || cleanId.includes('bangla_lang') || cleanId.includes('bangla language') || cleanId.includes('বাংলা ভাষা')) {
      targetIds.add('sub_bangla_lang');
      targetIds.add('bangla_language');
      targetCodes.push('BNG-LNG');
      targetCodes.push('BANGLA-LANG');
    }
    if (matchedSub.code === 'BAN-LIT' || matchedSub.code === 'BANGLA-LIT' || cleanId.includes('bangla_lit') || cleanId.includes('bangla literature') || cleanId.includes('বাংলা সাহিত্য')) {
      targetIds.add('sub_bangla_lit');
      targetIds.add('bangla_literature');
      targetCodes.push('BAN-LIT');
      targetCodes.push('BANGLA-LIT');
    }
    if (matchedSub.code === 'ENG-GRM' || matchedSub.code === 'ENG-LANG' || cleanId.includes('eng_grm') || cleanId.includes('eng_lang') || cleanId.includes('english_grammar') || cleanId.includes('english grammar') || cleanId.includes('english language')) {
      targetIds.add('sub_eng_grm');
      targetIds.add('english_grammar');
      targetCodes.push('ENG-GRM');
      targetCodes.push('ENG-LANG');
    }
    if (matchedSub.code === 'ENG-LIT' || cleanId.includes('eng_lit') || cleanId.includes('english_literature') || cleanId.includes('english literature')) {
      targetIds.add('sub_eng_lit');
      targetIds.add('english_literature');
      targetCodes.push('ENG-LIT');
    }
    if (matchedSub.code === 'MATH' || cleanId.includes('math') || cleanId.includes('গণিত') || cleanId.includes('গাণিতিক যুক্তি')) {
      targetIds.add('sub_math');
      targetIds.add('math');
      targetCodes.push('MATH');
      targetCodes.push('MATH-ARITH');
      targetCodes.push('MATH-ALG');
      targetCodes.push('MATH-GEO');
    }
    if (matchedSub.code === 'BD' || matchedSub.code === 'GK-BD' || cleanId.includes('gk_bd') || cleanId.includes('bangladesh') || cleanId.includes('বাংলাদেশ')) {
      targetIds.add('sub_gk_bd');
      targetIds.add('bangladesh_affairs');
      targetCodes.push('BD');
      targetCodes.push('GK-BD');
      targetCodes.push('BD-NAT');
      targetCodes.push('BD-AGR');
      targetCodes.push('BD-CUL');
      targetCodes.push('BD-FOR');
      targetCodes.push('BD-GEO');
      targetCodes.push('BD-ECO');
      targetCodes.push('BD-IND');
      targetCodes.push('BD-COM');
      targetCodes.push('BD-POP');
      targetCodes.push('BD-CONST');
      targetCodes.push('BD-POL');
      targetCodes.push('BD-GOV');
      targetCodes.push('BD-ACH');
      targetCodes.push('BD-BUD');
    }
    if (matchedSub.code === 'INT' || matchedSub.code === 'GK-INT' || cleanId.includes('gk_int') || cleanId.includes('international') || cleanId.includes('আন্তর্জাতিক')) {
      targetIds.add('sub_gk_int');
      targetIds.add('international_affairs');
      targetCodes.push('INT');
      targetCodes.push('GK-INT');
      targetCodes.push('INT-HIS');
      targetCodes.push('INT-SEC');
      targetCodes.push('INT-ENV');
      targetCodes.push('INT-ORG');
      targetCodes.push('INT-CUR');
      targetCodes.push('INT-MISC');
    }
    if (matchedSub.code === 'CS-IT' || cleanId.includes('cs_it') || cleanId.includes('computer') || cleanId.includes('কম্পিউটার')) {
      targetIds.add('sub_cs_it');
      targetIds.add('computer_it');
      targetCodes.push('CS-IT');
      targetCodes.push('CS-IT-CMP');
      targetCodes.push('CS-IT-ICT');
    }
    if (matchedSub.code === 'MENTAL' || cleanId.includes('mental') || cleanId.includes('মানসিক')) {
      targetIds.add('sub_mental');
      targetIds.add('mental_ability');
      targetCodes.push('MENTAL');
      targetCodes.push('MENTAL-AR');
      targetCodes.push('MENTAL-VR');
      targetCodes.push('MENTAL-PS');
      targetCodes.push('MENTAL-SL');
      targetCodes.push('MENTAL-MR');
      targetCodes.push('MENTAL-SR');
      targetCodes.push('MENTAL-NA');
      targetCodes.push('MENTAL-ABR');
    }
  }

  return topics.filter((t) => {
    const tSubId = String(t.subject_id || '').toLowerCase();
    if (targetIds.has(tSubId)) return true;
    if (targetCodes.some((code) => t.code.toUpperCase().startsWith(code))) return true;
    return false;
  });
};

/**
 * Fetch Topics from Supabase (with fallback to local cache & presets)
 */
export const fetchTopics = async (subjectId?: string): Promise<TopicItem[]> => {
  const cached = getCachedTopics();
  const client = getSupabaseClient();
  if (!client) {
    return filterTopicsForSubject(cached, subjectId);
  }

  try {
    let query = client.from('topics').select('*').order('code', { ascending: true });
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return filterTopicsForSubject(cached, subjectId);
    }

    const items: TopicItem[] = data.map((row: any) => ({
      id: String(row.id),
      subject_id: String(row.subject_id || ''),
      parent_id: row.parent_id ? String(row.parent_id) : null,
      title: String(row.title || row.name || ''),
      code: normalizeCodeString(String(row.code || '')),
      created_at: row.created_at,
    }));

    // Merge Supabase topics with default topics to guarantee all subtopics exist
    const updatedMap = new Map<string, TopicItem>();
    DEFAULT_TOPICS.forEach((t) => updatedMap.set(t.id, t));
    cached.forEach((t) => updatedMap.set(t.id, t));
    items.forEach((t) => updatedMap.set(t.id, t));

    const merged = Array.from(updatedMap.values());
    setCachedTopics(merged);

    return filterTopicsForSubject(merged, subjectId);
  } catch (e) {
    console.warn('Supabase fetchTopics error, using cache:', e);
    return filterTopicsForSubject(cached, subjectId);
  }
};

/**
 * Add New Subject (Supabase + Local Cache)
 */
export const addSubject = async (
  name: string,
  code?: string
): Promise<{ success: boolean; data?: SubjectItem; error?: string }> => {
  const cleanName = (name || '').trim();
  if (!cleanName) return { success: false, error: 'বিষয়ের নাম লিখুন।' };

  const cached = getCachedSubjects();
  const finalCode = normalizeCodeString(code || suggestSubjectCode(cleanName, cached));
  const newSubject: SubjectItem = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    code: finalCode,
    created_at: new Date().toISOString(),
  };

  // Update local cache immediately
  const updated = [...cached.filter((s) => s.name.toLowerCase() !== cleanName.toLowerCase()), newSubject];
  setCachedSubjects(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('subjects')
        .insert([{ id: newSubject.id, name: newSubject.name, code: newSubject.code }])
        .select()
        .single();
      if (!error && data) {
        newSubject.id = String(data.id);
      }
    } catch (e) {
      console.warn('Could not insert subject to Supabase, saved locally:', e);
    }
  }

  return { success: true, data: newSubject };
};

/**
 * Add New Topic or Sub-Topic (Supabase + Local Cache)
 */
export const addTopic = async (
  subjectId: string,
  title: string,
  code: string,
  parentId?: string | null
): Promise<{ success: boolean; data?: TopicItem; error?: string }> => {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return { success: false, error: 'টপিকের শিরোনাম লিখুন।' };

  const cached = getCachedTopics();
  const finalCode = normalizeCodeString(code);
  const newTopic: TopicItem = {
    id: `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    subject_id: subjectId,
    parent_id: parentId || null,
    title: cleanTitle,
    code: finalCode,
    created_at: new Date().toISOString(),
  };

  const updated = [...cached, newTopic];
  setCachedTopics(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('topics')
        .insert([
          {
            id: newTopic.id,
            subject_id: newTopic.subject_id,
            parent_id: newTopic.parent_id,
            title: newTopic.title,
            code: newTopic.code,
          },
        ])
        .select()
        .single();
      if (!error && data) {
        newTopic.id = String(data.id);
      }
    } catch (e) {
      console.warn('Could not insert topic to Supabase, saved locally:', e);
    }
  }

  return { success: true, data: newTopic };
};

/**
 * Smart Batch Prefix Formula Constructor:
 * `Q-[SELECTED_SUBTOPIC_CODE OR TOPIC_CODE OR SUBJECT_CODE]-`
 */
export const constructSmartBatchPrefix = (
  subjectCode?: string,
  topicCode?: string,
  subTopicCode?: string
): string => {
  let targetCode = '';
  if (subTopicCode && subTopicCode.trim()) {
    targetCode = normalizeCodeString(subTopicCode);
  } else if (topicCode && topicCode.trim()) {
    targetCode = normalizeCodeString(topicCode);
  } else if (subjectCode && subjectCode.trim()) {
    targetCode = normalizeCodeString(subjectCode);
  }

  if (!targetCode) {
    return 'Q-BANGLA-';
  }

  // Remove leading Q- if already included in code
  targetCode = targetCode.replace(/^Q[-_]/i, '');
  return `Q-${targetCode}-`;
};

/**
 * Compute the next sequence number for a given prefix by scanning existing questions in cache/db
 */
export const computeNextSequenceForPrefix = (
  prefix: string,
  existingQuestions: Question[] = []
): number => {
  if (!prefix) return 1;
  const cleanPrefix = prefix.trim().toUpperCase();

  let maxNum = 0;
  let found = false;

  existingQuestions.forEach((q) => {
    const candidates = [
      String(q.id || ''),
      String(q.question_code || ''),
      String((q as any).custom_question_id || ''),
    ];

    candidates.forEach((cand) => {
      const idUpper = cand.toUpperCase().trim();
      if (idUpper.startsWith(cleanPrefix)) {
        found = true;
        const suffix = idUpper.substring(cleanPrefix.length);
        const match = suffix.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  });

  if (found && maxNum > 0) {
    return maxNum + 1;
  }

  return 1;
};

/**
 * Format live preview ID e.g. Q-GK-INT-01-01-00001
 */
export const formatLiveQuestionId = (prefix: string, sequenceNum: number): string => {
  let cleanPrefix = prefix.trim().toUpperCase();
  if (!cleanPrefix.endsWith('-') && !cleanPrefix.endsWith('_')) {
    cleanPrefix += '-';
  }
  const padded = String(sequenceNum).padStart(5, '0');
  return `${cleanPrefix}${padded}`;
};
