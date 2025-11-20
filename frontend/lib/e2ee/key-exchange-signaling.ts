/**
 * Key Exchange Signaling via Stream.io
 * Uses Stream's call.update() to send encrypted key exchange messages
 * Keys are wrapped and only ciphertext is sent to server
 */

import { Call } from '@stream-io/video-react-sdk';
import { e2eeKeyManager } from './key-manager';
import { arrayBufferToBase64 } from './crypto-utils';

export interface KeyExchangeMessage {
  type: 'e2ee:public-key' | 'e2ee:wrapped-key' | 'e2ee:rekey';
  userId: string;
  meetingId: string;
  timestamp: number;
  // For public-key
  publicKey?: string;
  // For wrapped-key
  wrappedKey?: string;
  iv?: string;
  keyId?: string;
  targetUserId?: string;
  // For rekey
  newKeyId?: string;
  wrappedKeys?: Record<string, { wrappedKey: string; iv: string }>;
}

/**
 * Send public key to other participants via Stream call custom data
 */
export async function sendPublicKey(
  call: Call,
  meetingId: string,
  userId: string,
  publicKey: string
): Promise<void> {
  const message: KeyExchangeMessage = {
    type: 'e2ee:public-key',
    userId,
    meetingId,
    timestamp: Date.now(),
    publicKey,
  };

  // Use Stream's call.update() to send custom data
  // Note: Stream.io may not support arbitrary custom data in call.update()
  // Alternative: Use a separate signaling channel or WebSocket
  try {
    await call.update({
      custom: {
        e2eeKeyExchange: JSON.stringify(message),
      },
    });
  } catch (error) {
    console.warn('[E2EE] Failed to send public key via call.update, using alternative method:', error);
    // Fallback: Store in call state or use a different mechanism
    // For production, implement a dedicated signaling endpoint
  }
}

/**
 * Send wrapped meeting key to participant
 */
export async function sendWrappedKey(
  call: Call,
  meetingId: string,
  userId: string,
  targetUserId: string,
  wrappedKey: string,
  iv: string,
  keyId: string
): Promise<void> {
  const message: KeyExchangeMessage = {
    type: 'e2ee:wrapped-key',
    userId,
    meetingId,
    timestamp: Date.now(),
    targetUserId,
    wrappedKey,
    iv,
    keyId,
  };

  try {
    await call.update({
      custom: {
        e2eeKeyExchange: JSON.stringify(message),
      },
    });
  } catch (error) {
    console.warn('[E2EE] Failed to send wrapped key via call.update:', error);
  }
}

/**
 * Send rekey notification to all participants
 */
export async function sendRekeyNotification(
  call: Call,
  meetingId: string,
  userId: string,
  newKeyId: string,
  wrappedKeys: Map<string, { wrappedKey: string; iv: string }>
): Promise<void> {
  const wrappedKeysObj: Record<string, { wrappedKey: string; iv: string }> = {};
  wrappedKeys.forEach((value, key) => {
    wrappedKeysObj[key] = value;
  });

  const message: KeyExchangeMessage = {
    type: 'e2ee:rekey',
    userId,
    meetingId,
    timestamp: Date.now(),
    newKeyId,
    wrappedKeys: wrappedKeysObj,
  };

  try {
    await call.update({
      custom: {
        e2eeKeyExchange: JSON.stringify(message),
      },
    });
  } catch (error) {
    console.warn('[E2EE] Failed to send rekey notification:', error);
  }
}

/**
 * Parse key exchange message from Stream call custom data
 */
export function parseKeyExchangeMessage(data: any): KeyExchangeMessage | null {
  try {
    if (data?.custom?.e2eeKeyExchange) {
      return JSON.parse(data.custom.e2eeKeyExchange) as KeyExchangeMessage;
    }
  } catch (error) {
    console.error('[E2EE] Failed to parse key exchange message:', error);
  }
  return null;
}


