import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environmental variables. AI features will fail.");
}

// Construct GoogleGenerativeAI legacy client
const ai = new GoogleGenerativeAI(apiKey || 'mock_key');

export default ai;
