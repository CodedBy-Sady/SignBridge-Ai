import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  MessageSquare, 
  Calendar, 
  Download, 
  ChevronRight, 
  Plus, 
  Clock, 
  Hand, 
  Mic, 
  CheckCircle2,
  FileText,
  Lock,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../services/api';

export const SessionHistoryPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSessions = async () => {
      try {
        const res = await sessionAPI.getUserSessions();
        const list = res.data.sessions || [];
        setSessions(list);
        if (list.length > 0) {
          handleSelectSession(list[0]);
        }
      } catch (err) {
        console.warn('Could not fetch sessions from server, using sample archive:', err);
        const sampleList = [
          {
            id: 'sess-demo-welcome-001',
            title: 'Welcome Demonstration Dialogue',
            status: 'ended',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            ended_at: new Date(Date.now() - 85200000).toISOString(),
            message_count: 4,
          }
        ];
        setSessions(sampleList);
        handleSelectSession(sampleList[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated]);

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    try {
      const res = await sessionAPI.getSession(session.id);
      setSessionMessages(res.data.messages || []);
    } catch (err) {
      setSessionMessages([]);
    }
  };

  const handleExportText = () => {
    if (!selectedSession) return;
    const header = `=======================================================\nSIGNBRIDGE AI SESSION ARCHIVE\nSession ID: ${selectedSession.id}\nTitle: ${selectedSession.title}\nDate: ${new Date(selectedSession.created_at).toLocaleString()}\n=======================================================\n\n`;

    const body = sessionMessages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const role = m.sender_role === 'deaf_user' ? 'DEAF USER' : m.sender_role === 'hearing_user' ? 'HEARING USER' : 'SYSTEM';
        return `[${time}] ${role}:\n"${m.final_content}"\n`;
      })
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-${selectedSession.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In to View Archives
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Please sign in with your email or Google account to access your saved transcripts and session history.
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
              <History className="w-7 h-7 text-brand-600" />
              <span>Session History & Transcripts</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Archived dialogues, two-way speech transcripts, and sign language translations.
            </p>
          </div>

          <Link
            to="/communicate"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Live Dialogue</span>
          </Link>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sessions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Recorded Dialogues ({sessions.length})
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No sessions recorded yet. Start a new live dialogue above!
                </div>
              ) : (
                sessions.map((sess) => {
                  const isSelected = selectedSession?.id === sess.id;
                  return (
                    <button
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`w-full p-4 text-left transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-50/70 border-l-4 border-brand-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {sess.title || 'Conversation Session'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(sess.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span>{sess.message_count || 0} messages</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Transcript Detail View */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {selectedSession ? (
              <>
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedSession.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Recorded on {new Date(selectedSession.created_at).toLocaleString()} • ID: {selectedSession.id}
                    </p>
                  </div>

                  <button
                    onClick={handleExportText}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>

                {/* Transcript Scroll Area */}
                <div className="p-6 overflow-y-auto max-h-[540px] space-y-4">
                  {sessionMessages.map((msg, i) => {
                    const isDeaf = msg.sender_role === 'deaf_user';
                    const isHearing = msg.sender_role === 'hearing_user';

                    return (
                      <div
                        key={msg.id || i}
                        className={`p-4 rounded-xl border ${
                          isDeaf
                            ? 'bg-brand-50/40 border-brand-200'
                            : isHearing
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className={isDeaf ? 'text-brand-800' : 'text-emerald-800'}>
                            {isDeaf ? '👋 Deaf User (Sign-to-Speech)' : isHearing ? '🎙️ Hearing User (Voice STT)' : '⚙️ System'}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {msg.raw_content && msg.input_type === 'sign_ai' && (
                          <div className="text-[11px] font-mono text-brand-600 mb-1">
                            Extracted Glosses: [{msg.raw_content}]
                          </div>
                        )}

                        <p className="text-sm font-semibold text-slate-800">
                          {msg.final_content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-slate-400 text-sm">
                Select a session on the left to inspect its conversation transcript.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SessionHistoryPage;
