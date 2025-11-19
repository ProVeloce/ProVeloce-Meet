'use client';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useRouter } from 'next/navigation';
import { Meeting } from '@/lib/meeting-api';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        // For recordings, use meetings that have recordingUrl
        return callRecordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Meeting) => (
          <MeetingCard
            key={meeting._id || meeting.streamCallId}
            icon={
              type === 'ended'
                ? '/icons/previous.svg'
                : type === 'upcoming'
                  ? '/icons/upcoming.svg'
                  : '/icons/recordings.svg'
            }
            title={meeting.title || 'No Description'}
            date={
              meeting.startTime
                ? new Date(meeting.startTime).toLocaleString()
                : meeting.scheduledTime
                  ? new Date(meeting.scheduledTime).toLocaleString()
                  : meeting.createdAt
                    ? new Date(meeting.createdAt).toLocaleString()
                    : 'No date'
            }
            isPreviousMeeting={type === 'ended'}
            link={
              type === 'recordings' && meeting.recordingUrl
                ? meeting.recordingUrl
                : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.streamCallId}`
            }
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Play' : 'Start'}
            handleClick={
              type === 'recordings' && meeting.recordingUrl
                ? () => {
                    if (meeting.recordingUrl) {
                      window.open(meeting.recordingUrl, '_blank');
                    }
                  }
                : () => router.push(`/meeting/${meeting.streamCallId}`)
            }
          />
        ))
      ) : (
        <h1 className="text-xl sm:text-2xl font-bold text-black">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
