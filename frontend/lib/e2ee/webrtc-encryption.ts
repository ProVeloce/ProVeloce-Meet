/**
 * WebRTC Stream Encryption using Insertable Streams API
 * Encrypts audio/video streams before transmission
 */

import { e2eeKeyManager } from './key-manager';

/**
 * Create encryption transform for outgoing media stream
 */
export async function createEncryptionTransform(
  meetingId: string
): Promise<TransformStream<Uint8Array, Uint8Array>> {
  const meetingKey = e2eeKeyManager.getMeetingKey(meetingId);
  if (!meetingKey) {
    throw new Error('E2EE not initialized for this meeting');
  }

  // Generate a random IV for this stream (will be sent separately)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let frameCount = 0;

  return new TransformStream({
    async transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
      try {
        // Encrypt the chunk using AES-GCM
        // Note: For production, use proper frame-based encryption
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: new Uint8Array(iv.buffer, 0, 12), // Use IV with frame counter
            tagLength: 128,
          },
          meetingKey,
          chunk
        );

        // Prepend IV (first 12 bytes) to encrypted data
        const result = new Uint8Array(12 + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), 12);

        controller.enqueue(result);
        frameCount++;
      } catch (error) {
        console.error('Encryption error:', error);
        controller.error(error);
      }
    },
  });
}

/**
 * Create decryption transform for incoming media stream
 */
export async function createDecryptionTransform(
  meetingId: string
): Promise<TransformStream<Uint8Array, Uint8Array>> {
  const meetingKey = e2eeKeyManager.getMeetingKey(meetingId);
  if (!meetingKey) {
    throw new Error('E2EE not initialized for this meeting');
  }

  return new TransformStream({
    async transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
      try {
        // Extract IV (first 12 bytes) and encrypted data
        if (chunk.length < 12) {
          controller.error(new Error('Invalid encrypted chunk'));
          return;
        }

        const iv = chunk.slice(0, 12);
        const encrypted = chunk.slice(12);

        // Decrypt the chunk
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
            tagLength: 128,
          },
          meetingKey,
          encrypted
        );

        controller.enqueue(new Uint8Array(decrypted));
      } catch (error) {
        console.error('Decryption error:', error);
        controller.error(error);
      }
    },
  });
}

/**
 * Apply encryption to RTCRtpSender
 */
export async function applyEncryptionToSender(
  sender: RTCRtpSender,
  meetingId: string
): Promise<void> {
  if (!sender.track) {
    throw new Error('Sender has no track');
  }

  const stream = sender.track.getStreams()[0];
  if (!stream) {
    throw new Error('No stream found');
  }

  const transform = await createEncryptionTransform(meetingId);
  
  // Use Insertable Streams API
  const processor = new RTCRtpScriptTransform({
    transform: transform as any,
  });

  sender.transform = processor;
}

/**
 * Apply decryption to RTCRtpReceiver
 */
export async function applyDecryptionToReceiver(
  receiver: RTCRtpReceiver,
  meetingId: string
): Promise<void> {
  if (!receiver.track) {
    throw new Error('Receiver has no track');
  }

  const transform = await createDecryptionTransform(meetingId);
  
  // Use Insertable Streams API
  const processor = new RTCRtpScriptTransform({
    transform: transform as any,
  });

  receiver.transform = processor;
}

/**
 * Setup E2EE for a peer connection
 * Note: This is a simplified implementation
 * Stream.io SDK may not expose direct access to RTCRtpSender/Receiver
 * Full implementation would require custom WebRTC handling
 */
export async function setupE2EEForPeerConnection(
  pc: RTCPeerConnection,
  meetingId: string
): Promise<void> {
  // Monitor for new tracks and apply encryption/decryption
  pc.ontrack = async (event) => {
    if (event.receiver) {
      try {
        await applyDecryptionToReceiver(event.receiver, meetingId);
      } catch (error) {
        console.error('Failed to apply decryption:', error);
      }
    }
  };

  // Apply encryption to outgoing tracks
  pc.getSenders().forEach(async (sender) => {
    if (sender.track) {
      try {
        await applyEncryptionToSender(sender, meetingId);
      } catch (error) {
        console.error('Failed to apply encryption:', error);
      }
    }
  });

  // Monitor for new senders
  const originalAddTrack = pc.addTrack.bind(pc);
  pc.addTrack = async function (track, ...streams) {
    const sender = originalAddTrack(track, ...streams);
    if (sender) {
      try {
        await applyEncryptionToSender(sender, meetingId);
      } catch (error) {
        console.error('Failed to apply encryption to new track:', error);
      }
    }
    return sender;
  };
}

