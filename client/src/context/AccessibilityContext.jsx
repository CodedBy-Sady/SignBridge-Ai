import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('signbridge_high_contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('signbridge_font_size') || 'normal'; // 'normal' | 'large' | 'xlarge'
  });

  const [soundEffects, setSoundEffects] = useState(() => {
    return localStorage.getItem('signbridge_sound') !== 'false';
  });

  const [isFlashing, setIsFlashing] = useState(false);

  // Apply High Contrast class to root document element
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('theme-high-contrast');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('theme-high-contrast');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('signbridge_high_contrast', String(highContrast));
  }, [highContrast]);

  // Apply Font Size class
  useEffect(() => {
    document.documentElement.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (fontSize === 'large') {
      document.documentElement.classList.add('text-scale-large');
    } else if (fontSize === 'xlarge') {
      document.documentElement.classList.add('text-scale-xlarge');
    }
    localStorage.setItem('signbridge_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('signbridge_sound', String(soundEffects));
  }, [soundEffects]);

  // Visual screen flash alert helper for deaf participants
  const triggerVisualAlert = useCallback(() => {
    setIsFlashing(true);
    // Beep sound if enabled for hearing user
    if (soundEffects && typeof window !== 'undefined' && window.AudioContext) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        // AudioContext might require user interaction first
      }
    }

    const timer = setTimeout(() => {
      setIsFlashing(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [soundEffects]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const toggleSound = () => setSoundEffects((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        toggleHighContrast,
        fontSize,
        setFontSize,
        cycleFontSize,
        soundEffects,
        toggleSound,
        triggerVisualAlert,
        isFlashing,
      }}
    >
      {/* Visual accessibility alert ring overlay for deaf users */}
      {isFlashing && (
        <div
          className="fixed inset-0 pointer-events-none z-50 ring-8 ring-brand-500 ring-inset animate-pulse"
          aria-live="assertive"
          role="status"
        >
          <span className="sr-only">New message received</span>
        </div>
      )}
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;

