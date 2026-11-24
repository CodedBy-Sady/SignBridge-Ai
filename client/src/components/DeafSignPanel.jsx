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
  Activity,
  Globe,
  Filter
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { SIGN_DICTIONARY, BDSL_DICTIONARY, aiService } from '../services/aiService';
import { useAccessibility } from '../context/AccessibilityContext';

export const DeafSignPanel = ({ onSendMessage, sessionHistory = [] }) => {
  const { videoRef, isActive, isSimulated, statusText, setStatusText, toggleCamera } = useWebcam();
  const { speak, isSpeaking } = useTextToSpeech();
  const { triggerVisualAlert } = useAccessibility();

  // Language Mode: 'bdsl' (Bangla 60 Words) or 'asl' (American Sign Language)
  const [signMode, setSignMode] = useState('bdsl');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    lang: signMode,
    onGestureDetected: (gesture, confidence) => {
      setStatusText(`Recognized: ${gesture} (${Math.round(confidence * 100)}%)`);
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

  // Switch between BdSL and ASL modes
  const handleModeSwitch = (mode) => {
    if (mode === signMode) return;
    setSignMode(mode);
    setCapturedTokens([]);
    setReconstructedSentence('');
    setSelectedCategory('all');
    setStatusText(`Switched to ${mode === 'bdsl' ? 'BdSL (Bangla 60 Words)' : 'ASL (36 Signs)'} mode`);
  };

  // Trigger Gemini sentence reconstruction
  const handleReconstruct = async () => {
    if (capturedTokens.length === 0) return;
    setIsReconstructing(true);
    setStatusText(signMode === 'bdsl' ? 'জেমিনি এআই দিয়ে পূর্ণাঙ্গ বাংলা বাক্য তৈরি হচ্ছে...' : 'Reconstructing natural sentence via Gemini AI...');

    try {
      const result = await aiService.reconstructSentence(capturedTokens, sessionHistory, signMode);
      setReconstructedSentence(result.sentence);
      setConfidenceScore(result.confidence || 0.95);
      setStatusText(signMode === 'bdsl' ? 'বাংলা বাক্য সফলভাবে প্রস্তুত' : 'Natural sentence synthesized');
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
      lang: signMode,
    });

    speak(reconstructedSentence);
    triggerVisualAlert();

    setCapturedTokens([]);
    setReconstructedSentence('');
    setStatusText('Message sent. Ready for next gesture.');
  };

  // Filtered dictionary items based on active mode & category
  const activeDictionary = signMode === 'bdsl' ? BDSL_DICTIONARY : SIGN_DICTIONARY;
  const filteredDictionary = selectedCategory === 'all' 
    ? activeDictionary 
    : activeDictionary.filter(item => item.category === selectedCategory);

  // Quick preset signs for immediate testing
  const quickSigns = signMode === 'bdsl'
    ? ['ডাক্তার', 'চিকিৎসা', 'দুর্বল', 'ব্যান্ডেজ', 'বাবা', 'মা', 'ভাই', 'বোন', 'চা', 'জুতা']
    : ['HELLO', 'HELP', 'DOCTOR', 'WHERE', 'RESTROOM', 'THANK YOU', 'PLEASE', 'YES', 'NO'];

  return (
    <section 
      aria-label="Deaf User Sign Language Input Panel" 
      className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Channel 1: Deaf User (Sign-to-Speech)</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                signMode === 'bdsl' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              }`}>
                {signMode === 'bdsl' ? '🇧🇩 BdSL 60 Words' : '🇺🇸 ASL 36 Signs'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Dual Inference Engine • 3D Hand Landmarks • Gemini LLM</p>
          </div>
        </div>

        {/* Right Header Controls: Mode Selector & Camera Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => handleModeSwitch('bdsl')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                signMode === 'bdsl'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Bangla Sign Language - BdSLW60 Dataset (60 Words)"
            >
              🇧🇩 বাংলা সাইন
            </button>
            <button
              onClick={() => handleModeSwitch('asl')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                signMode === 'asl'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="American Sign Language (36 Classes)"
            >
              🇺🇸 ASL
            </button>
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
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* Video / Landmark Viewport */}
        <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          
          {/* Status Badge Over Video */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{statusText}</span>
          </div>

          {/* Active Engine Badge */}
          <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10">
            Engine: {signMode === 'bdsl' ? 'BdSL-60-RandomForest (94.07%)' : 'ASL-36-RandomForest (98.4%)'}
          </div>

          {/* Active Gesture Overlay Pill */}
          {activeGesture && (
            <div className={`absolute top-3 right-3 z-20 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow-lg border animate-bounce ${
              signMode === 'bdsl'
                ? 'bg-emerald-600/95 text-white border-emerald-400/40'
                : 'bg-brand-600/95 text-white border-brand-400/40'
            }`}>
              চিহ্নিত: {activeGesture}
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
                <p className="text-sm font-semibold text-slate-300">
                  {signMode === 'bdsl' ? 'বাংলা সাইন ক্যামেরা স্ট্যান্ডবাই মোডে আছে' : 'Camera is in standby'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {signMode === 'bdsl'
                    ? 'ক্যামেরা চালু করে হাতের অঙ্গভঙ্গি করুন অথবা নিচের ৬০টি বাংলা সাইন থেকে যেকোনো শব্দে ক্লিক করুন।'
                    : "Click 'Start Camera' to begin real-time gesture tracking, or tap the sample signs below."}
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
            <div className="absolute bottom-3 right-3 z-20 p-2 rounded-xl bg-brand-950/80 backdrop-blur-md border border-brand-800 text-brand-200 text-xs flex items-center gap-2">
              <span className="font-bold text-[10px] uppercase bg-brand-800 px-2 py-0.5 rounded">Demo Engine</span>
            </div>
          )}
        </div>

        {/* Quick Sign Vocabulary Trigger Bar */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>⚡ {signMode === 'bdsl' ? 'জনপ্রিয় বাংলা সাইন টোকেন' : 'Quick Sign Tokens'}</span>
              <span className="text-[10px] font-normal text-slate-500">
                ({signMode === 'bdsl' ? 'ক্লিক করলেই বাক্যে যুক্ত হবে' : 'Tap to insert sign'})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowDictionary(!showDictionary)}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1"
            >
              <span>{showDictionary ? 'ক্যাটালগ লুকান' : `সব শব্দ দেখুন (${activeDictionary.length})`}</span>
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5">
            {quickSigns.map((sign) => (
              <button
                key={sign}
                type="button"
                onClick={() => handleAddToken(sign)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs flex items-center gap-1 active:scale-95 ${
                  signMode === 'bdsl'
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800'
                    : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-800 hover:text-brand-800'
                }`}
              >
                <Plus className="w-3 h-3 text-slate-400" />
                <span>{sign}</span>
              </button>
            ))}
          </div>

          {/* Expanded Full Vocabulary Catalog */}
          {showDictionary && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              {/* Category Filter Tabs for BdSL */}
              {signMode === 'bdsl' && (
                <div className="flex flex-wrap gap-1 pb-1">
                  {[
                    { id: 'all', label: 'সকল শব্দ (৬০)' },
                    { id: 'family', label: 'পরিবার (১৪)' },
                    { id: 'food', label: 'খাবার (১৪)' },
                    { id: 'items', label: 'দৈনন্দিন (১২)' },
                    { id: 'household', label: 'গৃহস্থালি (১০)' },
                    { id: 'medical', label: 'চিকিৎসা (১০)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedCategory === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid of signs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredDictionary.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddToken(item.id)}
                    className="p-2 text-left rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-bold text-slate-900">{item.id}</p>
                      {item.wId && (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded">
                          {item.wId}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.label || item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Captured Sign Tokens Box */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>{signMode === 'bdsl' ? 'সংগৃহীত সাইন শব্দসমূহ' : 'Captured Sign Tokens'}</span>
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
                <span>{signMode === 'bdsl' ? 'মুছে ফেলুন' : 'Clear'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-h-[46px] p-2 bg-white rounded-xl border border-slate-200">
            {capturedTokens.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                {signMode === 'bdsl'
                  ? 'কোনো সাইন টোকেন এখনো যুক্ত হয়নি। ক্যামেরার সামনে সাইন করুন অথবা ওপরের শব্দগুলোতে ক্লিক করুন।'
                  : 'No sign tokens captured yet. Perform gestures in front of camera or click the token buttons above.'}
              </span>
            ) : (
              capturedTokens.map((token, idx) => (
                <span
                  key={`${token}-${idx}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs border shadow-2xs animate-fadeIn ${
                    signMode === 'bdsl'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-brand-100 text-brand-800 border-brand-200'
                  }`}
                >
                  <span>{token}</span>
                  <button
                    onClick={() => handleRemoveToken(idx)}
                    className="hover:text-rose-600 focus:outline-none text-sm font-black leading-none ml-0.5"
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
            className={`w-full mt-2.5 py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
              signMode === 'bdsl' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isReconstructing ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>
                  {signMode === 'bdsl' ? 'Gemini AI দিয়ে বাংলা বাক্য তৈরি হচ্ছে...' : 'Reconstructing via Gemini AI...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {signMode === 'bdsl'
                    ? 'Gemini AI দিয়ে পূর্ণাঙ্গ বাংলা বাক্য তৈরি করুন'
                    : 'Convert to Natural Sentence (Gemini AI)'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Reconstructed Sentence Display */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
          signMode === 'bdsl'
            ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200'
            : 'bg-gradient-to-br from-brand-50 to-sky-50 border-brand-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle className={`w-4 h-4 ${signMode === 'bdsl' ? 'text-emerald-600' : 'text-brand-600'}`} />
              <span>{signMode === 'bdsl' ? 'পুনর্গঠিত অর্থবহ বাংলা বাক্য:' : 'Reconstructed Fluent Sentence:'}</span>
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              signMode === 'bdsl' ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-700'
            }`}>
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
                {signMode === 'bdsl'
                  ? 'উপরে শব্দ যুক্ত করে বোতামে চাপ দিলে এখানে ব্যাকরণসম্মত প্রাকৃতিক বাংলা বাক্য আসবে।'
                  : 'Synthesized natural sentence will appear here in clear typography.'}
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
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>
                {isSpeaking 
                  ? 'উচ্চারণ করা হচ্ছে...' 
                  : (signMode === 'bdsl' ? 'বাংলায় পড়ে শুনুন (TTS)' : 'Speak for Hearing User')}
              </span>
            </button>

            <button
              onClick={handleCommitTurn}
              disabled={!reconstructedSentence}
              className={`py-2.5 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                signMode === 'bdsl'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
              }`}
            >
              <span>{signMode === 'bdsl' ? 'বার্তা পাঠান' : 'Send Turn'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default DeafSignPanel;
