// Central Post / Designation Manager for Tamreen Academy Admin Panel
// Supports multiple posts selection, comma-separated parsing, custom posts persistence,
// and flexible filtering across Question Bank and Exams.

import { getLocalSubjectPosts } from './subjectPostManager';

export const BASE_POSTS = [
  'সহকারী শিক্ষক (প্রাইমারি)',
  'প্রভাষক (NTRCA)',
  'সহকারী শিক্ষক (হাইস্কুল)',
  'সহকারী মৌলভী',
  'সহকারী মৌলভী (কারী)',
  'ইবতেদায়ী মৌলবি',
  'ইবতেদায়ী কারী',
  'আরবি প্রভাষক',
  'বিসিএস ক্যাডার (BCS)',
  '১০ম - ২০তম গ্রেড',
  'ব্যাংক কর্মকর্তা (Bank Officer)',
  'অফিস সহকারী',
  'জেনারেল বিষয়',
  'অন্যান্য',
];

const STORAGE_KEY = 'miniquiz_custom_posts';

/**
 * Split a comma-separated post string into a clean, trimmed array of unique posts.
 */
export const parsePosts = (postStr?: string | null): string[] => {
  if (!postStr || !postStr.trim()) return [];
  return postStr
    .split(/[,،]+/) // support standard English comma and Arabic/Bengali comma
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((value, index, self) => self.indexOf(value) === index);
};

/**
 * Format an array of posts into a clean comma-separated string.
 */
export const formatPosts = (posts: string[]): string => {
  if (!posts || posts.length === 0) return '';
  return posts
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index)
    .join(', ');
};

/**
 * Check if a question's post field matches a specific target post.
 */
export const isPostMatch = (questionPost?: string | null, targetPost?: string): boolean => {
  if (!targetPost || targetPost === 'all') return true;
  if (!questionPost) return false;
  const parsed = parsePosts(questionPost).map((p) => p.toLowerCase());
  return parsed.includes(targetPost.toLowerCase().trim());
};

/**
 * Retrieve user-defined custom posts from localStorage
 */
export const getCustomPosts = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s) => typeof s === 'string' && s.trim().length > 0 && !BASE_POSTS.includes(s.trim())
      );
    }
    return [];
  } catch (err) {
    console.warn('Error reading custom posts from localStorage:', err);
    return [];
  }
};

/**
 * Add a new custom post and notify listeners
 */
export const addCustomPost = (newPost: string): string[] => {
  const trimmed = newPost.trim();
  if (!trimmed) {
    return getCustomPosts();
  }

  const existing = getCustomPosts();
  if (!existing.includes(trimmed) && !BASE_POSTS.includes(trimmed)) {
    const updated = [...existing, trimmed];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom post:', e);
    }
    window.dispatchEvent(new CustomEvent('custom_posts_updated', { detail: updated }));
    return updated;
  }
  return existing;
};

/**
 * Returns a clean, deduplicated, sorted list of all available posts
 * combining BASE_POSTS + user custom posts + any additional posts found in DB questions.
 */
export const getAllPosts = (additionalPosts?: (string | null | undefined)[]): string[] => {
  const custom = getCustomPosts();
  const subjectPosts = getLocalSubjectPosts().map((sp) => sp.name);
  const extraPosts: string[] = [];

  if (additionalPosts) {
    for (const postItem of additionalPosts) {
      if (postItem) {
        extraPosts.push(...parsePosts(postItem));
      }
    }
  }

  const combinedSet = new Set<string>([...BASE_POSTS, ...subjectPosts, ...custom, ...extraPosts]);
  combinedSet.delete('');

  return Array.from(combinedSet);
};
