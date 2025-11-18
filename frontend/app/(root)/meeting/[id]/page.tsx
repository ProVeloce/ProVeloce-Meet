'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { StreamCall, StreamTheme, useStreamVideoClient, Call, CallingState, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import { participantApi } from '@/lib/participant-api';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const MeetingPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const { call: meeting, isCallLoading } = useGetCallById(id);
  const client = useStreamVideoClient();
  const [streamCall, setStreamCall] = useState<Call | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTrackedJoin, setHasTrackedJoin] = useState(false);

  // Create Stream.io Call object from meeting data
  useEffect(() => {
    if (!client || !meeting || !id) return;

    const meetingId = Array.isArray(id) ? id[0] : id;
    const call = client.call('default', meetingId);

    // Get or create the call
    call.getOrCreate()
      .then(() => {
        setStreamCall(call);
        setError(null);
      })
      .catch((err) => {
        console.error('Error creating Stream call:', err);
        setError('Failed to initialize meeting. Please try again.');
      });
  }, [client, meeting, id]);

  // Track leave when component unmounts
  useEffect(() => {
    return () => {
      const trackLeave = async () => {
        if (!hasTrackedJoin || !id || !user?.id) return;
        
        try {
          const token = await getToken();
          if (!token) return;

          const meetingId = Array.isArray(id) ? id[0] : id;
          await participantApi.leaveMeeting(meetingId, token);
        } catch (error) {
          console.error('Error tracking leave on unmount:', error);
        }
      };
      
      trackLeave();
    };
  }, [hasTrackedJoin, id, user?.id, getToken]);

  if (!isLoaded || isCallLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert title="Meeting Not Found" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert title={error} />
      </div>
    );
  }

  if (!streamCall) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="h-screen w-full">
      <StreamCall call={streamCall}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;
