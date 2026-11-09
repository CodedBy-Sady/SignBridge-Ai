import React, { useState } from 'react';
import {
  Mic,
  Send,
  RotateCcw,
  AlertCircle,
  Keyboard,
  Radio,
  Square,
  Sparkles,
} from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAccessibility } from '../context/AccessibilityContext';

export const HearingVoicePanel = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [completedLines, setCompletedLines] = useState([]);
  const { triggerVisualAlert } = useAccessibility();

  const {
    isListening,
    isSupported,
    interimText,
    finalText,
    error,
    toggleListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Handle clicking the Mic button
  const handleMicToggle = () => {
    if (isListening) {
      const liveText = (finalText + (interimText ? ' ' + interimText : '')).trim();
      if (liveText) {
        setCompletedLines((prev) => [
          ...prev,
          {
            id: `line-${Date.now()}`,
            text: liveText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
      stopListening();
    } else {
      toggleListening();
    }
  };

  // Transmit spoken words to the dialogue stream
  const handleSendVoiceMessage = () => {
    const liveText = (finalText + (interimText ? ' ' + interimText : '')).trim();
    const allTextList = completedLines.map((l) => l.text);
    if (liveText && isListening) {
      allTextList.push(liveText);
    }

    const textToSend = allTextList.join(' ').trim();
    if (!textToSend) return;

    onSendMessage({
      sender_role: 'hearing_user',
      input_type: 'voice_stt',
      raw_content: textToSend,
      final_content: textToSend,
      confidence_score: 0.98,
    });

    triggerVisualAlert();
    setCompletedLines([]);
    resetTranscript();
    if (isListening) {
      stopListening();
    }
  };

  // Send typed text from keyboard input
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

  // Quick reply chips
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

  // Clear all captured captions
  const handleClearAll = () => {
    setCompletedLines([]);
    resetTranscript();
    if (isListening) {
      stopListening();
    }
  };

  const hasContent =
    completedLines.length > 0 || finalText.trim() || interimText.trim();

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
            <h2 className="text-sm font-bold tracking-tight">
              Channel 2: Hearing User (Voice-to-Text)
            </h2>
            <p className="text-[11px] text-slate-400">
              Speech Recognition • Instant Captions
            </p>
          </div>
        </div>

        {/* Live Mic Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-red-500 animate-ping' : 'bg-slate-500'
            }`}
          />
          <span>{isListening ? 'Listening Live' : 'Mic Off'}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Big Microphone Action Center */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/30 border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Animated Wave Rings when listening */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-36 h-36 rounded-full bg-red-500/15 animate-ping" />
              <span className="w-48 h-48 rounded-full bg-red-500/10 animate-pulse absolute" />
            </div>
          )}

          {/* Main Action Mic Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={!isSupported}
            className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white ring-8 ring-red-100 scale-105 active:scale-95'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border-2 border-slate-300 hover:border-emerald-500 hover:text-emerald-700 active:scale-95'
            }`}
            aria-label={isListening ? 'Stop recording voice' : 'Start speaking'}
          >
            {isListening ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-10 h-10 text-emerald-600" />
            )}
            <span className="text-[10px] font-extrabold uppercase mt-1 tracking-wider">
              {isListening ? 'Stop Mic' : 'Tap & Speak'}
            </span>
          </button>

          <p className="mt-4 text-xs font-semibold text-slate-600 max-w-xs">
            {isListening
              ? '🔴 Recording active! Speak as long as you want. When done, click the button to stop and finish your line.'
              : isSupported
              ? 'Click the mic to speak. Speech converts to text continuously in real time.'
              : 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'}
          </p>

          {/* Browser Permission or Network Warning */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 max-w-sm text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Real-Time Live Speech Transcription Box */}
        <div className="flex-1 min-h-[220px] p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              Live Captions for Deaf Participant
            </span>
            {hasContent && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* High-Contrast Large Text Display Area */}
          <div className="min-h-[110px] flex-1 overflow-y-auto pr-1 space-y-3">
            {hasContent ? (
              <>
                {/* Completed finalized lines */}
                {completedLines.map((line) => (
                  <div
                    key={line.id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-3 animate-fadeIn"
                  >
                    <p className="text-base sm:text-lg font-bold text-emerald-300 leading-relaxed">
                      {line.text}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                      {line.timestamp}
                    </span>
                  </div>
                ))}

                {/* Currently live in-progress speech */}
                {(finalText || interimText) && (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-emerald-500/30">
                    <p className="text-lg sm:text-xl font-extrabold text-white leading-relaxed">
                      {finalText}
                      {interimText && (
                        <span className="text-emerald-400/80 font-medium italic ml-1.5">
                          {interimText}...
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mt-1 block">
                      ● Live speech incoming
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-sm text-slate-400 italic">
                  Tap the microphone above and speak. Your words will appear here instantly in high-contrast text.
                </p>
              </div>
            )}
          </div>

          {/* Transmit Action Bar */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">
              {completedLines.length > 0 &&
                `${completedLines.length} line${completedLines.length > 1 ? 's' : ''} ready`}
            </span>

            <button
              type="button"
              onClick={handleSendVoiceMessage}
              disabled={!hasContent}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Transmit Spoken Words</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fallback Keyboard Input */}
        <div className="space-y-2">
          <form onSubmit={handleSendTextMessage} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
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
            <span className="text-[11px] font-bold text-slate-400 shrink-0">
              Quick replies:
            </span>
            {[
              'I understand completely.',
              'Could you repeat that gesture?',
              'I will help you right now.',
              'Wait a minute please.',
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
