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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert Bangladeshi competitive exam (BCS, Primary Teacher, NTRCA, Admission) question parser.
Extract all multiple choice questions (MCQs) from the provided unformatted Bengali text.
For each question, accurately extract or determine:
1. question: The clear question text in Bengali.
2. option_a: Option A text.
3. option_b: Option B text.
4. option_c: Option C text.
5. option_d: Option D text.
6. correct_answer: Must be strictly one of: "option_a", "option_b", "option_c", or "option_d".
7. explanation: Clear, educational explanation in Bengali explaining why the answer is correct and providing relevant background context.
8. subject: Subject or category (e.g., "${defaultSubject || 'সাধারণ'}").

Here is the raw unformatted text:
${text}`,
      config: {
        systemInstruction:
          'Extract questions cleanly into a structured JSON array matching schema. Do not output markdown backticks if possible.',
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

    let jsonText = response.text?.trim() || '[]';
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse error from Gemini extraction output:', jsonText);
      return res.status(500).json({ error: 'এআই থেকে প্রাপ্ত উত্তর সঠিক JSON ফরম্যাটে নেই।' });
    }

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

// 2. AI Question Generator from Topic
const handleGenerateQuestions = async (req: express.Request, res: express.Response) => {
  try {
    const { topic, subject, count = 5 } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'টপিকের নাম দেওয়া বাধ্যতামূলক।' });
    }

    const ai = getGeminiClient();
    const numQuestions = Math.min(Math.max(Number(count) || 5, 1), 25);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate exactly ${numQuestions} high-quality, authentic Bengali MCQs for the topic "${topic}" (Subject: ${
        subject || 'সাধারণ জ্ঞান'
      }).
Requirements:
1. Each question must be clear, accurate, and suitable for BCS, NTRCA, Primary Teacher or university admission exams.
2. Provide 4 distinct options (option_a, option_b, option_c, option_d).
3. Set correct_answer strictly to one of: "option_a", "option_b", "option_c", or "option_d".
4. Provide a detailed, highly informative explanation (explanation) in Bengali under each question explaining the concept clearly.
5. Set subject to "${subject || 'সাধারণ'}".`,
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

    let jsonText = response.text?.trim() || '[]';
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    let generatedQuestions = [];
    try {
      generatedQuestions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse error from Gemini generated output:', jsonText);
      return res.status(500).json({ error: 'এআই দিয়ে প্রশ্ন তৈরির আউটপুট প্রসেস করতে সমস্যা হয়েছে।' });
    }

    return res.json({ success: true, questions: generatedQuestions });
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
