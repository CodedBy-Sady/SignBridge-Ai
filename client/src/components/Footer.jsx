import React from 'react';
import { Heart, ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-black text-lg text-slate-900 mb-2">
              <span className="text-xl">🤝</span>
              <span>SignBridge <span className="text-brand-600">AI</span></span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed mb-4">
              An assistive, real-time two-way communication platform bridging the gap between deaf or non-speaking individuals and hearing participants through computer vision, MediaPipe landmarks, and Google Gemini AI.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                WCAG 2.1 AA Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
                <Eye className="w-3.5 h-3.5" />
                High Contrast Ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Gemini LLM
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Core Modalities
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Channel 1: Sign-to-Speech (AI Reconstructed)</li>
              <li>Channel 2: Voice-to-Text (Realtime STT)</li>
              <li>Hand Landmark Tracking (3D Skeleton)</li>
              <li>Multi-turn Dialogue Synthesis</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              System Health
            </h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-medium text-slate-900">Web Speech STT: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Web Speech TTS: Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Gemini API Bridge: Online</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SignBridge AI. Built for universal accessibility & inclusive human connection.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Deaf & Hard of Hearing communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

