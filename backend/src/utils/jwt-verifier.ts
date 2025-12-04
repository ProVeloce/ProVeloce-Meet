import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Lazy-loaded Clerk domain and JWKS client
let _clerkDomain: string | null = null;
let _jwks: ReturnType<typeof jwksClient> | null = null;

// Extract Clerk domain from publishable key or use environment variable
function getClerkDomain(): string {
  if (_clerkDomain) {
    return _clerkDomain;
  }

  // Try to get from environment variable first
  if (process.env.CLERK_DOMAIN) {
    _clerkDomain = process.env.CLERK_DOMAIN.startsWith('http') 
      ? process.env.CLERK_DOMAIN 
      : `https://${process.env.CLERK_DOMAIN}`;
    return _clerkDomain;
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
        _clerkDomain = domain.startsWith('http') ? domain : `https://${domain}`;
        return _clerkDomain;
      }
    } catch (e) {
      console.warn('Could not extract Clerk domain from publishable key:', e);
    }
  }
  
  // No fallback for production - domain must be explicitly set
  throw new Error('CLERK_DOMAIN or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be set in environment variables');
}

// Get JWKS client (lazy-loaded)
function getJwksClient() {
  if (!_jwks) {
    const clerkDomain = getClerkDomain();
    const jwksUrl = `${clerkDomain}/.well-known/jwks.json`;
    
    _jwks = jwksClient({
      jwksUri: jwksUrl,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return _jwks;
}

// Get signing key from JWKS
function getKey(header: any, callback: any) {
  const jwks = getJwksClient();
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
    const clerkDomain = getClerkDomain();
    
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: clerkDomain,
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

