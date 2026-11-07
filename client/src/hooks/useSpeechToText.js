import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText: Custom hook for real-time speech recognition
 * Conforms to Web Speech Recognition API with pause/resume, interim transcripts,
 * fallback handlers, and accessible status flags.
 */
export const useSpeechToText = ({ onFinalTranscript, language = 'en-US' } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support for SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or enter text manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (currentFinal) {
          const trimmedFinal = currentFinal.trim();
          setFinalTranscript((prev) => (prev ? `${prev} ${trimmedFinal}` : trimmedFinal));
          setInterimTranscript('');
          if (onFinalTranscript) {
            onFinalTranscript(trimmedFinal);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechToText Warning]', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was silent, do not treat as fatal error
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Recognition halted
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('[SpeechToText Init Error]', err);
      setIsSupported(false);
      setError('Failed to initialize speech recognition.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [language, onFinalTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn('[SpeechToText Start Error]', err);
      // If already started, ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } catch (err) {
      console.warn('[SpeechToText Stop Error]', err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

export default useSpeechToText;

