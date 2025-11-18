import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { Meeting } from '../models/Meeting';
import { User } from '../models/User';
import mongoose from 'mongoose';

const router = Router();

// Helper function to get user display name
const getUserDisplayName = (user: any): string => {
  if (user.firstName) {
    return user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName;
  }
  return user.username || user.email?.split('@')[0] || 'User';
};

// Track user joining a meeting
router.post('/:meetingId/join', verifyAuth, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find meeting
    const meeting = await Meeting.findOne({ streamCallId: meetingId }).session(session);
    if (!meeting) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Get user info
    const user = await User.findOne({ clerkId: userId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if participant already exists (shouldn't happen due to unique constraint, but handle gracefully)
    let participant = await MeetingParticipant.findOne({ 
      meetingId, 
      userId 
    }).session(session);

    if (participant) {
      // If already exists but left, update to rejoin
      if (participant.leftAt) {
        participant.joinedAt = new Date();
        participant.leftAt = undefined;
        participant.duration = undefined;
        await participant.save({ session });
      }
    } else {
      // Create new participant record
      const isHost = meeting.hostId === userId;
      participant = new MeetingParticipant({
        meetingId,
        userId,
        userName: getUserDisplayName(user),
        userImageUrl: user.imageUrl,
        joinedAt: new Date(),
        isHost,
      });
      await participant.save({ session });

      // Add to meeting participants array if not already there
      if (!meeting.participants.includes(userId)) {
        meeting.participants.push(userId);
        await meeting.save({ session });
      }
    }

    // Create history entry for join
    const { History } = await import('../models/History');
    const historyEntry = new History({
      userId,
      meetingId,
      action: 'joined',
      timestamp: new Date(),
      metadata: {
        userName: getUserDisplayName(user),
      },
    });
    await historyEntry.save({ session });

    await session.commitTransaction();
    res.status(201).json(participant);
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error tracking participant join:', error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      // Participant already exists, fetch and return it
      try {
        const participant = await MeetingParticipant.findOne({ 
          meetingId: req.params.meetingId, 
          userId: req.userId 
        });
        if (participant) {
          return res.json(participant);
        }
      } catch (fetchError) {
        // Ignore fetch error
      }
    }
    
    res.status(500).json({ error: 'Failed to track participant join', details: error.message });
  } finally {
    session.endSession();
  }
});

// Track user leaving a meeting
router.post('/:meetingId/leave', verifyAuth, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { meetingId } = req.params;

    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Find participant
    const participant = await MeetingParticipant.findOne({ 
      meetingId, 
      userId 
    }).session(session);

    if (!participant) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Participant record not found' });
    }

    // Update leave time and calculate duration
    if (!participant.leftAt) {
      participant.leftAt = new Date();
      const durationMs = participant.leftAt.getTime() - participant.joinedAt.getTime();
      participant.duration = Math.floor(durationMs / 1000); // Duration in seconds
      await participant.save({ session });
    }

    // Create history entry for leave
    const { History } = await import('../models/History');
    const historyEntry = new History({
      userId,
      meetingId,
      action: 'left',
      timestamp: new Date(),
      metadata: {
        duration: participant.duration,
      },
    });
    await historyEntry.save({ session });

    await session.commitTransaction();
    res.json(participant);
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error tracking participant leave:', error);
    res.status(500).json({ error: 'Failed to track participant leave', details: error.message });
  } finally {
    session.endSession();
  }
});

// Get all participants for a meeting
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    const participants = await MeetingParticipant.find({ meetingId })
      .sort({ joinedAt: -1 });

    res.json(participants);
  } catch (error: any) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants', details: error.message });
  }
});

// Get user's meeting attendance history
router.get('/user/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own attendance
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 100, offset = 0 } = req.query;

    const participants = await MeetingParticipant.find({ userId })
      .sort({ joinedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(participants);
  } catch (error: any) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
});

export { router as meetingParticipantRoutes };

