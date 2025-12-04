'use client';

import { ReactNode, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

interface ClerkProviderWrapperProps {
  children: ReactNode;
  appearance: any;
}

export default function ClerkProviderWrapper({ children, appearance }: ClerkProviderWrapperProps) {
  // Check at runtime if we're on localhost
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
  );

  // Check if domain should be explicitly disabled
  const disableClerkDomain = process.env.NEXT_PUBLIC_DISABLE_CLERK_DOMAIN === 'true';

  // Check if using production keys
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const isProductionKey = publishableKey.startsWith('pk_live_');

  // Only use custom domain when:
  // 1. Not explicitly disabled
  // 2. Not on localhost (detected at runtime)
  // 3. In production environment
  const shouldUseCustomDomain = !disableClerkDomain && !isLocalhost && process.env.NODE_ENV === 'production';
  const clerkDomain = shouldUseCustomDomain
    ? (process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'clerk.meet.proveloce.com')
    : undefined;

  // Warn if using production keys on localhost
  useEffect(() => {
    if (isLocalhost && isProductionKey && !disableClerkDomain) {
      console.warn(
        '⚠️ Clerk Production Keys on Localhost:\n' +
        'You are using production Clerk keys (pk_live_...) on localhost.\n' +
        'Production keys are restricted to the configured domain (meet.proveloce.com).\n\n' +
        'Solutions:\n' +
        '1. Use development keys (pk_test_...) for localhost development\n' +
        '2. Set NEXT_PUBLIC_DISABLE_CLERK_DOMAIN=true in your .env.local file\n' +
        '3. Configure Clerk dashboard to allow localhost as an allowed origin'
      );
    }
  }, [isLocalhost, isProductionKey, disableClerkDomain]);

  return (
    <ClerkProvider
      {...(clerkDomain ? { domain: clerkDomain } : {})}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}

