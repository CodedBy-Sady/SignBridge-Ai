import React from 'react';
import { X, Download, FileText, CheckCircle, RotateCcw, Share2, Layers } from 'lucide-react';

export const SessionSummaryModal = ({ isOpen, onClose, session, messages = [], onRestartSession }) => {
  if (!isOpen) return null;

  const deafCount = messages.filter((m) => m.sender_role === 'deaf_user').length;
  const hearingCount = messages.filter((m) => m.sender_role === 'hearing_user').length;

  const handleExportText = () => {
    const header = `=======================================================\nSIGNBRIDGE AI — ACCESSIBLE DIALOGUE TRANSCRIPT\nSession ID: ${session?.id || 'session-current'}\nDate: ${new Date().toLocaleString()}\n=======================================================\n\n`;

    const body = messages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const role = m.sender_role === 'deaf_user' ? 'DEAF USER (Sign-to-Speech)' : m.sender_role === 'hearing_user' ? 'HEARING USER (Voice STT)' : 'SYSTEM';
        const gloss = m.raw_content && m.input_type === 'sign_ai' ? ` [Glosses: ${m.raw_content}]` : '';
        return `[${time}] ${role}${gloss}:\n"${m.final_content}"\n`;
      })
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      session,
      exportedAt: new Date().toISOString(),
      messages,
      metrics: {
        totalTurns: messages.length,
        deafTurns: deafCount,
        hearingTurns: hearingCount,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 id="summary-modal-title" className="text-base font-extrabold">
                Session Completed & Saved
              </h3>
              <p className="text-xs text-slate-400">Two-way conversation transcript is archived.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-2xl font-black text-slate-900">{messages.length}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Turns</span>
            </div>
            <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-center">
              <span className="block text-2xl font-black text-brand-700">{deafCount}</span>
              <span className="text-[11px] font-semibold text-brand-600 uppercase">Sign Turns</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="block text-2xl font-black text-emerald-700">{hearingCount}</span>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase">Voice Turns</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Export Accessible Transcript
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export this verified conversation dialogue for clinical, legal, or personal records in plaintext or JSON.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleExportText}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Download Plaintext (.txt)</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Structured (.json)</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Close Window
            </button>

            <button
              onClick={onRestartSession}
              className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SessionSummaryModal;

