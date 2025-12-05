'use client';

import { memo, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video } from 'lucide-react';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { Meeting } from '@/lib/meeting-api';

interface CallListProps {
  type: 'ended' | 'upcoming' | 'recordings';
}

const CallList = memo(function CallList({ type }: CallListProps) {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();

  const calls = useMemo(() => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return callRecordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  }, [type, endedCalls, upcomingCalls, callRecordings]);

  const getNoCallsMessage = useCallback(() => {
    switch (type) {
      case 'ended':
        return 'No previous calls';
      case 'upcoming':
        return 'No upcoming calls';
      case 'recordings':
        return 'No recordings';
      default:
        return '';
    }
  }, [type]);

  const getIcon = useCallback(() => {
    switch (type) {
      case 'ended':
        return '/icons/previous.svg';
      case 'upcoming':
        return '/icons/upcoming.svg';
      case 'recordings':
        return '/icons/recordings.svg';
      default:
        return '/icons/upcoming.svg';
    }
  }, [type]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  const noCallsMessage = getNoCallsMessage();

  if (!calls || calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
          {type === 'upcoming' ? (
            <Calendar className="w-8 h-8 text-text-tertiary" />
          ) : type === 'recordings' ? (
            <Video className="w-8 h-8 text-text-tertiary" />
          ) : (
            <Clock className="w-8 h-8 text-text-tertiary" />
          )}
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-1">{noCallsMessage}</h2>
        <p className="text-sm text-text-secondary">
          {type === 'upcoming' ? 'Schedule a meeting to see it here' :
            type === 'recordings' ? 'Recorded meetings will appear here' :
              'Your past meetings will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {calls.map((meeting: Meeting) => (
        <MeetingCard
          key={meeting._id || meeting.streamCallId}
          icon={getIcon()}
          title={meeting.title || 'Untitled Meeting'}
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
              : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/meeting/${meeting.streamCallId}`
          }
          buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
          buttonText={type === 'recordings' ? 'Play' : 'Start'}
          handleClick={
            type === 'recordings' && meeting.recordingUrl
              ? () => window.open(meeting.recordingUrl!, '_blank')
              : () => router.push(`/meeting/${meeting.streamCallId}`)
          }
        />
      ))}
    </div>
  );
});

export default CallList;
