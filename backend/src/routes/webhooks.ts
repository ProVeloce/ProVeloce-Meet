import { Router, Request, Response } from 'express';
import { Meeting } from '../models/Meeting';
// Webhook routes for external services (Stream.io, etc.)
import { History } from '../models/History';

const router = Router();

// Stream.io webhook handler for recording completion
router.post('/stream/recording', async (req: Request, res: Response) => {
  try {
    const { type, call_cid, call_id, recording } = req.body;

    // Handle recording completion
    if (type === 'recording.ready' && recording) {
      const meetingId = call_id;
      const recordingUrl = recording.url;
      const recordingId = recording.id;
      const duration = recording.duration;

      // Find meeting
      const meeting = await Meeting.findOne({ streamCallId: meetingId });
      if (!meeting) {
        console.warn(`Meeting not found for recording: ${meetingId}`);
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Update meeting with recording info
      meeting.recordingUrl = recordingUrl;
      meeting.recordingId = recordingId;
      await meeting.save();

      // Create history entry
      const historyEntry = new History({
        userId: meeting.hostId,
        meetingId,
        action: 'recorded',
        timestamp: new Date(),
        metadata: {
          recordingUrl,
          recordingId,
          duration,
        },
      });
      await historyEntry.save();

      console.log(`Recording saved for meeting: ${meetingId}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stream webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook', details: error.message });
  }
});

// Health check for webhook endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Webhook endpoint is ready' });
});

export { router as webhookRoutes };

