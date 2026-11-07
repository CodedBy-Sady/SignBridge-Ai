import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Keyboard, 
  Volume2, 
  Sparkles,
  Radio
} from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAccessibility } from '../context/AccessibilityContext';

export const HearingVoicePanel = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const { triggerVisualAlert } = useAccessibility();

  // Use Web Speech API hook
  const {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    error,
    toggleListening,
    resetTranscript,
    stopListening
  } = useSpeechToText({
    onFinalTranscript: (text) => {
      setActiveSpeechText((prev) => (prev ? `${prev} ${text}` : text));
    }
  });

  // Keep active speech updated with live interim or final
  useEffect(() => {
    if (finalTranscript) {
      setActiveSpeechText(finalTranscript);
    }
  }, [finalTranscript]);

  const handleSendVoiceMessage = () => {
    const textToSend = activeSpeechText.trim() || interimTranscript.trim();
    if (!textToSend) return;

    onSendMessage({
      sender_role: 'hearing_user',
      input_type: 'voice_stt',
      raw_content: textToSend,
      final_content: textToSend,
      confidence_score: 0.98,
    });

    triggerVisualAlert();
    setActiveSpeechText('');
    resetTranscript();
    stopListening();
  };

  const handleSendTextMessage = (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;

    onSendMessage({
      sender_role: 'hearing_user',
      input_type: 'text',
      raw_content: textToSend,
      final_content: textToSend,
      confidence_score: 1.0,
    });

    triggerVisualAlert();
    setInputText('');
  };

  const handleQuickReply = (text) => {
    onSendMessage({
      sender_role: 'hearing_user',
      input_type: 'text',
      raw_content: text,
      final_content: text,
      confidence_score: 1.0,
    });
    triggerVisualAlert();
  };

  return (
    <section 
      aria-label="Hearing User Voice Input Panel" 
      className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Channel 2: Hearing User (Voice-to-Text)</h2>
            <p className="text-[11px] text-slate-400">Web Speech API STT • Instant Captions • High Contrast</p>
          </div>
        </div>

        {/* Live Mic Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span>{isListening ? 'Listening Live' : 'Mic Muted'}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* Big Pulsing Microphone Action Center */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/40 border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
          
          {/* Subtle audio wave ripple effect when active */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-36 h-36 rounded-full bg-emerald-400/20 animate-ping" />
              <span className="w-48 h-48 rounded-full bg-emerald-400/10 animate-pulse" />
            </div>
          )}

          {/* Pulsing Mic Button */}
          <button
            onClick={toggleListening}
            className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl ${
              isListening
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-8 ring-emerald-100 scale-105'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 hover:border-emerald-500'
            }`}
            aria-label={isListening ? 'Stop recording voice' : 'Start speaking'}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10 text-emerald-600" />
            )}
            <span className="text-[10px] font-extrabold uppercase mt-1">
              {isListening ? 'Listening' : 'Tap & Speak'}
            </span>
          </button>

          <p className="mt-4 text-xs font-semibold text-slate-600 max-w-xs">
            {isListening
              ? 'Speak clearly into your microphone. Words will transcribe instantly in real time.'
              : 'Tap the microphone to speak your response to the deaf user.'}
          </p>

          {/* Browser Support / Permission Warning */}
          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 max-w-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Real-Time Live Speech Transcription Box */}
        <div className="flex-1 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              Live Captions for Deaf Participant
            </span>
            {(activeSpeechText || interimTranscript) && (
              <button
                onClick={() => {
                  setActiveSpeechText('');
                  resetTranscript();
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Large High-Contrast Display for Deaf Reader */}
          <div className="min-h-[70px] flex items-center">
            {activeSpeechText || interimTranscript ? (
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed tracking-wide">
                  {activeSpeechText}
                  {interimTranscript && (
                    <span className="text-slate-400 font-medium italic ml-1.5">
                      {interimTranscript}...
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Speech transcription will display here in high-contrast, large text for the deaf participant to read comfortably.
              </p>
            )}
          </div>

          {/* Send Spoken Transcript Action */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-800">
            <button
              onClick={handleSendVoiceMessage}
              disabled={!activeSpeechText && !interimTranscript}
              className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <span>Transmit Spoken Words</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fallback Keyboard Input for Silent / No-Mic Environments */}
        <div className="space-y-2">
          <form onSubmit={handleSendTextMessage} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Or type a message to the deaf participant..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors bg-white text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Response Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick replies:</span>
            {[
              'I understand completely.',
              'Could you repeat that gesture?',
              'I will help you right now.',
              'Wait a minute please.'
            ].map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleQuickReply(reply)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-200"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HearingVoicePanel;

