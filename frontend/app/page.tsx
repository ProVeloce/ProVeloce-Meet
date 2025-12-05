'use client';

import { useUser } from '@clerk/nextjs';
import LandingIntro from '@/components/LandingIntro';
import Loader from '@/components/Loader';

// This is the public landing page
// Authenticated users will see this too, but they can navigate using the sidebar
// The (root)/(home) layout provides the dashboard experience for authenticated users
export default function RootPage() {
  const { isLoaded, isSignedIn } = useUser();

  // Show loader while checking auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <Loader />
      </div>
    );
  }

  // If signed in, redirect to dashboard
  if (isSignedIn) {
    // Use window.location for a full page redirect to the dashboard
    if (typeof window !== 'undefined') {
      window.location.href = '/upcoming';
    }
    return null;
  }

  // Show landing intro for unauthenticated users
  return <LandingIntro />;
}
