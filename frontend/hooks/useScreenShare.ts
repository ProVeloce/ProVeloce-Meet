import { useState, useEffect, useRef, useCallback } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

interface UseScreenShareReturn {
  isSharing: boolean;
  isSharingSupported: boolean;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  error: string | null;
}

/**
 * Custom hook for handling screen sharing with Stream.io
 * Uses getDisplayMedia API and properly integrates with Stream.io's call object
 */
export function useScreenShare(): UseScreenShareReturn {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharingSupported, setIsSharingSupported] = useState(false);
  
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const isRestoringCameraRef = useRef(false);

  // Check if screen sharing is supported
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === 'function';
      setIsSharingSupported(isSupported);
    };
    
    checkSupport();
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (!call) return;
    
    const currentIsSharing = screenTrackRef.current !== null;
    if (!currentIsSharing) return;

    try {
      setError(null);
      const screenTrack = screenTrackRef.current;
      const screenStream = screenStreamRef.current;

      // Stop the screen track
      if (screenTrack) {
        screenTrack.stop();
        screenTrackRef.current = null;
      }

      // Stop all tracks in the screen stream
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Restore original camera track if we have it
      if (originalVideoTrackRef.current && !isRestoringCameraRef.current) {
        isRestoringCameraRef.current = true;
        
        try {
          const originalTrack = originalVideoTrackRef.current;
          
          // Check if original track is still live
          if (originalTrack.readyState === 'live') {
            // Replace the screen track with the original camera track
            await call.publishVideoTrack(originalTrack);
          } else {
            // Original track is no longer live, re-enable camera
            await call.camera.enable();
          }
        } catch (restoreError) {
          console.error('Error restoring camera:', restoreError);
          // Try to re-enable camera as fallback
          try {
            await call.camera.enable();
          } catch (enableError) {
            console.error('Error enabling camera:', enableError);
          }
        } finally {
          isRestoringCameraRef.current = false;
          originalVideoTrackRef.current = null;
        }
      } else {
        // No original track saved, just re-enable camera
        try {
          await call.camera.enable();
        } catch (enableError) {
          console.error('Error enabling camera:', enableError);
        }
      }

      setIsSharing(false);
      originalVideoTrackRef.current = null;
      console.log('Screen sharing stopped successfully');
    } catch (err: any) {
      console.error('Error stopping screen share:', err);
      setError(err.message || 'Failed to stop screen sharing');
      setIsSharing(false);
      originalVideoTrackRef.current = null;
    }
  }, [call]);

  // Monitor screen track for automatic stop (user stops from browser toolbar)
  useEffect(() => {
    const screenTrack = screenTrackRef.current;
    if (!screenTrack) return;

    const handleTrackEnd = () => {
      console.log('Screen track ended (user stopped sharing from browser)');
      stopScreenShare();
    };

    screenTrack.addEventListener('ended', handleTrackEnd);
    
    return () => {
      screenTrack.removeEventListener('ended', handleTrackEnd);
    };
  }, [isSharing, stopScreenShare]);

  // Monitor visibility change (tab switching)
  useEffect(() => {
    if (!isSharing) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched - screen sharing might be paused
        console.log('Tab hidden - screen sharing may be paused');
      } else {
        // Tab visible again - check if screen track is still active
        const screenTrack = screenTrackRef.current;
        if (screenTrack && screenTrack.readyState === 'ended') {
          console.log('Screen track ended while tab was hidden');
          stopScreenShare();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSharing, stopScreenShare]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop screen sharing if component unmounts
      if (screenTrackRef.current) {
        stopScreenShare();
      }
    };
  }, [stopScreenShare]);

  const startScreenShare = useCallback(async () => {
    if (!call || !isSharingSupported) {
      setError('Screen sharing is not supported in this browser');
      return;
    }

    // Check if already sharing by checking ref instead of state
    if (screenTrackRef.current) {
      console.log('Already sharing screen');
      return;
    }

    try {
      setError(null);

      // Get current camera track to restore later
      try {
        const currentVideoTrack = await call.camera.get();
        if (currentVideoTrack && currentVideoTrack.readyState === 'live') {
          // Store reference to original track (don't clone as it might fail)
          originalVideoTrackRef.current = currentVideoTrack;
        }
      } catch (err) {
        console.warn('Could not get current camera track:', err);
        // Continue anyway - we'll just re-enable camera later
      }

      // Request screen share permission and get display media
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Prefer full screen
          cursor: 'always', // Show cursor
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints,
      });

      screenStreamRef.current = screenStream;
      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];

      if (!videoTrack) {
        throw new Error('No video track in screen stream');
      }

      screenTrackRef.current = videoTrack;

      // Handle track end event (user stops sharing from browser)
      videoTrack.addEventListener('ended', () => {
        console.log('Screen track ended by user');
        stopScreenShare();
      });

      // Disable camera temporarily (we'll replace it with screen)
      try {
        await call.camera.disable();
      } catch (err) {
        console.warn('Could not disable camera:', err);
        // Continue anyway
      }

      // Publish the screen video track
      await call.publishVideoTrack(videoTrack);

      // If audio track is available, publish it too
      if (audioTrack) {
        try {
          await call.publishAudioTrack(audioTrack);
        } catch (audioErr) {
          console.warn('Could not publish screen audio:', audioErr);
          // Continue without audio
        }
      }

      setIsSharing(true);
      console.log('Screen sharing started successfully');

      // Handle errors on the track
      videoTrack.addEventListener('error', (event) => {
        console.error('Screen track error:', event);
        setError('Screen sharing error occurred');
        stopScreenShare();
      });

    } catch (err: any) {
      console.error('Error starting screen share:', err);
      
      // Restore camera if we disabled it
      if (originalVideoTrackRef.current) {
        try {
          await call.camera.enable();
        } catch (enableError) {
          console.error('Error restoring camera:', enableError);
        }
      }

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Could not access screen. Please check your system settings.');
      } else if (err.name === 'AbortError') {
        setError('Screen sharing was cancelled.');
      } else {
        setError(err.message || 'Failed to start screen sharing');
      }
      
      setIsSharing(false);
      originalVideoTrackRef.current = null;
    }
  }, [call, isSharingSupported, stopScreenShare]);

  return {
    isSharing,
    isSharingSupported,
    startScreenShare,
    stopScreenShare,
    error,
  };
}

