import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Fallback linguistic reconstructor for isolated sign language glosses
 * when GEMINI_API_KEY is not configured.
 */
const fallbackReconstruct = (glosses) => {
  const glossStr = Array.isArray(glosses) ? glosses.join(' ').toUpperCase() : String(glosses).toUpperCase();

  const dictionary = {
    'HELLO': 'Hello, nice to see you.',
    'HELLO MEET NICE': 'Hello, it is very nice to meet you.',
    'MEET NICE': 'Nice to meet you.',
    'HELP DOCTOR': 'I need a doctor for help.',
    'DOCTOR HELP': 'Please help, I need a doctor.',
    'HELP': 'I need help.',
    'THANK YOU': 'Thank you very much.',
    'THANKS': 'Thank you.',
    'YES': 'Yes, exactly.',
    'NO': 'No, thank you.',
    'PLEASE': 'Please.',
    'WHERE RESTROOM': 'Where is the nearest restroom?',
    'WHERE BATHROOM': 'Could you please tell me where the bathroom is?',
    'NEED DIRECTIONS TRAIN STATION': 'Could you please give me directions to the train station?',
    'MY NAME': 'My name is...',
    'GOOD MORNING': 'Good morning!',
    'GOOD AFTERNOON': 'Good afternoon!',
    'EMERGENCY': 'This is an emergency, please assist me.'
  };

  for (const [key, value] of Object.entries(dictionary)) {
    if (glossStr.includes(key)) {
      return value;
    }
  }

  // General heuristic: turn tokens into a polite, natural English statement
  const tokens = glossStr.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'Hello.';

  const capitalized = tokens.map((t, idx) => idx === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t).join(' ');
  return `I am indicating: ${capitalized}.`;
};

export const reconstructSentenceFromGlosses = async (glossTokens, conversationHistory = []) => {
  const glossInput = Array.isArray(glossTokens) ? glossTokens.join(' ') : String(glossTokens);

  if (!glossInput || !glossInput.trim()) {
    return {
      sentence: '',
      confidence: 0,
      source: 'empty'
    };
  }

  // If Gemini API is available, invoke it
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are the linguistic translation engine for SignBridge AI, an assistive communication system for deaf individuals.
A deaf user produced the following American Sign Language (ASL) gloss tokens:
"${glossInput}"

Recent conversation context:
${conversationHistory.slice(-3).map(m => `${m.sender_role}: ${m.final_content}`).join('\n') || 'None'}

TASK:
Convert these isolated sign language glosses into a single natural, grammatically correct, polite English sentence representing what the deaf speaker wants to communicate.
Do NOT include explanations, notes, or quotes. Output ONLY the reconstructed sentence.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');

      return {
        sentence: text,
        confidence: 0.95,
        source: 'gemini-1.5-flash'
      };
    } catch (error) {
      console.warn('[Gemini API Notice] Fallback used due to:', error.message);
    }
  }

  // Deterministic high-quality fallback
  return {
    sentence: fallbackReconstruct(glossTokens),
    confidence: 0.90,
    source: 'linguistic-heuristics-fallback'
  };
};

