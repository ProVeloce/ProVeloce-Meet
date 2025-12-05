'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import LandingIntro from '@/components/LandingIntro';
import Loader from '@/components/Loader';

// Public landing page - redirects authenticated users to dashboard
export default function RootPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/upcoming');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loader while checking auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <Loader />
      </div>
    );
  }

  // If signed in, show nothing (redirect will happen)
  if (isSignedIn) {
    return null;
  }

  // Show landing intro for unauthenticated users
  return <LandingIntro />;
}
