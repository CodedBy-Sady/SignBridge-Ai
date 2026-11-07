import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Hand, 
  Mic, 
  MessageSquare, 
  LogOut, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  Download, 
  AlertCircle,
  Split,
  Lock,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../services/api';
import DeafSignPanel from '../components/DeafSignPanel';
import HearingVoicePanel from '../components/HearingVoicePanel';
import DialogueStream from '../components/DialogueStream';
import SessionSummaryModal from '../components/SessionSummaryModal';

export const CommunicatePage = ({ onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('split'); // 'split' | 'deaf' | 'hearing' | 'stream'
  const [sessionStartTime] = useState(new Date());

  // Initialize session only if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const initSession = async () => {
      try {
        const res = await sessionAPI.createSession({
          title: `Dialogue: ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        });
        setSessionId(res.data.session.id);
        setSessionData(res.data.session);

        const details = await sessionAPI.getSession(res.data.session.id);
        if (details.data.messages) {
          setMessages(details.data.messages);
        }
      } catch (err) {
        console.warn('[CommunicatePage] Backend session API fallback:', err.message);
        const localId = `local-sess-${Date.now()}`;
        setSessionId(localId);
        setSessionData({ id: localId, title: 'Live Assistive Session (Local)', status: 'active' });
        setMessages([
          {
            id: 'msg-init-0',
            sender_role: 'system',
            input_type: 'text',
            final_content: 'SignBridge AI session initialized. Ready for two-way communication.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    initSession();
  }, [isAuthenticated]);

  // If user is not authenticated, show Access Lock Card (NO AUTO LOGIN)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Start Communicating
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Live webcam hand tracking, real-time microphone speech-to-text, and dialogue archiving require an active account.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : navigate('/login')}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Your Account</span>
            </button>

            <button
              onClick={() => onOpenAuth ? onOpenAuth('register') : navigate('/register')}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition-all"
            >
              Create Free Account
            </button>

            <Link
              to="/"
              className="block pt-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              ← Back to Interactive Preview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Post new turn from either DeafSignPanel or HearingVoicePanel
  const handleSendMessage = async (turnData) => {
    const tempId = `temp-msg-${Date.now()}`;
    const newTurn = {
      id: tempId,
      session_id: sessionId,
      ...turnData,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newTurn]);

    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await sessionAPI.postMessage(sessionId, turnData);
      } catch (err) {
        console.warn('[CommunicatePage] Message dispatch warning:', err.message);
      }
    }
  };

  const handleEndSession = async () => {
    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await sessionAPI.endSession(sessionId);
      } catch (err) {
        console.warn('Failed to end session on server:', err);
      }
    }
    setIsSummaryOpen(true);
  };

  const handleRestartNewSession = () => {
    setIsSummaryOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Top Session Status Ribbon */}
      <section 
        aria-label="Active Dialogue Controls and Session Status"
        className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Session</span>
          </div>

          <h1 className="text-sm font-black text-slate-800 hidden sm:inline">
            {sessionData?.title || 'Two-Way Communication Dashboard'}
          </h1>
          <span className="text-xs text-slate-400 hidden md:inline">|</span>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Participant: {user?.full_name} ({user?.role === 'deaf_user' ? 'Deaf Signer' : 'Hearing Speaker'})
          </span>
        </div>

        {/* View Mode Switcher for mobile / tablets */}
        <div className="flex items-center gap-2">
          <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'split' ? 'bg-white shadow-2xs text-brand-600' : 'text-slate-600'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('deaf')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'deaf' ? 'bg-white shadow-2xs text-brand-600' : 'text-slate-600'
              }`}
            >
              Sign Panel
            </button>
            <button
              onClick={() => setActiveTab('hearing')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'hearing' ? 'bg-white shadow-2xs text-brand-600' : 'text-slate-600'
              }`}
            >
              Voice Panel
            </button>
          </div>

          <button
            onClick={handleEndSession}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </section>

      {/* Main Dual-Panel Workspace */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* Split Screen Grid (Left: Sign-to-Speech / Right: Voice-to-Text) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[580px]">
          
          {/* Deaf User Sign Language Channel */}
          <div className={`${activeTab === 'hearing' ? 'hidden' : 'block'} h-full flex flex-col`}>
            <DeafSignPanel 
              onSendMessage={handleSendMessage} 
              sessionHistory={messages} 
            />
          </div>

          {/* Hearing User Voice Channel */}
          <div className={`${activeTab === 'deaf' ? 'hidden' : 'block'} h-full flex flex-col`}>
            <HearingVoicePanel 
              onSendMessage={handleSendMessage} 
            />
          </div>

        </div>

        {/* Real-Time Unified Dialogue Stream Transcript */}
        <div className="w-full min-h-[380px] flex flex-col">
          <DialogueStream
            messages={messages}
            onEndSession={handleEndSession}
          />
        </div>

      </main>

      {/* Session Export & Summary Modal */}
      <SessionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        session={sessionData}
        messages={messages}
        onRestartSession={handleRestartNewSession}
      />

    </div>
  );
};

export default CommunicatePage;
