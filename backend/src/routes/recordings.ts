import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Meeting } from '../models/Meeting';
import { History } from '../models/History';

const router = Router();

// Save recording URL for a meeting (called by webhook or manually)
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { recordingUrl, recordingId, duration } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find meeting
    const meeting = await Meeting.findOne({ streamCallId: meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can save recording
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can save recording' });
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

    res.json(meeting);
  } catch (error: any) {
    console.error('Error saving recording:', error);
    res.status(500).json({ error: 'Failed to save recording', details: error.message });
  }
});

// Get all recordings for a host
router.get('/host/:hostId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own recordings
    if (hostId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 100, offset = 0 } = req.query;

    // Find all meetings hosted by this user that have recordings
    const meetings = await Meeting.find({
      hostId,
      recordingUrl: { $exists: true, $ne: null },
    })
      .sort({ endTime: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    // Format response with recording details
    const recordings = meetings.map(meeting => ({
      meetingId: meeting.streamCallId,
      title: meeting.title,
      recordingUrl: meeting.recordingUrl,
      recordingId: meeting.recordingId,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.endTime && meeting.startTime
        ? Math.floor((meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000)
        : undefined,
      createdAt: meeting.createdAt,
    }));

    res.json(recordings);
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings', details: error.message });
  }
});

// Get a specific recording (host only)
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const meeting = await Meeting.findOne({ streamCallId: meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only host can access recording
    if (meeting.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can access this recording' });
    }

    if (!meeting.recordingUrl) {
      return res.status(404).json({ error: 'Recording not found for this meeting' });
    }

    res.json({
      meetingId: meeting.streamCallId,
      title: meeting.title,
      recordingUrl: meeting.recordingUrl,
      recordingId: meeting.recordingId,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      duration: meeting.endTime && meeting.startTime
        ? Math.floor((meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000)
        : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording', details: error.message });
  }
});

export { router as recordingRoutes };

