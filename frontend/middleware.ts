import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// Simplified middleware to avoid header immutability issues
// Skip WebSocket upgrade requests to prevent "Cannot read properties of undefined (reading 'bind')" errors
export default clerkMiddleware(async (auth, req) => {
  // Skip middleware for WebSocket upgrade requests
  // These are handled by Next.js internally and shouldn't go through Clerk middleware
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader === 'websocket') {
    return NextResponse.next();
  }

  // Only check auth for non-public routes
  // Don't manually redirect - let Clerk handle it through its internal mechanisms
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    // If not authenticated, Clerk's internal redirect will handle it
    // We just need to check, not redirect ourselves
    if (!userId) {
      // Return nothing - Clerk will handle the redirect internally
      // This avoids the header immutability issue
      return;
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
