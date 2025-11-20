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

// Send a chat message (supports both plaintext and encrypted)
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { message, encryptedMessage, iv } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Support both encrypted and plaintext messages
    const isEncrypted = !!(encryptedMessage && iv);
    const hasContent = !!(message?.trim() || encryptedMessage);

    if (!hasContent) {
      return res.status(400).json({ error: 'Message or encrypted message is required' });
    }

    // Get user info
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's full name (firstName + lastName or firstName only)
    const getUserDisplayName = () => {
      if (user.firstName) {
        return user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName;
      }
      return user.username || user.email?.split('@')[0] || 'User';
    };

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: getUserDisplayName(),
      userImageUrl: user.imageUrl,
      message: isEncrypted ? '[Encrypted]' : message.trim(), // Store placeholder for encrypted
      encryptedMessage: isEncrypted ? encryptedMessage : undefined,
      iv: isEncrypted ? iv : undefined,
      isEncrypted,
      timestamp: new Date(),
    });

    await chatMessage.save();

    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send chat message', details: error.message });
  }
});

// Send an encrypted chat message (E2EE)
router.post('/:meetingId/encrypted', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { encryptedMessage, iv } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (!encryptedMessage || !iv) {
      return res.status(400).json({ error: 'Encrypted message and IV are required' });
    }

    // Get user info
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's full name
    const getUserDisplayName = () => {
      if (user.firstName) {
        return user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName;
      }
      return user.username || user.email?.split('@')[0] || 'User';
    };

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: getUserDisplayName(),
      userImageUrl: user.imageUrl,
      message: '[Encrypted]', // Placeholder - actual content is encrypted
      encryptedMessage,
      iv,
      isEncrypted: true,
      timestamp: new Date(),
    });

    await chatMessage.save();

    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('Error sending encrypted chat message:', error);
    res.status(500).json({ error: 'Failed to send encrypted chat message', details: error.message });
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

