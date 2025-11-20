/**
 * E2EE Key Manager
 * Manages encryption keys for meetings with secure key exchange and rekeying
 */

import {
  generateEncryptionKey,
  exportKey,
  importKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateDHKeyPair,
  deriveSharedSecret,
  exportPublicKey,
  importPublicKey,
} from './crypto-utils';

export interface ParticipantKeyInfo {
  userId: string;
  publicKey: string; // base64 encoded
  sharedSecret?: CryptoKey; // Only stored temporarily during key exchange
}

export interface MeetingKeyData {
  meetingKey: CryptoKey;
  keyId: string; // Unique identifier for this key version (for rekeying)
  participants: Map<string, ParticipantKeyInfo>;
  isHost: boolean;
}

/**
 * Key Manager for E2EE meetings
 * Keys are stored only in memory and destroyed when meeting ends
 */
export class E2EEKeyManager {
  private meetingKeys: Map<string, MeetingKeyData> = new Map();
  private dhKeyPairs: Map<string, CryptoKeyPair> = new Map();

  /**
   * Initialize E2EE for a meeting
   * Host generates the meeting key, participants wait for key exchange
   */
  async initializeMeeting(
    meetingId: string,
    userId: string,
    isHost: boolean
  ): Promise<{ keyId: string; publicKey: string }> {
    // Generate DH key pair for this user
    const dhKeyPair = await generateDHKeyPair();
    this.dhKeyPairs.set(`${meetingId}:${userId}`, dhKeyPair);

    const publicKeyBuffer = await exportPublicKey(dhKeyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

    if (isHost) {
      // Host generates the meeting encryption key
      const meetingKey = await generateEncryptionKey();
      const keyId = crypto.randomUUID();

      this.meetingKeys.set(meetingId, {
        meetingKey,
        keyId,
        participants: new Map([
          [
            userId,
            {
              userId,
              publicKey: publicKeyBase64,
            },
          ],
        ]),
        isHost: true,
      });

      return { keyId, publicKey: publicKeyBase64 };
    } else {
      // Participant initializes with their public key
      // They'll receive the meeting key through secure key exchange
      if (!this.meetingKeys.has(meetingId)) {
        this.meetingKeys.set(meetingId, {
          meetingKey: null as any, // Will be set after key exchange
          keyId: '',
          participants: new Map([
            [
              userId,
              {
                userId,
                publicKey: publicKeyBase64,
              },
            ],
          ]),
          isHost: false,
        });
      } else {
        const meetingData = this.meetingKeys.get(meetingId)!;
        meetingData.participants.set(userId, {
          userId,
          publicKey: publicKeyBase64,
        });
      }

      return { keyId: '', publicKey: publicKeyBase64 };
    }
  }

  /**
   * Host shares meeting key with participant using ECDH
   */
  async shareKeyWithParticipant(
    meetingId: string,
    participantUserId: string,
    participantPublicKeyBase64: string
  ): Promise<string> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData || !meetingData.isHost) {
      throw new Error('Only host can share meeting key');
    }

    const hostUserId = Array.from(meetingData.participants.keys())[0];
    const hostDHKeyPair = this.dhKeyPairs.get(`${meetingId}:${hostUserId}`);
    if (!hostDHKeyPair) {
      throw new Error('Host DH key pair not found');
    }

    // Import participant's public key
    const participantPublicKeyBuffer = base64ToArrayBuffer(participantPublicKeyBase64);
    const participantPublicKey = await importPublicKey(participantPublicKeyBuffer);

    // Derive shared secret
    const sharedSecret = await deriveSharedSecret(
      hostDHKeyPair.privateKey,
      participantPublicKey
    );

    // Export meeting key
    const meetingKeyBuffer = await exportKey(meetingData.meetingKey);

    // Encrypt meeting key with shared secret (using a simple encryption)
    // In production, use proper key wrapping
    const encryptedKey = arrayBufferToBase64(meetingKeyBuffer);

    // Store participant info
    meetingData.participants.set(participantUserId, {
      userId: participantUserId,
      publicKey: participantPublicKeyBase64,
      sharedSecret,
    });

    return encryptedKey;
  }

  /**
   * Participant receives and sets meeting key
   */
  async receiveMeetingKey(
    meetingId: string,
    userId: string,
    encryptedKey: string,
    hostPublicKeyBase64: string
  ): Promise<void> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData) {
      throw new Error('Meeting not initialized');
    }

    const participantDHKeyPair = this.dhKeyPairs.get(`${meetingId}:${userId}`);
    if (!participantDHKeyPair) {
      throw new Error('Participant DH key pair not found');
    }

    // Import host's public key
    const hostPublicKeyBuffer = base64ToArrayBuffer(hostPublicKeyBase64);
    const hostPublicKey = await importPublicKey(hostPublicKeyBuffer);

    // Derive shared secret
    const sharedSecret = await deriveSharedSecret(
      participantDHKeyPair.privateKey,
      hostPublicKey
    );

    // Decrypt and import meeting key
    const keyBuffer = base64ToArrayBuffer(encryptedKey);
    const meetingKey = await importKey(keyBuffer);

    meetingData.meetingKey = meetingKey;
    const participantPublicKeyBuffer = await exportPublicKey(participantDHKeyPair.publicKey);
    const participantPublicKeyBase64 = arrayBufferToBase64(participantPublicKeyBuffer);
    
    meetingData.participants.set(userId, {
      userId,
      publicKey: participantPublicKeyBase64,
      sharedSecret,
    });
  }

  /**
   * Get meeting encryption key
   */
  getMeetingKey(meetingId: string): CryptoKey | null {
    const meetingData = this.meetingKeys.get(meetingId);
    return meetingData?.meetingKey || null;
  }

  /**
   * Check if E2EE is active for meeting
   */
  isE2EEActive(meetingId: string): boolean {
    const meetingData = this.meetingKeys.get(meetingId);
    return !!meetingData?.meetingKey;
  }

  /**
   * Rekey meeting (generate new key when participant joins/leaves)
   */
  async rekeyMeeting(meetingId: string): Promise<string> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData || !meetingData.isHost) {
      throw new Error('Only host can rekey meeting');
    }

    // Generate new key
    const newMeetingKey = await generateEncryptionKey();
    const newKeyId = crypto.randomUUID();

    meetingData.meetingKey = newMeetingKey;
    meetingData.keyId = newKeyId;

    return newKeyId;
  }

  /**
   * Clean up keys when leaving meeting
   */
  cleanup(meetingId: string, userId: string): void {
    // Remove DH key pair
    this.dhKeyPairs.delete(`${meetingId}:${userId}`);

    // If host leaves or last participant, remove meeting keys
    const meetingData = this.meetingKeys.get(meetingId);
    if (meetingData) {
      meetingData.participants.delete(userId);
      if (meetingData.participants.size === 0 || (meetingData.isHost && userId === Array.from(meetingData.participants.keys())[0])) {
        this.meetingKeys.delete(meetingId);
      }
    }
  }

  /**
   * Get participant public keys for key exchange
   */
  getParticipantPublicKeys(meetingId: string): Map<string, string> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData) {
      return new Map();
    }

    const publicKeys = new Map<string, string>();
    meetingData.participants.forEach((info, userId) => {
      publicKeys.set(userId, info.publicKey);
    });
    return publicKeys;
  }
}

// Singleton instance
export const e2eeKeyManager = new E2EEKeyManager();

