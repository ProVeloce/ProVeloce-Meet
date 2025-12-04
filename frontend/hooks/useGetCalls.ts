import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { meetingApi, Meeting } from '@/lib/meeting-api';

export const useGetCalls = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);

      try {
        const token = await getToken({ template: "meet" });
        if (!token) return;

        const allMeetings = await meetingApi.getMeetings(token);
        setMeetings(allMeetings);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, [user?.id, getToken]);

  const now = new Date();

  const endedCalls = meetings?.filter((meeting) => {
    if (meeting.status === 'ended' || meeting.status === 'cancelled') return true;
    if (meeting.endTime) return new Date(meeting.endTime) < now;
    if (meeting.scheduledTime && meeting.status === 'scheduled') {
      return new Date(meeting.scheduledTime) < now;
    }
    return false;
  }) || [];

  const upcomingCalls = meetings?.filter((meeting) => {
    if (meeting.status === 'scheduled' && meeting.scheduledTime) {
      return new Date(meeting.scheduledTime) > now;
    }
    return false;
  }) || [];

  // For recordings, filter ended meetings that have recording URLs
  const callRecordings = meetings?.filter((meeting) => {
    return (meeting.status === 'ended' || meeting.endTime) && meeting.recordingUrl;
  }) || [];

  return { endedCalls, upcomingCalls, callRecordings, isLoading };
};
