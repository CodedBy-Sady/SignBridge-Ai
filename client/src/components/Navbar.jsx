import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Type, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn, 
  User, 
  Menu,
  X,
  Hand,
  Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const Navbar = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout, updateUserRole } = useAuth();
  const { highContrast, toggleHighContrast, fontSize, cycleFontSize, soundEffects, toggleSound } = useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleToggle = () => {
    if (!user) return;
    const nextRole = user.role === 'deaf_user' ? 'hearing_user' : 'deaf_user';
    updateUserRole(nextRole);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 text-brand-600 font-extrabold text-xl tracking-tight hover:opacity-90 focus:outline-none"
          aria-label="SignBridge AI Homepage"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white shadow-md shadow-brand-500/20">
            <span className="text-xl">🤝</span>
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-slate-900 font-black tracking-tight flex items-center gap-1.5">
              SignBridge <span className="text-brand-600">AI</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Two-Way Assistive Voice
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              isActive('/')
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            How It Works
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/communicate"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/communicate')
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Live Communicate
              </Link>
              <Link
                to="/history"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/history')
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Session History
              </Link>
            </>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Live Demo & Dashboard
            </button>
          )}
        </nav>

        {/* Accessibility & User Action Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Accessibility Quick Bar */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {/* Font Size Cycle */}
            <button
              onClick={cycleFontSize}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white transition-all flex items-center gap-1 text-xs font-bold"
              title={`Text Size: ${fontSize.toUpperCase()} (Click to toggle 1x / 1.2x / 1.4x)`}
              aria-label={`Cycle font size, current: ${fontSize}`}
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline uppercase text-[10px]">
                {fontSize === 'normal' ? '1x' : fontSize === 'large' ? '1.2x' : '1.4x'}
              </span>
            </button>

            {/* High Contrast Mode */}
            <button
              onClick={toggleHighContrast}
              className={`p-1.5 rounded-lg transition-all ${
                highContrast 
                  ? 'bg-yellow-400 text-black font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-brand-600 hover:bg-white'
              }`}
              title={highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
              aria-label="Toggle high contrast mode"
            >
              {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white transition-all"
              title={soundEffects ? 'Sound Cues: Enabled' : 'Sound Cues: Muted'}
              aria-label="Toggle audio cues"
            >
              {soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* User Status / Login Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-1">
              
              {/* Authenticated Role Badge */}
              <button
                onClick={handleRoleToggle}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  user.role === 'deaf_user'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Your communication role. Click to switch."
              >
                {user.role === 'deaf_user' ? (
                  <>
                    <Hand className="w-3.5 h-3.5 text-purple-600" />
                    <span>Deaf User</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hearing User</span>
                  </>
                )}
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-8 h-8 rounded-full border border-slate-300 object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-all"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
              >
                <span>Get Started</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            How It Works
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link
                to="/communicate"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Live Communicate
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Session History
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Sign Out ({user.full_name})
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onOpenAuth('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm text-center"
              >
                Create Free Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
