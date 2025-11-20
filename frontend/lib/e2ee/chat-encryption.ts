/**
 * E2EE Chat Message Encryption
 * Encrypts chat messages before sending with AAD, decrypts on receive
 */

import { encryptMessage, decryptMessage } from './crypto-utils';
import { e2eeKeyManager } from './key-manager';

export interface EncryptedChatMessage {
  encryptedMessage: string;
  iv: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  timestamp: string;
  meetingId: string;
  _id?: string;
}

/**
 * Encrypt a chat message before sending with AAD (Authenticated Associated Data)
 */
export async function encryptChatMessage(
  meetingId: string,
  message: string,
  userId: string,
  userName: string,
  userImageUrl?: string
): Promise<EncryptedChatMessage> {
  const meetingKey = e2eeKeyManager.getMeetingKey(meetingId);
  if (!meetingKey) {
    throw new Error('E2EE not initialized for this meeting');
  }

  const timestamp = new Date().toISOString();
  const { ciphertext, iv } = await encryptMessage(
    message,
    meetingKey,
    meetingId,
    userId,
    timestamp
  );

  return {
    encryptedMessage: ciphertext,
    iv,
    userId,
    userName,
    userImageUrl,
    timestamp,
    meetingId,
  };
}

/**
 * Decrypt a chat message after receiving with AAD verification
 */
export async function decryptChatMessage(
  meetingId: string,
  encryptedMessage: EncryptedChatMessage
): Promise<{ message: string; userId: string; userName: string; userImageUrl?: string; timestamp: string; meetingId: string; _id?: string }> {
  const meetingKey = e2eeKeyManager.getMeetingKey(meetingId);
  if (!meetingKey) {
    throw new Error('E2EE not initialized for this meeting');
  }

  try {
    const decryptedMessage = await decryptMessage(
      encryptedMessage.encryptedMessage,
      encryptedMessage.iv,
      meetingKey,
      meetingId,
      encryptedMessage.userId,
      encryptedMessage.timestamp
    );

    return {
      message: decryptedMessage,
      userId: encryptedMessage.userId,
      userName: encryptedMessage.userName,
      userImageUrl: encryptedMessage.userImageUrl,
      timestamp: encryptedMessage.timestamp,
      meetingId: encryptedMessage.meetingId,
      _id: encryptedMessage._id,
    };
  } catch (error: any) {
    // If decryption fails, return error message
    console.error('[E2EE] Chat message decryption failed:', error);
    throw new Error('Failed to decrypt message. It may have been encrypted with a different key.');
  }
}

