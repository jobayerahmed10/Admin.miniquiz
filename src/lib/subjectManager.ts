// Central Subject Manager for Tamreen Academy Admin Panel
// Ensures persistent custom subjects, unified subject lists across all components,
// and eliminates any unwanted 'সাধারণ' or 'সকল বিষয়' placeholders.

export const BASE_SUBJECTS = [
  'বাংলা',
  'বাংলা ভাষা ও সাহিত্য',
  'ইংরেজি',
  'গণিত',
  'সাধারণ জ্ঞান',
  'বাংলাদেশ বিষয়াবলী',
  'আন্তর্জাতিক বিষয়াবলী',
  'বিজ্ঞান',
  'কম্পিউটার ও তথ্যপ্রযুক্তি',
  'ভূগোল ও পরিবেশ',
  'নৈতিকতা ও সুশাসন',
  'আল কুরআন ও হাদিস',
  'আল কুরআন ও তাফসির',
  'ইসলাম শিক্ষা',
  'আরবি',
  'সহকারী মৌলভী',
  'ইবতেদায়ী মৌলবি',
];

const STORAGE_KEY = 'miniquiz_custom_subjects';

/**
 * Retrieve user-defined custom subjects from localStorage
 */
export const getCustomSubjects = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s) => typeof s === 'string' && s.trim() && s !== 'সাধারণ' && s !== 'সকল বিষয়'
      );
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
  const trimmed = newSubject.trim();
  if (!trimmed || trimmed === 'সাধারণ' || trimmed === 'সকল বিষয়') {
    return getCustomSubjects();
  }

  const existing = getCustomSubjects();
  if (!existing.includes(trimmed) && !BASE_SUBJECTS.includes(trimmed)) {
    const updated = [...existing, trimmed];
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
  const existing = getCustomSubjects();
  const updated = existing.filter((s) => s !== subjectToDelete);
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
    .map((s) => s.trim())
    .filter((s) => s !== 'সাধারণ' && s !== 'সকল বিষয়');

  const combinedSet = new Set<string>([...BASE_SUBJECTS, ...custom, ...fromExtra]);

  // Exclude unwanted placeholders
  combinedSet.delete('সাধারণ');
  combinedSet.delete('সকল বিষয়');
  combinedSet.delete('');

  return Array.from(combinedSet);
};
