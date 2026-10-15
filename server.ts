import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Simple lazy initialization function for GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets/Settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10kb' }));

  // shortcut: in-memory per-IP limit, resets on restart and is per-instance; move to Redis if scaled out
  const hits = new Map<string, { count: number; reset: number }>();
  const RATE_LIMIT = 20; // requests per IP per minute
  const rateLimit = (req: any, res: any, next: any) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + 60_000 });
      if (hits.size > 10_000) hits.clear();
      return next();
    }
    if (++entry.count > RATE_LIMIT) {
      return res.status(429).json({ error: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' });
    }
    next();
  };
  app.use('/api', rateLimit);

  // API Paraphrase Endpoint Handler
  const handleParaphraseRequest = async (req: any, res: any) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }
      if (text.length > 1000) {
        return res.status(400).json({ error: 'Văn bản quá dài (tối đa 1000 ký tự).' });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        console.error('Gemini Client Initialization Failed:', err.message);
        return res.status(503).json({ 
          error: 'Gemini API client is not configured. Please ensure GEMINI_API_KEY is provided in the Settings.' 
        });
      }

      const prompt = `Input: ${text}`;
      const systemInstruction = `You are an IELTS C1/C2 English Paraphrasing and Vocabulary Upgrading Assistant.
Your task is to generate progressively more advanced English paraphrases or upgraded words for any Vietnamese or English input (word, phrase, or sentence).

Rules:
* Automatically detect the input language and input type:
  - If the input is a single word or short vocabulary term (e.g. "happy", "improve", "beautiful"), you MUST ONLY upgrade the vocabulary. Do NOT generate full sentences. 
    Example for "improve": B2: "enhance", C1: "ameliorate", C1+: "elevate", C2: "rectify/refine".
  - If the input is a phrase or sentence, generate progressive phrase/sentence-level paraphrases.
* If the input is in Vietnamese, translate it to English first.
* Progress naturally from B2 to C2 in vocabulary, collocations, and sentence complexity.
* Use native-like academic English suitable for IELTS Writing Task 2 and Speaking Part 3.
* Preserve the original meaning perfectly.
* For every paraphrase level (b2, c1, c1_plus, c2), you MUST provide a natural Vietnamese translation/meaning so the user understands the exact nuance.
* Extract 3 to 5 key advanced words or collocations used in your paraphrases. For each, provide its word type (part of speech in Vietnamese), level (B2, C1, C1+, C2), and precise Vietnamese meaning.

You must respond with a JSON object in exactly this schema:
{
  "original": "The detected or translated original English text representing the input",
  "original_vietnamese": "The Vietnamese meaning of the original text",
  "b2": "B2 level paraphrase (or upgraded word if input is a single word)",
  "b2_vietnamese": "Nghĩa tiếng Việt của câu hoặc từ cấp độ B2",
  "c1": "C1 level paraphrase (or upgraded word if input is a single word)",
  "c1_vietnamese": "Nghĩa tiếng Việt của câu hoặc từ cấp độ C1",
  "c1_plus": "C1+ level paraphrase (or upgraded word if input is a single word)",
  "c1_plus_vietnamese": "Nghĩa tiếng Việt của câu hoặc từ cấp độ C1+",
  "c2": "C2 level paraphrase (or upgraded word if input is a single word)",
  "c2_vietnamese": "Nghĩa tiếng Việt của câu hoặc từ cấp độ C2",
  "vocabulary": [
    {
      "word": "English word or collocation used",
      "type": "Word type in Vietnamese (e.g., danh từ, động từ, tính từ, cụm từ, trạng từ)",
      "level": "CEFR Level (B2, C1, C1+, C2)",
      "meaning": "Vietnamese meaning"
    }
  ]
}

Ensure the output is valid JSON, containing only these keys.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.0,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      // Try to parse the response as JSON
      try {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      } catch (e) {
        console.error('Failed to parse Gemini JSON output:', responseText);
        // Fallback or retry logic if needed, but usually 3.5-flash with mime-type is 100% JSON compliant.
        return res.status(500).json({ 
          error: 'Received invalid formatting from the AI. Please try again.',
          raw: responseText 
        });
      }

    } catch (error: any) {
      console.error('Paraphrase API Error:', error);
      return res.status(500).json({ error: error.message || 'An error occurred during paraphrasing.' });
    }
  };

  app.post('/api/paraphrase', handleParaphraseRequest);
  app.post('/api/process', handleParaphraseRequest);
  app.post('/api/suggestions', handleParaphraseRequest);

  // Serve Frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
