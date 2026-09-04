import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for API routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API Request] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Server-side Gemini client helper
function getGeminiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY কনফিগার করা হয়নি। AI Studio-র Settings > Secrets-এ GEMINI_API_KEY যুক্ত করুন।');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Question Extraction from pasted text
const handleExtractQuestions = async (req: express.Request, res: express.Response) => {
  try {
    const { text, defaultSubject } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'টেক্সট ইনপুট দেওয়া বাধ্যতামূলক।' });
    }

    const ai = getGeminiClient();

    const promptText = `You are an expert multi-lingual exam question parser specializing in Bangladeshi competitive exams (BCS, Primary Teacher, NTRCA, Admission), Islamic Studies, Arabic, English, and General Knowledge.
Extract all multiple choice questions (MCQs) from the provided raw text.
The raw text may be in Bengali, Arabic, English, or mixed languages.

Parsing Rules:
1. "question": Extract the clear question text in its original script/language (Bengali, Arabic, English, etc.).
2. "option_a": Option A / ক / أ text.
3. "option_b": Option B / খ / ب text.
4. "option_c": Option C / গ / ج text.
5. "option_d": Option D / ঘ / د text.
6. "correct_answer": Must be strictly one of: "option_a", "option_b", "option_c", or "option_d".
   - Map Option A / ক / 1 / أ -> "option_a"
   - Map Option B / খ / 2 / ب -> "option_b"
   - Map Option C / গ / 3 / ج -> "option_c"
   - Map Option D / ঘ / 4 / د -> "option_d"
   - Recognize Arabic answer indicators like "الإجابة الصحيحة", "الجواب", "الإجابة".
7. "explanation": Extract ONLY IF an explicit explanation, note, or commentary already exists in the raw text (e.g. marked with "ব্যাখ্যা:", "Explanation:", "নোট:", "Note:", "الشرح:"). If the raw text does NOT include an explanation, you MUST set "explanation" to "" (an empty string). STRICT CRITICAL RULE: NEVER put the answer, correct option text, option letters (like "ক", "A"), or phrases like "উত্তর: ক" in the explanation field. If no explicit explanation is given, leave it completely empty ("").
8. "subject": Must be strictly "${defaultSubject || 'ইংরেজি'}".

Here is the raw unformatted text:
${text}`;

    const generateCall = async (modelName: string) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction:
            'Extract questions cleanly into a structured JSON array matching schema. Preserve Arabic, Bengali, and English characters accurately.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                option_a: { type: Type.STRING },
                option_b: { type: Type.STRING },
                option_c: { type: Type.STRING },
                option_d: { type: Type.STRING },
                correct_answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                subject: { type: Type.STRING },
              },
              required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'],
            },
          },
        },
      });
    };

    let response;
    try {
      response = await generateCall('gemini-2.5-flash');
    } catch (err1) {
      console.warn('gemini-2.5-flash error, falling back to gemini-2.0-flash:', err1);
      response = await generateCall('gemini-2.0-flash');
    }

    let jsonText = response.text?.trim() || '[]';
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse error from Gemini extraction output:', jsonText);
      return res.status(500).json({ error: 'এআই থেকে প্রাপ্ত উত্তর সঠিক JSON ফরম্যাটে নেই।' });
    }

    // Sanitize explanation: Keep empty if no explanation or if it just repeats answer/options
    parsedQuestions = (Array.isArray(parsedQuestions) ? parsedQuestions : []).map((q: any) => {
      let exp = (q.explanation || '').trim();
      const optA = (q.option_a || '').trim();
      const optB = (q.option_b || '').trim();
      const optC = (q.option_c || '').trim();
      const optD = (q.option_d || '').trim();
      const optTexts = [optA.toLowerCase(), optB.toLowerCase(), optC.toLowerCase(), optD.toLowerCase()].filter(Boolean);
      const expLower = exp.toLowerCase();

      // If explanation is identical to one of the options
      if (optTexts.length > 0 && optTexts.includes(expLower)) {
        exp = '';
      } else if (/^[\(\[\{]?[কখগঘa-dA-D1-4أ-د][\)\]\}]?[\.\:\-\s]*$/.test(exp)) {
        // Pure option letter
        exp = '';
      } else if (/^(?:(?:সঠিক\s*)?উত্তর|Ans(?:wer)?|الإجابة|الجواب)[\:\-\=\s]*(?:[\(\[\{]?[কখগঘa-dA-D1-4أ-د][\)\]\}]?[\.\:\-\s]*)?$/i.test(exp)) {
        // Answer label
        exp = '';
      } else if (/^(?:(?:সঠিক\s*)?উত্তর|Ans(?:wer)?|الإجابة|الجواب)[\:\-\=\s]+/i.test(exp)) {
        const explicitExpMatch = exp.match(/(?:ব্যাখ্যা|Explanation|নোট|Note|الشرح|ملاحظة)[\:\-\=\s]+(.+)/i);
        if (explicitExpMatch) {
          exp = explicitExpMatch[1].trim();
        } else {
          exp = '';
        }
      }

      return {
        ...q,
        explanation: exp,
      };
    });

    return res.json({ success: true, questions: parsedQuestions });
  } catch (error: any) {
    console.error('Error extracting questions:', error);
    return res.status(500).json({
      error: error.message || 'এআই দিয়ে প্রশ্ন এক্সট্র্যাক্ট করতে সমস্যা হয়েছে।',
    });
  }
};

app.post('/api/gemini/extract-questions', handleExtractQuestions);
app.post('/api/gemini/extract-questions/', handleExtractQuestions);

// Helper function to generate a batch of questions from Gemini
const generateBatchOfQuestions = async (
  ai: ReturnType<typeof getGeminiClient>,
  topic: string,
  subject: string,
  batchCount: number,
  batchIndex: number
) => {
  const promptText = `Generate exactly ${batchCount} distinct, authentic, high-quality MCQs for topic "${topic}" (Subject: ${
    subject || 'ইংরেজি'
  }). Batch #${batchIndex + 1}.

Requirements:
1. Language requirement: Write questions, options, and explanations in the natural language appropriate for the topic and subject. For example, if the topic or subject is in Arabic or related to Arabic/Islamic Studies (e.g. "كتاب الطهارة", "আরবি প্রভাষক", "আল কুরআন"), write the question text, options, and explanations in Arabic (with vowels/harakat if appropriate). If Bengali or English, write in Bengali or English.
2. Provide 4 distinct options (option_a, option_b, option_c, option_d).
3. Set correct_answer strictly to "option_a", "option_b", "option_c", or "option_d".
4. Provide a helpful explanation (explanation) in the corresponding language under each question.
5. Set subject strictly to "${subject || 'ইংরেজি'}".`;

  const generateCall = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              option_a: { type: Type.STRING },
              option_b: { type: Type.STRING },
              option_c: { type: Type.STRING },
              option_d: { type: Type.STRING },
              correct_answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              subject: { type: Type.STRING },
            },
            required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'],
          },
        },
      },
    });
  };

  let response;
  try {
    response = await generateCall('gemini-2.5-flash');
  } catch (mErr) {
    console.warn('gemini-2.5-flash batch error, falling back to gemini-2.0-flash:', mErr);
    response = await generateCall('gemini-2.0-flash');
  }

  let jsonText = response.text?.trim() || '[]';
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error(`Batch ${batchIndex + 1} JSON parse warning. Output text:`, jsonText);
    // Attempt simple JSON repair if slightly malformed
    const repaired = jsonText.replace(/,\s*\]/, ']').replace(/,\s*\}/, '}');
    try {
      return JSON.parse(repaired);
    } catch (rErr) {
      return [];
    }
  }
};

// 2. AI Question Generator from Topic
const handleGenerateQuestions = async (req: express.Request, res: express.Response) => {
  try {
    const { topic, subject, count = 5 } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'টপিকের নাম দেওয়া বাধ্যতামূলক।' });
    }

    const ai = getGeminiClient();
    const targetCount = Math.min(Math.max(Number(count) || 5, 1), 200);

    // Chunk total count into batches of at most 10 items to prevent token limit truncation
    const BATCH_SIZE = 10;
    const batchSizes: number[] = [];
    let remaining = targetCount;

    while (remaining > 0) {
      const currentBatch = Math.min(remaining, BATCH_SIZE);
      batchSizes.push(currentBatch);
      remaining -= currentBatch;
    }

    // Execute batches in parallel
    const batchResults = await Promise.all(
      batchSizes.map((bSize, idx) =>
        generateBatchOfQuestions(ai, topic.trim(), subject, bSize, idx)
      )
    );

    const allQuestions = batchResults.flat().filter((q) => q && q.question && q.option_a && q.option_b);

    if (allQuestions.length === 0) {
      return res.status(500).json({ error: 'এআই প্রশ্ন জেনারেট করতে পারেনি। টপিক নাম স্পষ্ট করে আবার চেষ্টা করুন।' });
    }

    return res.json({ success: true, questions: allQuestions });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return res.status(500).json({
      error: error.message || 'এআই দিয়ে প্রশ্ন তৈরি করতে সমস্যা হয়েছে।',
    });
  }
};

app.post('/api/gemini/generate-questions', handleGenerateQuestions);
app.post('/api/gemini/generate-questions/', handleGenerateQuestions);

// Catch-all 404 handler for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `এপিআই এন্ডপয়েন্ট পাওয়া যায়নি: ${req.originalUrl}` });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
