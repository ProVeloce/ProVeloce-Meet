'use client';

import { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { recordingApi } from '@/lib/recording-api';
import { meetingApi } from '@/lib/meeting-api';
import { participantApi } from '@/lib/participant-api';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const [isEnding, setIsEnding] = useState(false);

  if (!call)
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    if (isEnding) return;
    
    setIsEnding(true);
    try {
      const token = await getToken();
      const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;

      // End the call
      await call.endCall();

      // Track leave
      if (token && meetingId) {
        try {
          await participantApi.leaveMeeting(meetingId, token);
        } catch (error) {
          console.error('Error tracking leave:', error);
        }

        // Update meeting status to ended
        try {
          await meetingApi.updateMeetingStatus(meetingId, 'ended', token);
        } catch (error) {
          console.error('Error updating meeting status:', error);
        }

        // Try to get recording URL from Stream.io (if recording was enabled)
        // Note: In production, you'd set up a webhook to handle recording completion
        // For now, we'll check if there's a recording available
        try {
          // This would typically come from a webhook, but we can check call state
          // Stream.io recordings are handled via webhooks in production
          // For now, we'll just update the meeting status
        } catch (error) {
          console.error('Error handling recording:', error);
        }
      }

      router.push('/');
    } catch (error) {
      console.error('Error ending call:', error);
      setIsEnding(false);
    }
  };

  return (
    <Button 
      onClick={endCall} 
      className="bg-red-500 hover:bg-red-600"
      disabled={isEnding}
    >
      {isEnding ? 'Ending...' : 'End call for everyone'}
    </Button>
  );
};

export default EndCallButton;
