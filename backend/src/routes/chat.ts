import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { clerkClient } from '../config/clerk';

const router = Router();

/**
 * Get or create user from Clerk
 * Prevents 404 "User not found" errors
 */
async function getOrCreateUser(userId: string) {
  // Try to find existing user
  let user = await User.findOne({ clerkId: userId });

  if (user) {
    return user;
  }

  // User not in DB - fetch from Clerk and create
  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      return null;
    }

    user = new User({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@unknown.com`,
      username: clerkUser.username || undefined,
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      imageUrl: clerkUser.imageUrl || undefined,
    });

    await user.save();
    console.log('[Chat] Auto-created user from Clerk:', userId);
    return user;
  } catch (error: any) {
    console.error('[Chat] Failed to fetch/create user from Clerk:', error.message);
    return null;
  }
}

/**
 * Get user display name
 */
function getUserDisplayName(user: any): string {
  if (user.firstName) {
    return user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName;
  }
  return user.username || user.email?.split('@')[0] || 'User';
}

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
    console.error('[Chat] Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send a chat message
router.post('/:meetingId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { message, encryptedMessage, iv } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Support both encrypted and plaintext messages
    const isEncrypted = !!(encryptedMessage && iv);
    const hasContent = !!(message?.trim() || encryptedMessage);

    if (!hasContent) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Get or create user (NEVER returns 404 for authenticated users)
    const user = await getOrCreateUser(userId);
    if (!user) {
      // This should only happen if Clerk user doesn't exist (very rare)
      return res.status(500).json({
        error: 'Failed to resolve user identity',
        details: 'User could not be found or created. Please re-authenticate.'
      });
    }

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: getUserDisplayName(user),
      userImageUrl: user.imageUrl,
      message: isEncrypted ? '[Encrypted]' : message.trim(),
      encryptedMessage: isEncrypted ? encryptedMessage : undefined,
      iv: isEncrypted ? iv : undefined,
      isEncrypted,
      timestamp: new Date(),
    });

    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('[Chat] Error sending message:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send encrypted chat message (E2EE)
router.post('/:meetingId/encrypted', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const { encryptedMessage, iv } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!encryptedMessage || !iv) {
      return res.status(400).json({ error: 'Encrypted message and IV are required' });
    }

    // Get or create user
    const user = await getOrCreateUser(userId);
    if (!user) {
      return res.status(500).json({ error: 'Failed to resolve user identity' });
    }

    const chatMessage = new Chat({
      meetingId,
      userId,
      userName: getUserDisplayName(user),
      userImageUrl: user.imageUrl,
      message: '[Encrypted]',
      encryptedMessage,
      iv,
      isEncrypted: true,
      timestamp: new Date(),
    });

    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error: any) {
    console.error('[Chat] Error sending encrypted message:', error.message);
    res.status(500).json({ error: 'Failed to send encrypted message' });
  }
});

// Delete a chat message (only by sender)
router.delete('/:meetingId/:messageId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Chat.deleteOne({ _id: messageId });
    res.json({ message: 'Message deleted' });
  } catch (error: any) {
    console.error('[Chat] Error deleting message:', error.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export { router as chatRoutes };
