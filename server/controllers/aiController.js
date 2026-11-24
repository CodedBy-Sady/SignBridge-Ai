import { reconstructSentenceFromGlosses } from '../services/geminiService.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000/predict';

/**
 * Geometric heuristic classifier for 21 3D hand coordinates
 * used as zero-crash fallback when Python worker is not active.
 */
function classifyLandmarksGeometricFallback(landmarks, lang = 'asl') {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'UNKNOWN', confidence: 0.0 };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const indexExt = dist(indexTip, wrist) > dist(indexPip, wrist) * 1.15;
  const middleExt = dist(middleTip, wrist) > dist(middlePip, wrist) * 1.15;
  const thumbExt = dist(thumbTip, landmarks[5]) > 0.15;
  const pinkyExt = dist(pinkyTip, wrist) > 0.25;

  const isBdSL = lang.toLowerCase() === 'bdsl' || lang.toLowerCase() === 'bn';

  if (thumbExt && indexExt && middleExt && pinkyExt) {
    return { gesture: isBdSL ? 'বাবা' : 'HELLO', confidence: 0.95 };
  }
  if (thumbExt && indexExt && !middleExt && pinkyExt) {
    return { gesture: isBdSL ? 'মা' : 'I LOVE YOU', confidence: 0.97 };
  }
  if (thumbExt && !indexExt && !middleExt && !pinkyExt) {
    return { gesture: isBdSL ? 'ডাক্তার' : 'HELP', confidence: 0.94 };
  }
  if (!thumbExt && indexExt && !middleExt && !pinkyExt) {
    return { gesture: isBdSL ? 'ভাই' : 'WHERE', confidence: 0.91 };
  }
  if (!thumbExt && !indexExt && !middleExt && !pinkyExt) {
    return { gesture: isBdSL ? 'আলু' : 'YES', confidence: 0.89 };
  }

  return { gesture: isBdSL ? 'চিকিৎসা' : 'THANK YOU', confidence: 0.90 };
}

export const reconstructSignSentence = async (req, res, next) => {
  try {
    const { glosses, history = [], lang = 'asl' } = req.body;

    if (!glosses) {
      return res.status(400).json({
        success: false,
        message: 'glosses array or string is required.'
      });
    }

    const result = await reconstructSentenceFromGlosses(glosses, history, lang);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const classifyLandmarksStub = async (req, res, next) => {
  try {
    const { landmarks, lang = 'asl' } = req.body;

    if (!landmarks || !Array.isArray(landmarks)) {
      return res.status(400).json({
        success: false,
        message: 'landmarks array required (21 3D hand coordinates).'
      });
    }

    // 1. Try forwarding to Python ML microservice if active
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const pyResponse = await fetch(`${PYTHON_AI_URL}?lang=${encodeURIComponent(lang)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks, lang }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (pyResponse.ok) {
        const pyData = await pyResponse.json();
        return res.json({
          success: true,
          data: {
            detected_sign: pyData.gesture,
            confidence: pyData.confidence,
            lang: pyData.lang || lang,
            alternatives: pyData.alternatives || [],
            source: 'python-fastapi-service',
            processed_at: new Date().toISOString()
          }
        });
      }
    } catch (pyErr) {
      // Python service offline or timed out; fall back gracefully
    }

    // 2. High-performance geometric fallback
    const result = classifyLandmarksGeometricFallback(landmarks, lang);

    return res.json({
      success: true,
      data: {
        detected_sign: result.gesture,
        confidence: result.confidence,
        lang,
        source: 'geometric-classifier-fallback',
        processed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
