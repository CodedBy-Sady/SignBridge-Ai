/**
 * AI Service Integration Layer for SignBridge AI
 * Bridges client-side MediaPipe landmark extraction, local/remote ML classification,
 * and Google Gemini LLM sentence reconstruction across ASL and BdSL (Bangla).
 */
import { aiAPI } from './api';

// Pre-defined ASL sign vocabulary dictionary
export const SIGN_DICTIONARY = [
  { id: 'HELLO', label: 'Hello', description: 'Open hand wave near temple/ear', category: 'greetings' },
  { id: 'THANK YOU', label: 'Thank You', description: 'Flat hand moves forward from chin', category: 'courtesy' },
  { id: 'PLEASE', label: 'Please', description: 'Flat hand circles clockwise over chest', category: 'courtesy' },
  { id: 'YES', label: 'Yes', description: 'Fist nods up and down like a head nod', category: 'responses' },
  { id: 'NO', label: 'No', description: 'Index and middle finger snap down to thumb', category: 'responses' },
  { id: 'HELP', label: 'Help', description: 'Thumbs-up on flat palm moves upward', category: 'urgent' },
  { id: 'DOCTOR', label: 'Doctor', description: 'Bent fingers tap the wrist pulse', category: 'medical' },
  { id: 'HOSPITAL', label: 'Hospital', description: 'H-hand draws cross on upper arm', category: 'medical' },
  { id: 'WHERE', label: 'Where', description: 'Index finger wiggles side to side', category: 'questions' },
  { id: 'RESTROOM', label: 'Restroom / Bathroom', description: 'T-hand shakes side to side', category: 'daily' },
  { id: 'WATER', label: 'Water', description: 'W-hand taps index finger to chin', category: 'daily' },
  { id: 'MY NAME', label: 'My Name', description: 'H-hands tap across each other twice', category: 'social' },
];

// Full 60-Word BdSLW60 Dictionary (Bangla Sign Language)
export const BDSL_DICTIONARY = [
  // Family & Relatives (14)
  { id: 'বাবা', label: 'বাবা (Father)', category: 'family', wId: 'W1' },
  { id: 'আত্মীয়', label: 'আত্মীয় (Relatives)', category: 'family', wId: 'W2' },
  { id: 'ভাই', label: 'ভাই (Brother)', category: 'family', wId: 'W3' },
  { id: 'বোন', label: 'বোন (Sister)', category: 'family', wId: 'W4' },
  { id: 'বৌ', label: 'বৌ (Wife)', category: 'family', wId: 'W5' },
  { id: 'চাচা', label: 'চাচা (Uncle)', category: 'family', wId: 'W6' },
  { id: 'চাচী', label: 'চাচী (Aunt)', category: 'family', wId: 'W7' },
  { id: 'দাদা/নানা', label: 'দাদা/নানা (Grandfather)', category: 'family', wId: 'W8' },
  { id: 'দাদী/নানী', label: 'দাদী/নানী (Grandmother)', category: 'family', wId: 'W9' },
  { id: 'দায়িত্ব', label: 'দায়িত্ব (Responsibility)', category: 'family', wId: 'W10' },
  { id: 'দেবর', label: 'দেবর (Brother-in-law)', category: 'family', wId: 'W11' },
  { id: 'দুলাভাই', label: 'দুলাভাই (Sister\'s Husband)', category: 'family', wId: 'W12' },
  { id: 'কন্যা', label: 'কন্যা (Daughter)', category: 'family', wId: 'W19' },
  { id: 'মা', label: 'মা (Mother)', category: 'family', wId: 'W20' },

  // Food & Fruits (14)
  { id: 'আম', label: 'আম (Mango)', category: 'food', wId: 'W37' },
  { id: 'আলু', label: 'আলু (Potato)', category: 'food', wId: 'W38' },
  { id: 'আনারস', label: 'আনারস (Pineapple)', category: 'food', wId: 'W39' },
  { id: 'আঙ্গুর', label: 'আঙ্গুর (Grapes)', category: 'food', wId: 'W40' },
  { id: 'আপেল', label: 'আপেল (Apple)', category: 'food', wId: 'W41' },
  { id: 'বিস্কুট', label: 'বিস্কুট (Biscuit)', category: 'food', wId: 'W42' },
  { id: 'বরই', label: 'বরই (Jujube)', category: 'food', wId: 'W43' },
  { id: 'কেক', label: 'কেক (Cake)', category: 'food', wId: 'W44' },
  { id: 'চা', label: 'চা (Tea)', category: 'food', wId: 'W45' },
  { id: 'চাল', label: 'চাল (Rice)', category: 'food', wId: 'W46' },
  { id: 'চিনি', label: 'চিনি (Sugar)', category: 'food', wId: 'W47' },
  { id: 'চিপস', label: 'চিপস (Chips)', category: 'food', wId: 'W48' },
  { id: 'চকলেট', label: 'চকলেট (Chocolate)', category: 'food', wId: 'W49' },
  { id: 'ডাল', label: 'ডাল (Lentils)', category: 'food', wId: 'W50' },

  // Daily & Items (12)
  { id: 'বোতাম', label: 'বোতাম (Button)', category: 'items', wId: 'W91' },
  { id: 'টুপি', label: 'টুপি (Cap)', category: 'items', wId: 'W92' },
  { id: 'চাদর', label: 'চাদর (Shawl)', category: 'items', wId: 'W93' },
  { id: 'চিরুনি', label: 'চিরুনি (Comb)', category: 'items', wId: 'W94' },
  { id: 'চশমা', label: 'চশমা (Spectacles)', category: 'items', wId: 'W95' },
  { id: 'চুড়ি', label: 'চুড়ি (Bangles)', category: 'items', wId: 'W96' },
  { id: 'ক্লিপ', label: 'ক্লিপ (Hair Clip)', category: 'items', wId: 'W97' },
  { id: 'ক্রিম', label: 'ক্রিম (Cream)', category: 'items', wId: 'W98' },
  { id: 'তথ্য', label: 'তথ্য (Data/Info)', category: 'items', wId: 'W99' },
  { id: 'দেনাদার', label: 'দেনাদার (Debtor)', category: 'items', wId: 'W100' },
  { id: 'জমজ', label: 'জমজ (Twin)', category: 'items', wId: 'W111' },
  { id: 'জুতা', label: 'জুতা (Shoe)', category: 'items', wId: 'W112' },

  // Household & Lifestyle (10)
  { id: 'টুথপেস্ট', label: 'টুথপেস্ট (Toothpaste)', category: 'household', wId: 'W211' },
  { id: 'টি-শার্ট', label: 'টি-শার্ট (T-shirt)', category: 'household', wId: 'W212' },
  { id: 'টিউবলাইট', label: 'টিউবলাইট (Tubelight)', category: 'household', wId: 'W213' },
  { id: 'টেলিভিশন', label: 'টেলিভিশন (TV)', category: 'household', wId: 'W214' },
  { id: 'এসি', label: 'এসি (Air Conditioner)', category: 'household', wId: 'W215' },
  { id: 'অ্যাপার্টমেন্ট', label: 'অ্যাপার্টমেন্ট (Apartment)', category: 'household', wId: 'W216' },
  { id: 'অডিও ক্যাসেট', label: 'অডিও ক্যাসেট (Audio Cassette)', category: 'household', wId: 'W217' },
  { id: 'আয়না', label: 'আয়না (Mirror)', category: 'household', wId: 'W218' },
  { id: 'বালতি', label: 'বালতি (Bucket)', category: 'household', wId: 'W219' },
  { id: 'বালু', label: 'বালু (Sand)', category: 'household', wId: 'W220' },

  // Medical & Health (10)
  { id: 'এইডস', label: 'এইডস (AIDS)', category: 'medical', wId: 'W351' },
  { id: 'বাত', label: 'বাত (Arthritis)', category: 'medical', wId: 'W352' },
  { id: 'ব্যান্ডেজ', label: 'ব্যান্ডেজ (Bandage)', category: 'medical', wId: 'W353' },
  { id: 'ক্যাপসুল', label: 'ক্যাপসুল (Capsule)', category: 'medical', wId: 'W354' },
  { id: 'চিকিৎসা', label: 'চিকিৎসা (Treatment)', category: 'medical', wId: 'W355' },
  { id: 'চোখ ওঠা', label: 'চোখ ওঠা (Conjunctivitis)', category: 'medical', wId: 'W356' },
  { id: 'ডেঙ্গু', label: 'ডেঙ্গু (Dengue)', category: 'medical', wId: 'W357' },
  { id: 'ডাক্তার', label: 'ডাক্তার (Doctor)', category: 'medical', wId: 'W358' },
  { id: 'দংশন', label: 'দংশন (Bite)', category: 'medical', wId: 'W359' },
  { id: 'দুর্বল', label: 'দুর্বল (Weak)', category: 'medical', wId: 'W360' },
];

class AIService {
  constructor() {
    this.buffer = [];
    this.bufferSize = 30; // 30 frames window
    this.isClassifying = false;
  }

  /**
   * Pushes incoming 3D hand landmarks (21 coordinates) into the sliding buffer.
   */
  pushLandmarks(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    this.buffer.push({
      landmarks,
      timestamp: performance.now(),
    });

    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    return this.buffer.length;
  }

  /**
   * Clears the current frame buffer
   */
  clearBuffer() {
    this.buffer = [];
  }

  /**
   * Send landmark buffer or provided landmarks to backend ML classifier.
   * Supports lang='asl' or lang='bdsl'.
   */
  async classifyCurrentGesture(landmarks = null, lang = 'asl') {
    if (this.isClassifying) {
      return null;
    }

    const inputLandmarks = landmarks || (this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].landmarks : null);
    if (!inputLandmarks) return null;

    this.isClassifying = true;
    try {
      const response = await aiAPI.classifyLandmarks(inputLandmarks, lang);

      if (response?.data?.success && response?.data?.data) {
        return {
          gloss: response.data.data.detected_sign,
          confidence: response.data.data.confidence,
          source: response.data.data.source,
          lang: response.data.data.lang || lang,
        };
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      this.isClassifying = false;
    }
  }

  /**
   * Routes isolated sign tokens to Google Gemini LLM via backend API
   * to reconstruct a fluent, grammatically natural sentence (English or Bengali).
   */
  async reconstructSentence(tokens, history = [], lang = 'asl') {
    if (!tokens || tokens.length === 0) {
      return { sentence: '', confidence: 0, source: 'empty' };
    }

    try {
      const response = await aiAPI.reconstructSentence(tokens, history, lang);
      return response.data.data;
    } catch (error) {
      console.error('[AIService] Sentence reconstruction request failed:', error);
      const isBdSL = lang === 'bdsl' || /[\u0980-\u09FF]/.test(tokens.join(' '));
      return {
        sentence: isBdSL ? `আমি সাইন দিয়ে প্রকাশ করছি: "${tokens.join(', ')}"।` : `I am signing: "${tokens.join(' ')}".`,
        confidence: 0.85,
        source: 'client-offline-fallback',
        lang: isBdSL ? 'bn' : 'en',
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;
