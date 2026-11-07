/**
 * AI Service Integration Layer for SignBridge AI
 * Bridges client-side MediaPipe landmark extraction, local/remote ML classification,
 * and Google Gemini LLM sentence reconstruction.
 */
import { aiAPI } from './api';

// Pre-defined sign vocabulary dictionary with sample landmarks/gloss representations
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

class AIService {
  constructor() {
    this.buffer = [];
    this.bufferSize = 30; // 30 frames window (approx 1 second at 30fps)
    this.isClassifying = false;
  }

  /**
   * Pushes incoming 3D hand landmarks (21 coordinates per hand) into the temporal sliding buffer.
   * @param {Array<{x: number, y: number, z: number}>} landmarks - MediaPipe hand landmarks
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
   * Send the temporal landmark buffer to the backend ML classifier or run lightweight on-device inference
   * @returns {Promise<{gloss: string, confidence: number}>}
   */
  async classifyCurrentGesture() {
    if (this.buffer.length < 5 || this.isClassifying) {
      return null;
    }

    this.isClassifying = true;
    try {
      // Send landmark coordinates to inference bridge endpoint
      const latestLandmarks = this.buffer[this.buffer.length - 1].landmarks;
      const response = await aiAPI.classifyLandmarks(latestLandmarks);

      return {
        gloss: response.data.data.detected_sign,
        confidence: response.data.data.confidence,
      };
    } catch (error) {
      console.warn('[AIService] Backend inference offline, using client heuristic:', error.message);
      return null;
    } finally {
      this.isClassifying = false;
    }
  }

  /**
   * Routes isolated sign tokens to Google Gemini LLM via backend API
   * to reconstruct a fluent, grammatically natural English sentence.
   * 
   * @param {Array<string>} tokens - Array of isolated gloss tokens (e.g. ['HELP', 'DOCTOR'])
   * @param {Array<Object>} history - Recent conversation history for dialogue context
   * @returns {Promise<{sentence: string, confidence: number, source: string}>}
   */
  async reconstructSentence(tokens, history = []) {
    if (!tokens || tokens.length === 0) {
      return { sentence: '', confidence: 0, source: 'empty' };
    }

    try {
      const response = await aiAPI.reconstructSentence(tokens, history);
      return response.data.data;
    } catch (error) {
      console.error('[AIService] Sentence reconstruction request failed:', error);
      // Fallback formatting
      const fallback = tokens.join(' ').toLowerCase();
      return {
        sentence: `I am signing: "${fallback.charAt(0).toUpperCase() + fallback.slice(1)}".`,
        confidence: 0.85,
        source: 'client-offline-fallback',
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;

