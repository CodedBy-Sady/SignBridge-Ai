import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const LandingPage = ({ onOpenAuth }) => {
  const { isAuthenticated, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const { speak, isSpeaking } = useTextToSpeech();

  // Interactive Live Demo Simulator State (Preserved exact data & behavior)
  const [activeTab, setActiveTab] = useState('deaf_to_hearing'); // 'deaf_to_hearing' | 'hearing_to_deaf'
  const [selectedDeafSign, setSelectedDeafSign] = useState({
    title: 'Greeting',
    tokens: ['HELLO', 'MEET', 'NICE'],
    voice: 'Hello! It is very nice to meet you.'
  });
  const [hearingSpeechInput, setHearingSpeechInput] = useState('Hello! I can understand you clearly. How can I help you today?');
  const [simulatedVoiceActive, setSimulatedVoiceActive] = useState(false);

  // Exact Sample Sign Data (Replaced emojis with semantic icon identifiers)
  const sampleDeafSigns = [
    {
      id: 'greeting',
      title: 'Greeting',
      tokens: ['HELLO', 'MEET', 'NICE'],
      voice: 'Hello! It is very nice to meet you.'
    },
    {
      id: 'medical',
      title: 'Medical Help',
      tokens: ['HELP', 'DOCTOR'],
      voice: 'Please help, I need to see a doctor.'
    },
    {
      id: 'restroom',
      title: 'Restroom Inquiry',
      tokens: ['WHERE', 'RESTROOM'],
      voice: 'Could you please tell me where the nearest restroom is?'
    },
    {
      id: 'thankyou',
      title: 'Thank You',
      tokens: ['THANK YOU', 'VERY MUCH'],
      voice: 'Thank you so much for your assistance!'
    }
  ];

  // Exact Sample Hearing Speech Phrases (Preserved)
  const sampleHearingPhrases = [
    'Hello! I can understand you clearly. How can I help you today?',
    'The doctor is available on the second floor, room 204.',
    'Yes, the restroom is straight down this hallway on your left.',
    'You are very welcome! Have a wonderful day.'
  ];

  // Primary Action Target (Preserved Gating)
  const handleStartLive = () => {
    if (isAuthenticated) {
      navigate('/communicate');
    } else {
      onOpenAuth('login');
    }
  };

  // Final CTA Role-based Navigation (Part 3 Rule 4)
  const handleRoleStart = (role) => {
    if (updateUserRole) {
      updateUserRole(role);
    }
    handleStartLive();
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

  // Keyboard navigation for tablist
  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab((prev) => (prev === 'deaf_to_hearing' ? 'hearing_to_deaf' : 'deaf_to_hearing'));
    }
  };

  return (
    <main id="main-content" className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-200">
      
      {/* =========================================================================
          PART 7: HERO SECTION (Dark Section)
          ========================================================================= */}
      <section 
        className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 text-white border-b border-white/10"
        style={{
          backgroundColor: '#070B1A',
          backgroundImage: `
            radial-gradient(900px 480px at 15% -10%, rgba(79,124,255,.35), transparent 60%),
            radial-gradient(800px 460px at 92% 10%, rgba(139,92,246,.30), transparent 60%),
            radial-gradient(700px 420px at 50% 115%, rgba(34,211,197,.20), transparent 60%)
          `
        }}
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
          
          {/* 1. Pill Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[14px] font-semibold mb-6 shadow-sm"
            style={{
              borderColor: 'rgba(143,176,255,.35)',
              backgroundColor: 'rgba(79,124,255,.12)',
              color: '#BFD0FF'
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" aria-hidden="true" />
            <span>Real-time voice for Deaf and speech-impaired people</span>
          </div>

          {/* 2. H1: Two lines, no orphan words, responsive */}
          <h1 className="font-display text-[40px] sm:text-[54px] lg:text-[64px] font-extrabold tracking-[-0.035em] leading-[1.08] heading-balance max-w-[960px]">
            <span className="text-white block">Signed or spoken,</span>
            <span className="sb-gradient-text block">every voice is heard.</span>
          </h1>

          {/* 3. Subtitle */}
          <p className="mt-6 text-[18px] sm:text-[20px] text-[#CBD5E1] max-w-[680px] leading-[1.6]">
            SignBridge AI turns sign language into spoken words and spoken words into clear text, so Deaf and speech-impaired people can talk with anyone, without an interpreter.
          </p>

          {/* 4. CTA Row */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            {/* Primary Live Conversation Button */}
            <button
              type="button"
              onClick={handleStartLive}
              className="w-full sm:w-auto h-[56px] px-8 rounded-[14px] text-white font-bold text-[16px] sb-btn-glow flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
            >
              <span>{isAuthenticated ? 'Open live conversation' : 'Open live conversation'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Secondary Anchor Link to Demo */}
            <a
              href="#demo"
              className="w-full sm:w-auto h-[56px] px-7 rounded-[14px] border border-white/25 bg-white/[0.06] hover:bg-white/10 text-white font-semibold text-[16px] flex items-center justify-center gap-2 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4 text-emerald-300">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Try the demo</span>
            </a>
          </div>

          {/* 5. Animated Bridge Scene Frame (Part 8) */}
          <div 
            className="w-full max-w-[1120px] mt-12 rounded-[28px] border border-white/[0.14] p-5 sm:p-6 pb-2 shadow-2xl sb-scene"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02))' }}
          >
            {/* Inline Responsive Animated Bridge SVG */}
            <svg 
              viewBox="0 0 1000 420" 
              width="100%" 
              role="img" 
              aria-label="Animation: a person signing on the left, an AI bridge in the middle, and a listening person on the right who hears the words" 
              style={{ display: 'block', height: 'auto' }}
            >
              <defs>
                <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#7DA2FF" />
                  <stop offset="0.5" stopColor="#B79CFF" />
                  <stop offset="1" stopColor="#5EEAD4" />
                </linearGradient>
                <linearGradient id="pa" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#3A63F0" />
                  <stop offset="1" stopColor="#7C4DFF" />
                </linearGradient>
                <linearGradient id="pb" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0EA5A0" />
                  <stop offset="1" stopColor="#3A63F0" />
                </linearGradient>
                <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#7DA2FF" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#7DA2FF" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="170" cy="392" rx="130" ry="16" fill="url(#floor)" />
              <ellipse cx="830" cy="392" rx="130" ry="16" fill="url(#floor)" />

              {/* bridge arc */}
              <path d="M262 170 Q500 -30 738 170" fill="none" stroke="url(#arc)" strokeWidth="3" opacity="0.35" />
              <path className="flow" d="M262 170 Q500 -30 738 170" fill="none" stroke="url(#arc)" strokeWidth="4" strokeLinecap="round" />

              {/* AI node */}
              <g className="bob">
                <circle className="ring" cx="500" cy="62" r="34" fill="none" stroke="#B79CFF" strokeWidth="2" />
                <circle className="ring2" cx="500" cy="62" r="34" fill="none" stroke="#5EEAD4" strokeWidth="2" />
                <circle cx="500" cy="62" r="34" fill="#0B1124" stroke="url(#arc)" strokeWidth="3" />
                <text x="500" y="70" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="22" fontWeight="800" fill="#FFFFFF">AI</text>
              </g>

              {/* chips */}
              <g className="chipL">
                <rect x="262" y="214" width="160" height="40" rx="12" fill="#111A3A" stroke="#7DA2FF" strokeOpacity="0.5" />
                <text x="342" y="240" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="15" fill="#C7D6FF">HELLO · MEET</text>
              </g>
              <g className="chipR">
                <rect x="520" y="214" width="236" height="40" rx="12" fill="#0E2B33" stroke="#5EEAD4" strokeOpacity="0.5" />
                <text x="638" y="240" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fill="#CCFBF1">“Hello, nice to meet you.”</text>
              </g>

              {/* person A: signer */}
              <g>
                <rect x="100" y="215" width="140" height="170" rx="62" fill="url(#pa)" />
                <circle cx="170" cy="150" r="42" fill="#E8EEFF" />
                <path d="M130 138 Q170 96 210 138" fill="#1B2A8F" />
                <circle cx="156" cy="156" r="3.5" fill="#1B2A8F" />
                <circle cx="184" cy="156" r="3.5" fill="#1B2A8F" />
                <path d="M160 172 Q170 180 180 172" fill="none" stroke="#1B2A8F" strokeWidth="3" strokeLinecap="round" />
                <g className="wave">
                  <path d="M224 250 L276 170" stroke="#E8EEFF" strokeWidth="22" strokeLinecap="round" />
                  <circle cx="282" cy="158" r="22" fill="#E8EEFF" />
                  <path d="M268 142 L262 118M280 138 L280 112M292 140 L298 116M302 150 L316 130" stroke="#E8EEFF" strokeWidth="8" strokeLinecap="round" />
                </g>
                <g className="wave2">
                  <path d="M118 262 L96 318" stroke="#E8EEFF" strokeWidth="20" strokeLinecap="round" />
                  <circle cx="92" cy="328" r="18" fill="#E8EEFF" />
                </g>
              </g>

              {/* person B: listener */}
              <g>
                <rect x="760" y="215" width="140" height="170" rx="62" fill="url(#pb)" />
                <circle cx="830" cy="150" r="42" fill="#E6FAF7" />
                <path d="M790 138 Q830 96 870 138" fill="#0F4F55" />
                <circle cx="816" cy="156" r="3.5" fill="#0F4F55" />
                <circle cx="844" cy="156" r="3.5" fill="#0F4F55" />
                <path d="M820 170 Q830 180 840 170" fill="none" stroke="#0F4F55" strokeWidth="3" strokeLinecap="round" />
                <path d="M788 150 A42 42 0 0 1 872 150" fill="none" stroke="#5EEAD4" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                <rect x="780" y="146" width="12" height="30" rx="6" fill="#5EEAD4" />
                <path className="snd1" d="M760 130 Q744 150 760 170" fill="none" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" />
                <path className="snd2" d="M744 118 Q720 150 744 182" fill="none" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" />
                <path className="snd3" d="M728 106 Q696 150 728 194" fill="none" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* labels */}
              <text x="170" y="412" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600" fill="#BFD0FF">Deaf or speech-impaired</text>
              <text x="830" y="412" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600" fill="#99F6E4">Anyone, no sign language needed</text>

              {/* equalizer */}
              <g>
                <rect className="eq" x="472" y="300" width="8" height="40" rx="4" fill="#7DA2FF" />
                <rect className="eq" x="487" y="300" width="8" height="40" rx="4" fill="#B79CFF" style={{ animationDelay: '0.2s' }} />
                <rect className="eq" x="502" y="300" width="8" height="40" rx="4" fill="#B79CFF" style={{ animationDelay: '0.4s' }} />
                <rect className="eq" x="517" y="300" width="8" height="40" rx="4" fill="#5EEAD4" style={{ animationDelay: '0.6s' }} />
              </g>
            </svg>
          </div>

          {/* 6. Legend Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-9 text-[15px] font-semibold">
            <span className="flex items-center gap-2 text-[#BFD0FF]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7DA2FF]" aria-hidden="true" />
              Signs become spoken words
            </span>
            <span className="flex items-center gap-2 text-[#99F6E4]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5EEAD4]" aria-hidden="true" />
              Speech becomes big, clear text
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.1: "BUILT WITH" STRIP
          ========================================================================= */}
      <section className="bg-white border-b border-[#E6EAF5] py-9 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-wrap items-center justify-center gap-x-11 gap-y-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
            BUILT WITH
          </span>
          <span className="font-display text-[17px] font-bold text-[#334155]">
            MediaPipe hand landmarks
          </span>
          <span className="font-display text-[17px] font-bold text-[#334155]">
            Google Gemini
          </span>
          <span className="font-display text-[17px] font-bold text-[#334155]">
            Web Speech API
          </span>
          <span className="font-display text-[17px] font-bold text-[#334155]">
            WCAG 2.1 AA
          </span>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9.2: OUR GOAL (id="mission", white)
          ========================================================================= */}
      <section id="mission" className="bg-white py-16 sm:py-24 px-6 border-b border-slate-100">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          
          {/* Left Column */}
          <div className="space-y-6">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#4F46E5]">
              OUR GOAL
            </span>
            <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold text-[#0F172A] leading-[1.12] heading-balance tracking-tight">
              No one should need an interpreter to be understood.
            </h2>
            <p className="text-[18px] text-[#475569] leading-[1.7]">
              Millions of Deaf and speech-impaired people face a silent barrier in everyday life: at the clinic, at the shop, at school, even at home. SignBridge AI exists to remove that barrier, so a conversation can simply happen.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-4 py-2 rounded-full text-[15px] font-semibold bg-[#EEF0FF] border border-[#D9DDFB] text-[#3730A3]">
                Be heard
              </span>
              <span className="px-4 py-2 rounded-full text-[15px] font-semibold bg-[#E6FAF7] border border-[#BDE6E0] text-[#115E59]">
                Understand
              </span>
              <span className="px-4 py-2 rounded-full text-[15px] font-semibold bg-[#F3EBFF] border border-[#E2D3FB] text-[#5B21B6]">
                Stay independent
              </span>
            </div>
          </div>

          {/* Right Column: 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5">
            {/* Card 1: Be heard */}
            <div 
              className="rounded-[24px] p-7 border border-[#D9DDFB] flex flex-col sm:flex-row lg:flex-row items-start gap-5 shadow-xs"
              style={{ background: 'linear-gradient(160deg, #EEF0FF, #FFFFFF)' }}
            >
              <div 
                className="w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0 shadow-md"
                style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
              >
                {/* Raised-hand stroke icon */}
                <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
                  <path d="M24 36V22a3 3 0 0 1 6 0v10M30 30V18a3 3 0 0 1 6 0v14M36 32V22a3 3 0 0 1 6 0v14M24 36a3 3 0 0 0-6 0v6c0 8 6 12 14 12s14-4 14-12v-8" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[20px] font-bold text-[#0F172A] mb-1">Be heard</h3>
                <p className="text-[15px] text-[#475569]">Your signs become natural spoken sentences.</p>
              </div>
            </div>

            {/* Card 2: Understand */}
            <div 
              className="rounded-[24px] p-7 border border-[#BDE6E0] flex flex-col sm:flex-row lg:flex-row items-start gap-5 shadow-xs"
              style={{ background: 'linear-gradient(160deg, #E6FAF7, #FFFFFF)' }}
            >
              <div 
                className="w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0 shadow-md"
                style={{ background: 'linear-gradient(135deg, #0EA5A0, #3A63F0)' }}
              >
                {/* Text lines stroke icon */}
                <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
                  <path d="M16 22h32M16 32h32M16 42h20" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[20px] font-bold text-[#0F172A] mb-1">Understand</h3>
                <p className="text-[15px] text-[#475569]">Their voice appears as big, readable text.</p>
              </div>
            </div>

            {/* Card 3: Stay independent */}
            <div 
              className="rounded-[24px] p-7 border border-[#E2D3FB] flex flex-col sm:flex-row lg:flex-row items-start gap-5 shadow-xs"
              style={{ background: 'linear-gradient(160deg, #F3EBFF, #FFFFFF)' }}
            >
              <div 
                className="w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0 bg-[#7C3AED] shadow-md"
              >
                {/* Person stroke icon */}
                <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
                  <circle cx="32" cy="22" r="7" />
                  <path d="M18 50c2-10 8-14 14-14s12 4 14 14" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[20px] font-bold text-[#0F172A] mb-1">Stay independent</h3>
                <p className="text-[15px] text-[#475569]">Handle daily life without waiting for help.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.3: HOW IT WORKS (id="how", bg --sb-surface, borders)
          ========================================================================= */}
      <section id="how" className="bg-[#F5F7FF] py-16 sm:py-24 px-6 border-y border-[#E1E7FB]">
        <div className="mx-auto max-w-[1200px] space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#4F46E5]">
              HOW IT WORKS
            </span>
            <h2 className="font-display text-[30px] sm:text-[44px] font-extrabold text-[#0F172A] leading-[1.12] heading-balance tracking-tight">
              From a hand sign to a spoken sentence in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            
            {/* Step 1 */}
            <div className="bg-white rounded-[24px] p-8 sm:p-9 border border-[#E1E7FB] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #3A63F0, #6B3FE0)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                    <path d="m22 8-6 4 6 4V8Z" />
                    <rect width="14" height="12" x="2" y="6" rx="2" />
                  </svg>
                </div>
                <span className="block text-[13px] font-bold uppercase tracking-[0.08em] text-[#6366F1]">
                  STEP 1
                </span>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A]">
                  Turn on your camera
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Allow camera access. SignBridge tracks 21 landmarks on each hand in real time, right in your browser.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-[24px] p-8 sm:p-9 border border-[#E1E7FB] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #6B3FE0, #A855F7)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                </div>
                <span className="block text-[13px] font-bold uppercase tracking-[0.08em] text-[#7C3AED]">
                  STEP 2
                </span>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A]">
                  AI builds the sentence
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Recognised signs become a polite, natural English sentence and are spoken aloud.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-[24px] p-8 sm:p-9 border border-[#E1E7FB] shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5A0)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  </svg>
                </div>
                <span className="block text-[13px] font-bold uppercase tracking-[0.08em] text-[#0F766E]">
                  STEP 3
                </span>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A]">
                  They talk, you read
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  The other person simply speaks. Their words appear instantly in big, high-contrast text you can resize.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.4: FEATURES (id="features", white)
          ========================================================================= */}
      <section id="features" className="bg-white py-16 sm:py-24 px-6 border-b border-slate-100">
        <div className="mx-auto max-w-[1200px] space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#4F46E5]">
              FEATURES
            </span>
            <h2 className="font-display text-[30px] sm:text-[44px] font-extrabold text-[#0F172A] leading-[1.12] heading-balance tracking-tight">
              Everything you need for a real conversation
            </h2>
          </div>

          <div className="flex flex-wrap gap-6">
            
            {/* Large Card: Sign to Speech */}
            <div 
              className="flex-[2_1_560px] min-h-[280px] rounded-[28px] p-9 sm:p-11 text-white flex flex-col justify-between shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
            >
              <div className="w-[52px] h-[52px] rounded-[16px] bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </div>
              <div className="space-y-3 mt-8">
                <h3 className="font-display text-[26px] sm:text-[28px] font-extrabold">
                  Sign to speech
                </h3>
                <p className="text-[17px] text-[#E0E7FF] leading-relaxed max-w-xl">
                  Real-time hand landmark tracking turns your signs into fluent spoken English the other person can hear immediately.
                </p>
              </div>
            </div>

            {/* Small Card 1: Speech to big text */}
            <div className="flex-[1_1_320px] rounded-[28px] p-8 sm:p-9 bg-[#F5F7FF] border border-[#E1E7FB] flex flex-col justify-between space-y-6">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#E6FAF7] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A] mb-2">
                  Speech to big text
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Live transcription in large, easy-to-read type.
                </p>
              </div>
            </div>

            {/* Small Card 2: Multi-turn dialogue */}
            <div className="flex-[1_1_320px] rounded-[28px] p-8 sm:p-9 bg-[#F5F7FF] border border-[#E1E7FB] flex flex-col justify-between space-y-6">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#EEF0FF] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A] mb-2">
                  Multi-turn dialogue
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Context carries across turns so replies stay natural, not robotic.
                </p>
              </div>
            </div>

            {/* Small Card 3: English and বাংলা (Part 3 Rule 8 adjusted) */}
            <div className="flex-[1_1_320px] rounded-[28px] p-8 sm:p-9 bg-[#F5F7FF] border border-[#E1E7FB] flex flex-col justify-between space-y-6">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#F3EBFF] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A] mb-2">
                  English and বাংলা
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Interface language options are coming soon.
                </p>
              </div>
            </div>

            {/* Small Card 4: Session history */}
            <div className="flex-[1_1_320px] rounded-[28px] p-8 sm:p-9 bg-[#F5F7FF] border border-[#E1E7FB] flex flex-col justify-between space-y-6">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#FFF1E6] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-bold text-[#0F172A] mb-2">
                  Session history
                </h3>
                <p className="text-[16px] text-[#475569] leading-relaxed">
                  Save, review and delete past conversations whenever you like.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.5: INTERACTIVE DEMO (id="demo", bg --sb-surface, top border)
          ========================================================================= */}
      <section id="demo" className="bg-[#F5F7FF] py-16 sm:py-24 px-6 border-t border-[#E1E7FB]">
        <div className="mx-auto max-w-[1100px] space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#4F46E5]">
              INTERACTIVE DEMO
            </span>
            <h2 className="font-display text-[30px] sm:text-[44px] font-extrabold text-[#0F172A] leading-[1.12] tracking-tight">
              Pick a phrase and hear it
            </h2>
            <p className="text-[16px] sm:text-[18px] text-[#475569]">
              Sample phrases only. No login and no camera needed.
            </p>
          </div>

          {/* Interactive Card */}
          <div className="bg-white rounded-[28px] border border-[#E1E7FB] sb-card-shadow overflow-hidden">
            
            {/* Tabs List */}
            <div 
              role="tablist" 
              aria-label="Demo demonstration modes"
              onKeyDown={handleTabKeyDown}
              className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#E1E7FB] bg-[#F5F7FF]"
            >
              <button
                type="button"
                role="tab"
                id="tab-deaf"
                aria-selected={activeTab === 'deaf_to_hearing'}
                aria-controls="panel-deaf"
                tabIndex={activeTab === 'deaf_to_hearing' ? 0 : -1}
                onClick={() => setActiveTab('deaf_to_hearing')}
                className={`min-h-[64px] px-6 py-4 text-center font-display font-bold text-[16px] flex items-center justify-center gap-2.5 transition-all ${
                  activeTab === 'deaf_to_hearing'
                    ? 'bg-white text-[#4338CA] border-b-[3px] border-[#4F46E5] shadow-xs'
                    : 'bg-[#F5F7FF] text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5 text-[#4F46E5]">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
                <span>1. Signing to speech</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-hearing"
                aria-selected={activeTab === 'hearing_to_deaf'}
                aria-controls="panel-hearing"
                tabIndex={activeTab === 'hearing_to_deaf' ? 0 : -1}
                onClick={() => setActiveTab('hearing_to_deaf')}
                className={`min-h-[64px] px-6 py-4 text-center font-display font-bold text-[16px] flex items-center justify-center gap-2.5 transition-all ${
                  activeTab === 'hearing_to_deaf'
                    ? 'bg-white text-[#0F766E] border-b-[3px] border-[#0EA5A0] shadow-xs'
                    : 'bg-[#F5F7FF] text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5 text-[#0EA5A0]">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>2. Speech to big text</span>
              </button>
            </div>

            {/* TAB PANEL 1: SIGNING TO SPEECH */}
            {activeTab === 'deaf_to_hearing' && (
              <div 
                role="tabpanel" 
                id="panel-deaf" 
                aria-labelledby="tab-deaf"
                className="p-6 sm:p-10 space-y-8 animate-smooth-expand"
              >
                {/* Phrase Pills Row */}
                <div className="space-y-3">
                  <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#475569]">
                    Select a sample phrase to simulate signing:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {sampleDeafSigns.map((item) => {
                      const isSelected = selectedDeafSign.title === item.title;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTestDeafVoice(item)}
                          className={`h-[48px] px-5 rounded-full text-[15px] font-bold flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'border-2 border-[#4F46E5] bg-[#EEF0FF] text-[#3730A3] shadow-xs'
                              : 'border border-[#CBD5E1] bg-white text-[#475569] hover:bg-slate-50'
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                          </svg>
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Two Panels Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Dark Panel (Sample Signs Recognised) */}
                  <div 
                    className="rounded-[20px] p-7 min-h-[220px] flex flex-col justify-between text-white space-y-4"
                    style={{ background: 'linear-gradient(160deg, #111A3A, #0B1124)' }}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8FB0FF]">
                        SAMPLE SIGNS RECOGNISED
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">MediaPipe real-time landmarks mapping</p>
                    </div>

                    <div className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedDeafSign.tokens.map((token) => (
                          <span 
                            key={token} 
                            className="font-mono-token text-[16px] px-3.5 py-1.5 rounded-lg border border-[#7DA2FF]/30 text-[#C7D6FF]"
                            style={{ backgroundColor: 'rgba(125,162,255,.16)' }}
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                      Sign recognition completed
                    </div>
                  </div>

                  {/* Right: Light Tinted Panel (What They Hear) */}
                  <div 
                    className="rounded-[20px] p-7 min-h-[220px] border border-[#D9DDFB] flex flex-col justify-between space-y-5"
                    style={{ background: 'linear-gradient(160deg, #EEF0FF, #F3EBFF)' }}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#4338CA]">
                        WHAT THEY HEAR
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">Polite, natural sentence spoken aloud</p>
                    </div>

                    <div className="py-2">
                      <p className="font-display text-[26px] sm:text-[30px] font-bold text-[#0F172A] leading-snug">
                        “{selectedDeafSign.voice}”
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => speak(selectedDeafSign.voice)}
                      className="w-full h-[48px] px-6 rounded-[12px] text-white font-bold text-[15px] flex items-center justify-center gap-2.5 sb-btn-glow transition-all hover:scale-[1.01] active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      <span>{isSpeaking ? 'Playing Voice Output...' : 'Play this sentence'}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TAB PANEL 2: SPEECH TO BIG TEXT */}
            {activeTab === 'hearing_to_deaf' && (
              <div 
                role="tabpanel" 
                id="panel-hearing" 
                aria-labelledby="tab-hearing"
                className="p-6 sm:p-10 space-y-8 animate-smooth-expand"
              >
                {/* Phrase Selection */}
                <div className="space-y-3">
                  <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#475569]">
                    Click any sample speech to see how the deaf participant reads it:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sampleHearingPhrases.map((phrase) => {
                      const isSelected = hearingSpeechInput === phrase;
                      return (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => handleSimulateHearingSpeech(phrase)}
                          className={`p-3.5 rounded-[16px] border text-left text-[14px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 text-[#0F172A] border-slate-200'
                          }`}
                        >
                          “{phrase}”
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Big High-Contrast Deaf Screen Output */}
                <div className="p-8 rounded-[24px] bg-[#070B1A] text-white border border-slate-800 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5EEAD4] flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${simulatedVoiceActive ? 'bg-[#5EEAD4] animate-ping' : 'bg-[#0EA5A0]'}`} aria-hidden="true" />
                      Live Screen for Deaf Reader (High-Contrast Mode)
                    </span>
                    <span className="text-[12px] font-mono text-[#5EEAD4] bg-[#0B1124] px-3 py-1 rounded-md border border-[#0EA5A0]/30">
                      Real-Time Captions
                    </span>
                  </div>

                  <div className="py-4 min-h-[100px] flex items-center">
                    <p className="font-display text-[26px] sm:text-[32px] font-extrabold text-white leading-relaxed tracking-wide">
                      {hearingSpeechInput}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">
                    High-legibility font with optical flash alerts so deaf users never miss a response.
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.6: USE CASES (Dark Section)
          ========================================================================= */}
      <section 
        className="py-16 sm:py-24 px-6 text-white border-b border-white/10"
        style={{
          backgroundColor: '#0B1020',
          backgroundImage: `
            radial-gradient(700px 400px at 85% 0%, rgba(139,92,246,.25), transparent 60%),
            radial-gradient(600px 360px at 0% 100%, rgba(34,211,197,.14), transparent 60%)
          `
        }}
      >
        <div className="mx-auto max-w-[1200px] space-y-12">
          
          <div className="max-w-[720px] space-y-3 text-left">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#8FB0FF]">
              MADE FOR REAL LIFE
            </span>
            <h2 className="font-display text-[30px] sm:text-[44px] font-extrabold text-white leading-[1.12] heading-balance tracking-tight">
              The moments where communication breaks down
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. Clinics and hospitals */}
            <div className="rounded-[22px] p-7 bg-white/[0.05] border border-white/[0.12] space-y-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8FB0FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[30px] h-[30px]">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              <h3 className="font-display text-[20px] font-bold text-white">
                Clinics and hospitals
              </h3>
              <p className="text-[15px] text-[#CBD5E1] leading-relaxed">
                Describe symptoms and understand the doctor right away.
              </p>
            </div>

            {/* 2. Shops and services */}
            <div className="rounded-[22px] p-7 bg-white/[0.05] border border-white/[0.12] space-y-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#B79CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[30px] h-[30px]">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <h3 className="font-display text-[20px] font-bold text-white">
                Shops and services
              </h3>
              <p className="text-[15px] text-[#CBD5E1] leading-relaxed">
                Ask prices, place orders, and solve problems at the counter.
              </p>
            </div>

            {/* 3. Schools and offices */}
            <div className="rounded-[22px] p-7 bg-white/[0.05] border border-white/[0.12] space-y-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[30px] h-[30px]">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              <h3 className="font-display text-[20px] font-bold text-white">
                Schools and offices
              </h3>
              <p className="text-[15px] text-[#CBD5E1] leading-relaxed">
                Follow classes and meetings through live, readable text.
              </p>
            </div>

            {/* 4. Family and friends */}
            <div className="rounded-[22px] p-7 bg-white/[0.05] border border-white/[0.12] space-y-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[30px] h-[30px]">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3 className="font-display text-[20px] font-bold text-white">
                Family and friends
              </h3>
              <p className="text-[15px] text-[#CBD5E1] leading-relaxed">
                Talk freely with people who never learned sign language.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.7: ACCESSIBILITY AND PRIVACY (White)
          ========================================================================= */}
      <section className="bg-white py-16 sm:py-24 px-6 border-b border-slate-100">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Card: Accessible by design */}
          <div className="rounded-[28px] p-9 sm:p-11 bg-[#F5F7FF] border border-[#E1E7FB] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div 
                className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <circle cx="12" cy="4" r="2" />
                  <path d="m4.5 12.5 4-1.5 3.5 7v5" />
                  <path d="m19.5 12.5-4-1.5-3.5 7" />
                  <path d="M7 6.5h10" />
                </svg>
              </div>
              <h3 className="font-display text-[26px] sm:text-[28px] font-extrabold text-[#0F172A]">
                Accessible by design
              </h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Adjustable text size, high-contrast mode, dark mode, visible focus, and full keyboard navigation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#D9DDFB] text-[#3730A3]">
                Text size
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#D9DDFB] text-[#3730A3]">
                High contrast
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#D9DDFB] text-[#3730A3]">
                Dark mode
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#D9DDFB] text-[#3730A3]">
                Keyboard
              </span>
            </div>
          </div>

          {/* Right Card: You stay in control */}
          <div className="rounded-[28px] p-9 sm:p-11 bg-[#F0FAF8] border border-[#CDEEE9] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div 
                className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5A0)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-display text-[26px] sm:text-[28px] font-extrabold text-[#0F172A]">
                You stay in control
              </h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Camera and microphone start only after you allow them. Transcripts are kept only when you sign in, and you can delete any session.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#BDE6E0] text-[#115E59]">
                Permission first
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold bg-white border border-[#BDE6E0] text-[#115E59]">
                Delete anytime
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.8: FAQ (id="faq", bg --sb-surface, top border)
          ========================================================================= */}
      <section id="faq" className="bg-[#F5F7FF] py-16 sm:py-24 px-6 border-t border-[#E1E7FB]">
        <div className="mx-auto max-w-[820px] space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#4F46E5]">
              FAQ
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#0F172A] leading-[1.15]">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            
            {/* Question 1 (Open by default) */}
            <details open className="group bg-white rounded-[18px] border border-[#E1E7FB] px-7 py-5 transition-all">
              <summary className="font-display text-[18px] font-bold text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-4">
                <span>Does the other person need to know sign language?</span>
                <span className="text-xl font-bold text-[#4F46E5] group-open:rotate-45 transition-transform shrink-0" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[16px] text-[#475569] leading-[1.7]">
                No. They just speak and listen. Your signs are spoken aloud and their voice is shown as text.
              </p>
            </details>

            {/* Question 2 */}
            <details className="group bg-white rounded-[18px] border border-[#E1E7FB] px-7 py-5 transition-all">
              <summary className="font-display text-[18px] font-bold text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-4">
                <span>Is my video saved?</span>
                <span className="text-xl font-bold text-[#4F46E5] group-open:rotate-45 transition-transform shrink-0" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[16px] text-[#475569] leading-[1.7]">
                Only your conversation transcripts can be saved, and only if you are signed in. You can delete any session from your history.
              </p>
            </details>

            {/* Question 3 */}
            <details className="group bg-white rounded-[18px] border border-[#E1E7FB] px-7 py-5 transition-all">
              <summary className="font-display text-[18px] font-bold text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-4">
                <span>Can it replace a human interpreter?</span>
                <span className="text-xl font-bold text-[#4F46E5] group-open:rotate-45 transition-transform shrink-0" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[16px] text-[#475569] leading-[1.7]">
                It is an everyday communication aid. For legal, medical or other high-stakes situations, a qualified human interpreter is still the safest choice.
              </p>
            </details>

            {/* Question 4 (With visible TODO comment) */}
            <details className="group bg-white rounded-[18px] border border-[#E1E7FB] px-7 py-5 transition-all">
              <summary className="font-display text-[18px] font-bold text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-4">
                <span>Which languages are supported?</span>
                <span className="text-xl font-bold text-[#4F46E5] group-open:rotate-45 transition-transform shrink-0" aria-hidden="true">+</span>
              </summary>
              {/* TODO: [CONFIRM which sign languages and vocabulary you support] */}
              <p className="mt-3 text-[16px] text-[#475569] leading-[1.7]">
                The interface works in English and বাংলা. Spoken output is English today. American Sign Language (ASL) core vocabulary is supported.
              </p>
            </details>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9.9: FINAL CTA WITH ROLE CHOICE
          ========================================================================= */}
      <section 
        className="py-16 sm:py-24 px-6 text-white text-center"
        style={{
          background: `
            radial-gradient(800px 420px at 20% 0%, rgba(79,124,255,.4), transparent 60%),
            radial-gradient(800px 420px at 85% 100%, rgba(34,211,197,.25), transparent 60%),
            linear-gradient(135deg, #1B2A8F, #4A2BB8)
          `
        }}
      >
        <div className="mx-auto max-w-[1100px] space-y-10 flex flex-col items-center">
          
          <div className="space-y-3 max-w-2xl">
            <h2 className="font-display text-[32px] sm:text-[46px] font-extrabold tracking-tight leading-[1.12]">
              Ready to start your first conversation?
            </h2>
            <p className="text-[17px] sm:text-[19px] text-[#DDE5FF] leading-relaxed">
              Choose how you will use SignBridge today. You can switch any time.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 w-full">
            
            {/* Card 1: I SIGN (Deaf User) */}
            <button
              type="button"
              onClick={() => handleRoleStart('deaf_user')}
              className="flex-[1_1_360px] max-w-[480px] rounded-[24px] p-8 text-left bg-white text-[#0F172A] shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-2.5">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#4338CA]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                  </svg>
                  I SIGN
                </span>
                <h3 className="font-display text-[24px] font-extrabold text-[#0F172A] leading-snug">
                  I am Deaf or speech-impaired
                </h3>
                <p className="text-[15px] text-[#475569]">
                  Sign to the camera and be heard.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[14px] font-bold text-[#4338CA]">
                <span>Start signing now</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

            {/* Card 2: I SPEAK (Hearing User) */}
            <button
              type="button"
              onClick={() => handleRoleStart('hearing_user')}
              className="flex-[1_1_360px] max-w-[480px] rounded-[24px] p-8 text-left bg-white/10 border border-white/[0.35] text-white shadow-xl hover:scale-[1.02] hover:bg-white/15 transition-all active:scale-95 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-2.5">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#99F6E4]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                  I SPEAK
                </span>
                <h3 className="font-display text-[24px] font-extrabold text-white leading-snug">
                  I am talking with someone who signs
                </h3>
                <p className="text-[15px] text-[#DDE5FF]">
                  Speak normally and see your words as text.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[14px] font-bold text-[#99F6E4]">
                <span>Start speaking now</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

          </div>

        </div>
      </section>

    </main>
  );
};

export default LandingPage;
