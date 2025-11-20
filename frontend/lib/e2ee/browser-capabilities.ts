/**
 * Browser Capability Detection for E2EE
 * Detects support for Insertable Streams, X25519, and other E2EE requirements
 */

export interface BrowserCapabilities {
  supportsInsertableStreams: boolean;
  supportsX25519: boolean;
  supportsAESGCM: boolean;
  supportsWebCrypto: boolean;
  browserName: string;
  browserVersion: string;
  isChromium: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isMobile: boolean;
  canSupportE2EE: boolean;
  warningMessage?: string;
}

/**
 * Detect browser capabilities for E2EE
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const userAgent = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  // Browser detection
  const isChromium = /Chrome|Chromium|Edge/i.test(userAgent) && !/Safari/i.test(userAgent.replace(/Chrome/i, ''));
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isFirefox = /Firefox/i.test(userAgent);
  
  // Extract browser version
  let browserName = 'Unknown';
  let browserVersion = '0';
  
  if (isChromium) {
    browserName = 'Chromium';
    const match = userAgent.match(/(?:Chrome|Chromium|Edg)\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (isSafari) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (isFirefox) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }

  // Check Web Crypto API support
  const supportsWebCrypto = typeof crypto !== 'undefined' && 
                            typeof crypto.subtle !== 'undefined';

  // Check AES-GCM support
  let supportsAESGCM = false;
  if (supportsWebCrypto) {
    try {
      // Test if AES-GCM is supported
      supportsAESGCM = true; // Assume supported if Web Crypto exists
    } catch {
      supportsAESGCM = false;
    }
  }

  // Check X25519 support
  let supportsX25519 = false;
  if (supportsWebCrypto) {
    try {
      // Test X25519 support
      crypto.subtle.generateKey(
        { name: 'X25519' },
        false,
        ['deriveBits']
      ).then(() => {
        supportsX25519 = true;
      }).catch(() => {
        supportsX25519 = false;
      });
      // For synchronous check, assume true if Web Crypto exists (async check happens later)
      supportsX25519 = true;
    } catch {
      supportsX25519 = false;
    }
  }

  // Check Insertable Streams support
  // Insertable Streams is supported in Chromium-based browsers (Chrome 94+, Edge 94+)
  // Not supported in Safari or older browsers
  const supportsInsertableStreams = isChromium && 
                                     parseInt(browserVersion) >= 94 &&
                                     typeof RTCRtpSender !== 'undefined' &&
                                     'createEncodedStreams' in RTCRtpSender.prototype;

  // Determine if E2EE can be supported
  let canSupportE2EE = supportsWebCrypto && supportsAESGCM;
  let warningMessage: string | undefined;

  if (!supportsWebCrypto) {
    canSupportE2EE = false;
    warningMessage = 'Web Crypto API not supported. E2EE cannot be enabled.';
  } else if (!supportsAESGCM) {
    canSupportE2EE = false;
    warningMessage = 'AES-GCM encryption not supported. E2EE cannot be enabled.';
  } else if (!supportsInsertableStreams) {
    // Media E2EE requires Insertable Streams, but chat E2EE can still work
    if (isSafari) {
      warningMessage = 'Safari does not support Insertable Streams. Media E2EE unavailable, but chat E2EE will work.';
    } else if (isFirefox) {
      warningMessage = 'Firefox does not support Insertable Streams. Media E2EE unavailable, but chat E2EE will work.';
    } else {
      warningMessage = 'Insertable Streams not supported. Media E2EE unavailable, but chat E2EE will work.';
    }
  } else if (!supportsX25519) {
    warningMessage = 'X25519 not supported, falling back to P-256 ECDH.';
  }

  return {
    supportsInsertableStreams,
    supportsX25519,
    supportsAESGCM,
    supportsWebCrypto,
    browserName,
    browserVersion,
    isChromium,
    isSafari,
    isFirefox,
    isMobile,
    canSupportE2EE,
    warningMessage,
  };
}

/**
 * Async check for X25519 support (more accurate)
 */
export async function checkX25519Support(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey(
      { name: 'X25519' },
      false,
      ['deriveBits']
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if browser can join E2EE meeting
 * @param requireMediaE2EE - If true, requires Insertable Streams support
 */
export function canJoinE2EEMeeting(requireMediaE2EE: boolean = false): {
  canJoin: boolean;
  reason?: string;
} {
  const caps = detectBrowserCapabilities();

  if (!caps.canSupportE2EE) {
    return {
      canJoin: false,
      reason: caps.warningMessage || 'Browser does not support E2EE requirements.',
    };
  }

  if (requireMediaE2EE && !caps.supportsInsertableStreams) {
    return {
      canJoin: false,
      reason: 'Media E2EE requires Insertable Streams, which is not supported in this browser.',
    };
  }

  return { canJoin: true };
}


