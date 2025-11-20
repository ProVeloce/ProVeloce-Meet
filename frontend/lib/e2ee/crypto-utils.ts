/**
 * End-to-End Encryption (E2EE) Utilities
 * Implements AES-GCM 256-bit encryption for secure communication
 */

// Generate a random 256-bit (32-byte) key for AES-GCM
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
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

// Generate a key pair for Diffie-Hellman key exchange
export async function generateDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256', // NIST P-256 curve
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

// Derive a shared secret using ECDH
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Export public key for sharing
export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

// Import public key
export async function importPublicKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
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

// Secure key derivation using HKDF (HMAC-based Key Derivation Function)
export async function deriveKeyFromSecret(
  sharedSecret: CryptoKey,
  salt: Uint8Array,
  info: Uint8Array
): Promise<CryptoKey> {
  // Import shared secret as HMAC key
  const sharedSecretBuffer = await exportKey(sharedSecret);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    sharedSecretBuffer,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // HKDF extract - create a new ArrayBuffer from Uint8Array to ensure proper type
  const saltArrayBuffer = new Uint8Array(salt).buffer;
  const prk = await crypto.subtle.sign('HMAC', hmacKey, saltArrayBuffer);

  // HKDF expand (simplified - for production use a proper HKDF implementation)
  const hmacKey2 = await crypto.subtle.importKey(
    'raw',
    prk,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Create a new ArrayBuffer from info Uint8Array
  const infoArrayBuffer = new Uint8Array(info).buffer;
  const okm = await crypto.subtle.sign('HMAC', hmacKey2, infoArrayBuffer);

  // Import as AES-GCM key - ensure we have a proper ArrayBuffer
  const keyBuffer = okm.slice(0, 32); // Use first 32 bytes for 256-bit key
  return await importKey(keyBuffer);
}

