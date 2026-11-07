import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  Layers, 
  Hand, 
  Plus, 
  Trash2,
  HelpCircle,
  Activity
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { SIGN_DICTIONARY, aiService } from '../services/aiService';
import { useAccessibility } from '../context/AccessibilityContext';

export const DeafSignPanel = ({ onSendMessage, sessionHistory = [] }) => {
  const { videoRef, isActive, isSimulated, statusText, setStatusText, toggleCamera } = useWebcam();
  const { speak, isSpeaking } = useTextToSpeech();
  const { triggerVisualAlert } = useAccessibility();

  const [capturedTokens, setCapturedTokens] = useState([]);
  const [reconstructedSentence, setReconstructedSentence] = useState('');
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0.95);
  const [showDictionary, setShowDictionary] = useState(false);

  const canvasRef = useRef(null);

  // Real-time MediaPipe Hand Detection & Gesture Classification
  const { isReady: isMediaPipeReady, handCount, activeGesture } = useMediaPipe({
    videoRef,
    canvasRef,
    enabled: isActive,
    onGestureDetected: (gesture, confidence) => {
      setStatusText(`Recognized Gesture: ${gesture} (${Math.round(confidence * 100)}%)`);
      handleAddToken(gesture);
    },
  });

  // Animated landmark skeleton fallback overlay when camera is running in simulation mode
  useEffect(() => {
    if (!isActive || !isSimulated) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const renderSimulationLandmarks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2 + Math.sin(angle) * 15;
      const cy = canvas.height / 2 + Math.cos(angle * 0.7) * 10;
      
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;

      const fingers = [
        { angle: -0.8, length: 70 },
        { angle: -0.4, length: 90 },
        { angle: 0.0, length: 100 },
        { angle: 0.4, length: 85 },
        { angle: 0.8, length: 65 },
      ];

      fingers.forEach((finger) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let j = 1; j <= 3; j++) {
          const segDist = (finger.length / 3) * j;
          const jointX = cx + Math.sin(finger.angle) * segDist;
          const jointY = cy - Math.cos(finger.angle) * segDist;
          ctx.lineTo(jointX, jointY);
        }
        ctx.stroke();

        for (let j = 1; j <= 3; j++) {
          const segDist = (finger.length / 3) * j;
          const jointX = cx + Math.sin(finger.angle) * segDist;
          const jointY = cy - Math.cos(finger.angle) * segDist;

          ctx.beginPath();
          ctx.arc(jointX, jointY, 4, 0, Math.PI * 2);
          ctx.fillStyle = j === 3 ? '#10b981' : '#38bdf8';
          ctx.fill();
          ctx.stroke();
        }
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      angle += 0.03;
      animationFrameId = requestAnimationFrame(renderSimulationLandmarks);
    };

    renderSimulationLandmarks();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isSimulated]);

  // Add a detected or simulated token
  const handleAddToken = (glossId) => {
    setCapturedTokens((prev) => {
      // Don't add same token if it was just added last
      if (prev.length > 0 && prev[prev.length - 1] === glossId) {
        return prev;
      }
      return [...prev, glossId];
    });
    setStatusText(`Added Sign Token: ${glossId}`);
  };

  const handleRemoveToken = (indexToRemove) => {
    setCapturedTokens((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearTokens = () => {
    setCapturedTokens([]);
    setReconstructedSentence('');
    setStatusText('Tokens cleared');
  };

  // Trigger Gemini sentence reconstruction
  const handleReconstruct = async () => {
    if (capturedTokens.length === 0) return;
    setIsReconstructing(true);
    setStatusText('Reconstructing natural sentence via Gemini AI...');

    try {
      const result = await aiService.reconstructSentence(capturedTokens, sessionHistory);
      setReconstructedSentence(result.sentence);
      setConfidenceScore(result.confidence || 0.95);
      setStatusText('Natural sentence synthesized');
    } catch (err) {
      console.error(err);
      setStatusText('Reconstruction failed');
    } finally {
      setIsReconstructing(false);
    }
  };

  // Speak synthesized voice for hearing user
  const handleVocalizeTTS = () => {
    if (!reconstructedSentence) return;
    speak(reconstructedSentence);
  };

  // Send turn to shared conversation transcript
  const handleCommitTurn = () => {
    if (!reconstructedSentence) return;

    onSendMessage({
      sender_role: 'deaf_user',
      input_type: 'sign_ai',
      raw_content: capturedTokens.join(' '),
      final_content: reconstructedSentence,
      confidence_score: confidenceScore,
    });

    speak(reconstructedSentence);
    triggerVisualAlert();

    setCapturedTokens([]);
    setReconstructedSentence('');
    setStatusText('Message sent. Ready for next gesture.');
  };

  return (
    <section 
      aria-label="Deaf User Sign Language Input Panel" 
      className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Channel 1: Deaf User (Sign-to-Speech)</h2>
            <p className="text-[11px] text-slate-400">Camera Gesture Analysis • 3D Landmarks • Gemini AI</p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        <button
          onClick={toggleCamera}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white'
          }`}
          aria-label={isActive ? 'Turn off camera' : 'Turn on camera'}
        >
          {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          <span>{isActive ? 'Stop Camera' : 'Start Camera'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* Video / Landmark Viewport */}
        <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          
          {/* Status Badge Over Video */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{statusText}</span>
          </div>

          {/* Active Gesture Overlay Pill */}
          {activeGesture && (
            <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-xl bg-brand-600/90 text-white font-mono font-bold text-xs shadow-md border border-brand-400/30 animate-pulse">
              Detected: {activeGesture}
            </div>
          )}

          {/* HTML5 Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${isActive && !isSimulated ? 'block' : 'hidden'}`}
          />

          {/* Canvas for 3D Hand Landmark Overlay */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${isActive ? 'block' : 'hidden'}`}
          />

          {/* Standby Placeholder when camera is inactive */}
          {!isActive && (
            <div className="text-center p-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">Camera is in standby</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click 'Start Camera' to begin real-time gesture tracking, or tap the sample signs below.
                </p>
              </div>
              <button
                onClick={toggleCamera}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Turn On Camera
              </button>
            </div>
          )}

          {/* Simulation Notification overlay */}
          {isSimulated && isActive && (
            <div className="absolute bottom-3 left-3 right-3 z-20 p-2.5 rounded-xl bg-brand-950/80 backdrop-blur-md border border-brand-800 text-brand-200 text-xs flex items-center justify-between">
              <span>Simulation mode: Interactive landmark overlay active.</span>
              <span className="font-bold text-[10px] uppercase bg-brand-800 px-2 py-0.5 rounded">Demo Engine</span>
            </div>
          )}
        </div>

        {/* Quick Sign Vocabulary Trigger Bar */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>⚡ Clickable Sign Tokens</span>
              <span className="text-[10px] font-normal text-slate-500">(Tap to insert sign)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDictionary(!showDictionary)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {showDictionary ? 'Hide Catalog' : 'View Vocabulary'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['HELLO', 'HELP', 'DOCTOR', 'WHERE', 'RESTROOM', 'THANK YOU', 'PLEASE', 'YES', 'NO'].map((sign) => (
              <button
                key={sign}
                type="button"
                onClick={() => handleAddToken(sign)}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3 h-3 text-slate-400" />
                <span>{sign}</span>
              </button>
            ))}
          </div>

          {showDictionary && (
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
              {SIGN_DICTIONARY.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToken(item.id)}
                  className="p-2 text-left rounded-xl bg-white border border-slate-200 hover:border-brand-400 text-xs transition-colors"
                >
                  <p className="font-bold text-slate-800">{item.id}</p>
                  <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Captured Sign Tokens Box */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Captured Sign Tokens</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                {capturedTokens.length}
              </span>
            </span>
            {capturedTokens.length > 0 && (
              <button
                onClick={handleClearTokens}
                className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-h-[44px] p-2 bg-white rounded-xl border border-slate-200">
            {capturedTokens.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No sign tokens captured yet. Perform gestures in front of camera or click the token buttons above.
              </span>
            ) : (
              capturedTokens.map((token, idx) => (
                <span
                  key={`${token}-${idx}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-100 text-brand-800 font-bold text-xs border border-brand-200 shadow-2xs animate-fadeIn"
                >
                  <span>{token}</span>
                  <button
                    onClick={() => handleRemoveToken(idx)}
                    className="hover:text-rose-600 focus:outline-none text-sm font-black"
                    aria-label={`Remove token ${token}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Reconstruct Sentence Button */}
          <button
            onClick={handleReconstruct}
            disabled={capturedTokens.length === 0 || isReconstructing}
            className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isReconstructing ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Reconstructing via Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Convert to Natural Sentence (Gemini AI)</span>
              </>
            )}
          </button>
        </div>

        {/* Reconstructed Sentence Display */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 border border-brand-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-brand-900 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-brand-600" />
              Reconstructed Fluent Sentence:
            </span>
            <span className="text-[11px] font-mono text-brand-600 bg-brand-100/80 px-2 py-0.5 rounded-full">
              Confidence: {Math.round(confidenceScore * 100)}%
            </span>
          </div>

          <div className="min-h-[50px] flex items-center">
            {reconstructedSentence ? (
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                "{reconstructedSentence}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Synthesized natural sentence will appear here in clear typography.
              </p>
            )}
          </div>

          {/* Actions: Vocalize & Send */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleVocalizeTTS}
              disabled={!reconstructedSentence || isSpeaking}
              className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                isSpeaking
                  ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              } disabled:opacity-40`}
              title="Vocalize for Hearing Participant via Text-to-Speech"
            >
              <Volume2 className="w-4 h-4 text-brand-600" />
              <span>{isSpeaking ? 'Speaking Output...' : 'Speak for Hearing User'}</span>
            </button>

            <button
              onClick={handleCommitTurn}
              disabled={!reconstructedSentence}
              className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Send Turn</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default DeafSignPanel;
