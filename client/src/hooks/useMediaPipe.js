import { useState, useEffect, useRef, useCallback } from 'react';
import { classifyLandmarks, GestureStabilizer } from '../services/gestureClassifier';

/**
 * useMediaPipe: Real-Time Hand Tracking and ASL Gesture Recognition Hook
 * Connects HTML5 video to Google MediaPipe Hands, renders 3D joint skeleton on canvas,
 * and passes normalized landmarks to the gesture classifier.
 * 
 * Uses direct requestAnimationFrame processing to prevent camera hardware lockouts.
 */
export const useMediaPipe = ({ videoRef, canvasRef, onGestureDetected, enabled = true } = {}) => {
  const [isReady, setIsReady] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [activeGesture, setActiveGesture] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const handsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const stabilizerRef = useRef(new GestureStabilizer(5, 1400));
  const isSendingFrameRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let checkInterval = null;

    const processVideoLoop = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      const hands = handsRef.current;

      if (video && hands && video.readyState >= 2 && !isSendingFrameRef.current) {
        try {
          isSendingFrameRef.current = true;
          await hands.send({ image: video });
        } catch (e) {
          // Ignore occasional dropped frames
        } finally {
          isSendingFrameRef.current = false;
        }
      }

      if (isMounted) {
        animFrameIdRef.current = requestAnimationFrame(processVideoLoop);
      }
    };

    const initMediaPipe = () => {
      // Check if MediaPipe is available on the window object (from CDN)
      if (typeof window === 'undefined' || !window.Hands) {
        return false;
      }

      try {
        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        hands.onResults((results) => {
          if (!isMounted) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // If hands are detected
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setHandCount(results.multiHandLandmarks.length);

            // Draw each detected hand
            for (const landmarks of results.multiHandLandmarks) {
              // Draw connectors if drawing utils are loaded
              if (window.drawConnectors && window.HAND_CONNECTIONS) {
                window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                  color: '#0284c7', // Brand cyan
                  lineWidth: 3,
                });
              } else {
                drawManualSkeleton(ctx, landmarks, canvas.width, canvas.height);
              }

              // Draw landmark joints
              if (window.drawLandmarks) {
                window.drawLandmarks(ctx, landmarks, {
                  color: '#10b981', // Emerald tip
                  lineWidth: 1,
                  radius: 3.5,
                });
              } else {
                drawManualNodes(ctx, landmarks, canvas.width, canvas.height);
              }
            }

            // Perform Real-Time Classification
            const classification = classifyLandmarks(results.multiHandLandmarks);

            if (classification) {
              setActiveGesture(classification.gesture);
              setConfidence(classification.confidence);

              // Stabilize before emitting token to prevent accidental flickers
              const confirmed = stabilizerRef.current.feed(classification.gesture);
              if (confirmed && onGestureDetected) {
                onGestureDetected(confirmed, classification.confidence);
              }
            } else {
              stabilizerRef.current.feed(null);
            }
          } else {
            setHandCount(0);
            stabilizerRef.current.feed(null);
          }

          ctx.restore();
        });

        handsRef.current = hands;
        setIsReady(true);

        // Start processing video frames via requestAnimationFrame
        animFrameIdRef.current = requestAnimationFrame(processVideoLoop);
        return true;
      } catch (err) {
        console.warn('[useMediaPipe] MediaPipe initialization error:', err);
        return false;
      }
    };

    // Retry checking until MediaPipe scripts are loaded
    if (!initMediaPipe()) {
      checkInterval = setInterval(() => {
        if (initMediaPipe()) {
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch {}
      }
    };
  }, [enabled, videoRef, canvasRef, onGestureDetected]);

  return {
    isReady,
    handCount,
    activeGesture,
    confidence,
  };
};

// Fallback skeleton rendering if CDN drawing_utils is slow to load
function drawManualSkeleton(ctx, landmarks, width, height) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [9, 13], [13, 14], [14, 15], [15, 16],// Ring
    [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [0, 17]                               // Palm base
  ];

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  connections.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  });
}

function drawManualNodes(ctx, landmarks, width, height) {
  landmarks.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, idx % 4 === 0 ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = [4, 8, 12, 16, 20].includes(idx) ? '#10b981' : '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export default useMediaPipe;
