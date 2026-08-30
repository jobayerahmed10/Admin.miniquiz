// Central Subject Manager for Tamreen Academy Admin Panel
// Ensures persistent custom subjects, unified subject lists across all components,
// subject name sanitization, case-insensitive trimmed matching, and eliminates
// unwanted placeholders or duplicate grouping cards.

export const BASE_SUBJECTS = [
  'কুরআন মাজিদ',
  'উলুমুল কুরআন',
  'হাদিস শরিফ',
  'উলুমুল হাদিস',
  'ফিকহ',
  'উসূলুল ফিকহ',
  'আকাইদ',
  'আরবি সাহিত্য',
  'আরবি ব্যাকরণ',
  'বাংলা ব্যাকরণ',
  'বাংলা সাহিত্য',
  'ইংরেজি ব্যাকরণ',
  'ইংরেজি সাহিত্য',
  'GK- বাংলাদেশ বিষয়াবলি',
  'আন্তর্জাতিক বিষয়াবলি',
];

/**
 * Known subject alias map to automatically normalize English / Transliterated / Alternate labels
 * to their standard canonical representations.
 */
export const SUBJECT_ALIAS_MAP: Record<string, string> = {
  'english': 'ইংরেজি সাহিত্য',
  'english literature': 'ইংরেজি সাহিত্য',
  'english grammar': 'ইংরেজি ব্যাকরণ',
  'ইংরেজি': 'ইংরেজি ব্যাকরণ',
  'bangla': 'বাংলা সাহিত্য',
  'bengali': 'বাংলা সাহিত্য',
  'bangla grammar': 'বাংলা ব্যাকরণ',
  'বাংলা': 'বাংলা ব্যাকরণ',
  'math': 'গণিত',
  'mathematics': 'গণিত',
  'gk': 'GK- বাংলাদেশ বিষয়াবলি',
  'general knowledge': 'GK- বাংলাদেশ বিষয়াবলি',
  'বাংলাদেশ বিষয়াবলী': 'GK- বাংলাদেশ বিষয়াবলি',
  'বাংলাদেশ বিষয়াবলি': 'GK- বাংলাদেশ বিষয়াবলি',
  'আন্তর্জাতিক বিষয়াবলী': 'আন্তর্জাতিক বিষয়াবলি',
  'international affairs': 'আন্তর্জাতিক বিষয়াবলি',
  'arabic': 'আরবি সাহিত্য',
  'arabic literature': 'আরবি সাহিত্য',
  'arabic grammar': 'আরবি ব্যাকরণ',
  'আরবি': 'আরবি সাহিত্য',
  'العربية': 'আরবি সাহিত্য',
  'quran': 'কুরআন মাজিদ',
  'কুরআন': 'কুরআন মাজিদ',
  'আল কুরআন ও হাদিস': 'কুরআন মাজিদ',
  'আল কুরআন ও তাফসির': 'কুরআন মাজিদ',
  'hadith': 'হাদিস শরিফ',
  'হাদিস': 'হাদিস শরিফ',
  'ইসলাম শিক্ষা': 'ফিকহ',
  'fiqh': 'ফিকহ',
  'usulul fiqh': 'উসূলুল ফিকহ',
  'উসুলুল': 'উসূলুল ফিকহ',
  'উসুলুল ফিকহ': 'উসূলুল ফিকহ',
  'aqida': 'আকাইদ',
  'আকীদা': 'আকাইদ',
};

const STORAGE_KEY = 'miniquiz_custom_subjects';

/**
 * Sanitize & Normalize a Subject Name:
 * - Trims leading & trailing whitespace
 * - Collapses multiple spaces
 * - Maps known English/alternate names to canonical Bengali/Standard form
 * - Matches BASE_SUBJECTS case-insensitively
 */
export const sanitizeSubjectName = (subject?: string | null): string => {
  if (!subject) return 'বাংলা';
  const clean = String(subject).replace(/\s+/g, ' ').trim();
  if (!clean || clean === 'সাধারণ' || clean === 'সকল বিষয়') return 'বাংলা';

  const lower = clean.toLowerCase();
  if (SUBJECT_ALIAS_MAP[lower]) {
    return SUBJECT_ALIAS_MAP[lower];
  }

  // Check against BASE_SUBJECTS case-insensitively
  const match = BASE_SUBJECTS.find((b) => b.toLowerCase() === lower);
  if (match) return match;

  return clean;
};

/**
 * Returns a normalized key for case-insensitive and whitespace-insensitive comparison
 */
export const getSubjectNormalizedKey = (subject?: string | null): string => {
  return sanitizeSubjectName(subject).toLowerCase();
};

/**
 * Checks whether two subjects are identical (case-insensitive & whitespace trimmed)
 */
export const isSameSubject = (subjA?: string | null, subjB?: string | null): boolean => {
  if (!subjA && !subjB) return true;
  if (!subjA || !subjB) return false;
  return getSubjectNormalizedKey(subjA) === getSubjectNormalizedKey(subjB);
};

/**
 * Group any items by sanitized subject name, dynamically summing counts and merging duplicates
 */
export const groupItemsBySanitizedSubject = <T extends { subject?: string | null }>(
  items: T[]
): { name: string; count: number; items: T[] }[] => {
  const map = new Map<string, { name: string; count: number; items: T[] }>();

  items.forEach((item) => {
    const canonicalName = sanitizeSubjectName(item.subject);
    const key = canonicalName.toLowerCase();

    if (!map.has(key)) {
      map.set(key, { name: canonicalName, count: 0, items: [] });
    }
    const entry = map.get(key)!;
    entry.count += 1;
    entry.items.push(item);
  });

  return Array.from(map.values());
};

/**
 * Retrieve user-defined custom subjects from localStorage
 */
export const getCustomSubjects = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (s) => typeof s === 'string' && s.trim() && s !== 'সাধারণ' && s !== 'সকল বিষয়'
        )
        .map((s) => sanitizeSubjectName(s));
    }
    return [];
  } catch (err) {
    console.warn('Error reading custom subjects from localStorage:', err);
    return [];
  }
};

/**
 * Add a new custom subject and notify listeners
 */
export const addCustomSubject = (newSubject: string): string[] => {
  const sanitized = sanitizeSubjectName(newSubject);
  if (!sanitized || sanitized === 'সাধারণ' || sanitized === 'সকল বিষয়') {
    return getCustomSubjects();
  }

  const existing = getCustomSubjects();
  const lowerNew = sanitized.toLowerCase();
  const alreadyExists =
    existing.some((s) => s.toLowerCase() === lowerNew) ||
    BASE_SUBJECTS.some((b) => b.toLowerCase() === lowerNew);

  if (!alreadyExists) {
    const updated = [...existing, sanitized];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom subject:', e);
    }
    window.dispatchEvent(new CustomEvent('custom_subjects_updated', { detail: updated }));
    return updated;
  }
  return existing;
};

/**
 * Delete a custom subject from localStorage
 */
export const deleteCustomSubject = (subjectToDelete: string): string[] => {
  const targetKey = getSubjectNormalizedKey(subjectToDelete);
  const existing = getCustomSubjects();
  const updated = existing.filter((s) => getSubjectNormalizedKey(s) !== targetKey);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting custom subject:', e);
  }
  window.dispatchEvent(new CustomEvent('custom_subjects_updated', { detail: updated }));
  return updated;
};

/**
 * Returns a clean, deduplicated, sorted list of all available subjects
 * combining BASE_SUBJECTS + user custom subjects + any additional subjects from DB questions.
 */
export const getAllSubjects = (additionalSubjects?: (string | null | undefined)[]): string[] => {
  const custom = getCustomSubjects();
  const fromExtra = (additionalSubjects || [])
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => sanitizeSubjectName(s))
    .filter((s) => s !== 'সাধারণ' && s !== 'সকল বিষয়' && s.length > 0);

  const combined = [...BASE_SUBJECTS, ...custom, ...fromExtra];
  
  // Deduplicate case-insensitively while preserving canonical Bengali names
  const canonicalMap = new Map<string, string>();
  combined.forEach((sub) => {
    const canonical = sanitizeSubjectName(sub);
    const key = canonical.toLowerCase();
    if (!canonicalMap.has(key)) {
      canonicalMap.set(key, canonical);
    }
  });

  // Exclude unwanted placeholders
  canonicalMap.delete('সাধারণ'.toLowerCase());
  canonicalMap.delete('সকল বিষয়'.toLowerCase());
  canonicalMap.delete('');

  return Array.from(canonicalMap.values());
};
