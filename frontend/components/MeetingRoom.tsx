'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Users, LayoutList, Copy, Link as LinkIcon, MessageSquare, Clock } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { meetingAnimations } from '@/lib/animations';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import MeetingChat from './MeetingChat';
import ScreenShareButton from './ScreenShareButton';
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasTrackedJoin, setHasTrackedJoin] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState<number>(0); // Duration in seconds
  const { useCallCallingState } = useCallStateHooks();

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  // Fetch meeting data and track join
  useEffect(() => {
    const fetchMeetingAndTrackJoin = async () => {
      if (!call?.id || !user?.id || callingState !== CallingState.JOINED) return;

      try {
        const token = await getToken();
        if (!token) return;

        const meetingId = Array.isArray(params.id) ? params.id[0] : params.id;
        
        // Fetch meeting data
        const fetchedMeeting = await meetingApi.getMeetingById(meetingId, token);
        setMeeting(fetchedMeeting);
        
        // Track participant join (only once)
        if (!hasTrackedJoin) {
          try {
            await participantApi.joinMeeting(meetingId, token);
            setHasTrackedJoin(true);
          } catch (error) {
            console.error('Error tracking join:', error);
            // Continue even if tracking fails
          }
        }
      } catch (error) {
        console.error('Error fetching meeting:', error);
        // Silently fail - meeting data is optional
      }
    };

    fetchMeetingAndTrackJoin();
  }, [call?.id, user?.id, params.id, getToken, callingState, hasTrackedJoin]);

  // Track leave when component unmounts or user leaves
  useEffect(() => {
    return () => {
      const trackLeave = async () => {
        if (!hasTrackedJoin || !call?.id || !user?.id) return;
        
        try {
          const token = await getToken();
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

  // Countdown timer - update every second when meeting is active
  useEffect(() => {
    if (!meeting?.startTime || meeting?.endTime) {
      setMeetingDuration(0);
      return;
    }

    const startTime = new Date(meeting.startTime).getTime();
    const updateDuration = () => {
      const now = Date.now();
      const durationSeconds = Math.floor((now - startTime) / 1000);
      setMeetingDuration(durationSeconds);
    };

    updateDuration(); // Initial update
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [meeting?.startTime, meeting?.endTime]);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isHost = meeting?.hostId === user?.id;
  const getMeetingLink = () => {
    if (!meeting) return '';
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    return `${baseUrl}/meeting/${meeting.streamCallId}${isPersonalRoom ? '?personal=true' : ''}`;
  };
  const meetingLink = getMeetingLink();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied`,
      description: `${label} has been copied to clipboard`,
    });
    setShowShareMenu(false);
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
    <section className="relative h-screen w-full overflow-hidden pt-2 sm:pt-4 text-white">
      {/* Meeting Duration Timer */}
      {meeting?.startTime && !meeting?.endTime && meetingDuration > 0 && (
        <motion.div 
          className="absolute top-2 sm:top-4 left-2 sm:left-4 z-50 bg-dark-2/80 backdrop-blur-sm border border-dark-3 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            <span className="text-white text-xs sm:text-sm font-mono font-semibold">
              {formatDuration(meetingDuration)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Share menu for host */}
      {isHost && meeting && (
        <motion.div 
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Popover open={showShareMenu} onOpenChange={setShowShareMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-dark-2 border-dark-3 text-white hover:bg-dark-3 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
              >
                <LinkIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] sm:w-80 bg-dark-2 border-dark-3 text-white p-3 sm:p-4">
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Share Meeting</h3>
                
                {meeting.roomCode && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Room Code</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-dark-3 rounded text-center font-mono text-lg tracking-wider">
                        {meeting.roomCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-dark-3 border-dark-4"
                        onClick={() => copyToClipboard(meeting.roomCode!, 'Room Code')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {meetingLink && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Meeting Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={meetingLink}
                        className="flex-1 px-3 py-2 bg-dark-3 rounded text-sm truncate"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-dark-3 border-dark-4"
                        onClick={() => copyToClipboard(meetingLink, 'Meeting Link')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}

      <motion.div 
        className="relative flex size-full items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex size-full max-w-[1000px] items-center px-2 sm:px-4">
          <motion.div
            className="w-full h-full"
            {...meetingAnimations.videoTile}
          >
          <CallLayout />
          </motion.div>
        </div>
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              className="h-[calc(100vh-80px)] sm:h-[calc(100vh-86px)] ml-2 w-[280px] sm:w-[320px] z-30"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={meetingAnimations.panelSlide}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* video layout and call controls */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-center gap-2 sm:gap-3 md:gap-5 pb-2 sm:pb-4 px-2 sm:px-4 overflow-x-auto"
        initial="initial"
        animate="animate"
        variants={meetingAnimations.controls}
      >
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
        <CallControls 
          onLeave={async () => {
            // Track leave before navigating
            if (hasTrackedJoin && meeting && user?.id) {
              try {
                const token = await getToken();
                if (token) {
                  await participantApi.leaveMeeting(meeting.streamCallId, token);
                }
              } catch (error) {
                console.error('Error tracking leave:', error);
              }
            }
            router.push(`/`);
          }} 
        />

        <DropdownMenu>
          <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-xl sm:rounded-2xl bg-[#19232d] px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-[#4c535b] transition-colors">
                <LayoutList size={16} className="sm:w-5 sm:h-5 text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <ScreenShareButton />
          <button onClick={() => setShowParticipants((prev) => !prev)} className="flex-shrink-0">
            <div className="cursor-pointer rounded-xl sm:rounded-2xl bg-[#19232d] px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-[#4c535b] transition-colors">
              <Users size={16} className="sm:w-5 sm:h-5 text-white" />
          </div>
        </button>
          <button onClick={() => setShowChat((prev) => !prev)} className="flex-shrink-0">
            <div className="cursor-pointer rounded-xl sm:rounded-2xl bg-[#19232d] px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-[#4c535b] transition-colors">
              <MessageSquare size={16} className="sm:w-5 sm:h-5 text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {meeting && showChat && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={meetingAnimations.panelSlide}
            className="fixed right-0 top-0 h-full z-40"
          >
        <MeetingChat
          meetingId={meeting.streamCallId}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
          </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
};

export default MeetingRoom;
