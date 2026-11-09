import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText — Resilient, continuous real-time speech recognition hook.
 *
 * Key features:
 *  - Continuous listening until user explicitly stops
 *  - Auto-restarts with safety delay if browser speech engine times out on silence
 *  - Supports dynamic language switching (e.g., 'en-US', 'bn-BD')
 *  - Separates interim (live words being spoken) and final (settled sentences) transcripts
 */
export const useSpeechToText = ({ defaultLanguage = 'en-US' } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [language, setLanguage] = useState(defaultLanguage);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(true);
  const restartTimerRef = useRef(null);

  // Initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        'Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';
      let newFinalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalChunk += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      setInterimText(currentInterim);

      if (newFinalChunk) {
        const trimmed = newFinalChunk.trim();
        if (trimmed) {
          setFinalText((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
          setInterimText('');
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechToText] Recognition error:', event.error);

      if (event.error === 'not-allowed') {
        setError(
          'Microphone permission was denied. Please click the camera/mic icon in your browser address bar to allow access, then retry.'
        );
        setIsListening(false);
        isManuallyStoppedRef.current = true;
      } else if (event.error === 'no-speech') {
        // Normal silence timeout — auto-restart in onend will handle keeping it alive
      } else if (event.error === 'network') {
        setError('Network error: Chrome speech recognition requires an active internet connection.');
        setIsListening(false);
        isManuallyStoppedRef.current = true;
      } else if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // If user did NOT manually stop, auto-restart after a brief cleanup timeout
      if (!isManuallyStoppedRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isManuallyStoppedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              // Ignore if already active or user stopped in between
              if (!err.message?.includes('already started')) {
                console.warn('[SpeechToText] Auto-restart warning:', err.message);
              }
            }
          }
        }, 150);
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      isManuallyStoppedRef.current = true;
      clearTimeout(restartTimerRef.current);
      try {
        recognition.abort();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []); // Run once on mount

  // Update recognition language when state changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || !isSupported) return;

    setError(null);
    setInterimText('');
    setFinalText('');
    isManuallyStoppedRef.current = false;

    // Explicitly prompt for mic permission if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream so SpeechRecognition can bind cleanly
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('[SpeechToText] getUserMedia pre-check error:', err);
      }
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (err.message && err.message.includes('already started')) {
        setIsListening(true);
      } else {
        console.warn('[SpeechToText] Start error:', err.message);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearTimeout(restartTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('[SpeechToText] Stop error:', err.message);
      }
    }

    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setInterimText('');
    setFinalText('');
  }, []);

  return {
    isListening,
    isSupported,
    interimText,
    finalText,
    language,
    setLanguage,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

export default useSpeechToText;
