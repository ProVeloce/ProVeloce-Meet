import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Chat } from '../models/Chat';
import { User } from '../models/User';

const router = Router();

// Get chat messages for a meeting
router.get('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Chat.find({ meetingId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    res.json(messages.reverse()); // Return in chronological order
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages', details: error.message });
  }
});

// Send a chat message
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user info
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: user.username || user.email,
      userImageUrl: user.imageUrl,
      message: message.trim(),
      timestamp: new Date(),
    });

    await chatMessage.save();

    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send chat message', details: error.message });
  }
});

// Delete a chat message (only by sender)
router.delete('/:meetingId/:messageId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Chat.deleteOne({ _id: messageId });

    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting chat message:', error);
    res.status(500).json({ error: 'Failed to delete chat message', details: error.message });
  }
});

export { router as chatRoutes };

