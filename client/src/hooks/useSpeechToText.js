import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText — Resilient, continuous real-time speech recognition hook.
 * Supports multi-language speech recognition (e.g., English 'en-US' and Bangla 'bn-BD').
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
      console.warn('[SpeechToText] Error:', event.error);

      if (event.error === 'not-allowed') {
        setError(
          'Microphone permission denied. Please allow microphone access in your browser settings and try again.'
        );
        setIsListening(false);
        isManuallyStoppedRef.current = true;
      } else if (event.error === 'no-speech') {
        // Auto-recovery restart handles normal silence timeouts
      } else if (event.error === 'network') {
        setError('Network error: Voice recognition requires an active internet connection.');
        setIsListening(false);
        isManuallyStoppedRef.current = true;
      } else if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user did not manually click stop
      if (!isManuallyStoppedRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isManuallyStoppedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
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
  }, []);

  // Dynamically update recognition language
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

    // Mic pre-check
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('[SpeechToText] getUserMedia pre-check:', err);
      }
    }

    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (err.message && err.message.includes('already started')) {
        setIsListening(true);
      } else {
        console.warn('[SpeechToText] Start error:', err.message);
      }
    }
  }, [isSupported, language]);

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
