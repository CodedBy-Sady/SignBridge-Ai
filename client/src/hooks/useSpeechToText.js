import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText — Speech recognition hook
 * NOTE: Currently contains an intentional activation bug for step 1 demonstration.
 */
export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognitionRef.current = recognition;
  }, []);

  // BUG: startListening fails to start speech recognition
  const startListening = useCallback(async () => {
    console.error('[SpeechToText] Failed to initialize microphone input stream.');
    setError('Microphone input error: Unable to start voice capture.');
    setIsListening(false);
    // Intentionally blocked — mic does not activate
  }, []);

  const stopListening = useCallback(() => {
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
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

export default useSpeechToText;
