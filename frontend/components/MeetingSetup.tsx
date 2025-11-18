'use client';
import { useEffect, useState, ErrorInfo, Component, ReactNode } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

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
        <div className="flex h-[300px] w-[500px] items-center justify-center rounded-lg bg-dark-2">
          <p className="text-gray-400">Camera preview unavailable</p>
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
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
  // Safely access call state hooks - they may not always be available
  const callStateHooks = useCallStateHooks();
  
  let callStartsAt: Date | undefined;
  let callEndedAt: Date | undefined;
  
  // Try to get call start/end times from hooks if available
  try {
    if (callStateHooks && typeof callStateHooks.useCallStartsAt === 'function') {
      const result = callStateHooks.useCallStartsAt();
      callStartsAt = result;
    }
  } catch (error) {
    // Hook may not be available or call state not initialized
    // This is okay - we'll just skip the scheduled time check
  }
  
  try {
    if (callStateHooks && typeof callStateHooks.useCallEndedAt === 'function') {
      const result = callStateHooks.useCallEndedAt();
      callEndedAt = result;
    }
  } catch (error) {
    // Hook may not be available or call state not initialized
    // This is okay - we'll just skip the ended check
  }
  
  // Alternative: Try to get from call state directly if hooks didn't work
  if (!callStartsAt && call?.state?.startsAt) {
    callStartsAt = new Date(call.state.startsAt);
  }
  
  if (!callEndedAt && call?.state?.endedAt) {
    callEndedAt = new Date(call.state.endedAt);
  }
  
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);
  const [isDevicesReady, setIsDevicesReady] = useState(false);

  // Wait for call to be properly initialized before rendering VideoPreview
  useEffect(() => {
    if (!call) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const initializeDevices = async () => {
      try {
        // Wait for call's device manager to fully initialize
        // Check multiple times to ensure device manager is ready
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts for slower connections
        
        const checkDevicesReady = (): boolean => {
          try {
            // Check if call object has the necessary properties
            if (!call || !call.camera || !call.microphone) {
              return false;
            }
            
            // Check if listDevices method exists and is callable
            const cameraReady = 
              typeof call.camera.listDevices === 'function' &&
              typeof call.camera.enable === 'function' &&
              typeof call.camera.disable === 'function';
            
            const micReady = 
              typeof call.microphone.listDevices === 'function' &&
              typeof call.microphone.enable === 'function' &&
              typeof call.microphone.disable === 'function';
            
            // Additional check: ensure the device manager objects are fully initialized
            // by checking if they have the expected structure
            const cameraHasState = call.camera.state !== undefined;
            const micHasState = call.microphone.state !== undefined;
            
            return cameraReady && micReady && cameraHasState && micHasState;
          } catch (error) {
            // If any error occurs during check, devices are not ready
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
                // Add a small additional delay to ensure Stream.io has fully initialized
                // This helps prevent race conditions
                setTimeout(() => {
                  if (isMounted) {
                    setIsDevicesReady(true);
                  }
                }, 100);
                resolve();
              } else if (attempts >= maxAttempts) {
                if (intervalId) clearInterval(intervalId);
                // If still not ready after max attempts, set ready anyway
                // The error boundary will catch any issues
                console.warn('Device manager not fully initialized after max attempts, proceeding anyway');
                if (isMounted) {
                  setIsDevicesReady(true);
                }
                resolve();
              }
            }, 200); // Check every 200ms
          });
        };

        // Initial delay to let Stream.io initialize the call object
        // Increased delay to give more time for initialization
        timeoutId = setTimeout(async () => {
          if (isMounted) {
            // Poll for device manager to be ready
            await pollDevices();
          }
        }, 300);
      } catch (error) {
        console.warn('Device initialization error:', error);
        // Still allow rendering after delay - error boundary will catch issues
        if (isMounted) {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              setIsDevicesReady(true);
            }
          }, 2000);
        }
      }
    };

    initializeDevices();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [call]);

  useEffect(() => {
    if (!isDevicesReady || !call?.camera || !call?.microphone) return;

    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call, isDevicesReady]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  // Additional safety check before rendering VideoPreview
  const canRenderVideoPreview = isDevicesReady && 
    call?.camera && 
    call?.microphone &&
    typeof call.camera.listDevices === 'function' &&
    typeof call.microphone.listDevices === 'function';

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>
      <VideoPreviewErrorBoundary>
        {canRenderVideoPreview ? (
          <VideoPreview />
        ) : (
          <div className="flex h-[300px] w-[500px] items-center justify-center rounded-lg bg-dark-2">
            <p className="text-gray-400">
              {isDevicesReady ? 'Initializing camera preview...' : 'Loading camera preview...'}
            </p>
          </div>
        )}
      </VideoPreviewErrorBoundary>
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
            disabled={!canRenderVideoPreview}
          />
          Join with mic and camera off
        </label>
        {canRenderVideoPreview && <DeviceSettings />}
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={() => {
          call.join();
          setIsSetupComplete(true);
        }}
        disabled={!canRenderVideoPreview}
      >
        Join meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;
