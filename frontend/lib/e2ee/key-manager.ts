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
  generateX25519KeyPair,
  generateDHKeyPair,
  deriveSharedSecretBits,
  exportPublicKey,
  importX25519PublicKey,
  importPublicKey,
  deriveWrappingKey,
  wrapKey,
  unwrapKey,
} from './crypto-utils';

export interface ParticipantKeyInfo {
  userId: string;
  publicKey: string; // base64 encoded
  sharedSecret?: CryptoKey; // Only stored temporarily during key exchange
}

export interface MeetingKeyData {
  meetingKey: CryptoKey | null;
  keyId: string; // Unique identifier for this key version (for rekeying)
  participants: Map<string, ParticipantKeyInfo>;
  isHost: boolean;
  createdAt: number; // Timestamp when key was created
  lastRekeyAt: number; // Timestamp of last rekey
  hostUserId?: string; // Current host user ID
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
    // Generate X25519 key pair for this user (with P-256 fallback)
    let dhKeyPair: CryptoKeyPair;
    try {
      dhKeyPair = await generateX25519KeyPair();
    } catch {
      // Fallback to P-256 if X25519 not supported
      dhKeyPair = await generateDHKeyPair();
    }
    this.dhKeyPairs.set(`${meetingId}:${userId}`, dhKeyPair);

    const publicKeyBuffer = await exportPublicKey(dhKeyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

    if (isHost) {
      // Host generates the meeting encryption key
      const meetingKey = await generateEncryptionKey();
      const keyId = crypto.randomUUID();
      const createdAt = Date.now();

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
        createdAt,
        lastRekeyAt: createdAt,
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
          createdAt: Date.now(),
          lastRekeyAt: 0,
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
   * Host shares meeting key with participant using X25519 ECDH + HKDF + Key Wrapping
   */
  async shareKeyWithParticipant(
    meetingId: string,
    participantUserId: string,
    participantPublicKeyBase64: string
  ): Promise<{ wrappedKey: string; iv: string; keyId: string }> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData || !meetingData.isHost || !meetingData.meetingKey) {
      throw new Error('Only host can share meeting key');
    }

    const hostUserId = meetingData.hostUserId || Array.from(meetingData.participants.keys())[0];
    const hostDHKeyPair = this.dhKeyPairs.get(`${meetingId}:${hostUserId}`);
    if (!hostDHKeyPair) {
      throw new Error('Host DH key pair not found');
    }

    // Import participant's public key
    const participantPublicKeyBuffer = base64ToArrayBuffer(participantPublicKeyBase64);
    let participantPublicKey: CryptoKey;
    try {
      participantPublicKey = await importX25519PublicKey(participantPublicKeyBuffer);
    } catch {
      participantPublicKey = await importPublicKey(participantPublicKeyBuffer);
    }

    // Derive shared secret bits
    const sharedSecretBits = await deriveSharedSecretBits(
      hostDHKeyPair.privateKey,
      participantPublicKey
    );

    // Derive wrapping key using HKDF
    const wrappingKey = await deriveWrappingKey(
      sharedSecretBits,
      meetingId,
      participantUserId
    );

    // Wrap the meeting key
    const { wrappedKey, iv } = await wrapKey(meetingData.meetingKey, wrappingKey);

    // Store participant info
    meetingData.participants.set(participantUserId, {
      userId: participantUserId,
      publicKey: participantPublicKeyBase64,
    });

    return {
      wrappedKey,
      iv,
      keyId: meetingData.keyId,
    };
  }

  /**
   * Participant receives and unwraps meeting key
   */
  async receiveMeetingKey(
    meetingId: string,
    userId: string,
    wrappedKey: string,
    iv: string,
    hostPublicKeyBase64: string,
    keyId: string
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
    let hostPublicKey: CryptoKey;
    try {
      hostPublicKey = await importX25519PublicKey(hostPublicKeyBuffer);
    } catch {
      hostPublicKey = await importPublicKey(hostPublicKeyBuffer);
    }

    // Derive shared secret bits
    const sharedSecretBits = await deriveSharedSecretBits(
      participantDHKeyPair.privateKey,
      hostPublicKey
    );

    // Derive wrapping key using HKDF
    const wrappingKey = await deriveWrappingKey(
      sharedSecretBits,
      meetingId,
      userId
    );

    // Unwrap the meeting key
    const meetingKey = await unwrapKey(wrappedKey, iv, wrappingKey);

    meetingData.meetingKey = meetingKey;
    meetingData.keyId = keyId;
    meetingData.lastRekeyAt = Date.now();
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
   * Returns wrapped keys for all current participants
   */
  async rekeyMeeting(meetingId: string): Promise<{
    keyId: string;
    wrappedKeys: Map<string, { wrappedKey: string; iv: string }>;
  }> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData || !meetingData.isHost || !meetingData.meetingKey) {
      throw new Error('Only host can rekey meeting');
    }

    // Generate new key
    const newMeetingKey = await generateEncryptionKey();
    const newKeyId = crypto.randomUUID();
    const hostUserId = meetingData.hostUserId || Array.from(meetingData.participants.keys())[0];
    const hostDHKeyPair = this.dhKeyPairs.get(`${meetingId}:${hostUserId}`);
    
    if (!hostDHKeyPair) {
      throw new Error('Host DH key pair not found');
    }

    // Wrap new key for all participants
    const wrappedKeys = new Map<string, { wrappedKey: string; iv: string }>();

    // Convert to array to avoid iteration issues in older TypeScript targets
    const participantsArray = Array.from(meetingData.participants.entries());
    for (const [participantId, participantInfo] of participantsArray) {
      if (participantId === hostUserId) {
        // Host doesn't need wrapped key
        continue;
      }

      try {
        const wrapped = await this.shareKeyWithParticipant(
          meetingId,
          participantId,
          participantInfo.publicKey
        );
        wrappedKeys.set(participantId, {
          wrappedKey: wrapped.wrappedKey,
          iv: wrapped.iv,
        });
      } catch (error) {
        console.error(`Failed to wrap key for participant ${participantId}:`, error);
      }
    }

    // Update meeting key
    meetingData.meetingKey = newMeetingKey;
    meetingData.keyId = newKeyId;
    meetingData.lastRekeyAt = Date.now();

    return {
      keyId: newKeyId,
      wrappedKeys,
    };
  }

  /**
   * Transfer host role and rekey
   */
  async transferHost(
    meetingId: string,
    newHostUserId: string
  ): Promise<{
    keyId: string;
    wrappedKeys: Map<string, { wrappedKey: string; iv: string }>;
  }> {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData || !meetingData.isHost) {
      throw new Error('Only current host can transfer host role');
    }

    // Rekey with new host
    meetingData.isHost = false;
    meetingData.hostUserId = newHostUserId;
    
    // The new host will need to initialize as host
    // For now, we'll rekey and let the new host take over
    return this.rekeyMeeting(meetingId);
  }

  /**
   * Check if rekey is needed (based on time or participant count)
   */
  shouldRekey(meetingId: string, maxKeyAgeMinutes: number = 60): boolean {
    const meetingData = this.meetingKeys.get(meetingId);
    if (!meetingData) return false;

    const ageMinutes = (Date.now() - meetingData.lastRekeyAt) / (1000 * 60);
    return ageMinutes >= maxKeyAgeMinutes;
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

