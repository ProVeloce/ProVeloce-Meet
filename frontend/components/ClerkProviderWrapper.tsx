'use client';

import { ReactNode } from 'react';
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

  // Only use custom domain when:
  // 1. Not explicitly disabled
  // 2. Not on localhost (detected at runtime)
  // 3. In production environment
  const shouldUseCustomDomain = !disableClerkDomain && !isLocalhost && process.env.NODE_ENV === 'production';
  const clerkDomain = shouldUseCustomDomain
    ? (process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'clerk.meet.proveloce.com')
    : undefined;

  return (
    <ClerkProvider
      {...(clerkDomain ? { domain: clerkDomain } : {})}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}

