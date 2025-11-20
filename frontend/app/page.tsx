'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import LandingIntro from '@/components/LandingIntro';
import Loader from '@/components/Loader';

export default function RootPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we know the auth state and user is signed in
    if (isLoaded && isSignedIn) {
      router.push('/home');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loader only while checking auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-2">
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

