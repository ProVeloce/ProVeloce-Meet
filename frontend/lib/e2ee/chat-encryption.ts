/**
 * E2EE Chat Message Encryption
 * Encrypts chat messages before sending, decrypts on receive
 */

import { encrypt, decrypt } from './crypto-utils';
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
 * Encrypt a chat message before sending
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

  const { ciphertext, iv } = await encrypt(message, meetingKey);

  return {
    encryptedMessage: ciphertext,
    iv,
    userId,
    userName,
    userImageUrl,
    timestamp: new Date().toISOString(),
    meetingId,
  };
}

/**
 * Decrypt a chat message after receiving
 */
export async function decryptChatMessage(
  meetingId: string,
  encryptedMessage: EncryptedChatMessage
): Promise<{ message: string; userId: string; userName: string; userImageUrl?: string; timestamp: string; meetingId: string; _id?: string }> {
  const meetingKey = e2eeKeyManager.getMeetingKey(meetingId);
  if (!meetingKey) {
    throw new Error('E2EE not initialized for this meeting');
  }

  const decryptedMessage = await decrypt(
    encryptedMessage.encryptedMessage,
    encryptedMessage.iv,
    meetingKey
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
}

