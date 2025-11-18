'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Calendar, Clock, Users, MessageSquare, Video } from 'lucide-react';
import { meetingHistoryApi, MeetingHistory } from '@/lib/meeting-history-api';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

const HistoryPage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [history, setHistory] = useState<MeetingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !user?.id) return;

      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const userHistory = await meetingHistoryApi.getUserHistory(user.id, token);
        setHistory(userHistory);
      } catch (error: any) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meeting history',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id, isLoaded, getToken, toast]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white p-6">
      <h1 className="text-3xl font-bold">Meeting History</h1>

      {history.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-lg">No meeting history available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.meetingId}
              className="bg-dark-1 rounded-lg p-6 border border-dark-3 hover:border-blue-1 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {item.meeting?.title || 'Meeting'}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {item.participation.joinedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.participation.joinedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {item.participation.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(item.participation.duration)}</span>
                      </div>
                    )}
                    {item.chatMessages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{item.chatMessages.length} messages</span>
                      </div>
                    )}
                    {item.meeting?.recordingUrl && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Recording available</span>
                      </div>
                    )}
                  </div>
                </div>
                {item.participation.isHost && (
                  <span className="px-2 py-1 bg-blue-1 text-white text-xs rounded">Host</span>
                )}
              </div>

              {item.chatMessages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-3">
                  <h4 className="text-sm font-semibold mb-2 text-gray-400">Chat Messages</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {item.chatMessages.slice(-5).map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-blue-400 font-semibold">{msg.userName}:</span>
                        <span className="text-gray-300 ml-2">{msg.message}</span>
                      </div>
                    ))}
                    {item.chatMessages.length > 5 && (
                      <p className="text-xs text-gray-500">
                        +{item.chatMessages.length - 5} more messages
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {item.meeting?.recordingUrl && item.participation.isHost && (
                  <Button
                    onClick={() => window.open(item.meeting!.recordingUrl, '_blank')}
                    variant="outline"
                    className="bg-dark-3 border-dark-4"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    View Recording
                  </Button>
                )}
                <Button
                  onClick={() => router.push(`/meeting/${item.meetingId}`)}
                  variant="outline"
                  className="bg-dark-3 border-dark-4"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HistoryPage;

