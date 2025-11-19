/* eslint-disable camelcase */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser, useAuth } from '@clerk/nextjs';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import RoomCodeInput from './RoomCodeInput';
import { cn } from '@/lib/utils';
// Room code utilities are available but not currently used in this component

const initialValues = {
  dateTime: new Date(),
  description: '',
  link: '',
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const [roomCode, setRoomCode] = useState<string>('');
  const [isRoomCodeValid, setIsRoomCodeValid] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');
      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || 'Instant Meeting';
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });
      setCallDetail(call);
      if (!values.description) {
        router.push(`/meeting/${call.id}`);
      }
      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  if (!client || !user) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Meeting options">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="border-google-blue border-2"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        handleClick={() => router.push('/recordings')}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-text-primary">
              Add a description
            </label>
            <Textarea
              className="border border-light-4 bg-white text-text-primary placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-0 min-h-[100px]"
              placeholder="Enter meeting description..."
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-sm font-medium text-text-primary">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded-md border border-light-4 bg-white text-text-primary p-3 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-0"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setRoomCode('');
          setIsRoomCodeValid(false);
        }}
        title="Join Meeting"
        className="text-center"
        buttonText="Join Meeting"
        buttonDisabled={!isRoomCodeValid}
        handleClick={async () => {
          try {
            if (!isRoomCodeValid || !roomCode) {
              toast({ 
                title: 'Invalid room code',
                description: 'Please enter a valid room code in XXX-XXXX-XXX format'
              });
              return;
            }

            const token = await getToken();
            if (!token) {
              toast({ title: 'Authentication required' });
              return;
            }

            const { meetingApi } = await import('@/lib/meeting-api');
            try {
              // Try to find meeting by room code
              const meeting = await meetingApi.getMeetingById(roomCode, token);
              
              // Check if meeting is still active
              if (meeting.status === 'ended' || meeting.status === 'cancelled') {
                toast({ 
                  title: 'Meeting has ended',
                  description: 'This meeting is no longer active'
                });
                return;
              }

              // Navigate to meeting
              router.push(`/meeting/${meeting.streamCallId}`);
              setMeetingState(undefined);
              setRoomCode('');
            } catch (error: any) {
              if (error.message?.includes('404') || error.message?.includes('not found')) {
                toast({ 
                  title: 'Meeting not found',
                  description: 'Please check the room code and try again'
                });
              } else {
                toast({ 
                  title: 'Failed to join meeting',
                  description: error.message || 'An error occurred'
                });
              }
            }
          } catch (error: any) {
            console.error('Error joining meeting:', error);
            toast({ 
              title: 'Failed to join meeting',
              description: error.message || 'An error occurred'
            });
          }
        }}
      >
        <div className="flex flex-col gap-2.5">
          <RoomCodeInput
            value={roomCode}
            onChange={(value) => setRoomCode(value)}
            placeholder="XXX-XXXX-XXX"
            className="border border-light-4 bg-white text-text-primary placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-0"
            onValidationChange={setIsRoomCodeValid}
          />
          <p className={cn("text-sm", {
            "text-google-green": isRoomCodeValid,
            "text-text-tertiary": !isRoomCodeValid,
          })}>
            {isRoomCodeValid 
              ? '✓ Valid room code format' 
              : 'Enter room code in XXX-XXXX-XXX format'}
          </p>
        </div>
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      />
    </section>
  );
};

export default MeetingTypeList;
