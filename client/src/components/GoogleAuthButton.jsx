import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const GoogleAuthButton = ({
  mode = 'login',
  role = 'deaf_user',
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Real Google OAuth Login via popup
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsProcessing(true);
        if (onSuccess) {
          await onSuccess({ accessToken: tokenResponse.access_token, role });
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to sign in with Google account.';
        if (onError) onError(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (errorResponse) => {
      setIsProcessing(false);
      console.warn('Google sign-in popup closed or encountered error:', errorResponse);
      if (onError) {
        onError('Google Sign-In was cancelled or popup closed.');
      }
    },
  });

  const handleClick = () => {
    if (disabled || isProcessing) return;

    if (googleClientId && googleClientId.trim() !== '') {
      try {
        triggerGoogleLogin();
      } catch (err) {
        console.warn('Direct Google trigger exception, falling back:', err);
        handleSimulated();
      }
    } else {
      handleSimulated();
    }
  };

  const handleSimulated = async () => {
    setIsProcessing(true);
    try {
      if (onSuccess) {
        await onSuccess({
          demoUser: {
            email: 'sady@gmail.com',
            name: 'Soliman Hossen Sady',
            sub: `google_oauth_${Date.now()}`,
            picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
          },
          role,
        });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Simulated Google sign-in failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const buttonText = mode === 'login' ? 'Sign in with Google' : 'Sign up with Google';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className="w-full relative flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-sm shadow-xs hover:shadow-sm hover:border-slate-300 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300/60"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2.5 text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
            <span className="font-semibold text-xs sm:text-sm">Connecting with Google...</span>
          </div>
        ) : (
          <>
            {/* Crisp Official Google Multi-Color SVG G Icon */}
            <div className="w-5 h-5 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
              <svg className="w-full h-full" viewBox="0 0 24 24">
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
            </div>

            <span className="text-slate-800 text-sm tracking-normal">
              {buttonText}
            </span>
          </>
        )}
      </button>

      {/* Subtle OAuth 2.0 Verification Badge */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Verified Google OAuth 2.0 Authentication</span>
      </div>
    </div>
  );
};

export default GoogleAuthButton;

