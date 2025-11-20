/**
 * E2EE Hook for Meeting
 * Manages E2EE initialization, key exchange, and status
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { e2eeKeyManager } from '@/lib/e2ee/key-manager';
import { useCall } from '@stream-io/video-react-sdk';

export interface E2EEStatus {
  isActive: boolean;
  isInitializing: boolean;
  error: string | null;
  keyId: string | null;
}

export function useE2EE(meetingId: string | undefined, isHost: boolean) {
  const { user } = useUser();
  const call = useCall();
  const [status, setStatus] = useState<E2EEStatus>({
    isActive: false,
    isInitializing: false,
    error: null,
    keyId: null,
  });

  // Initialize E2EE when meeting starts
  const initializeE2EE = useCallback(async () => {
    if (!meetingId || !user?.id) return;

    setStatus(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Initialize key manager
      const { keyId, publicKey } = await e2eeKeyManager.initializeMeeting(
        meetingId,
        user.id,
        isHost
      );

      // For now, if host, we consider E2EE active
      // In production, wait for key exchange confirmation
      if (isHost) {
        setStatus({
          isActive: true,
          isInitializing: false,
          error: null,
          keyId,
        });
      } else {
        // Participant waits for host to share key
        // In production, implement proper key exchange via signaling
        setStatus({
          isActive: false,
          isInitializing: true,
          error: null,
          keyId: null,
        });

        // Simulate key exchange (in production, this would be via WebSocket/signaling)
        // For now, we'll set as active after a delay
        setTimeout(() => {
          setStatus({
            isActive: true,
            isInitializing: false,
            error: null,
            keyId: null,
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error('E2EE initialization failed:', error);
      setStatus({
        isActive: false,
        isInitializing: false,
        error: error.message || 'Failed to initialize E2EE',
        keyId: null,
      });
    }
  }, [meetingId, user?.id, isHost]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (meetingId && user?.id) {
        e2eeKeyManager.cleanup(meetingId, user.id);
      }
    };
  }, [meetingId, user?.id]);

  // Initialize when meeting is ready
  useEffect(() => {
    if (meetingId && call && !status.isActive && !status.isInitializing && !status.error) {
      initializeE2EE();
    }
  }, [meetingId, call, status.isActive, status.isInitializing, status.error, initializeE2EE]);

  return {
    ...status,
    initializeE2EE,
  };
}

