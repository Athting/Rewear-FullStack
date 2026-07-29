import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environmental variables. AI features will fail.");
}

// Construct GoogleGenerativeAI legacy client
const ai = new GoogleGenerativeAI(apiKey || 'mock_key');

export default ai;
