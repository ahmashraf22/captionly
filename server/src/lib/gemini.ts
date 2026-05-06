import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let cachedModel: GenerativeModel | null = null;

/**
 * Returns a singleton gemini-1.5-flash model.
 * Lazy-initialized so process.env is fully populated (by dotenv) before
 * the API key is read.
 */
export function getGeminiModel(): GenerativeModel {
  if (cachedModel) return cachedModel;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in server/.env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return cachedModel;
}
