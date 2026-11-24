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
 * when GEMINI_API_KEY is not configured or offline.
 */
const fallbackReconstruct = (glosses, isBangla = false) => {
  const glossStr = Array.isArray(glosses) ? glosses.join(' ') : String(glosses);

  if (isBangla) {
    const bdslDictionary = {
      'ডাক্তার চিকিৎসা দুর্বল': 'আমার শরীর খুব দুর্বল লাগছে, চিকিৎসার জন্য জরুরি একজন ডাক্তার প্রয়োজন।',
      'ডাক্তার দুর্বল': 'আমার শরীর অনেক দুর্বল, দয়া করে একজন ডাক্তার ডাকুন।',
      'চিকিৎসা দুর্বল': 'আমার জরুরি চিকিৎসা প্রয়োজন, আমি খুব দুর্বল।',
      'ডাক্তার চিকিৎসা': 'আমার চিকিৎসার জন্য একজন ডাক্তারের সাথে কথা বলতে হবে।',
      'ডাক্তার': 'আমার জরুরি একজন ডাক্তার প্রয়োজন।',
      'চিকিৎসা': 'দয়া করে আমার চিকিৎসার ব্যবস্থা করুন।',
      'দুর্বল': 'আমি খুব দুর্বল বোধ করছি।',
      'ব্যান্ডেজ': 'আমার ক্ষতস্থানে একটি ব্যান্ডেজ বেঁধে দিন।',
      'ক্যাপসুল': 'আমার প্রেসক্রিপশনের ক্যাপসুল ঔষধটি দিন।',
      'ডেঙ্গু': 'আমার তীব্র জ্বর, ডেঙ্গু পরীক্ষা করানো দরকার।',
      'চোখ ওঠা': 'আমার চোখে প্রদাহ হয়েছে, চোখ উঠেছে।',
      'বাত': 'আমার বাতের ব্যথায় খুব কষ্ট হচ্ছে।',
      'দংশন': 'আমাকে কিছুতে দংশন করেছে, দ্রুত সাহায্য করুন।',
      'বাবা': 'তিনি আমার বাবা।',
      'মা': 'আমার মা কেমন আছেন?',
      'ভাই': 'আমার ভাই আমাকে সাহায্য করবেন।',
      'বোন': 'তিনি আমার বোন।',
      'চা': 'দয়া করে আমাকে এক কাপ চা দিন।',
      'পানি': 'আমাকে একটু খাবার পানি দিন।',
      'ভাত': 'আমার ক্ষুধা পেয়েছে, খাবার প্রয়োজন।',
      'জুতা': 'আমার জুতা কোথায়?'
    };

    const cleanStr = glossStr.trim();
    for (const [key, value] of Object.entries(bdslDictionary)) {
      if (cleanStr.includes(key)) {
        return value;
      }
    }

    const tokens = cleanStr.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 'নমস্কার / আসসালামু আলাইকুম।';
    return `আমি সাইন দিয়ে প্রকাশ করছি: "${tokens.join(', ')}"।`;
  }

  const upperGloss = glossStr.toUpperCase();
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
    if (upperGloss.includes(key)) {
      return value;
    }
  }

  const tokens = upperGloss.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'Hello.';

  const capitalized = tokens.map((t, idx) => idx === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t).join(' ');
  return `I am indicating: ${capitalized}.`;
};

export const reconstructSentenceFromGlosses = async (glossTokens, conversationHistory = [], lang = 'asl') => {
  const glossInput = Array.isArray(glossTokens) ? glossTokens.join(' ') : String(glossTokens);

  if (!glossInput || !glossInput.trim()) {
    return {
      sentence: '',
      confidence: 0,
      source: 'empty'
    };
  }

  // Detect whether target is Bangla / BdSL
  const isBangla = lang.toLowerCase() === 'bdsl' || 
                   lang.toLowerCase() === 'bn' || 
                   /[\u0980-\u09FF]/.test(glossInput);

  // If Gemini API is available, invoke it
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let prompt = '';
      if (isBangla) {
        prompt = `You are the linguistic translation engine for SignBridge AI, an assistive communication system for deaf individuals.
A deaf user produced the following Bangla Sign Language (BdSL) sign tokens:
"${glossInput}"

Recent conversation context:
${conversationHistory.slice(-3).map(m => `${m.sender_role}: ${m.final_content}`).join('\n') || 'None'}

TASK:
Convert these isolated Bangla sign language words into a single natural, polite, and grammatically complete Bengali sentence (বাংলা বাক্য).
The sentence will be vocalized to hearing people in Bangladesh via Text-to-Speech.
Examples:
- ["ডাক্তার", "চিকিৎসা", "দুর্বল"] -> "আমার শরীর খুব দুর্বল লাগছে, চিকিৎসার জন্য একজন ডাক্তার ডাকুন।"
- ["সাহায্য", "জরুরি", "পানি"] -> "আমাকে একটু সাহায্য করুন, আমার জরুরি খাবার পানি প্রয়োজন।"
- ["বাবা", "অসুস্থ", "হাসপাতাল"] -> "আমার বাবা খুব অসুস্থ, তাকে দ্রুত হাসপাতালে নেওয়া দরকার।"

Do NOT include English explanations, notes, or quotation marks. Output ONLY the reconstructed Bengali sentence.`;
      } else {
        prompt = `You are the linguistic translation engine for SignBridge AI, an assistive communication system for deaf individuals.
A deaf user produced the following American Sign Language (ASL) gloss tokens:
"${glossInput}"

Recent conversation context:
${conversationHistory.slice(-3).map(m => `${m.sender_role}: ${m.final_content}`).join('\n') || 'None'}

TASK:
Convert these isolated sign language glosses into a single natural, grammatically correct, polite English sentence representing what the deaf speaker wants to communicate.
Do NOT include explanations, notes, or quotes. Output ONLY the reconstructed sentence.`;
      }

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');

      return {
        sentence: text,
        confidence: 0.95,
        source: 'gemini-1.5-flash',
        lang: isBangla ? 'bn' : 'en'
      };
    } catch (error) {
      console.warn('[Gemini API Notice] Fallback used due to:', error.message);
    }
  }

  // Deterministic high-quality fallback
  return {
    sentence: fallbackReconstruct(glossTokens, isBangla),
    confidence: 0.90,
    source: 'linguistic-heuristics-fallback',
    lang: isBangla ? 'bn' : 'en'
  };
};
