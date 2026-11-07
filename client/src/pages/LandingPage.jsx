import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Hand, 
  Mic, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Play, 
  RotateCcw,
  Smile,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const LandingPage = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { speak, isSpeaking } = useTextToSpeech();

  // Interactive Live Demo Simulator on Landing Page
  const [activeTab, setActiveTab] = useState('deaf_to_hearing'); // 'deaf_to_hearing' | 'hearing_to_deaf'
  const [selectedDeafSign, setSelectedDeafSign] = useState({
    title: 'Hello! Nice to meet you.',
    tokens: ['HELLO', 'MEET', 'NICE'],
    voice: 'Hello, it is very nice to meet you.',
    emoji: '👋'
  });
  const [hearingSpeechInput, setHearingSpeechInput] = useState('Hello! I can understand you clearly. How can I help you today?');
  const [simulatedVoiceActive, setSimulatedVoiceActive] = useState(false);

  const sampleDeafSigns = [
    {
      title: 'Greeting',
      tokens: ['HELLO', 'MEET', 'NICE'],
      voice: 'Hello! It is very nice to meet you.',
      emoji: '👋'
    },
    {
      title: 'Medical Help',
      tokens: ['HELP', 'DOCTOR'],
      voice: 'Please help, I need to see a doctor.',
      emoji: '🩺'
    },
    {
      title: 'Restroom Inquiry',
      tokens: ['WHERE', 'RESTROOM'],
      voice: 'Could you please tell me where the nearest restroom is?',
      emoji: '🚻'
    },
    {
      title: 'Thank You',
      tokens: ['THANK YOU', 'VERY MUCH'],
      voice: 'Thank you so much for your assistance!',
      emoji: '🙏'
    }
  ];

  const sampleHearingPhrases = [
    'Hello! I can understand you clearly. How can I help you today?',
    'The doctor is available on the second floor, room 204.',
    'Yes, the restroom is straight down this hallway on your left.',
    'You are very welcome! Have a wonderful day.'
  ];

  const handleStartLive = () => {
    if (isAuthenticated) {
      navigate('/communicate');
    } else {
      onOpenAuth('login');
    }
  };

  const handleTestDeafVoice = (item) => {
    setSelectedDeafSign(item);
    speak(item.voice);
  };

  const handleSimulateHearingSpeech = (phrase) => {
    setHearingSpeechInput(phrase);
    setSimulatedVoiceActive(true);
    setTimeout(() => setSimulatedVoiceActive(false), 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-200">
      
      {/* 1. HERO SECTION: Zero Technical Jargon, 100% Human Connection */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-radial-gradient from-brand-50/50 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-6">
            <span>🤝 Bridging Deaf & Hearing Worlds</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Talk to Anyone. <br />
            <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Even Without Knowing Sign Language.
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A deaf person signs in front of their camera, and it instantly speaks aloud. 
            A hearing person speaks, and their voice appears in big, clear text. 
            Simple, natural, and accessible for everyone.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={handleStartLive}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 active:scale-95"
            >
              <span>{isAuthenticated ? 'Open Live Conversation' : 'Start Conversation (Sign In)'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-base transition-all shadow-2xs"
              >
                Create Free Account
              </button>
            )}
          </div>

        </div>
      </section>

      {/* 2. INTERACTIVE DEMONSTRATION WIDGET: Anyone can see how it works instantly */}
      <section className="py-16 sm:py-20 bg-slate-100 border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-600 mb-2">
              See It in Action
            </h2>
            <p className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How Conversation Happens in Real-Time
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Try the interactive preview below. No login or camera required to test this demo!
            </p>
          </div>

          {/* Dual-Tab Interactive Switcher */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab('deaf_to_hearing')}
                className={`py-4 px-4 text-center font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'deaf_to_hearing'
                    ? 'bg-white text-brand-600 border-b-2 border-brand-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Hand className="w-5 h-5 text-brand-600" />
                <span>1. Deaf Person Signs → Speaks Aloud</span>
              </button>

              <button
                onClick={() => setActiveTab('hearing_to_deaf')}
                className={`py-4 px-4 text-center font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'hearing_to_deaf'
                    ? 'bg-white text-emerald-600 border-b-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Mic className="w-5 h-5 text-emerald-600" />
                <span>2. Hearing Person Speaks → Big Clear Text</span>
              </button>
            </div>

            {/* TAB 1: DEAF PERSON -> HEARING PERSON */}
            {activeTab === 'deaf_to_hearing' && (
              <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
                
                <div className="bg-brand-50/60 p-4 rounded-2xl border border-brand-100 flex items-center gap-3">
                  <span className="text-3xl">👋</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Step: The deaf person shows hand signs to their camera
                    </h3>
                    <p className="text-xs text-slate-600">
                      SignBridge AI understands the sign tokens, builds a polite English sentence, and speaks it out loud for the hearing listener.
                    </p>
                  </div>
                </div>

                {/* Sample Signs to click */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Click any sample sign to see and hear the live translation:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {sampleDeafSigns.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => handleTestDeafVoice(item)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          selectedDeafSign.title === item.title
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md scale-[1.02]'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="text-2xl mb-1">{item.emoji}</span>
                        <span className="text-xs font-bold">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* The Visual Simulation Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Left: What the Camera Sees */}
                  <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Camera Ingestion
                      </span>
                      <span className="font-mono text-[11px] text-sky-400">Hand Detection: Active</span>
                    </div>

                    <div className="text-center py-4">
                      <span className="text-5xl block mb-2">{selectedDeafSign.emoji}</span>
                      <p className="text-xs text-slate-400">Recognized Sign Tokens:</p>
                      <div className="flex justify-center gap-1.5 mt-1.5">
                        {selectedDeafSign.tokens.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-brand-900 text-brand-300 font-mono font-bold text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center">
                      AI translates hand movement in real-time
                    </p>
                  </div>

                  {/* Right: What the Hearing Person Hears & Reads */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 border border-brand-200 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between text-xs text-brand-900 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-brand-600" />
                        Audible Voice for Hearing Listener
                      </span>
                      <span className="text-[11px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                        Natural English
                      </span>
                    </div>

                    <div className="py-2">
                      <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                        "{selectedDeafSign.voice}"
                      </p>
                    </div>

                    <button
                      onClick={() => speak(selectedDeafSign.voice)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-brand-100 border border-brand-300 text-brand-800 font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4 text-brand-600" />
                      <span>{isSpeaking ? 'Playing Voice Output...' : 'Click to Hear This Sentence Aloud'}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: HEARING PERSON -> DEAF PERSON */}
            {activeTab === 'hearing_to_deaf' && (
              <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
                
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <span className="text-3xl">🎙️</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Step: The hearing person talks naturally into their microphone
                    </h3>
                    <p className="text-xs text-slate-600">
                      Their spoken words turn instantly into large, clear captions on the deaf person’s screen with high visual contrast.
                    </p>
                  </div>
                </div>

                {/* Sample Spoken Phrases to click */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Click any sample speech to see how the deaf participant reads it:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sampleHearingPhrases.map((phrase) => (
                      <button
                        key={phrase}
                        onClick={() => handleSimulateHearingSpeech(phrase)}
                        className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                          hearingSpeechInput === phrase
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        "{phrase}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Big High-Contrast Deaf Screen Preview */}
                <div className="p-6 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${simulatedVoiceActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                      Live Screen for Deaf Reader (High-Contrast Mode)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Real-Time Captions
                    </span>
                  </div>

                  <div className="py-4 min-h-[90px] flex items-center">
                    <p className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed tracking-wide">
                      {hearingSpeechInput}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    ✓ High-legibility font with optical flash alerts so deaf users never miss a response.
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>
      </section>

      {/* 3. ACCESS LOCK NOTICE: All Full Features Require Login */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ready to Connect Live?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            To use your live webcam, turn on your real microphone, save your dialogue transcripts, and communicate with partners, please sign in or create a free account.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-500/20 transition-all"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition-all"
            >
              Create Free Account
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default LandingPage;
