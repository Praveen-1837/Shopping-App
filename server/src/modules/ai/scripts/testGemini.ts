import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const modelsToTest = ['gemini-3.6-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash'];

async function testKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  console.log('Testing Gemini API key:', key ? `${key.slice(0, 8)}...` : 'MISSING');

  if (!key) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(key.trim());

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model "${modelName}"...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello in 3 words');
      console.log(`SUCCESS with model "${modelName}"! Response:`, result.response.text());
      return modelName;
    } catch (error: any) {
      console.error(`Failed with "${modelName}":`, error?.message || error);
    }
  }
}

testKey();
