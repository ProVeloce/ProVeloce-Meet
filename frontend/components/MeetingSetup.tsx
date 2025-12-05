'use client';
import { useEffect, useState, ErrorInfo, Component, ReactNode } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { Mic, MicOff, Video, VideoOff, Settings } from 'lucide-react';

import Alert from './Alert';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Error boundary for VideoPreview
class VideoPreviewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('VideoPreview error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-surface">
          <p className="text-white/50 text-sm">Camera preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const call = useCall();

  if (!call) {
    throw new Error('useStreamCall must be used within a StreamCall component.');
  }

  const callStateHooks = useCallStateHooks();

  let callStartsAt: Date | undefined;
  let callEndedAt: Date | undefined;

  try {
    if (callStateHooks && typeof callStateHooks.useCallStartsAt === 'function') {
      callStartsAt = callStateHooks.useCallStartsAt();
    }
  } catch (error) { }

  try {
    if (callStateHooks && typeof callStateHooks.useCallEndedAt === 'function') {
      callEndedAt = callStateHooks.useCallEndedAt();
    }
  } catch (error) { }

  if (!callStartsAt && call?.state?.startsAt) {
    callStartsAt = new Date(call.state.startsAt);
  }

  if (!callEndedAt && call?.state?.endedAt) {
    callEndedAt = new Date(call.state.endedAt);
  }

  const callTimeNotArrived = callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isDevicesReady, setIsDevicesReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Wait for call to be properly initialized
  useEffect(() => {
    if (!call) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const initializeDevices = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 20;

        const checkDevicesReady = (): boolean => {
          try {
            if (!call || !call.camera || !call.microphone) return false;

            const cameraReady = typeof call.camera.listDevices === 'function' &&
              typeof call.camera.enable === 'function';
            const micReady = typeof call.microphone.listDevices === 'function' &&
              typeof call.microphone.enable === 'function';

            return cameraReady && micReady;
          } catch {
            return false;
          }
        };

        const pollDevices = (): Promise<void> => {
          return new Promise((resolve) => {
            intervalId = setInterval(() => {
              if (!isMounted) {
                if (intervalId) clearInterval(intervalId);
                resolve();
                return;
              }

              attempts++;

              if (checkDevicesReady()) {
                if (intervalId) clearInterval(intervalId);
                setTimeout(() => {
                  if (isMounted) setIsDevicesReady(true);
                }, 100);
                resolve();
              } else if (attempts >= maxAttempts) {
                if (intervalId) clearInterval(intervalId);
                if (isMounted) setIsDevicesReady(true);
                resolve();
              }
            }, 200);
          });
        };

        timeoutId = setTimeout(async () => {
          if (isMounted) await pollDevices();
        }, 300);
      } catch (error) {
        if (isMounted) {
          timeoutId = setTimeout(() => {
            if (isMounted) setIsDevicesReady(true);
          }, 2000);
        }
      }
    };

    initializeDevices();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [call]);

  // Toggle mic/camera
  useEffect(() => {
    if (!isDevicesReady || !call?.camera || !call?.microphone) return;

    if (isCameraOn) {
      call.camera.enable();
    } else {
      call.camera.disable();
    }

    if (isMicOn) {
      call.microphone.enable();
    } else {
      call.microphone.disable();
    }
  }, [isMicOn, isCameraOn, call, isDevicesReady]);

  if (callTimeNotArrived) {
    return (
      <Alert
        title={`Your meeting has not started yet. It is scheduled for ${callStartsAt ? callStartsAt.toLocaleString() : "a later time"
          }`}
      />
    );
  }

  if (callHasEnded) {
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );
  }

  const canRenderVideoPreview = isDevicesReady &&
    call?.camera &&
    call?.microphone &&
    typeof call.camera.listDevices === 'function';

  return (
    <div className="flex h-screen w-full bg-meeting">
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Title */}
        <h1 className="text-white text-2xl font-medium mb-8">
          Ready to join?
        </h1>

        {/* Video Preview Container */}
        <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden bg-surface mb-6">
          <VideoPreviewErrorBoundary>
            {canRenderVideoPreview ? (
              <VideoPreview />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="loader-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </VideoPreviewErrorBoundary>

          {/* Overlay Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              disabled={!canRenderVideoPreview}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isMicOn ? "bg-surface hover:bg-control-hover" : "bg-control-danger"
              )}
            >
              {isMicOn ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <MicOff className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              disabled={!canRenderVideoPreview}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isCameraOn ? "bg-surface hover:bg-control-hover" : "bg-control-danger"
              )}
            >
              {isCameraOn ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <VideoOff className="w-5 h-5 text-white" />
              )}
            </button>

            {canRenderVideoPreview && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-12 h-12 rounded-full bg-surface hover:bg-control-hover flex items-center justify-center transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Device Settings Panel */}
        {showSettings && canRenderVideoPreview && (
          <div className="mb-6 bg-surface rounded-lg p-4">
            <DeviceSettings />
          </div>
        )}

        {/* Join Button */}
        <Button
          onClick={() => {
            call.join();
            setIsSetupComplete(true);
          }}
          disabled={!canRenderVideoPreview}
          className="bg-google-blue hover:bg-google-blue-hover text-white px-8 py-3 rounded-full font-medium text-base transition-colors"
        >
          Join now
        </Button>

        {/* Status Text */}
        <p className="text-white/50 text-sm mt-4">
          {isMicOn && isCameraOn
            ? "Your microphone and camera are on"
            : isMicOn
              ? "Your camera is off"
              : isCameraOn
                ? "Your microphone is off"
                : "Your microphone and camera are off"
          }
        </p>
      </div>
    </div>
  );
};

export default MeetingSetup;
