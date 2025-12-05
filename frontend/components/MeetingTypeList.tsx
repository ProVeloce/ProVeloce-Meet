'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Video, Plus, Calendar, Link2, UserPlus, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { meetingApi } from '@/lib/meeting-api';
import { useToast } from './ui/use-toast';

const MeetingTypeList = () => {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeetingLink, setCreatedMeetingLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Schedule form state
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const getDisplayName = () => {
    if (user?.firstName) {
      return user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName;
    }
    return user?.username || 'User';
  };

  const createInstantMeeting = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const token = await getToken({ template: "meet" });
      if (!token) throw new Error('No auth token');

      const meeting = await meetingApi.createMeeting({
        title: `${getDisplayName()}'s Meeting`,
        type: 'instant',
      }, token);

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      setCreatedMeetingLink(`${baseUrl}/meeting/${meeting.streamCallId}`);
      setShowNewMeetingMenu(false);
      setShowInstantModal(true);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to create meeting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createScheduledMeeting = async () => {
    if (!user || !scheduleDate || !scheduleTime) return;

    setIsCreating(true);
    try {
      const token = await getToken({ template: "meet" });
      if (!token) throw new Error('No auth token');

      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      const meeting = await meetingApi.createMeeting({
        title: scheduleTitle || `${getDisplayName()}'s Meeting`,
        type: 'scheduled',
        scheduledTime: scheduledDateTime.toISOString(),
      }, token);

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      setCreatedMeetingLink(`${baseUrl}/meeting/${meeting.streamCallId}`);
      setShowScheduleModal(false);
      setShowInstantModal(true);

      // Reset form
      setScheduleTitle('');
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinMeeting = () => {
    if (!joinCode.trim()) return;

    // Check if it's a full URL or just a code
    if (joinCode.includes('/meeting/')) {
      const meetingId = joinCode.split('/meeting/')[1]?.split('?')[0];
      if (meetingId) {
        router.push(`/meeting/${meetingId}`);
        return;
      }
    }

    // Treat as room code or meeting ID
    router.push(`/meeting/${joinCode.trim()}`);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(createdMeetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startMeeting = () => {
    const meetingId = createdMeetingLink.split('/meeting/')[1];
    if (meetingId) {
      router.push(`/meeting/${meetingId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Actions Row */}
      <div className="flex flex-wrap gap-4">
        {/* New Meeting Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
            className="flex items-center gap-2 bg-google-blue hover:bg-google-blue-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Video className="w-5 h-5" />
            New meeting
          </button>

          {showNewMeetingMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNewMeetingMenu(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-border-lighter py-2 z-50 animate-fadeIn">
                <button
                  onClick={createInstantMeeting}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary text-left transition-colors"
                >
                  <Link2 className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">Create a meeting for later</p>
                    <p className="text-sm text-text-secondary">Get a link to share</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMeetingMenu(false);
                    createInstantMeeting().then(() => {
                      if (createdMeetingLink) startMeeting();
                    });
                  }}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary text-left transition-colors"
                >
                  <Plus className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">Start an instant meeting</p>
                    <p className="text-sm text-text-secondary">Start meeting now</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMeetingMenu(false);
                    setShowScheduleModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary text-left transition-colors"
                >
                  <Calendar className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">Schedule in calendar</p>
                    <p className="text-sm text-text-secondary">Plan your meeting</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Join Meeting Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter a code or link"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
              className="w-64 px-4 py-3 border border-border-light rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
            />
          </div>
          <button
            onClick={joinMeeting}
            disabled={!joinCode.trim()}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              joinCode.trim()
                ? "text-google-blue hover:bg-google-blue-light"
                : "text-text-tertiary cursor-not-allowed"
            )}
          >
            Join
          </button>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-text-primary">Schedule a meeting</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 hover:bg-bg-tertiary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Meeting title (optional)
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder={`${getDisplayName()}'s Meeting`}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createScheduledMeeting}
                  disabled={!scheduleDate || !scheduleTime || isCreating}
                  className="px-6 py-2 bg-google-blue hover:bg-google-blue-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Created Modal */}
      {showInstantModal && createdMeetingLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-text-primary">Your meeting is ready</h2>
              <button
                onClick={() => {
                  setShowInstantModal(false);
                  setCreatedMeetingLink('');
                }}
                className="p-1 hover:bg-bg-tertiary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <p className="text-text-secondary mb-4">
              Share this link with others you want in the meeting
            </p>

            <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg mb-6">
              <input
                type="text"
                readOnly
                value={createdMeetingLink}
                className="flex-1 bg-transparent text-text-primary text-sm truncate outline-none"
              />
              <button
                onClick={copyMeetingLink}
                className="p-2 hover:bg-bg-hover rounded transition-colors"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-text-secondary" />
                )}
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowInstantModal(false);
                  setCreatedMeetingLink('');
                }}
                className="px-4 py-2 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={startMeeting}
                className="px-6 py-2 bg-google-blue hover:bg-google-blue-hover text-white rounded-lg font-medium transition-colors"
              >
                Join now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingTypeList;
