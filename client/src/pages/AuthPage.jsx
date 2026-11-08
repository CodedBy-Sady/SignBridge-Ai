import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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
  Mic,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectPath = location.state?.from?.pathname || '/communicate';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setIsLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential, role);
        navigate(redirectPath);
      } else {
        throw new Error('No Google credentials received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In popup was closed or encountered an error.');
  };

  // Simulation fallback if user hasn't added Google Client ID yet
  const handleSimulatedGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await googleLogin(null, role, {
        email: 'sady@gmail.com',
        name: 'Soliman Hossen Sady',
        sub: `google_oauth_${Date.now()}`,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
      });
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Simulated Google auth failed.');
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
                  placeholder="sady@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 bg-white placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
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
                  minLength={6}
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

          {/* DIVIDER: OR CONTINUE WITH */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest relative shrink-0">
              or continue with
            </span>
          </div>

          {/* 5. SIGN IN WITH GOOGLE BUTTON */}
          <div className="flex flex-col items-center justify-center space-y-2">
            
            {googleClientId ? (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="100%"
                  text={mode === 'login' ? 'signin_with' : 'signup_with'}
                />
              </div>
            ) : (
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleSimulatedGoogle}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-2xs transition-all hover:border-slate-400 active:bg-slate-100"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* Info Note on Google Client ID Setup */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    OAuth 2.0 Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                    className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    Setup Google Credentials
                  </button>
                </div>
              </div>
            )}

            {/* Google OAuth Quick Setup Card */}
            {showGoogleGuide && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 text-left animate-fadeIn">
                <p className="font-bold text-slate-800">
                  How to enable live Google Sign-In:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Visit <b>console.cloud.google.com</b></li>
                  <li>Create an OAuth 2.0 Client ID (Web Application)</li>
                  <li>Add Authorized JavaScript origin: <code className="bg-slate-200 px-1 rounded">http://localhost:3000</code></li>
                  <li>Add Client ID to <code className="bg-slate-200 px-1 rounded">client/.env</code> as <code className="bg-slate-200 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code></li>
                </ol>
                <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl">
                  ✓ For development, clicking above signs in instantly as Soliman Hossen Sady!
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthPage;
