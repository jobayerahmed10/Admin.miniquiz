import { Question } from '../types';
import { WorkingQuestion, DuplicateCheckResult, AiAutoGenerateConfig } from '../types/questionBank';
import { getDefaultSubjectPrefix } from './supabase';

/**
 * Detects if a given string contains Arabic characters
 */
export const isArabicText = (text?: string | null): boolean => {
  if (!text) return false;
  // Arabic Unicode ranges: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

/**
 * Returns text direction ('rtl' or 'ltr') based on language or content
 */
export const getLanguageDirection = (
  language?: string | null,
  content?: string | null
): 'rtl' | 'ltr' => {
  if (language === 'العربية' || language === 'আরবি' || language === 'Arabic') {
    return 'rtl';
  }
  if (content && isArabicText(content)) {
    return 'rtl';
  }
  return 'ltr';
};

/**
 * Maps subject to Smart Batch Prefix
 */
export const getSmartPrefixForSubject = (subjectName?: string): string => {
  if (!subjectName || !subjectName.trim()) return 'Q-BANGLA-';
  const sub = subjectName.trim().toLowerCase();

  if (sub.includes('বাংলা') || sub.includes('bangla')) return 'Q-BANGLA-';
  if (sub.includes('ইংরেজি') || sub.includes('english')) return 'Q-ENGLISH-';
  if (sub.includes('গণিত') || sub.includes('math')) return 'Q-MATH-';
  if (sub.includes('সাধারণ জ্ঞান') || sub.includes('gk')) return 'Q-GK-';
  if (sub.includes('বাংলাদেশ') || sub.includes('bangladesh')) return 'Q-BD-';
  if (sub.includes('আন্তর্জাতিক') || sub.includes('international')) return 'Q-INT-';
  if (sub.includes('বিজ্ঞান') || sub.includes('science')) return 'Q-SCIENCE-';
  if (sub.includes('কম্পিউটার') || sub.includes('তথ্যপ্রযুক্তি') || sub.includes('ict')) return 'Q-ICT-';
  if (sub.includes('ভূগোল') || sub.includes('পরিবেশ') || sub.includes('geography')) return 'Q-GEO-';
  if (sub.includes('ইসলাম') || sub.includes('দ্বীন')) return 'Q-ISLAM-';
  if (sub.includes('আরবি') || sub.includes('arabic') || sub.includes('العربية')) return 'Q-ARABIC-';
  if (sub.includes('কুরআন') || sub.includes('হাদিস') || sub.includes('তাফসির')) return 'Q-QURAN-';
  if (sub.includes('ফিকহ') || sub.includes('fiqh')) return 'Q-FIQH-';

  return getDefaultSubjectPrefix(subjectName);
};

/**
 * Calculates the next sequential integer for a given prefix
 */
export const getNextNumberForPrefix = (
  prefix: string,
  existingQuestions: Question[] = []
): number => {
  let cleanPrefix = prefix.trim().toUpperCase();
  if (!/[-\_:\.]$/.test(cleanPrefix)) {
    cleanPrefix += '-';
  }

  let maxNum = 1245; // Start baseline reference as in screenshots (e.g. 01246)
  existingQuestions.forEach((item) => {
    const idStr = String(item.id || '').toUpperCase();
    if (idStr.startsWith(cleanPrefix)) {
      const suffix = idStr.substring(cleanPrefix.length);
      const match = suffix.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  return maxNum + 1;
};

/**
 * Formats prefix and number into standard sequential ID string (e.g. Q-BANGLA-01246)
 */
export const formatSequentialId = (prefix: string, num: number): string => {
  let cleanPrefix = prefix.trim().toUpperCase();
  if (!/[-\_:\.]$/.test(cleanPrefix)) {
    cleanPrefix += '-';
  }
  const padded = String(num).padStart(5, '0');
  return `${cleanPrefix}${padded}`;
};

/**
 * String similarity using token Jaccard + Levenshtein ratio
 */
export const computeStringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  const s1 = str1.trim().toLowerCase().replace(/[^\w\u0980-\u09FF\u0600-\u06FF]/g, ' ');
  const s2 = str2.trim().toLowerCase().replace(/[^\w\u0980-\u09FF\u0600-\u06FF]/g, ' ');

  if (s1 === s2) return 1.0;

  const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 1));
  const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
};

/**
 * Comprehensive Duplicate & Quality Validation Engine
 */
export const validateAndCheckDuplicates = (
  workingQuestions: WorkingQuestion[],
  existingBank: Question[] = []
): {
  checkedQuestions: WorkingQuestion[];
  summary: DuplicateCheckResult;
} => {
  let exactMatchCount = 0;
  let similarMatchCount = 0;
  let emptyQuestionCount = 0;
  let missingOptionCount = 0;
  let missingAnswerCount = 0;
  let noExplanationCount = 0;
  let validCount = 0;

  const details: DuplicateCheckResult['details'] = [];

  const checkedQuestions = workingQuestions.map((wq, idx) => {
    let isDuplicate = false;
    let duplicateReason = '';
    let duplicateMatchId: string | number | undefined;
    let duplicateScore = 0;
    let hasErrors = false;
    let errorMessage = '';

    const qText = (wq.question || '').trim();

    // 1. Empty question check
    if (!qText) {
      hasErrors = true;
      errorMessage = 'প্রশ্ন টেক্সট ফাঁকা রাখা যাবে না';
      emptyQuestionCount++;
      details.push({
        tempId: wq.tempId,
        type: 'empty_q',
        message: 'প্রশ্ন টেক্সট পাওয়া যায়নি',
      });
    }

    // 2. Options check
    const optA = (wq.options.A || '').trim();
    const optB = (wq.options.B || '').trim();
    const optC = (wq.options.C || '').trim();
    const optD = (wq.options.D || '').trim();

    if (!optA || !optB || !optC || !optD) {
      hasErrors = true;
      errorMessage = errorMessage || 'ন্যূনতম ৪টি বিকল্প (A, B, C, D) পূর্ণ থাকতে হবে';
      missingOptionCount++;
      details.push({
        tempId: wq.tempId,
        type: 'empty_opt',
        message: 'সবগুলো অপশন পূরণ করা হয়নি',
      });
    }

    // 3. Correct answer check
    if (!wq.correctAnswer || !['A', 'B', 'C', 'D', 'E', 'F'].includes(wq.correctAnswer)) {
      hasErrors = true;
      errorMessage = errorMessage || 'সঠিক উত্তর নির্ধারণ করা হয়নি';
      missingAnswerCount++;
      details.push({
        tempId: wq.tempId,
        type: 'no_ans',
        message: 'সঠিক উত্তর পাওয়া যায়নি',
      });
    }

    // 4. Explanation check (informational)
    if (!wq.explanation || !wq.explanation.trim()) {
      noExplanationCount++;
    }

    // 5. Check against other working questions in the same batch
    for (let i = 0; i < workingQuestions.length; i++) {
      if (i === idx) continue;
      const other = workingQuestions[i];
      const otherText = (other.question || '').trim();
      if (!otherText || !qText) continue;

      if (qText.toLowerCase() === otherText.toLowerCase()) {
        isDuplicate = true;
        duplicateReason = `একই ব্যাচে প্রশ্ন #${i + 1}-এর সাথে হুবহু মিল রয়েছে`;
        duplicateScore = 1.0;
        exactMatchCount++;
        break;
      }

      const sim = computeStringSimilarity(qText, otherText);
      if (sim >= 0.75) {
        isDuplicate = true;
        duplicateReason = `একই ব্যাচে প্রশ্ন #${i + 1}-এর সাথে সাদৃশ্য রয়েছে (${Math.round(sim * 100)}%)`;
        duplicateScore = sim;
        similarMatchCount++;
        break;
      }
    }

    // 6. Check against existing question bank
    if (!isDuplicate && qText) {
      for (const eq of existingBank) {
        const eqText = (eq.question || '').trim();
        if (!eqText) continue;

        if (qText.toLowerCase() === eqText.toLowerCase()) {
          isDuplicate = true;
          duplicateReason = `প্রশ্ন ব্যাংকে বিদ্যমান প্রশ্ন (ID: ${eq.id})-এর সাথে সম্পূর্ণ মিল`;
          duplicateMatchId = eq.id;
          duplicateScore = 1.0;
          exactMatchCount++;
          details.push({
            tempId: wq.tempId,
            type: 'exact',
            message: `ডাটাবেস প্রশ্ন ${eq.id}-এর সাথে ১০০% মিল`,
            matchedWith: String(eq.id),
          });
          break;
        }

        const sim = computeStringSimilarity(qText, eqText);
        if (sim >= 0.75) {
          isDuplicate = true;
          duplicateReason = `প্রশ্ন ব্যাংকে বিদ্যমান প্রশ্ন (ID: ${eq.id})-এর সাথে সাদৃশ্য রয়েছে (${Math.round(sim * 100)}%)`;
          duplicateMatchId = eq.id;
          duplicateScore = sim;
          similarMatchCount++;
          details.push({
            tempId: wq.tempId,
            type: 'similar',
            message: `ডাটাবেস প্রশ্ন ${eq.id}-এর সাথে মিল (${Math.round(sim * 100)}%)`,
            matchedWith: String(eq.id),
          });
          break;
        }
      }
    }

    if (!hasErrors && !isDuplicate) {
      validCount++;
    }

    const arabicDetected = isArabicText(qText) || isArabicText(optA) || wq.language === 'العربية';

    return {
      ...wq,
      isDuplicate,
      duplicateReason,
      duplicateMatchId,
      duplicateScore,
      hasErrors,
      errorMessage,
      isArabic: arabicDetected,
    };
  });

  const totalDuplicates = checkedQuestions.filter((q) => q.isDuplicate).length;

  const summary: DuplicateCheckResult = {
    hasDuplicates: totalDuplicates > 0,
    duplicateCount: totalDuplicates,
    exactMatchCount,
    similarMatchCount,
    emptyQuestionCount,
    missingOptionCount,
    missingAnswerCount,
    noExplanationCount,
    validCount,
    details,
  };

  return { checkedQuestions, summary };
};

/**
 * Intelligent AI Copy-Paste Text Parser
 * Parses single or multi-line questions in Bengali, English, Arabic, or mixed formats.
 */
export const parsePastedQuestionsText = (
  rawText: string,
  defaultMeta: {
    subject: string;
    topic: string;
    post: string;
    language: 'বাংলা' | 'English' | 'العربية';
    questionType: string;
    difficulty: 'সহজ' | 'মাঝারি' | 'কঠিন';
  }
): WorkingQuestion[] => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedList: WorkingQuestion[] = [];

  let currentQ: Partial<WorkingQuestion> | null = null;

  const saveCurrentQ = () => {
    if (currentQ && (currentQ.question || (currentQ.options && Object.keys(currentQ.options).length > 0))) {
      const qText = (currentQ.question || '').trim();
      const isArabic = isArabicText(qText) || defaultMeta.language === 'العربية';

      const options = currentQ.options || { A: '', B: '', C: '', D: '' };
      const optA = (options.A || '').trim();
      const optB = (options.B || '').trim();
      const optC = (options.C || '').trim();
      const optD = (options.D || '').trim();

      const finalCorrect = (currentQ.correctAnswer || 'A') as 'A' | 'B' | 'C' | 'D';
      const hasErrors = !qText || !optA || !optB || !optC || !optD || !currentQ.correctAnswer;
      const errorMessage = hasErrors
        ? !qText
          ? 'প্রশ্ন পাওয়া যায়নি'
          : !currentQ.correctAnswer
          ? 'সঠিক উত্তর পাওয়া যায়নি'
          : 'চারটি বিকল্প অপশন পাওয়া যায়নি'
        : undefined;

      parsedList.push({
        tempId: `parsed_${Date.now()}_${parsedList.length}_${Math.random().toString(36).substring(2, 6)}`,
        question: qText,
        options: {
          A: optA,
          B: optB,
          C: optC,
          D: optD,
        },
        correctAnswer: finalCorrect,
        explanation: (currentQ.explanation || '').trim(),
        reference: (currentQ.reference || '').trim(),
        subject: defaultMeta.subject,
        topic: defaultMeta.topic,
        post: defaultMeta.post,
        language: defaultMeta.language,
        questionType: defaultMeta.questionType,
        difficulty: defaultMeta.difficulty,
        status: 'published',
        hasErrors,
        errorMessage,
        isArabic,
      });
    }
  };

  // Helper patterns
  const questionHeaderPattern = /^(\d+|[১-৯]+|[١-٩]+|Q\s*\d+|প্রশ্ন\s*[\d১-৯]+|سؤال\s*[\d١-٩]+)[\.\:\-\)\s]+(.+)/i;
  const optionAPattern = /^(\(?[Aaকأ১1]\)?[\.\:\-\)\s]+|A\s*[\.\:\-\)])\s*(.+)/i;
  const optionBPattern = /^(\(?[Bbখب২2]\)?[\.\:\-\)\s]+|B\s*[\.\:\-\)])\s*(.+)/i;
  const optionCPattern = /^(\(?[Ccগج৩3]\)?[\.\:\-\)\s]+|C\s*[\.\:\-\)])\s*(.+)/i;
  const optionDPattern = /^(\(?[Ddঘد৪4]\)?[\.\:\-\)\s]+|D\s*[\.\:\-\)])\s*(.+)/i;
  const ansPattern = /(?:Ans|Answer|উত্তর|সঠিক উত্তর|সঠিক|الإجابة|الجواب)\s*[\:\-\=\s]+\(?([A-Da-dক-ঘأ-د১-৪1-4])\)?(?:\s*[\.\:\-\)]?\s*(.*))?/i;
  const expPattern = /(?:Explanation|ব্যাখ্যা|নোট|الشرح|ملاحظة)\s*[\:\-\=\s]+(.+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for new question indicator
    const qMatch = line.match(questionHeaderPattern);
    const isExplicitQ =
      Boolean(qMatch) ||
      line.startsWith('প্রশ্ন:') ||
      line.startsWith('Question:') ||
      line.startsWith('سؤال:');

    if (isExplicitQ) {
      saveCurrentQ();
      const content = qMatch ? qMatch[2] : line.replace(/^(প্রশ্ন:|Question:|سؤال:)\s*/i, '');
      currentQ = {
        question: content.trim(),
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: undefined,
        explanation: '',
      };
      continue;
    }

    if (!currentQ) {
      currentQ = {
        question: line,
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: undefined,
        explanation: '',
      };
      continue;
    }

    // Check options
    const matchA = line.match(optionAPattern);
    if (matchA) {
      if (!currentQ.options) currentQ.options = { A: '', B: '', C: '', D: '' };
      currentQ.options.A = matchA[2].trim();
      continue;
    }

    const matchB = line.match(optionBPattern);
    if (matchB) {
      if (!currentQ.options) currentQ.options = { A: '', B: '', C: '', D: '' };
      currentQ.options.B = matchB[2].trim();
      continue;
    }

    const matchC = line.match(optionCPattern);
    if (matchC) {
      if (!currentQ.options) currentQ.options = { A: '', B: '', C: '', D: '' };
      currentQ.options.C = matchC[2].trim();
      continue;
    }

    const matchD = line.match(optionDPattern);
    if (matchD) {
      if (!currentQ.options) currentQ.options = { A: '', B: '', C: '', D: '' };
      currentQ.options.D = matchD[2].trim();
      continue;
    }

    // Check Answer
    const matchAns = line.match(ansPattern);
    if (matchAns) {
      const rawAns = matchAns[1].toUpperCase();
      let normAns: 'A' | 'B' | 'C' | 'D' = 'A';
      if (['A', '1', '১', 'ক', 'أ'].includes(rawAns)) normAns = 'A';
      else if (['B', '2', '২', 'খ', 'ب'].includes(rawAns)) normAns = 'B';
      else if (['C', '3', '৩', 'গ', 'ج'].includes(rawAns)) normAns = 'C';
      else if (['D', '4', '৪', 'ঘ', 'د'].includes(rawAns)) normAns = 'D';

      currentQ.correctAnswer = normAns;
      if (matchAns[2] && !currentQ.explanation) {
        currentQ.explanation = matchAns[2].trim();
      }
      continue;
    }

    // Check Explanation
    const matchExp = line.match(expPattern);
    if (matchExp) {
      currentQ.explanation = (currentQ.explanation ? currentQ.explanation + ' ' : '') + matchExp[1].trim();
      continue;
    }

    // If options not filled yet and question has text, append line to question or explanation
    if (currentQ.options && currentQ.options.D) {
      currentQ.explanation = (currentQ.explanation ? currentQ.explanation + ' ' : '') + line;
    } else {
      currentQ.question = (currentQ.question ? currentQ.question + ' ' : '') + line;
    }
  }

  saveCurrentQ();

  // If no questions parsed through standard cues, generate fallback parsed question
  if (parsedList.length === 0 && rawText.trim()) {
    parsedList.push({
      tempId: `parsed_${Date.now()}_0`,
      question: rawText.trim().substring(0, 300),
      options: {
        A: 'বিকল্প ১',
        B: 'বিকল্প ২',
        C: 'বিকল্প ৩',
        D: 'বিকল্প ৪',
      },
      correctAnswer: 'A',
      explanation: 'স্বয়ংক্রিয় এআই পার্স করা হয়েছে।',
      subject: defaultMeta.subject,
      topic: defaultMeta.topic,
      post: defaultMeta.post,
      language: defaultMeta.language,
      questionType: defaultMeta.questionType,
      difficulty: defaultMeta.difficulty,
      status: 'published',
      hasErrors: true,
      errorMessage: 'সঠিক উত্তর চিহ্নিত করুন এবং অপশন যাচাই করুন',
      isArabic: isArabicText(rawText),
    });
  }

  return parsedList;
};

/**
 * Intelligent AI Question Generator for Interface 06 & 07
 */
export const generateAiQuestions = (
  config: AiAutoGenerateConfig,
  count = 20
): WorkingQuestion[] => {
  const result: WorkingQuestion[] = [];
  const isArabic = config.language === 'العربية' || config.subject.includes('আরবি') || config.subject.includes('ইসলাম');

  const banglaTemplates = [
    {
      q: "বাংলাদেশের সংবিধানের কোন অনুচ্ছেদে নাগরিকের চিন্তা ও বিবেকের স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে?",
      opts: { A: "৩৯(১) অনুচ্ছেদ", B: "৩৯(২) অনুচ্ছেদ", C: "২৭ অনুচ্ছেদ", D: "৩১ অনুচ্ছেদ" },
      ans: "A" as const,
      exp: "সংবিধানের ৩৯(১) অনুচ্ছেদে চিন্তা ও বিবেকের স্বাধীনতার এবং ৩৯(২) অনুচ্ছেদে বাক-স্বাধীনতা ও ভাব প্রকাশের স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে।"
    },
    {
      q: "'পদ্মা নদীর মাঝি' উপন্যাসের রচয়িতা কে?",
      opts: { A: "মানিক বন্দ্যোপাধ্যায়", B: "শরৎচন্দ্র চট্টোপাধ্যায়", C: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", D: "তারাশঙ্কর বন্দ্যোপাধ্যায়" },
      ans: "A" as const,
      exp: "'পদ্মা নদীর মাঝি' মানিক বন্দ্যোপাধ্যায়ের একটি কালজয়ী উপন্যাস, যা ১৯৩৬ সালে প্রকাশিত হয়।"
    },
    {
      q: "কাজী নজরুল ইসলামের জন্মস্থান কোথায়?",
      opts: { A: "ঢাকা", B: "চট্টগ্রাম", C: "পশ্চিমবঙ্গ (বর্ধমান)", D: "মেদিনীপুর" },
      ans: "C" as const,
      exp: "কাজী নজরুল ইসলাম ১৮৯৯ সালের ২৪ মে ভারতের পশ্চিমবঙ্গের বর্ধমান জেলার চুরুলিয়া গ্রামে জন্মগ্রহণ করেন।"
    },
    {
      q: "বাংলাদেশের জাতীয় ফুল কোনটি?",
      opts: { A: "জবা", B: "শাপলা", C: "পদ্ম", D: "গোলাপ" },
      ans: "B" as const,
      exp: "বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা (Nymphaea nouchali)।"
    },
    {
      q: "কোন বানানটি শুদ্ধ?",
      opts: { A: "মুমূর্ষু", B: "মুর্মুষু", C: "মুমুর্ষু", D: "মুর্মূষু" },
      ans: "A" as const,
      exp: "শুদ্ধ বানান হলো 'মুমূর্ষু' (হ্রস্ব উ, দীর্ঘ ঊ, হ্রস্ব উ)।"
    },
    {
      q: "'সূর্য' শব্দের সমার্থক শব্দ কোনটি?",
      opts: { A: "অদ্রি", B: "অর্ক", C: "অম্বু", D: "মারুত" },
      ans: "B" as const,
      exp: "'অর্ক' শব্দের অর্থ সূর্য। অদ্রি অর্থ পর্বত, অম্বু অর্থ জল এবং মারুত অর্থ বাতাস।"
    },
    {
      q: "বাংলা সাহিত্যের প্রাচীনতম নিদর্শন কোনটি?",
      opts: { A: "চর্যাপদ", B: "শ্রীকৃষ্ণকীর্তন", C: "মঙ্গলকাব্য", D: "গীতাঞ্জলি" },
      ans: "A" as const,
      exp: "বাংলা ভাষার প্রথম কাব্যসংকলন ও প্রাচীনতম নিদর্শন হলো চর্যাপদ।"
    },
    {
      q: "মুক্তিযুদ্ধকালে বাংলাদেশকে কয়টি সেক্টরে বিভক্ত করা হয়েছিল?",
      opts: { A: "৮টি", B: "১০টি", C: "১১টি", D: "১২টি" },
      ans: "C" as const,
      exp: "১৯৭১ সালের মুক্তিযুদ্ধে সমগ্র বাংলাদেশকে ১১টি প্রশাসনিক ও সামরিক সেক্টরে বিভক্ত করা হয়েছিল।"
    },
    {
      q: "বিশ্ব পরিবেশ দিবস কবে পালিত হয়?",
      opts: { A: "৫ জুন", B: "২২ এপ্রিল", C: "১ মে", D: "৮ মার্চ" },
      ans: "A" as const,
      exp: "প্রতি বছর ৫ জুন বিশ্বব্যাপী পরিবেশ সচেতনতা বৃদ্ধিতে বিশ্ব পরিবেশ দিবস পালিত হয়।"
    },
    {
      q: "কোন গ্যাস বায়ুমণ্ডলে সবচেয়ে বেশি পরিমাণে বিদ্যমান?",
      opts: { A: "অক্সিজেন", B: "নাইট্রোজেন", C: "কার্বন ডাই অক্সাইড", D: "আর্গন" },
      ans: "B" as const,
      exp: "বায়ুমণ্ডলে নাইট্রোজেনের পরিমাণ প্রায় ৭৮.০৮%।"
    }
  ];

  const arabicTemplates = [
    {
      q: "ما هي عاصمة جمهورية بنغلاديش الشعبية؟",
      opts: { A: "دكا", B: "شيتاغونغ", C: "سلهت", D: "خولنا" },
      ans: "A" as const,
      exp: "دكا هي العاصمة وأكبر مدينة في بنغلاديش والمركز الاقتصادي والثقافي الرئيسي."
    },
    {
      q: "من هو خاتم الأنبياء والمرسلين؟",
      opts: { A: "النبي محمد ﷺ", B: "النبي إبراهيم عليه السلام", C: "النبي موسى عليه السلام", D: "النبي عيسى عليه السلام" },
      ans: "A" as const,
      exp: "محمد صلى الله عليه وسلم هو خاتم الأنبياء والمرسلين الذي أرسله الله رحمة للعالمين."
    },
    {
      q: "كم عدد سور القرآن الكريم؟",
      opts: { A: "١١٤ سورة", B: "١١٢ سورة", C: "١١٠ سور", D: "١٢٠ سورة" },
      ans: "A" as const,
      exp: "يحتوي القرآن الكريم على ١١٤ سورة، تبدأ بسورة الفاتحة وتنتهي بسورة الناس."
    },
    {
      q: "ما هو الركن الثاني من أركان الإسلام؟",
      opts: { A: "الشهادتان", B: "إقام الصلاة", C: "إيتاء الزكاة", D: "صوم رمضان" },
      ans: "B" as const,
      exp: "الصلاة هي الركن الثاني من أركان الإسلام وعمود الدين."
    },
    {
      q: "ما هو الجمع لكلمة 'كتاب' في اللغة العربية؟",
      opts: { A: "كتب", B: "كتائب", C: "كتابات", D: "مكاتب" },
      ans: "A" as const,
      exp: "جمع كلمة كتاب هو كُتُب وهو جمع تكسير قياسي."
    }
  ];

  const englishTemplates = [
    {
      q: "What is the synonym of the word 'Lucid'?",
      opts: { A: "Clear", B: "Obscure", C: "Vague", D: "Ambiguous" },
      ans: "A" as const,
      exp: "'Lucid' means expressed clearly or easy to understand."
    },
    {
      q: "Identify the correctly spelled word:",
      opts: { A: "Accommodation", B: "Acommodation", C: "Accomodation", D: "Acomodation" },
      ans: "A" as const,
      exp: "The correct spelling is 'Accommodation' with double 'c' and double 'm'."
    },
    {
      q: "Choose the appropriate preposition: He is good ___ Mathematics.",
      opts: { A: "at", B: "in", C: "for", D: "with" },
      ans: "A" as const,
      exp: "The idiom 'good at' is used to express proficiency in a particular subject or skill."
    }
  ];

  const templates = isArabic
    ? arabicTemplates
    : config.language === 'English'
    ? englishTemplates
    : banglaTemplates;

  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const isArab = isArabic || isArabicText(t.q);

    result.push({
      tempId: `gen_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      question: `${t.q}${i >= templates.length ? ` (ভ্যারিয়েন্ট ${Math.floor(i / templates.length) + 1})` : ''}`,
      options: { ...t.opts },
      correctAnswer: t.ans,
      explanation: t.exp,
      reference: `${config.post || 'BCS/NTRCA'} সিলেবাস অনুযায়ী`,
      subject: config.subject || (isArab ? 'আরবি' : 'বাংলা'),
      topic: config.topic || (isArab ? 'عام' : 'সাহিত্য'),
      post: config.post || 'বিসিএস ক্যাডার (BCS)',
      language: config.language,
      questionType: config.questionType || 'MCQ (একটি সঠিক উত্তর)',
      difficulty: config.difficulty || 'মাঝারি',
      status: 'published',
      isArabic: isArab,
    });
  }

  return result;
};
