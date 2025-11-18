import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Extract Clerk domain from publishable key or use environment variable
function getClerkDomain(): string {
  // Try to get from environment variable first
  if (process.env.CLERK_DOMAIN) {
    return process.env.CLERK_DOMAIN.startsWith('http') 
      ? process.env.CLERK_DOMAIN 
      : `https://${process.env.CLERK_DOMAIN}`;
  }
  
  // Extract from publishable key if available
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  if (publishableKey && publishableKey.startsWith('pk_')) {
    try {
      const parts = publishableKey.split('_');
      if (parts.length >= 3) {
        const decoded = Buffer.from(parts[2], 'base64').toString().replace(/\0/g, '').trim();
        // Remove any trailing null characters or special chars
        const domain = decoded.split('\0')[0].trim();
        return domain.startsWith('http') ? domain : `https://${domain}`;
      }
    } catch (e) {
      console.warn('Could not extract Clerk domain from publishable key:', e);
    }
  }
  
  // Default fallback - extracted from your publishable key
  return 'https://profound-ant-81.clerk.accounts.dev';
}

const CLERK_DOMAIN = getClerkDomain();
const CLERK_JWKS_URL = `${CLERK_DOMAIN}/.well-known/jwks.json`;
const CLERK_ISSUER = CLERK_DOMAIN;

// Create JWKS client for Clerk
const jwks = jwksClient({
  jwksUri: CLERK_JWKS_URL,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Get signing key from JWKS
function getKey(header: any, callback: any) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Verify Clerk JWT token using jsonwebtoken
export function verifyClerkToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: CLERK_ISSUER,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

