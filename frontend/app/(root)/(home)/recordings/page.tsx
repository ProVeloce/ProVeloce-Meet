'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Play, Calendar, Clock } from 'lucide-react';
import { recordingApi, Recording } from '@/lib/recording-api';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { generateBreadcrumbSchema, generateVideoObjectSchema } from '@/lib/seo-utils';

const RecordingsPage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!isLoaded || !user?.id) return;

      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const hostRecordings = await recordingApi.getHostRecordings(user.id, token);
        setRecordings(hostRecordings);
      } catch (error: any) {
        console.error('Error fetching recordings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recordings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
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
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://proveloce-meet.vercel.app';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Recordings', url: `${baseUrl}/recordings` },
  ]);

  return (
    <>
      <SEOHead
        title="Meeting Recordings - Host Dashboard"
        description="View and manage your meeting recordings. Access secure video recordings of your hosted meetings with detailed analytics and playback controls."
        keywords={['meeting recordings', 'video recordings', 'host dashboard', 'meeting playback']}
        canonicalUrl={`${baseUrl}/recordings`}
        noindex={true} // Private recordings should not be indexed
        structuredData={breadcrumbSchema}
      />
      <section className="flex size-full flex-col gap-10 text-white p-6" role="main" aria-label="Meeting recordings">
        <h1 className="text-3xl font-bold">Recordings</h1>

      {recordings.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-lg">No recordings available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording) => (
            <div
              key={recording.meetingId}
              className="bg-dark-1 rounded-lg p-6 border border-dark-3 hover:border-blue-1 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2 truncate">{recording.title}</h3>
              
              <div className="flex flex-col gap-2 mb-4 text-sm text-gray-400">
                {recording.startTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(recording.startTime).toLocaleDateString()}</span>
                  </div>
                )}
                {recording.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(recording.duration)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  if (recording.recordingUrl) {
                    window.open(recording.recordingUrl, '_blank');
                  } else {
                    toast({
                      title: 'Error',
                      description: 'Recording URL not available',
                      variant: 'destructive',
                    });
                  }
                }}
                className="w-full bg-blue-1 hover:bg-blue-2"
                disabled={!recording.recordingUrl}
              >
                <Play className="h-4 w-4 mr-2" />
                View Recording
              </Button>
            </div>
          ))}
        </div>
      )}
      </section>
    </>
  );
};

export default RecordingsPage;
