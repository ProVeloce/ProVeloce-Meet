'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
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
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) {
      setError('Stream API key is missing. Please configure NEXT_PUBLIC_STREAM_API_KEY.');
      return;
    }

    const initializeClient = async () => {
      try {
        // Get Clerk session token with "meet" template to include correct audience claim
        const clerkToken = await getToken({ template: "meet" });
        
        if (!clerkToken) {
          console.warn('No Clerk token available, user might not be authenticated');
          return; // Don't initialize if no token
        }

        // Create token provider that fetches from backend
        // Track retry attempts to prevent infinite loops
        const MAX_RETRIES = 3;
        
        const tokenProvider = async () => {
          // Prevent infinite retry loops
          if (retryCountRef.current >= MAX_RETRIES) {
            const errorMessage = `Failed to fetch Stream token after ${MAX_RETRIES} attempts. Please refresh the page.`;
            console.error(errorMessage);
            setError(errorMessage);
            throw new Error(errorMessage);
          }

          try {
            retryCountRef.current++;
            
            // Get a fresh token each time with "meet" template
            const freshToken = await getToken({ template: "meet" });
            if (!freshToken) {
              throw new Error('Failed to get authentication token from Clerk');
            }

            const response = await apiClient.post<{ token: string }>(
              '/stream/token',
              {},
              freshToken
            );

            // Validate response
            if (!response || !response.token || typeof response.token !== 'string') {
              throw new Error('Invalid token response from backend');
            }

            // Reset retry count on success
            retryCountRef.current = 0;
            return response.token;
          } catch (error: any) {
            // Check if it's a 401 error (authentication issue)
            if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
              const errorMessage = 'Authentication failed. Please sign in again.';
              console.error('Authentication error:', {
                message: error?.message,
                retryCount: retryCountRef.current,
              });
              setError(errorMessage);
              retryCountRef.current = 0; // Reset on auth error to allow retry after re-auth
              throw new Error(errorMessage);
            }

            // For other errors, log and throw
            console.error('Error fetching Stream token:', {
              message: error?.message,
              stack: error?.stack,
              retryCount: retryCountRef.current,
              maxRetries: MAX_RETRIES,
            });

            // If we've exhausted retries, set error state
            if (retryCountRef.current >= MAX_RETRIES) {
              const errorMessage = `Failed to fetch Stream token: ${error?.message || 'Unknown error'}. Please check your connection and try refreshing the page.`;
              setError(errorMessage);
              throw new Error(errorMessage);
            }

            // Otherwise, throw to allow retry (Stream SDK will retry)
            throw error;
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
        retryCountRef.current = 0; // Reset retry count when client is initialized
      } catch (err: any) {
        console.error('Error initializing Stream client:', err);
        setError(err?.message || 'Failed to initialize video client');
        retryCountRef.current = 0; // Reset retry count on error
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

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
