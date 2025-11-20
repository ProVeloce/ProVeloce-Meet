# E2EE Security Summary & Threat Model

## Security Architecture Overview

ProVeloce Meet implements End-to-End Encryption (E2EE) for both media streams and in-call chat messages. All encryption operations are performed client-side using the Web Crypto API, ensuring that the server never has access to decrypted content or encryption keys.

## Key Exchange Protocol

### 1. Initialization
- **Host**: Generates 256-bit AES-GCM meeting key and X25519 ephemeral key pair
- **Participants**: Generate their own X25519 ephemeral key pairs
- **Public Key Exchange**: Public keys are exchanged via Stream.io's authenticated signaling channel

### 2. Key Derivation
- **ECDH**: X25519 Elliptic Curve Diffie-Hellman for shared secret derivation
- **HKDF**: HMAC-based Key Derivation Function (SHA-256) for wrapping key derivation
- **Wrapping**: Meeting key is wrapped using AES-GCM with HKDF-derived wrapping key

### 3. Key Distribution
- Host wraps meeting key for each participant using pairwise ECDH + HKDF
- Wrapped keys are sent via Stream.io signaling (encrypted by Stream's authentication)
- Participants unwrap keys using their shared secret with the host

## Encryption Algorithms

| Component | Algorithm | Key Size | Purpose |
|-----------|-----------|----------|---------|
| Media Encryption | AES-GCM | 256-bit | Video/audio stream encryption |
| Message Encryption | AES-GCM | 256-bit | Chat message encryption |
| Key Exchange | X25519 ECDH | 256-bit | Shared secret derivation |
| Key Wrapping | AES-GCM | 256-bit | Secure key distribution |
| Key Derivation | HKDF-SHA-256 | 256-bit | Wrapping key derivation |
| Authentication | AES-GCM Tag | 128-bit | Message integrity & authenticity |

## Key Management

### Storage
- **Location**: Client memory only (JavaScript Map objects)
- **Persistence**: Never stored in database, localStorage, or sessionStorage
- **Lifetime**: Destroyed when user leaves meeting or page unloads

### Key Rotation (Rekeying)
- **Trigger Events**:
  - New participant joins
  - Participant leaves
  - Time-based (configurable, default: 60 minutes)
  - Host transfer
- **Process**: Host generates new meeting key, wraps for all participants, distributes via signaling

### Forward Secrecy
- Rekeying on participant changes ensures forward secrecy
- Previous participants cannot decrypt new messages after leaving
- Time-based rotation limits exposure window

## Threat Model

### Protected Against

1. **Server-Side Eavesdropping**
   - Server receives only ciphertext
   - No access to encryption keys
   - Cannot decrypt media or messages

2. **Man-in-the-Middle (MITM) Attacks**
   - Authenticated ECDH key exchange
   - Stream.io's token-based authentication
   - AAD includes meetingId, userId, timestamp

3. **Key Leakage**
   - Keys never sent to server unencrypted
   - Keys never stored in database
   - Keys destroyed on page unload

4. **Replay Attacks**
   - AAD includes timestamp
   - AES-GCM authentication tag prevents tampering
   - Unique IV per encryption operation

5. **Forward Secrecy Violations**
   - Automatic rekeying on participant changes
   - Previous keys cannot decrypt new content

### Limitations & Assumptions

1. **Client Security**
   - No protection against compromised client devices
   - Malware on client can access keys in memory
   - Browser extensions may have access to keys

2. **Browser Support**
   - Insertable Streams (media E2EE) only in Chromium browsers
   - Safari/Firefox: Chat E2EE only
   - Requires Web Crypto API support

3. **Signaling Security**
   - Depends on Stream.io's signaling security
   - Public keys sent via authenticated channel
   - Wrapped keys sent via authenticated channel

4. **Key Exchange**
   - Initial key exchange requires Stream.io signaling
   - If signaling is compromised, key exchange may be intercepted
   - However, wrapped keys require ECDH shared secret to unwrap

5. **Performance**
   - Encryption adds latency (<200ms target)
   - CPU overhead for crypto operations
   - May impact low-end devices

## Security Properties

### Confidentiality
- ✅ Only participants can decrypt media/messages
- ✅ Server cannot decrypt content
- ✅ Forward secrecy via rekeying

### Integrity
- ✅ AES-GCM authentication tag prevents tampering
- ✅ AAD includes meetingId, userId, timestamp
- ✅ Failed decryption indicates tampering

### Authenticity
- ✅ AAD binds message to sender and meeting
- ✅ Timestamp prevents replay attacks
- ✅ ECDH key exchange authenticated via Stream.io tokens

### Availability
- ⚠️ E2EE requires browser support
- ⚠️ Unsupported browsers blocked or degraded
- ✅ Graceful fallback for chat-only E2EE

## Failure Modes

### E2EE Initialization Failure
- **Behavior**: Block meeting join
- **User Experience**: Clear error message, redirect to dashboard
- **Logging**: Error logged (no keys logged)

### Key Exchange Failure
- **Behavior**: Participant cannot decrypt
- **User Experience**: Show error, retry key exchange
- **Recovery**: Host resends wrapped key

### Decryption Failure
- **Behavior**: Message/media cannot be decrypted
- **User Experience**: Show error, skip corrupted content
- **Cause**: Wrong key, tampered content, or corruption

### Browser Incompatibility
- **Behavior**: Block join or degrade to chat-only E2EE
- **User Experience**: Clear warning message
- **Options**: User can choose to proceed or cancel

## Security Best Practices

1. **Key Hygiene**
   - Generate keys using cryptographically secure RNG
   - Use unique IVs for each encryption
   - Destroy keys immediately after use

2. **Key Exchange**
   - Use authenticated channels
   - Verify participant identity
   - Rekey on suspicious activity

3. **Error Handling**
   - Never log keys or plaintext
   - Fail securely (block on error)
   - Provide clear user feedback

4. **Performance**
   - Use Web Workers for heavy crypto
   - Optimize for low latency
   - Monitor CPU usage

## Compliance & Auditing

### What We Log
- E2EE enabled/disabled status
- Key exchange success/failure (boolean)
- Decryption errors (error codes only)
- Browser compatibility warnings

### What We Don't Log
- Encryption keys (never)
- Plaintext messages (never)
- Shared secrets (never)
- Wrapped keys (never)
- Decrypted content (never)

### Telemetry
- High-level metrics only
- No sensitive data
- No user-identifiable encryption data

## Recommendations

1. **Regular Security Audits**
   - Review key exchange protocol
   - Test rekeying mechanisms
   - Verify key destruction

2. **Browser Compatibility**
   - Monitor browser support
   - Provide clear warnings
   - Consider fallback options

3. **Performance Monitoring**
   - Track encryption latency
   - Monitor CPU usage
   - Optimize for low-end devices

4. **User Education**
   - Explain E2EE benefits
   - Show security indicators
   - Warn about limitations

---

**Security Level**: Production-ready for chat E2EE, media E2EE limited by browser support  
**Last Updated**: 2025-01-XX  
**Review Frequency**: Quarterly


