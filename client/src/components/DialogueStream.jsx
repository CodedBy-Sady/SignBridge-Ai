import React, { useEffect, useRef } from 'react';
import { 
  Volume2, 
  Hand, 
  Mic, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare, 
  Layers,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const DialogueStream = ({ messages = [], onEndSession }) => {
  const { speak, isSpeaking } = useTextToSpeech();
  const [copiedId, setCopiedId] = React.useState(null);
  const streamEndRef = useRef(null);

  // Auto-scroll to latest turn
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      aria-label="Conversation History and Live Dialogue Transcript"
      className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Dialogue Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Unified Two-Way Dialogue Stream
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
            {messages.length} turns
          </span>
        </div>

        {onEndSession && (
          <button
            onClick={onEndSession}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs transition-colors"
          >
            End & Export Session
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600">The dialogue has started.</p>
            <p className="text-xs max-w-sm">
              Use either the Sign Panel (left) or the Voice Panel (right) to transmit your first message.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isDeaf = msg.sender_role === 'deaf_user';
            const isHearing = msg.sender_role === 'hearing_user';
            const isSystem = msg.sender_role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center my-2">
                  <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{msg.final_content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-[88%] ${isDeaf ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Speaker Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                    isDeaf
                      ? 'bg-gradient-to-tr from-brand-600 to-sky-500'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-400'
                  }`}
                  title={isDeaf ? 'Deaf User' : 'Hearing User'}
                >
                  {isDeaf ? <Hand className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`rounded-2xl p-4 shadow-xs border transition-all ${
                    isDeaf
                      ? 'bg-brand-50/50 border-brand-200 text-slate-900 rounded-tl-sm'
                      : 'bg-emerald-50/50 border-emerald-200 text-slate-900 rounded-tr-sm'
                  }`}
                >
                  {/* Sender Metadata Row */}
                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5 pb-1 border-b border-black/5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={isDeaf ? 'text-brand-800' : 'text-emerald-800'}>
                        {isDeaf ? 'Deaf Participant' : 'Hearing Participant'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-white/80 border border-black/5">
                        {msg.input_type === 'sign_ai' ? 'ASL Gesture AI' : msg.input_type === 'voice_stt' ? 'Voice STT' : 'Text Input'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>

                  {/* Raw Gloss / Keyword Annotation for Sign turns */}
                  {msg.raw_content && msg.input_type === 'sign_ai' && (
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Detected Glosses: [{msg.raw_content}]</span>
                    </div>
                  )}

                  {/* Natural Final Sentence Content */}
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {msg.final_content}
                  </p>

                  {/* Bubble Footer Actions */}
                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t border-black/5 text-xs">
                    {msg.confidence_score ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Model Confidence: {Math.round(msg.confidence_score * 100)}%
                      </span>
                    ) : <span />}

                    <div className="flex items-center gap-1.5">
                      {/* Read Aloud Button for Sign AI messages */}
                      {isDeaf && (
                        <button
                          onClick={() => speak(msg.final_content)}
                          className="p-1 text-slate-500 hover:text-brand-600 rounded transition-colors"
                          title="Vocalize this sign message for the hearing user"
                          aria-label="Vocalize message"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Copy message button */}
                      <button
                        onClick={() => handleCopy(msg.id || index, msg.final_content)}
                        className="p-1 text-slate-500 hover:text-slate-700 rounded transition-colors"
                        title="Copy message text"
                        aria-label="Copy message"
                      >
                        {copiedId === (msg.id || index) ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={streamEndRef} />
      </div>
    </div>
  );
};

export default DialogueStream;

