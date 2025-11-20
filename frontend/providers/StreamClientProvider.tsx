'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser, useAuth } from '@clerk/nextjs';

import { apiClient } from '@/lib/api-client';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Validate Stream API key
if (typeof window !== 'undefined' && !API_KEY) {
  console.error('NEXT_PUBLIC_STREAM_API_KEY is not set. Video features will not work.');
}

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    // Only initialize if user is loaded and authenticated
    if (!isLoaded) return; // Still loading auth state
    if (!user) {
      // User is not authenticated - don't initialize Stream, just render children
      setVideoClient(undefined);
      return;
    }
    
    if (!API_KEY) {
      setError('Stream API key is missing. Please configure NEXT_PUBLIC_STREAM_API_KEY.');
      return;
    }

    const initializeClient = async () => {
      try {
        // Get Clerk session token - this returns a JWT that can be verified by the backend
        // getToken() without options returns the default session token
        const clerkToken = await getToken();
        
        if (!clerkToken) {
          console.warn('No Clerk token available, user might not be authenticated');
          return; // Don't initialize if no token
        }

        // Create token provider that fetches from backend
        const tokenProvider = async () => {
          try {
            // Get a fresh token each time
            const freshToken = await getToken();
            if (!freshToken) {
              throw new Error('Failed to get authentication token');
            }

            const response = await apiClient.post<{ token: string }>(
              '/stream/token',
              {},
              freshToken
            );
            return response.token;
          } catch (error: any) {
            console.error('Error fetching Stream token:', {
              message: error?.message,
              stack: error?.stack,
            });
            // Provide more helpful error message
            const errorMessage = error?.message || 'Failed to fetch Stream token';
            throw new Error(
              `Token provider error: ${errorMessage}. ` +
              `Make sure the backend server is running and accessible at ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}.`
            );
          }
        };

        // Get user's full name (firstName + lastName or firstName only)
        const getUserDisplayName = () => {
          if (user?.firstName) {
            return user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.firstName;
          }
          return user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
        };

        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user?.id,
            name: getUserDisplayName(),
            image: user?.imageUrl,
          },
          tokenProvider,
        });

        setVideoClient(client);
        setError(null);
      } catch (err: any) {
        console.error('Error initializing Stream client:', err);
        setError(err?.message || 'Failed to initialize video client');
      }
    };

    initializeClient();
  }, [user, isLoaded, getToken]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-sm text-gray-400">Please check your configuration and try again.</p>
        </div>
      </div>
    );
  }

  // If auth is still loading or user is not authenticated, render children immediately
  // Don't block rendering with a loader - let the auth pages show immediately
  if (!isLoaded || !user || !videoClient) {
    return <>{children}</>;
  }

  // User is authenticated and videoClient is ready
  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
