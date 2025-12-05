'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Users, LayoutGrid, Copy, Link2, MessageSquare, Clock, MoreVertical, X } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';

import Loader from './Loader';
import EndCallButton from './EndCallButton';
import MeetingChat from './MeetingChat';
import { cn } from '@/lib/utils';
import { meetingApi, Meeting } from '@/lib/meeting-api';
import { participantApi } from '@/lib/participant-api';
import { useToast } from './ui/use-toast';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const call = useCall();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [hasTrackedJoin, setHasTrackedJoin] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState<number>(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();
  const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Fetch meeting data and track join
  useEffect(() => {
    const fetchMeetingAndTrackJoin = async () => {
      if (!call?.id || !user?.id || callingState !== CallingState.JOINED) return;

      try {
        const token = await getToken({ template: "meet" });
        if (!token) return;

        const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;
        const fetchedMeeting = await meetingApi.getMeetingById(meetingId, token);
        setMeeting(fetchedMeeting);

        if (!hasTrackedJoin) {
          try {
            await participantApi.joinMeeting(meetingId, token);
            setHasTrackedJoin(true);
          } catch (error) {
            console.error('Error tracking join:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching meeting:', error);
      }
    };

    fetchMeetingAndTrackJoin();
  }, [call?.id, user?.id, params.id, getToken, callingState, hasTrackedJoin]);

  // Track leave when component unmounts
  useEffect(() => {
    return () => {
      const trackLeave = async () => {
        if (!hasTrackedJoin || !call?.id || !user?.id) return;

        try {
          const token = await getToken({ template: "meet" });
          if (!token) return;
          const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;
          await participantApi.leaveMeeting(meetingId, token);
        } catch (error) {
          console.error('Error tracking leave:', error);
        }
      };

      trackLeave();
    };
  }, [hasTrackedJoin, call?.id, user?.id, params.id, getToken]);

  // Meeting duration timer
  useEffect(() => {
    if (!meeting?.startTime || meeting?.endTime) {
      setMeetingDuration(0);
      return;
    }

    const startTime = new Date(meeting.startTime).getTime();
    const updateDuration = () => {
      const now = Date.now();
      setMeetingDuration(Math.floor((now - startTime) / 1000));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [meeting?.startTime, meeting?.endTime]);

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isHost = meeting?.hostId === user?.id;

  const getMeetingLink = () => {
    if (!meeting) return '';
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    return `${baseUrl}/meeting/${meeting.streamCallId}${isPersonalRoom ? '?personal=true' : ''}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: `${label} has been copied to clipboard`,
    });
    setShowMoreMenu(false);
  };

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-meeting">
      {/* Top Bar - Meeting Info */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3">
        {/* Left - Meeting Title & Duration */}
        <div className="flex items-center gap-3">
          {meeting?.title && (
            <span className="text-white text-sm font-medium truncate max-w-[200px]">
              {meeting.title}
            </span>
          )}
          {meetingDuration > 0 && (
            <span className="text-white/70 text-sm font-mono">
              {formatDuration(meetingDuration)}
            </span>
          )}
        </div>

        {/* Right - Quick Actions */}
        <div className="flex items-center gap-2">
          {isHost && meeting?.roomCode && (
            <button
              onClick={() => copyToClipboard(meeting.roomCode!, 'Room code')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-control-hover text-white text-sm transition-colors"
            >
              <span className="font-mono">{meeting.roomCode}</span>
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="h-full pt-14 pb-24 px-2">
        <div className="h-full max-w-6xl mx-auto">
          <CallLayout />
        </div>
      </div>

      {/* Side Panels */}
      {showParticipants && (
        <div className="fixed right-0 top-0 h-full w-80 bg-surface z-50 animate-slideUp">
          <div className="flex items-center justify-between p-4 border-b border-meeting-border">
            <h3 className="text-white font-medium">People</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="p-1 rounded hover:bg-control-hover text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      )}

      {showChat && meeting && (
        <div className="fixed right-0 top-0 h-full z-50 animate-slideUp">
          <MeetingChat
            meetingId={meeting.streamCallId}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Bottom Control Bar - Google Meet Style */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          {/* Main Controls */}
          <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-full px-4 py-2">
            <CallControls
              onLeave={async () => {
                if (hasTrackedJoin && meeting && user?.id) {
                  try {
                    const token = await getToken({ template: "meet" });
                    if (token) {
                      await participantApi.leaveMeeting(meeting.streamCallId, token);
                    }
                  } catch (error) {
                    console.error('Error tracking leave:', error);
                  }
                }
                router.push('/');
              }}
            />

            <div className="w-px h-8 bg-white/20 mx-2" />

            {/* Layout Toggle */}
            <button
              onClick={() => setLayout(layout === 'grid' ? 'speaker-left' : 'grid')}
              className="control-btn"
              title="Change layout"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* Participants */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={cn("control-btn", showParticipants && "bg-google-blue")}
              title="Show participants"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn("control-btn", showChat && "bg-google-blue")}
              title="Show chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="control-btn"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMoreMenu && (
                <div className="absolute bottom-14 right-0 w-56 bg-surface rounded-lg shadow-lg py-2 animate-fadeIn">
                  <button
                    onClick={() => copyToClipboard(getMeetingLink(), 'Meeting link')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-white hover:bg-control-hover transition-colors text-left"
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="text-sm">Copy meeting link</span>
                  </button>
                  {meeting?.roomCode && (
                    <button
                      onClick={() => copyToClipboard(meeting.roomCode!, 'Room code')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-white hover:bg-control-hover transition-colors text-left"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy room code</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* End Call */}
            {!isPersonalRoom && <EndCallButton />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
