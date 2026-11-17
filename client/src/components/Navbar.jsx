import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const Navbar = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout, updateUserRole } = useAuth();
  const { highContrast, toggleHighContrast, fontSize, cycleFontSize, soundEffects, toggleSound } = useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yRef = useRef(null);
  const location = useLocation();

  const handleRoleToggle = () => {
    if (!user) return;
    const nextRole = user.role === 'deaf_user' ? 'hearing_user' : 'deaf_user';
    updateUserRole(nextRole);
  };

  const isHome = location.pathname === '/';

  // Close accessibility popover on Click Outside or Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setA11yOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (a11yRef.current && !a11yRef.current.contains(e.target)) {
        setA11yOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* WCAG 2.1 AA Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-white text-slate-900 font-bold rounded-xl shadow-2xl ring-4 ring-indigo-500 transition-all"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 w-full bg-[#070B1A]/90 backdrop-blur-md border-b border-white/10 transition-colors duration-200">
        <div className="mx-auto flex min-h-[80px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Brand Logo Tile + Wordmark */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl"
            aria-label="SignBridge AI Homepage"
          >
            <div 
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px] text-white sb-logo-glow"
              style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
            >
              {/* Headset line icon */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#fff" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                aria-hidden="true" 
                className="w-5 h-5"
              >
                <path d="M3 18V12a9 9 0 0 1 18 0v6" />
                <path d="M3 18h4M17 18h4" />
              </svg>
            </div>
            <div className="flex items-baseline font-display text-[21px] font-extrabold tracking-tight">
              <span className="text-white">SignBridge</span>
              <span className="ml-1.5 text-[#8FB0FF]">AI</span>
            </div>
          </Link>

          {/* Center Links (900px+) */}
          <nav className="hidden lg:flex items-center gap-1">
            {isHome ? (
              <>
                <a
                  href="#mission"
                  className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
                >
                  Our goal
                </a>
                <a
                  href="#how"
                  className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
                >
                  How it works
                </a>
                <a
                  href="#features"
                  className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
                >
                  Features
                </a>
                <a
                  href="#demo"
                  className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
                >
                  Demo
                </a>
                <a
                  href="#faq"
                  className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
                >
                  FAQ
                </a>
              </>
            ) : (
              <Link
                to="/"
                className="px-4 py-2.5 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-all"
              >
                How It Works
              </Link>
            )}

            {/* Preserved Route Links for Authenticated Users */}
            {isAuthenticated && (
              <>
                <Link
                  to="/communicate"
                  className={`px-3.5 py-2 rounded-xl text-[15px] font-semibold transition-all ${
                    location.pathname === '/communicate'
                      ? 'bg-indigo-600/30 text-white border border-indigo-400/40 shadow-xs'
                      : 'text-[#CBD5E1] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Live Communicate
                </Link>
                <Link
                  to="/history"
                  className={`px-3.5 py-2 rounded-xl text-[15px] font-semibold transition-all ${
                    location.pathname === '/history'
                      ? 'bg-indigo-600/30 text-white border border-indigo-400/40 shadow-xs'
                      : 'text-[#CBD5E1] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Session History
                </Link>
              </>
            )}
          </nav>

          {/* Right Cluster */}
          <div className="flex items-center gap-3">
            
            {/* 1. Language switch (EN | বাংলা) visual control */}
            <button
              type="button"
              aria-disabled="true"
              title="Interface language options are coming soon"
              aria-label="Language: English or Bangla (Coming soon)"
              className="hidden sm:inline-flex items-center gap-2 h-[44px] px-3.5 rounded-[10px] border border-white/20 bg-white/[0.06] text-[14px] font-medium text-[#CBD5E1] hover:text-white hover:border-white/30 transition-all cursor-default"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-[#8FB0FF]">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>EN | বাংলা</span>
            </button>

            {/* 2. Accessibility settings Popover */}
            <div className="relative" ref={a11yRef}>
              <button
                type="button"
                onClick={() => setA11yOpen(!a11yOpen)}
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border transition-all ${
                  a11yOpen 
                    ? 'border-indigo-400 bg-indigo-500/20 text-white ring-2 ring-indigo-400/50' 
                    : 'border-white/20 bg-white/[0.06] text-[#CBD5E1] hover:text-white hover:border-white/30'
                }`}
                aria-label="Accessibility settings"
                aria-expanded={a11yOpen}
                aria-haspopup="true"
                title="Accessibility settings (Text size, contrast, audio cues)"
              >
                {/* Person accessibility icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
                  <circle cx="12" cy="4" r="2" />
                  <path d="m4.5 12.5 4-1.5 3.5 7v5" />
                  <path d="m19.5 12.5-4-1.5-3.5 7" />
                  <path d="M7 6.5h10" />
                </svg>
              </button>

              {/* Popover Menu */}
              {a11yOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0B1124] border border-white/15 p-3.5 shadow-2xl z-50 text-white space-y-2.5 animate-modal-entry"
                  role="dialog"
                  aria-label="Accessibility controls"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8FB0FF]">Accessibility</span>
                    <button
                      type="button"
                      onClick={() => setA11yOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs"
                      aria-label="Close settings"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Font Size Cycle */}
                  <button
                    type="button"
                    onClick={cycleFontSize}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition-all"
                  >
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-indigo-400">
                        <polyline points="4 7 4 4 20 4 20 7" />
                        <line x1="9" y1="20" x2="15" y2="20" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                      </svg>
                      Text Size
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                      {fontSize === 'normal' ? '1x' : fontSize === 'large' ? '1.2x' : '1.4x'}
                    </span>
                  </button>

                  {/* High Contrast / Dark Toggle */}
                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition-all"
                  >
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-amber-400">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                      </svg>
                      High Contrast
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      highContrast ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 text-slate-400'
                    }`}>
                      {highContrast ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Audio Feedback Toggle */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition-all"
                  >
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-emerald-400">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      Sound Cues
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      soundEffects ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
                    }`}>
                      {soundEffects ? 'ON' : 'MUTED'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Auth Area (Strict Mode Rule 1 & Rule 3) */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-1">
                {/* Preserved Role Chip (Rule 3) */}
                <button
                  type="button"
                  onClick={handleRoleToggle}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold border transition-all ${
                    user?.role === 'deaf_user'
                      ? 'bg-purple-900/30 text-purple-300 border-purple-500/40 hover:bg-purple-900/50'
                      : 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                  }`}
                  title="Your communication role. Click to switch."
                >
                  {user?.role === 'deaf_user' ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-3.5 h-3.5 text-purple-300">
                        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                      </svg>
                      <span>Deaf User</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-3.5 h-3.5 text-emerald-300">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                      </svg>
                      <span>Hearing User</span>
                    </>
                  )}
                </button>

                {/* Avatar */}
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user?.full_name || 'User avatar'} 
                    className="w-8 h-8 rounded-full border border-white/20 object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs border border-white/20">
                    {user?.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 rounded-xl text-[15px] font-semibold text-[#E2E8F0] hover:text-white transition-all"
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center justify-center h-[44px] px-5 rounded-[10px] text-[15px] font-semibold text-white sb-logo-glow transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
                >
                  Get started
                </button>
              </div>
            )}

            {/* Mobile hamburger (<900px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-white/20 bg-white/[0.06] text-white hover:bg-white/10"
              aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Drawer (under 900px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#070B1A] px-4 pt-3 pb-6 space-y-2.5">
            {isHome ? (
              <>
                <a
                  href="#mission"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
                >
                  Our goal
                </a>
                <a
                  href="#how"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
                >
                  How it works
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
                >
                  Features
                </a>
                <a
                  href="#demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
                >
                  Demo
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
                >
                  FAQ
                </a>
              </>
            ) : (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white hover:bg-white/5"
              >
                How It Works
              </Link>
            )}

            {isAuthenticated ? (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <Link
                  to="/communicate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-white bg-indigo-600/30 border border-indigo-400/30"
                >
                  Live Communicate
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-[15px] font-medium text-[#CBD5E1] hover:text-white"
                >
                  Session History
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-[15px] font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out ({user?.full_name || 'User'})
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm text-center"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-sm text-center"
                  style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
