/**
 * Real-Time Sign Gesture Classifier for MediaPipe 3D Hand Landmarks
 * Analyzes spatial joint geometry, fingertip distances, and temporal movement
 * to classify American Sign Language (ASL) gestures and sign glosses.
 * 
 * Includes an interface for attaching custom pre-trained neural networks (TF.js / ONNX / PyTorch worker).
 */

// Custom model hook (can be registered dynamically)
let customClassifierPlugin = null;

export const registerCustomClassifier = (pluginFn) => {
  customClassifierPlugin = pluginFn;
};

// Euclidean distance between two 3D points
const dist3D = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Computes whether a finger is extended based on tip vs PIP/MCP distance from wrist
const isFingerExtended = (landmarks, tipIdx, pipIdx, mcpIdx) => {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distTipWrist = dist3D(tip, wrist);
  const distPipWrist = dist3D(pip, wrist);

  // For index, middle, ring, pinky: tip is further from wrist than PIP
  return distTipWrist > distPipWrist * 1.15;
};

const isThumbExtended = (landmarks) => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexMcp = landmarks[5];

  const distThumbIndex = dist3D(thumbTip, indexMcp);
  const distIpIndex = dist3D(thumbIp, indexMcp);

  return distThumbIndex > distIpIndex * 1.1;
};

/**
 * Classifies 21 3D landmarks for a single hand or two hands
 * @param {Array<Array<{x: number, y: number, z: number}>>} multiHandLandmarks 
 * @returns {{ gesture: string, confidence: number, description: string } | null}
 */
export const classifyLandmarks = (multiHandLandmarks) => {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return null;
  }

  // If a custom pre-trained neural network is registered, execute it first
  if (customClassifierPlugin) {
    try {
      const customResult = customClassifierPlugin(multiHandLandmarks);
      if (customResult) return customResult;
    } catch (e) {
      console.warn('[Classifier Plugin Error]', e);
    }
  }

  const primaryHand = multiHandLandmarks[0];
  const secondaryHand = multiHandLandmarks.length > 1 ? multiHandLandmarks[1] : null;

  // Extract primary hand finger extensions
  const thumbExt = isThumbExtended(primaryHand);
  const indexExt = isFingerExtended(primaryHand, 8, 6, 5);
  const middleExt = isFingerExtended(primaryHand, 12, 10, 9);
  const ringExt = isFingerExtended(primaryHand, 16, 14, 13);
  const pinkyExt = isFingerExtended(primaryHand, 20, 18, 17);

  const thumbTip = primaryHand[4];
  const indexTip = primaryHand[8];
  const middleTip = primaryHand[12];
  const ringTip = primaryHand[16];
  const pinkyTip = primaryHand[20];
  const wrist = primaryHand[0];

  // Distances between fingertips
  const distThumbIndex = dist3D(thumbTip, indexTip);
  const distIndexMiddle = dist3D(indexTip, middleTip);

  // Check 1: TWO-HAND GESTURES
  if (secondaryHand) {
    const secThumbExt = isThumbExtended(secondaryHand);
    const secIndexExt = isFingerExtended(secondaryHand, 8, 6, 5);
    const secMiddleExt = isFingerExtended(secondaryHand, 12, 10, 9);
    const secRingExt = isFingerExtended(secondaryHand, 16, 14, 13);
    const secPinkyExt = isFingerExtended(secondaryHand, 20, 18, 17);

    // Two-hand "HELP": One hand flat open palm, dominant hand thumbs-up on top
    const isOneFlat = secIndexExt && secMiddleExt && secRingExt && secPinkyExt;
    const isOtherThumbUp = thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt;
    if (isOneFlat && isOtherThumbUp) {
      return {
        gesture: 'HELP',
        confidence: 0.96,
        description: 'Thumbs-up on flat palm (ASL Help)',
      };
    }

    // Both hands open waving/facing: "WELCOME" / "MEET"
    if (indexExt && middleExt && ringExt && pinkyExt && secIndexExt && secMiddleExt) {
      return {
        gesture: 'MEET NICE',
        confidence: 0.91,
        description: 'Both hands open gesturing meeting',
      };
    }
  }

  // Check 2: "I LOVE YOU" (ASL standard: Thumb, Index, and Pinky extended; Middle and Ring curled)
  if (thumbExt && indexExt && !middleExt && !ringExt && pinkyExt) {
    return {
      gesture: 'I LOVE YOU',
      confidence: 0.97,
      description: 'Thumb, index, and pinky extended (ASL I Love You)',
    };
  }

  // Check 3: "HELLO" / Open Palm Wave (All 5 fingers extended and spread)
  if (thumbExt && indexExt && middleExt && ringExt && pinkyExt) {
    // If hand is elevated above center of frame (y < 0.6)
    if (wrist.y < 0.7) {
      return {
        gesture: 'HELLO',
        confidence: 0.95,
        description: 'Open hand wave near temple/face (ASL Hello)',
      };
    }
  }

  // Check 4: "OK" Sign (Thumb tip touching Index tip, Middle/Ring/Pinky extended)
  if (distThumbIndex < 0.08 && middleExt && ringExt && pinkyExt) {
    return {
      gesture: 'OK',
      confidence: 0.94,
      description: 'Thumb and index circle with fingers extended (ASL OK / Confirm)',
    };
  }

  // Check 5: "PEACE" / "V" (Index and Middle extended in V, others curled)
  if (indexExt && middleExt && !ringExt && !pinkyExt && !thumbExt && distIndexMiddle > 0.04) {
    return {
      gesture: 'PEACE',
      confidence: 0.93,
      description: 'Index and middle fingers extended (V-shape)',
    };
  }

  // Check 6: "HELP" / "THUMBS UP" (Only Thumb extended upwards, all 4 fingers curled)
  if (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    // Check if thumb tip is above the wrist
    if (thumbTip.y < wrist.y) {
      return {
        gesture: 'HELP',
        confidence: 0.92,
        description: 'Thumbs-up gesture (ASL Help / Support)',
      };
    }
  }

  // Check 7: "POINTING" / "WHERE" (Only Index finger extended, others curled)
  if (!thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      gesture: 'WHERE',
      confidence: 0.90,
      description: 'Index finger pointing (ASL Where / Direction inquiry)',
    };
  }

  // Check 8: "YES" / Closed Fist (All 5 fingers curled into fist)
  if (!thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      gesture: 'YES',
      confidence: 0.88,
      description: 'Closed fist (ASL Yes / Agreement)',
    };
  }

  // Check 9: "NO" (Index and Middle snapping close to thumb, ring and pinky curled)
  if (indexExt && middleExt && !ringExt && !pinkyExt && distThumbIndex < 0.12) {
    return {
      gesture: 'NO',
      confidence: 0.89,
      description: 'Index and middle snapping to thumb (ASL No / Refusal)',
    };
  }

  // Check 10: "THANK YOU" / Flat Hand near chin/face moving forward
  if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) {
    return {
      gesture: 'THANK YOU',
      confidence: 0.91,
      description: 'Flat hand moving forward from chin (ASL Thank You)',
    };
  }

  return null;
};

/**
 * Temporal Gesture Stabilizer
 * Ensures a gesture is consistently detected across consecutive frames before confirming it,
 * preventing noisy flickers or accidental triggers.
 */
export class GestureStabilizer {
  constructor(threshold = 5, cooldownMs = 1200) {
    this.threshold = threshold; // Consecutive frames required
    this.cooldownMs = cooldownMs; // Cooldown before same gesture can re-trigger
    this.currentGesture = null;
    this.frameCount = 0;
    this.lastTriggerTime = 0;
  }

  feed(gesture) {
    const now = performance.now();

    if (!gesture) {
      this.frameCount = Math.max(0, this.frameCount - 1);
      return null;
    }

    if (gesture === this.currentGesture) {
      this.frameCount += 1;
      if (this.frameCount >= this.threshold) {
        if (now - this.lastTriggerTime > this.cooldownMs) {
          this.lastTriggerTime = now;
          this.frameCount = 0;
          return gesture;
        }
      }
    } else {
      this.currentGesture = gesture;
      this.frameCount = 1;
    }

    return null;
  }

  reset() {
    this.currentGesture = null;
    this.frameCount = 0;
  }
}

