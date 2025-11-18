'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser, useAuth } from '@clerk/nextjs';

import { apiClient } from '@/lib/api-client';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) throw new Error('Stream API key is missing');

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

        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user?.id,
            name: user?.username || user?.id,
            image: user?.imageUrl,
          },
          tokenProvider,
        });

        setVideoClient(client);
      } catch (error) {
        console.error('Error initializing Stream client:', error);
      }
    };

    initializeClient();
  }, [user, isLoaded, getToken]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
