# E2EE Testing Checklist

## Unit Tests

### Crypto Utilities (`crypto-utils.ts`)
- [ ] `generateX25519KeyPair()` generates valid key pair
- [ ] `hkdf()` produces consistent output for same inputs
- [ ] `wrapKey()` and `unwrapKey()` round-trip correctly
- [ ] `encryptMessage()` and `decryptMessage()` with AAD work correctly
- [ ] AAD verification fails on tampered messages
- [ ] P-256 fallback works when X25519 unavailable

### Key Manager (`key-manager.ts`)
- [ ] Host initializes meeting with key generation
- [ ] Participant initializes without key (waits for exchange)
- [ ] `shareKeyWithParticipant()` wraps key correctly
- [ ] `receiveMeetingKey()` unwraps key correctly
- [ ] `rekeyMeeting()` generates new key and wraps for all participants
- [ ] `shouldRekey()` returns true after time threshold
- [ ] `cleanup()` removes all keys from memory
- [ ] `transferHost()` works correctly

### Browser Capabilities (`browser-capabilities.ts`)
- [ ] Detects Insertable Streams support correctly
- [ ] Detects X25519 support correctly
- [ ] Identifies browser type and version
- [ ] `canJoinE2EEMeeting()` blocks unsupported browsers
- [ ] Provides appropriate warnings

## Integration Tests

### Key Exchange Flow
- [ ] Host generates key and sends public key
- [ ] Participant receives host's public key
- [ ] Participant sends their public key
- [ ] Host receives participant's public key
- [ ] Host wraps meeting key and sends to participant
- [ ] Participant receives and unwraps meeting key
- [ ] Both parties can encrypt/decrypt messages

### Rekeying Flow
- [ ] New participant joins → rekey triggered
- [ ] Participant leaves → rekey triggered
- [ ] Time-based rekey works after threshold
- [ ] All participants receive new wrapped keys
- [ ] Old key cannot decrypt new messages
- [ ] New key can decrypt new messages

### Chat Encryption
- [ ] Message encrypted before sending
- [ ] Server stores only ciphertext
- [ ] Message decrypted on receive
- [ ] Decryption fails with wrong key
- [ ] AAD verification works
- [ ] Multiple participants can decrypt same message

### Key Cleanup
- [ ] Keys destroyed on page unload
- [ ] Keys destroyed on meeting leave
- [ ] Keys not accessible after cleanup
- [ ] No memory leaks

## Manual Testing Steps

### Test 1: Basic E2EE Flow
1. Open two browser windows (Chrome/Edge)
2. Host creates meeting and joins
3. Verify E2EE status shows "Securing..." then "End-to-End Encrypted"
4. Participant joins meeting
5. Verify participant's E2EE status activates
6. Send chat message from host
7. Verify participant can read message
8. Check server logs - verify only ciphertext stored

### Test 2: Key Exchange Failure
1. Host creates meeting
2. Participant joins
3. Simulate key exchange failure (network issue)
4. Verify error message shown
5. Verify meeting join blocked or retry offered

### Test 3: Rekey on Join/Leave
1. Host and Participant 1 in meeting
2. Participant 2 joins
3. Verify rekey triggered (check logs)
4. Verify all participants receive new key
5. Send message - verify all can decrypt
6. Participant 1 leaves
7. Verify rekey triggered
8. Verify remaining participants can still decrypt

### Test 4: Browser Compatibility
1. Test on Chrome 94+ (full E2EE)
2. Test on Firefox (chat E2EE only)
3. Test on Safari (chat E2EE only)
4. Test on older Chrome (fallback to P-256)
5. Verify appropriate warnings shown
6. Verify unsupported browsers blocked if required

### Test 5: Performance
1. Join meeting with E2EE
2. Measure latency added by encryption
3. Verify <200ms added latency
4. Monitor CPU usage
5. Test on low-end device
6. Verify smooth performance

### Test 6: Error Handling
1. Corrupt encrypted message
2. Verify decryption fails gracefully
3. Verify error shown to user
4. Verify meeting continues (other messages work)
5. Test with wrong key
6. Verify appropriate error handling

### Test 7: Security Verification
1. Check server logs - verify no keys logged
2. Check database - verify only ciphertext stored
3. Attempt to decrypt server-stored message without key
4. Verify decryption fails
5. Test with network proxy - verify keys not in plaintext
6. Verify keys destroyed on page refresh

### Test 8: Multiple Participants
1. Host + 3 participants
2. Verify all receive keys
3. Send messages from each participant
4. Verify all can decrypt all messages
5. Participant leaves
6. Verify rekey and remaining participants can decrypt

### Test 9: Host Transfer
1. Host creates meeting
2. Multiple participants join
3. Host transfers host role
4. Verify new host can rekey
5. Verify all participants receive new keys
6. Verify meeting continues normally

### Test 10: Time-Based Rekey
1. Host creates meeting
2. Wait for time threshold (or modify code to use shorter interval)
3. Verify rekey triggered
4. Verify all participants receive new keys
5. Verify old messages still decrypt (if using backward compatibility)
6. Verify new messages use new key

## Browser-Specific Tests

### Chrome/Edge (Full E2EE)
- [ ] Media encryption works
- [ ] Chat encryption works
- [ ] Insertable Streams active
- [ ] Performance acceptable

### Firefox (Chat E2EE Only)
- [ ] Chat encryption works
- [ ] Warning shown about media E2EE
- [ ] Meeting join allowed
- [ ] Media works (unencrypted)

### Safari (Chat E2EE Only)
- [ ] Chat encryption works
- [ ] Warning shown about media E2EE
- [ ] Meeting join allowed
- [ ] Media works (unencrypted)

### Mobile Browsers
- [ ] Chrome Android - full E2EE
- [ ] Safari iOS - chat E2EE only
- [ ] Performance acceptable
- [ ] UI responsive

## Security Tests

### Key Security
- [ ] Keys never sent to server unencrypted
- [ ] Keys never stored in database
- [ ] Keys destroyed on page unload
- [ ] Keys not accessible via console
- [ ] Memory cleared after cleanup

### Message Security
- [ ] Server stores only ciphertext
- [ ] Decryption requires correct key
- [ ] AAD prevents tampering
- [ ] Replay attacks prevented

### Key Exchange Security
- [ ] Public keys sent via authenticated channel
- [ ] Wrapped keys require shared secret
- [ ] MITM attacks prevented
- [ ] Key exchange failures handled securely

## Performance Benchmarks

### Latency
- [ ] Encryption adds <200ms latency
- [ ] Decryption adds <200ms latency
- [ ] Key exchange completes <2s
- [ ] Rekey completes <3s

### CPU Usage
- [ ] Encryption uses <10% CPU (idle)
- [ ] Decryption uses <10% CPU (idle)
- [ ] Key exchange uses <20% CPU (peak)
- [ ] Acceptable on low-end devices

### Memory Usage
- [ ] Keys use <1MB memory
- [ ] No memory leaks
- [ ] Memory freed on cleanup

## Regression Tests

### Backward Compatibility
- [ ] Old encrypted messages can decrypt (if backward compatible)
- [ ] New clients work with old keys (if applicable)
- [ ] Graceful degradation for unsupported features

### Integration with Existing Features
- [ ] Screen sharing works with E2EE
- [ ] Recording works (if applicable)
- [ ] Chat history loads encrypted messages
- [ ] Meeting history shows encrypted status

---

**Test Environment**: Chrome 120+, Edge 120+, Firefox 121+, Safari 17+  
**Test Frequency**: Before each release  
**Automation**: Unit tests automated, integration tests manual for now


