import { Question } from '../types';
import { getLocalCachedQuestions, getSupabaseClient } from './supabase';

const PREFIX_STORAGE_KEY = 'miniquiz_subject_prefix_map';

/**
 * Standard predefined subject keywords to prefix mapping
 */
const KNOWN_SUBJECT_MAP: Record<string, string> = {
  // 13 Main Exam Subjects
  'কারেন্ট অ্যাফেয়ার্স': 'Q-CA-',
  'বাংলা সাহিত্য': 'Q-BANGLA-',
  'বাংলা ভাষা ও ব্যাকরণ': 'Q-BANGLA-',
  'English Literature': 'Q-ENGLISH-',
  'English Language': 'Q-ENGLISH-',
  'গাণিতিক যুক্তি': 'Q-MATH-',
  'সাধারণ বিজ্ঞান': 'Q-SCIENCE-',
  'বাংলাদেশ বিষয়াবলি': 'Q-BD-',
  'আন্তর্জাতিক বিষয়াবলি': 'Q-INT-',
  'ভূগোল ও দুর্যোগ ব্যবস্থাপনা': 'Q-GEO-',
  'নৈতিকতা, মূল্যবোধ ও সুশাসন': 'Q-ETHICS-',
  'কম্পিউটার ও তথ্যপ্রযুক্তি': 'Q-ICT-',
  'মানসিক দক্ষতা': 'Q-IQ-',

  // বাংলা
  বাংলা: 'Q-BANGLA-',
  bangla: 'Q-BANGLA-',
  bengali: 'Q-BANGLA-',
  'বাংলা ব্যাকরণ': 'Q-BANGLA-',

  // ইংরেজি
  ইংরেজি: 'Q-ENGLISH-',
  english: 'Q-ENGLISH-',
  'english literature': 'Q-ENGLISH-',
  'english grammar': 'Q-ENGLISH-',

  // গণিত
  গণিত: 'Q-MATH-',
  math: 'Q-MATH-',
  mathematics: 'Q-MATH-',
  পাটিগণিত: 'Q-MATH-',
  বীজগণিত: 'Q-MATH-',
  জ্যামিতি: 'Q-MATH-',

  // সাধারণ জ্ঞান
  'সাধারণ জ্ঞান': 'Q-GK-',
  'সাধারন জ্ঞান': 'Q-GK-',
  gk: 'Q-GK-',
  'general knowledge': 'Q-GK-',

  // বাংলাদেশ বিষয়াবলি
  'বাংলাদেশ বিষয়াবলি': 'Q-BD-',
  বাংলাদেশ: 'Q-BD-',
  bangladesh: 'Q-BD-',
  'বাংলাদেশ প্রসঙ্গ': 'Q-BD-',

  // আন্তর্জাতিক বিষয়াবলি
  'আন্তর্জাতিক বিষয়াবলি': 'Q-INT-',
  আন্তর্জাতিক: 'Q-INT-',
  international: 'Q-INT-',
  'আন্তর্জাতিক সম্পর্ক': 'Q-INT-',

  // আইসিটি ও কম্পিউটার
  'তথ্য ও যোগাযোগ প্রযুক্তি': 'Q-ICT-',
  কম্পিউটার: 'Q-ICT-',
  তথ্যপ্রযুক্তি: 'Q-ICT-',
  আইসিটি: 'Q-ICT-',
  ict: 'Q-ICT-',
  computer: 'Q-ICT-',

  // বিজ্ঞান
  বিজ্ঞান: 'Q-SCIENCE-',
  science: 'Q-SCIENCE-',
  পদার্থবিজ্ঞান: 'Q-PHYSICS-',
  পদার্থ: 'Q-PHYSICS-',
  physics: 'Q-PHYSICS-',
  রসায়ন: 'Q-CHEM-',
  রসায়ন: 'Q-CHEM-',
  chemistry: 'Q-CHEM-',
  জীববিজ্ঞান: 'Q-BIO-',
  জীব: 'Q-BIO-',
  biology: 'Q-BIO-',

  // ভূগোল ও পরিবেশ
  'ভূগোল ও পরিবেশ': 'Q-GEO-',
  ভূগোল: 'Q-GEO-',
  পরিবেশ: 'Q-GEO-',
  'দুর্যোগ ব্যবস্থাপনা': 'Q-GEO-',
  geography: 'Q-GEO-',

  // ইসলাম ও ধর্মীয় শিক্ষা
  'ইসলাম শিক্ষা': 'Q-ISLAM-',
  'ইসলাম ও নৈতিক শিক্ষা': 'Q-ISLAM-',
  'ইসলামিক স্টাডিজ': 'Q-ISLAM-',
  ইসলাম: 'Q-ISLAM-',
  দ্বীন: 'Q-ISLAM-',
  islam: 'Q-ISLAM-',
  'ইসলামের ইতিহাস': 'Q-ISLAM-HIST-',

  // আরবি
  'আরবি ভাষা ও সাহিত্য': 'Q-ARABIC-',
  'আরবি সাহিত্য': 'Q-ARABIC-',
  'আরবি ব্যাকরণ': 'Q-ARABIC-',
  আরবি: 'Q-ARABIC-',
  arabic: 'Q-ARABIC-',
  العربية: 'Q-ARABIC-',
  'আল-কুরআন': 'Q-QURAN-',
  কুরআন: 'Q-QURAN-',
  হাদিস: 'Q-HADITH-',
  ফিকহ: 'Q-FIQH-',
  'উসুলুল ফিকহ': 'Q-FIQH-',

  // অন্যান্য বিষয়
  পৌরনীতি: 'Q-CIVICS-',
  'পৌরনীতি ও সুশাসন': 'Q-CIVICS-',
  রাষ্ট্রবিজ্ঞান: 'Q-CIVICS-',
  civics: 'Q-CIVICS-',
  অর্থনীতি: 'Q-ECON-',
  economics: 'Q-ECON-',
  সমাজবিজ্ঞান: 'Q-SOC-',
  সমাজকল্যাণ: 'Q-SOC-',
  sociology: 'Q-SOC-',
  ইতিহাস: 'Q-HIST-',
  history: 'Q-HIST-',
  দর্শন: 'Q-PHIL-',
  philosophy: 'Q-PHIL-',
  মনোবিজ্ঞান: 'Q-PSYCH-',
  psychology: 'Q-PSYCH-',
  হিসাববিজ্ঞান: 'Q-ACC-',
  accounting: 'Q-ACC-',
  ব্যবসায়: 'Q-BUS-',
  ব্যবসায়: 'Q-BUS-',
  ব্যবস্থাপনা: 'Q-MGT-',
  management: 'Q-MGT-',
  মার্কেটিং: 'Q-MKT-',
  marketing: 'Q-MKT-',
  ফিন্যান্স: 'Q-FIN-',
  finance: 'Q-FIN-',
  পরিসংখ্যান: 'Q-STAT-',
  statistics: 'Q-STAT-',
  কৃষিবিজ্ঞান: 'Q-AGRI-',
  কৃষি: 'Q-AGRI-',
  agriculture: 'Q-AGRI-',
  আইন: 'Q-LAW-',
  law: 'Q-LAW-',
};

/**
 * Clean & normalize prefix string (ensure leading Q- and trailing -)
 */
export const normalizePrefixString = (rawPrefix: string): string => {
  if (!rawPrefix) return 'Q-GEN-';
  let clean = String(rawPrefix).trim().toUpperCase();
  clean = clean.replace(/[^A-Z0-9_-]/g, '');
  if (!clean.startsWith('Q-') && !clean.startsWith('q-')) {
    clean = `Q-${clean.replace(/^[-_]+/, '')}`;
  }
  if (!clean.endsWith('-') && !clean.endsWith('_')) {
    clean = `${clean}-`;
  }
  return clean;
};

/**
 * Get saved prefix mappings from LocalStorage
 */
export const getSavedPrefixMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(PREFIX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Save custom subject prefix mapping to LocalStorage
 */
export const saveSubjectPrefixMapping = (subject: string, prefix: string): void => {
  if (!subject || !subject.trim() || !prefix || !prefix.trim()) return;
  try {
    const map = getSavedPrefixMap();
    const cleanSub = subject.trim().toLowerCase();
    const cleanPrefix = normalizePrefixString(prefix);
    map[cleanSub] = cleanPrefix;
    localStorage.setItem(PREFIX_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to save subject prefix mapping:', e);
  }
};

/**
 * Convert any arbitrary Bengali/English subject name to a smart default prefix proposal
 */
export const generateProposedPrefixForSubject = (subjectName: string): string => {
  if (!subjectName || !subjectName.trim()) return 'Q-BANGLA-';
  const sub = subjectName.trim().toLowerCase();

  // 1. Direct or partial match with known subjects
  for (const [key, prefix] of Object.entries(KNOWN_SUBJECT_MAP)) {
    if (sub === key || sub.includes(key)) {
      return prefix;
    }
  }

  // 2. Transliteration / Romanization of Bengali words if custom
  // Extract ASCII characters if user typed English subject
  const ascii = sub.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (ascii.length >= 2) {
    return `Q-${ascii.substring(0, 8)}-`;
  }

  // 3. Smart Bengali transliteration map for first syllables
  const bToEn: Record<string, string> = {
    ক: 'K',
    খ: 'KH',
    গ: 'G',
    ঘ: 'GH',
    চ: 'CH',
    ছ: 'CHH',
    জ: 'J',
    ঝ: 'JH',
    ট: 'T',
    ঠ: 'TH',
    ড: 'D',
    ঢ: 'DH',
    ত: 'T',
    থ: 'TH',
    দ: 'D',
    ধ: 'DH',
    ন: 'N',
    প: 'P',
    ফ: 'F',
    ব: 'B',
    ভ: 'BH',
    ম: 'M',
    য: 'Y',
    র: 'R',
    ল: 'L',
    শ: 'SH',
    ষ: 'SH',
    স: 'S',
    হ: 'H',
    অ: 'A',
    আ: 'A',
    ই: 'I',
    ঈ: 'I',
    উ: 'U',
    ঊ: 'U',
    এ: 'E',
    ঐ: 'OI',
    ও: 'O',
    ঔ: 'OU',
  };

  let transliterated = '';
  for (const char of subjectName.trim()) {
    if (bToEn[char]) {
      transliterated += bToEn[char];
      if (transliterated.length >= 6) break;
    }
  }

  if (transliterated.length >= 2) {
    return `Q-${transliterated}-`;
  }

  return 'Q-SUB-';
};

export interface PrefixLookupResult {
  prefix: string;
  nextNumber: number;
  isExisting: boolean;
  matchCount: number;
  lastSavedId?: string;
  source: 'database' | 'saved_map' | 'proposed';
}

/**
 * Dynamic Prefix Lookup & Fallback System
 * 1. Checks existing database/cached questions for the selected subject
 * 2. If questions exist, extracts the prefix & calculates the next sequence number (e.g. 01246)
 * 3. If new subject, checks saved mappings or generates a smart proposal with starting sequence 0001 (or 1)
 */
export const lookupSubjectPrefixAndSequence = (
  subject: string,
  existingQuestions: Question[] = []
): PrefixLookupResult => {
  if (!subject || !subject.trim()) {
    return {
      prefix: 'Q-BANGLA-',
      nextNumber: 1246,
      isExisting: false,
      matchCount: 0,
      source: 'proposed',
    };
  }

  const cleanSubject = subject.trim().toLowerCase();

  // 1. Search in existing questions matching this subject
  const subjectQuestions = existingQuestions.filter((q) => {
    const qSub = (q.subject || '').trim().toLowerCase();
    return qSub === cleanSubject || (qSub && cleanSubject && (qSub.includes(cleanSubject) || cleanSubject.includes(qSub)));
  });

  if (subjectQuestions.length > 0) {
    // Look for ID prefixes from these questions (e.g. Q-BANGLA-01245 -> Q-BANGLA-)
    const prefixCountMap = new Map<string, number>();
    let maxIdNum = 0;
    let mostRecentId = '';

    subjectQuestions.forEach((item) => {
      const idStr = String(item.id || '').toUpperCase().trim();
      const match = idStr.match(/^([A-Z0-9_\-]+?)[-_:]?(\d+)$/);
      if (match) {
        let detectedPrefix = match[1];
        if (!detectedPrefix.endsWith('-') && !detectedPrefix.endsWith('_')) {
          detectedPrefix += '-';
        }
        prefixCountMap.set(detectedPrefix, (prefixCountMap.get(detectedPrefix) || 0) + 1);

        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
          mostRecentId = idStr;
        }
      }
    });

    // Find the most frequently used prefix for this subject
    let dominantPrefix = '';
    let highestCount = 0;
    prefixCountMap.forEach((count, p) => {
      if (count > highestCount) {
        highestCount = count;
        dominantPrefix = p;
      }
    });

    if (dominantPrefix) {
      // Also scan across ALL existing questions for this prefix to avoid any collisions
      let globalMaxNum = maxIdNum;
      existingQuestions.forEach((item) => {
        const idStr = String(item.id || '').toUpperCase().trim();
        if (idStr.startsWith(dominantPrefix)) {
          const suffix = idStr.substring(dominantPrefix.length);
          const match = suffix.match(/^(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > globalMaxNum) {
              globalMaxNum = num;
            }
          }
        }
      });

      return {
        prefix: dominantPrefix,
        nextNumber: globalMaxNum + 1,
        isExisting: true,
        matchCount: subjectQuestions.length,
        lastSavedId: mostRecentId || undefined,
        source: 'database',
      };
    }
  }

  // 2. Check saved prefix mapping in LocalStorage
  const savedMap = getSavedPrefixMap();
  if (savedMap[cleanSubject]) {
    const savedPrefix = savedMap[cleanSubject];
    let maxGlobal = 0;
    existingQuestions.forEach((item) => {
      const idStr = String(item.id || '').toUpperCase().trim();
      if (idStr.startsWith(savedPrefix)) {
        const suffix = idStr.substring(savedPrefix.length);
        const match = suffix.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxGlobal) {
            maxGlobal = num;
          }
        }
      }
    });

    return {
      prefix: savedPrefix,
      nextNumber: maxGlobal > 0 ? maxGlobal + 1 : 1,
      isExisting: maxGlobal > 0,
      matchCount: 0,
      source: 'saved_map',
    };
  }

  // 3. New Subject Fallback: Generate smart proposal and sequence 0001 (or 1)
  const proposed = generateProposedPrefixForSubject(subject);
  let existingPrefixMax = 0;
  existingQuestions.forEach((item) => {
    const idStr = String(item.id || '').toUpperCase().trim();
    if (idStr.startsWith(proposed)) {
      const suffix = idStr.substring(proposed.length);
      const match = suffix.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > existingPrefixMax) {
          existingPrefixMax = num;
        }
      }
    }
  });

  return {
    prefix: proposed,
    nextNumber: existingPrefixMax > 0 ? existingPrefixMax + 1 : 1,
    isExisting: false,
    matchCount: 0,
    source: 'proposed',
  };
};
