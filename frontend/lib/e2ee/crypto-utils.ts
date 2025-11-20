/**
 * Enhanced E2EE Crypto Utilities
 * Implements X25519 ECDH, HKDF, AES-GCM 256, and key wrapping
 * Uses Web Crypto API exclusively (no third-party libs)
 */

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generate a 256-bit AES-GCM meeting key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable for wrapping
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate X25519 ephemeral key pair for ECDH
 * X25519 is preferred over P-256 for better performance and security
 */
export async function generateX25519KeyPair(): Promise<CryptoKeyPair> {
  return (await crypto.subtle.generateKey(
    {
      name: 'X25519',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  )) as CryptoKeyPair;
}

// Legacy P-256 support (fallback for older browsers)
export async function generateDHKeyPair(): Promise<CryptoKeyPair> {
  try {
    return await generateX25519KeyPair();
  } catch {
    // Fallback to P-256 if X25519 not supported
    return crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  }
}

// Export key as ArrayBuffer (for secure sharing)
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

// Import key from ArrayBuffer
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Convert ArrayBuffer to base64 string for transmission
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Encrypt data using AES-GCM
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate a random 96-bit (12-byte) IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// Decrypt data using AES-GCM
export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: 128,
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: Invalid ciphertext or key');
  }
}

/**
 * Derive shared secret bits using X25519 or ECDH
 */
export async function deriveSharedSecretBits(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  try {
    // Try X25519 first
    return crypto.subtle.deriveBits(
      {
        name: 'X25519',
        public: publicKey,
      },
      privateKey,
      256 // 256 bits = 32 bytes
    );
  } catch {
    // Fallback to ECDH P-256
    return crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: publicKey,
      },
      privateKey,
      256
    );
  }
}

// Legacy: derive key directly (for backward compatibility)
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  const bits = await deriveSharedSecretBits(privateKey, publicKey);
  return crypto.subtle.importKey(
    'raw',
    bits,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export public key for sharing
export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

// Import X25519 public key
export async function importX25519PublicKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'X25519',
    },
    true,
    []
  );
}

// Import public key (with fallback)
export async function importPublicKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  try {
    return await importX25519PublicKey(keyData);
  } catch {
    // Fallback to P-256
    return crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  }
}

// ============================================================================
// HKDF (HMAC-based Key Derivation Function)
// ============================================================================

/**
 * HKDF Extract: Derives a pseudorandom key (PRK) from input key material
 */
async function hkdfExtract(
  salt: Uint8Array,
  inputKeyMaterial: ArrayBuffer
): Promise<ArrayBuffer> {
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    inputKeyMaterial,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const saltBuffer = new Uint8Array(salt).buffer;
  return crypto.subtle.sign('HMAC', hmacKey, saltBuffer);
}

/**
 * HKDF Expand: Expands PRK into output key material
 */
async function hkdfExpand(
  prk: ArrayBuffer,
  info: Uint8Array,
  outputLength: number
): Promise<ArrayBuffer> {
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    prk,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const infoBuffer = new Uint8Array(info).buffer;
  const hashLength = 32; // SHA-256 output length
  const iterations = Math.ceil(outputLength / hashLength);
  const output = new Uint8Array(outputLength);

  for (let i = 0; i < iterations; i++) {
    const counter = new Uint8Array([i + 1]);
    const data = new Uint8Array(infoBuffer.byteLength + counter.length);
    data.set(new Uint8Array(infoBuffer), 0);
    data.set(counter, infoBuffer.byteLength);

    const hash = await crypto.subtle.sign('HMAC', hmacKey, data.buffer);
    const hashArray = new Uint8Array(hash);
    const start = i * hashLength;
    const end = Math.min(start + hashLength, outputLength);
    output.set(hashArray.slice(0, end - start), start);
  }

  return output.buffer;
}

/**
 * HKDF: Full key derivation function
 */
export async function hkdf(
  inputKeyMaterial: ArrayBuffer,
  salt: Uint8Array,
  info: Uint8Array,
  outputLength: number
): Promise<ArrayBuffer> {
  const prk = await hkdfExtract(salt, inputKeyMaterial);
  return hkdfExpand(prk, info, outputLength);
}

/**
 * Derive a wrapping key from shared secret using HKDF
 */
export async function deriveWrappingKey(
  sharedSecret: ArrayBuffer,
  meetingId: string,
  participantId: string
): Promise<CryptoKey> {
  const salt = new TextEncoder().encode('ProVeloce-E2EE-Salt');
  const info = new TextEncoder().encode(`meeting:${meetingId}:participant:${participantId}:wrapping-key`);
  
  const keyMaterial = await hkdf(sharedSecret, salt, info, 32);
  
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Legacy function for backward compatibility
export async function deriveKeyFromSecret(
  sharedSecret: CryptoKey,
  salt: Uint8Array,
  info: Uint8Array
): Promise<CryptoKey> {
  const secretBuffer = await exportKey(sharedSecret);
  const keyMaterial = await hkdf(secretBuffer, salt, info, 32);
  return importKey(keyMaterial);
}

// ============================================================================
// Key Wrapping/Unwrapping
// ============================================================================

/**
 * Wrap (encrypt) a meeting key with a wrapping key
 */
export async function wrapKey(
  keyToWrap: CryptoKey,
  wrappingKey: CryptoKey
): Promise<{ wrappedKey: string; iv: string }> {
  const keyData = await exportKey(keyToWrap);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const wrapped = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    wrappingKey,
    keyData
  );

  return {
    wrappedKey: arrayBufferToBase64(wrapped),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Unwrap (decrypt) a wrapped meeting key
 */
export async function unwrapKey(
  wrappedKey: string,
  iv: string,
  wrappingKey: CryptoKey
): Promise<CryptoKey> {
  const wrappedBuffer = base64ToArrayBuffer(wrappedKey);
  const ivBuffer = base64ToArrayBuffer(iv);

  const keyData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
      tagLength: 128,
    },
    wrappingKey,
    wrappedBuffer
  );

  return importKey(keyData);
}

// ============================================================================
// Message Encryption/Decryption with AAD
// ============================================================================

/**
 * Encrypt a message with authenticated associated data (AAD)
 */
export async function encryptMessage(
  message: string,
  key: CryptoKey,
  meetingId: string,
  userId: string,
  timestamp: string
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // AAD: meetingId, userId, timestamp
  const aad = encoder.encode(JSON.stringify({ meetingId, userId, timestamp }));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: aad,
      tagLength: 128,
    },
    key,
    messageBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a message with AAD verification
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey,
  meetingId: string,
  userId: string,
  timestamp: string
): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);
  const encoder = new TextEncoder();
  const aad = encoder.encode(JSON.stringify({ meetingId, userId, timestamp }));

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        additionalData: aad,
        tagLength: 128,
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: Invalid ciphertext, key, or AAD');
  }
}

