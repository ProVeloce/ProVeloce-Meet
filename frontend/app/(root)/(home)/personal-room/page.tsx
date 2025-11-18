"use client";

import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { meetingApi } from "@/lib/meeting-api";
import Loader from "@/components/Loader";

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  if (!isLoaded || !user) {
    return <Loader />;
  }

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : (user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User');

  const startRoom = async () => {
    if (!client || !user) return;

    setIsStarting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Authentication required",
          variant: "destructive",
        });
        setIsStarting(false);
        return;
      }

      // Create meeting in database when starting
      const newMeeting = await meetingApi.createMeeting({
        title: `${displayName}'s Meeting Room`,
        type: 'personal',
      }, token);

      // Create Stream call
      const newCall = client.call("default", newMeeting.streamCallId);

      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });

      // Navigate to meeting room
      router.push(`/meeting/${newMeeting.streamCallId}?personal=true`);
    } catch (error: any) {
      console.error('Error starting meeting:', error);
      toast({
        title: "Failed to start meeting",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        <Table title="Topic" description={`${displayName}'s Meeting Room`} />
        <Table title="Room Code" description="Will be generated when you start the meeting" />
        <Table title="Invite Link" description="Will be available after starting the meeting" />
      </div>
      <div className="flex gap-5">
        <Button 
          className="bg-blue-1" 
          onClick={startRoom}
          disabled={isStarting}
        >
          {isStarting ? "Starting..." : "Start Meeting"}
        </Button>
        <p className="text-sm text-gray-400 self-center">
          Click &quot;Start Meeting&quot; to create your personal room and get the room code and invite link.
        </p>
      </div>
    </section>
  );
};

export default PersonalRoom;
