import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useWebcam: Custom hook for managing camera video stream,
 * device permissions, and visual status indicators for sign detection.
 */
export const useWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [statusText, setStatusText] = useState('Camera Standby');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setStatusText('Requesting camera access...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API is not supported in this browser environment. Using simulation mode.');
      setIsSimulated(true);
      setIsActive(true);
      setStatusText('Simulation Active');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
      setIsSimulated(false);
      setHasPermission(true);
      setStatusText('Camera Active');
    } catch (err) {
      console.warn('[useWebcam] Real camera failed, falling back to interactive simulation:', err);
      setHasPermission(false);
      setError(err.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Camera device unavailable.');
      // Auto fallback to simulation mode so the UI can still be experienced
      setIsSimulated(true);
      setIsActive(true);
      setStatusText('Simulation Mode Active');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setStatusText('Camera Standby');
  }, []);

  const toggleCamera = useCallback(() => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isActive, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    isSimulated,
    hasPermission,
    error,
    statusText,
    setStatusText,
    startCamera,
    stopCamera,
    toggleCamera,
    setIsSimulated,
  };
};

export default useWebcam;

