/**
 * E2EE Hook for Meeting
 * Manages E2EE initialization, key exchange via Stream.io, rekeying, and status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { e2eeKeyManager } from '@/lib/e2ee/key-manager';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { detectBrowserCapabilities, canJoinE2EEMeeting } from '@/lib/e2ee/browser-capabilities';
import {
  sendPublicKey,
  sendWrappedKey,
  sendRekeyNotification,
  parseKeyExchangeMessage,
} from '@/lib/e2ee/key-exchange-signaling';

export interface E2EEStatus {
  isActive: boolean;
  isInitializing: boolean;
  error: string | null;
  keyId: string | null;
  lastRekeyAt: number | null;
  browserWarning?: string;
}

export function useE2EE(meetingId: string | undefined, isHost: boolean) {
  const { user } = useUser();
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const keyExchangeHandled = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<E2EEStatus>({
    isActive: false,
    isInitializing: false,
    error: null,
    keyId: null,
    lastRekeyAt: null,
  });

  // Check browser capabilities
  useEffect(() => {
    const caps = detectBrowserCapabilities();
    const canJoin = canJoinE2EEMeeting(false); // Don't require media E2EE for now

    if (!canJoin.canJoin) {
      setStatus(prev => ({
        ...prev,
        error: canJoin.reason || 'Browser does not support E2EE',
        browserWarning: caps.warningMessage,
      }));
    } else if (caps.warningMessage) {
      setStatus(prev => ({
        ...prev,
        browserWarning: caps.warningMessage,
      }));
    }
  }, []);

  // Initialize E2EE when meeting starts
  const initializeE2EE = useCallback(async () => {
    if (!meetingId || !user?.id || !call) return;

    // Check if browser can support E2EE
    const canJoin = canJoinE2EEMeeting(false);
    if (!canJoin.canJoin) {
      setStatus(prev => ({
        ...prev,
        error: canJoin.reason || 'Browser does not support E2EE',
        isInitializing: false,
      }));
      return;
    }

    setStatus(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Initialize key manager
      const { keyId, publicKey } = await e2eeKeyManager.initializeMeeting(
        meetingId,
        user.id,
        isHost
      );

      if (isHost) {
        // Host: E2EE is active immediately after key generation
        setStatus({
          isActive: true,
          isInitializing: false,
          error: null,
          keyId,
          lastRekeyAt: Date.now(),
        });

        // Send public key to participants
        try {
          await sendPublicKey(call, meetingId, user.id, publicKey);
        } catch (error) {
          console.warn('[E2EE] Failed to send public key:', error);
        }
      } else {
        // Participant: Send public key and wait for host's wrapped key
        setStatus({
          isActive: false,
          isInitializing: true,
          error: null,
          keyId: null,
          lastRekeyAt: null,
        });

        // Send public key to host
        try {
          await sendPublicKey(call, meetingId, user.id, publicKey);
        } catch (error) {
          console.warn('[E2EE] Failed to send public key:', error);
        }
      }
    } catch (error: any) {
      console.error('E2EE initialization failed:', error);
      setStatus({
        isActive: false,
        isInitializing: false,
        error: error.message || 'Failed to initialize E2EE',
        keyId: null,
        lastRekeyAt: null,
      });
    }
  }, [meetingId, user?.id, isHost, call]);

  // Handle key exchange messages
  useEffect(() => {
    if (!call || !meetingId || !user?.id) return;

    const handleCallUpdate = () => {
      try {
        const callData = call.state;
        const message = parseKeyExchangeMessage(callData);
        if (!message) return;

        const messageId = `${message.type}-${message.userId}-${message.timestamp}`;
        if (keyExchangeHandled.current.has(messageId)) return;
        keyExchangeHandled.current.add(messageId);

        // Handle different message types
        if (message.type === 'e2ee:public-key' && isHost && message.userId !== user.id) {
          // Host receives participant's public key, send wrapped key
          handleParticipantPublicKey(message.userId, message.publicKey!);
        } else if (message.type === 'e2ee:wrapped-key' && !isHost && message.targetUserId === user.id) {
          // Participant receives wrapped key from host
          handleWrappedKey(message.wrappedKey!, message.iv!, message.keyId!, message.userId);
        } else if (message.type === 'e2ee:rekey' && message.userId !== user.id) {
          // Handle rekey notification
          handleRekey(message.newKeyId!, message.wrappedKeys!, message.userId);
        }
      } catch (error) {
        console.error('[E2EE] Error handling key exchange:', error);
      }
    };

    // Listen to call state changes
    const unsubscribe = call.on('call.updated', handleCallUpdate);
    return () => {
      unsubscribe();
    };
  }, [call, meetingId, user?.id, isHost]);

  // Handle participant public key (host only)
  const handleParticipantPublicKey = useCallback(async (participantId: string, publicKey: string) => {
    if (!isHost || !meetingId || !call) return;

    try {
      const { wrappedKey, iv, keyId } = await e2eeKeyManager.shareKeyWithParticipant(
        meetingId,
        participantId,
        publicKey
      );

      await sendWrappedKey(call, meetingId, user!.id, participantId, wrappedKey, iv, keyId);
    } catch (error) {
      console.error('[E2EE] Failed to share key with participant:', error);
    }
  }, [isHost, meetingId, call, user?.id]);

  // Handle wrapped key (participant only)
  const handleWrappedKey = useCallback(async (
    wrappedKey: string,
    iv: string,
    keyId: string,
    hostId: string
  ) => {
    if (isHost || !meetingId || !user?.id) return;

    try {
      // Get host's public key from key manager
      const publicKeys = e2eeKeyManager.getParticipantPublicKeys(meetingId);
      const hostPublicKey = publicKeys.get(hostId);
      if (!hostPublicKey) {
        throw new Error('Host public key not found');
      }

      await e2eeKeyManager.receiveMeetingKey(
        meetingId,
        user.id,
        wrappedKey,
        iv,
        hostPublicKey,
        keyId
      );

      setStatus(prev => ({
        ...prev,
        isActive: true,
        isInitializing: false,
        keyId,
        lastRekeyAt: Date.now(),
      }));
    } catch (error: any) {
      console.error('[E2EE] Failed to receive meeting key:', error);
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to receive encryption key',
        isInitializing: false,
      }));
    }
  }, [isHost, meetingId, user?.id]);

  // Handle rekey notification
  const handleRekey = useCallback(async (
    newKeyId: string,
    wrappedKeys: Record<string, { wrappedKey: string; iv: string }>,
    hostId: string
  ) => {
    if (!meetingId || !user?.id) return;

    const wrappedKeyData = wrappedKeys[user.id];
    if (!wrappedKeyData) {
      console.warn('[E2EE] No wrapped key found for this participant in rekey');
      return;
    }

    try {
      const publicKeys = e2eeKeyManager.getParticipantPublicKeys(meetingId);
      const hostPublicKey = publicKeys.get(hostId);
      if (!hostPublicKey) {
        throw new Error('Host public key not found');
      }

      await e2eeKeyManager.receiveMeetingKey(
        meetingId,
        user.id,
        wrappedKeyData.wrappedKey,
        wrappedKeyData.iv,
        hostPublicKey,
        newKeyId
      );

      setStatus(prev => ({
        ...prev,
        keyId: newKeyId,
        lastRekeyAt: Date.now(),
      }));
    } catch (error: any) {
      console.error('[E2EE] Failed to receive rekey:', error);
    }
  }, [meetingId, user?.id]);

  // Rekey on participant join/leave (host only)
  const prevParticipantCountRef = useRef<number>(0);
  useEffect(() => {
    if (!isHost || !meetingId || !e2eeKeyManager.isE2EEActive(meetingId)) {
      prevParticipantCountRef.current = participants.length;
      return;
    }

    const participantCount = participants.length;
    const prevCount = prevParticipantCountRef.current;

    if (participantCount !== prevCount && prevCount > 0) {
      // Participant joined or left, trigger rekey
      const rekey = async () => {
        try {
          const { keyId, wrappedKeys } = await e2eeKeyManager.rekeyMeeting(meetingId);
          if (call) {
            await sendRekeyNotification(call, meetingId, user!.id, keyId, wrappedKeys);
          }
          setStatus(prev => ({
            ...prev,
            keyId,
            lastRekeyAt: Date.now(),
          }));
        } catch (error) {
          console.error('[E2EE] Rekey failed:', error);
        }
      };

      // Debounce rekey
      const timeout = setTimeout(rekey, 1000);
      prevParticipantCountRef.current = participantCount;
      return () => clearTimeout(timeout);
    } else {
      prevParticipantCountRef.current = participantCount;
    }
  }, [participants.length, isHost, meetingId, call, user?.id]);

  // Time-based rekey check (host only)
  useEffect(() => {
    if (!isHost || !meetingId) return;

    const checkRekey = setInterval(() => {
      if (e2eeKeyManager.shouldRekey(meetingId, 60)) { // 60 minutes
        const rekey = async () => {
          try {
            const { keyId, wrappedKeys } = await e2eeKeyManager.rekeyMeeting(meetingId);
            if (call) {
              await sendRekeyNotification(call, meetingId, user!.id, keyId, wrappedKeys);
            }
            setStatus(prev => ({
              ...prev,
              keyId,
              lastRekeyAt: Date.now(),
            }));
          } catch (error) {
            console.error('[E2EE] Time-based rekey failed:', error);
          }
        };
        rekey();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkRekey);
  }, [isHost, meetingId, call, user?.id]);

  // Note: Stream.io doesn't provide direct custom events API
  // Key exchange would need to be implemented via Stream's messaging API or custom signaling
  // For now, participants will wait for key exchange (simplified for demo)
  // In production, implement proper key exchange via:
  // - Stream's messaging SDK (@stream-io/chat-react)
  // - WebRTC data channels (requires direct peer connection)
  // - Custom WebSocket signaling server

  // Cleanup on unmount or page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (meetingId && user?.id) {
        e2eeKeyManager.cleanup(meetingId, user.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (meetingId && user?.id) {
        e2eeKeyManager.cleanup(meetingId, user.id);
      }
    };
  }, [meetingId, user?.id]);

  // Initialize when meeting is ready
  useEffect(() => {
    if (meetingId && call && !status.isActive && !status.isInitializing && !status.error && !status.browserWarning) {
      initializeE2EE();
    }
  }, [meetingId, call, status.isActive, status.isInitializing, status.error, status.browserWarning, initializeE2EE]);

  return {
    ...status,
    initializeE2EE,
  };
}

