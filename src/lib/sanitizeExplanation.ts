/**
 * Sanitizes explanation text so that:
 * - Empty / null / whitespace returns ''
 * - Explanations that just repeat the answer (e.g. "উত্তর: ক", "Ans: A", "সঠিক উত্তর: খ") are cleared to ''
 * - Explanations that just equal one of the options (A, B, C, D) are cleared to ''
 * - If an answer label contains an explicit explanation (e.g. "উত্তর: ক ব্যাখ্যা: এটি একটি কারণ"), only the explanation part is extracted.
 * - Otherwise genuine explanations are preserved.
 */
export const sanitizeExplanation = (
  explanation: string | null | undefined,
  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    [key: string]: any;
  }
): string => {
  if (!explanation) return '';
  let clean = explanation.trim();
  if (!clean) return '';

  const optTexts = options
    ? [
        options.A || options.option_a || '',
        options.B || options.option_b || '',
        options.C || options.option_c || '',
        options.D || options.option_d || '',
      ]
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const lower = clean.toLowerCase();

  // If explanation is literally one of the options (e.g. user or parser set explanation = option text)
  if (optTexts.length > 0 && optTexts.includes(lower)) {
    return '';
  }

  // If explanation is purely an option letter e.g. "ক", "A", "(B)", "১.", "[ক]"
  if (/^[\(\[\{]?[কখগঘa-dA-D1-4أ-د][\)\]\}]?[\.\:\-\s]*$/.test(clean)) {
    return '';
  }

  // If explanation is just an answer label like "উত্তর: ক", "Ans: A", "সঠিক উত্তর: option_a", "সঠিক: খ"
  if (/^(?:(?:সঠিক\s*)?উত্তর|Ans(?:wer)?|الإجابة|الجواب|Correct\s*Answer)[\:\-\=\s]*(?:[\(\[\{]?[কখগঘa-dA-D1-4أ-د][\)\]\}]?[\.\:\-\s]*)?$/i.test(clean)) {
    return '';
  }

  // If it starts with answer label e.g. "উত্তর: ক. ঢাকা" or "উত্তর: ক (ঢাকা)"
  if (/^(?:(?:সঠিক\s*)?উত্তর|Ans(?:wer)?|الإجابة|الجواب|Correct\s*Answer)[\:\-\=\s]+/i.test(clean)) {
    const explicitExpMatch = clean.match(/(?:ব্যাখ্যা|Explanation|নোট|Note|الشرح|ملاحظة)[\:\-\=\s]+(.+)/i);
    if (explicitExpMatch) {
      return explicitExpMatch[1].trim();
    }
    // Check if what follows is an option text or empty
    const stripped = clean.replace(/^(?:(?:সঠিক\s*)?উত্তর|Ans(?:wer)?|الإجابة|الجواب|Correct\s*Answer)[\:\-\=\s]+(?:[\(\[\{]?[কখগঘa-dA-D1-4أ-د][\)\]\}]?[\.\:\-\s]*)?/i, '').trim();
    if (!stripped || (optTexts.length > 0 && optTexts.includes(stripped.toLowerCase()))) {
      return '';
    }
    return '';
  }

  return clean;
};
