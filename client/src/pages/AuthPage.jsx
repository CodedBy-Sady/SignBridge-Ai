import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Hand,
  Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

export const AuthPage = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('deaf_user'); // 'deaf_user' | 'hearing_user'
  
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/communicate';

  // Validation helpers
  const isGmailValid = (val) => /^[^\s@]+@gmail\.com$/i.test(val);
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation for register mode
    if (mode === 'register') {
      if (!isGmailValid(email)) {
        setError('Only @gmail.com email addresses are allowed.');
        return;
      }
      if (!isPasswordValid) {
        setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ full_name: fullName, email, password, role });
      }
      navigate(redirectPath);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication error. Please check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = (newMode) => {
    setError(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-brand-50/20 to-sky-50">
      
      {/* Spacious Card (max-w-[560px]) with Smooth Entry Animation */}
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden animate-modal-entry transition-all duration-300">
        
        {/* Top Header Card */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/60">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <span className="text-2xl">🤝</span>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">
              SignBridge <span className="text-brand-600">AI</span>
            </span>
          </Link>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Free Account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
            {mode === 'login'
              ? 'Sign in to access two-way sign & voice real-time translation.'
              : 'Join SignBridge AI to start seamless, accessible conversations.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-9 pt-6 space-y-5 text-left">
          
          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MAIN FORM: Email, Password, Login Button */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Smoothly Animated Registration Fields */}
            {mode === 'register' && (
              <div className="space-y-4 animate-smooth-expand transition-all duration-300">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Soliman Hossen Sady"
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 bg-white placeholder:text-slate-400 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Primary Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Primary Communication Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('deaf_user')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        role === 'deaf_user'
                          ? 'border-brand-600 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-brand-100 text-brand-600 shrink-0">
                        <Hand className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900">Deaf Signer</span>
                        <span className="block text-[11px] text-slate-500 truncate">Signs with webcam</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('hearing_user')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        role === 'hearing_user'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900">Hearing Speaker</span>
                        <span className="block text-[11px] text-slate-500 truncate">Speaks with microphone</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1. EMAIL INPUT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 bg-white placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
              {mode === 'register' && email && !isGmailValid(email) && (
                <p className="text-[11px] text-rose-500 mt-1.5 ml-1 font-semibold">
                  ✕ Only @gmail.com emails are accepted
                </p>
              )}
              {mode === 'register' && email && isGmailValid(email) && (
                <p className="text-[11px] text-emerald-600 mt-1.5 ml-1 font-semibold">
                  ✓ Valid Gmail address
                </p>
              )}
            </div>

            {/* 2. PASSWORD INPUT */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 text-sm rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 bg-white placeholder:text-slate-400 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-3.5 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && password && (
                <div className="mt-2 space-y-1 ml-1">
                  <p className={`text-[11px] font-semibold ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hasMinLength ? '✓' : '✕'} Minimum 8 characters
                  </p>
                  <p className={`text-[11px] font-semibold ${hasUppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hasUppercase ? '✓' : '✕'} At least one uppercase letter (A-Z)
                  </p>
                  <p className={`text-[11px] font-semibold ${hasLowercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hasLowercase ? '✓' : '✕'} At least one lowercase letter (a-z)
                  </p>
                  <p className={`text-[11px] font-semibold ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hasNumber ? '✓' : '✕'} At least one number (0-9)
                  </p>
                </div>
              )}
            </div>

            {/* 3. SIGN IN / LOGIN BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-700 hover:to-sky-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 4. DON'T HAVE AN ACCOUNT? CREATE ACCOUNT */}
          <div className="text-center pt-1">
            {mode === 'login' ? (
              <p className="text-xs sm:text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode('register')}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors ml-1"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode('login')}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          {/* DIVIDER: OR CONTINUE WITH (Strictly Horizontally Centered Across Card) */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-center">
              <span className="bg-white px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                or continue with
              </span>
            </div>
          </div>

          {/* 5. SIGN IN WITH GOOGLE (Modern, Sleek, Professional Design) */}
          <div className="w-full">
            <GoogleAuthButton
              mode={mode}
              role={role}
              disabled={isLoading}
              onSuccess={async (authData) => {
                setError(null);
                setIsLoading(true);
                try {
                  await googleLogin(authData);
                  navigate(redirectPath);
                } catch (err) {
                  setError(err.response?.data?.message || err.message || 'Google Sign-In failed.');
                } finally {
                  setIsLoading(false);
                }
              }}
              onError={(errMsg) => setError(errMsg)}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthPage;
