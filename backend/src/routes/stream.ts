import { Router, Request, Response } from 'express';
import { StreamClient } from '@stream-io/node-sdk';
import { verifyAuth } from './auth';

const router = Router();

// These will be checked when actually used, not at module load time
const getStreamCredentials = () => {
  const STREAM_API_KEY = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;
  
  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    console.warn('⚠️  Stream API credentials are missing!');
  }
  
  return { STREAM_API_KEY, STREAM_API_SECRET };
};

// Generate Stream token for authenticated user (stores in MongoDB)
router.post('/token', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      console.error('Stream token generation failed: User ID not found in request');
      return res.status(401).json({ 
        error: 'Unauthorized: User ID not found',
        details: 'Authentication token was valid but user ID could not be extracted'
      });
    }

    const { STREAM_API_KEY, STREAM_API_SECRET } = getStreamCredentials();
    
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      console.error('Stream token generation failed: API credentials missing', {
        hasApiKey: !!STREAM_API_KEY,
        hasApiSecret: !!STREAM_API_SECRET,
      });
      return res.status(500).json({ 
        error: 'Stream API credentials are not configured',
        details: 'STREAM_API_KEY and STREAM_API_SECRET must be set in environment variables'
      });
    }

    // Check if user exists in MongoDB
    const { User } = await import('../models/User');
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      try {
        // Create user if doesn't exist
        const { clerkClient } = await import('../config/clerk');
        const clerkUser = await clerkClient.users.getUser(userId);
        
        user = new User({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          username: clerkUser.username || undefined,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          imageUrl: clerkUser.imageUrl || undefined,
        });
        await user.save();
        console.log('Created new user in MongoDB:', userId);
      } catch (userError: any) {
        console.error('Error creating user in MongoDB:', {
          error: userError?.message,
          stack: userError?.stack,
          userId,
        });
        return res.status(500).json({ 
          error: 'Failed to create user',
          details: userError?.message || 'Unknown error creating user'
        });
      }
    }

    // Check if token exists and is still valid
    const now = new Date();
    if (user.streamToken && user.streamTokenExpiry && user.streamTokenExpiry > now) {
      return res.json({ token: user.streamToken });
    }

    // Generate new token
    try {
      const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
      const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const issuedAt = Math.floor(Date.now() / 1000) - 60;
      const token = streamClient.createToken(userId, expirationTime, issuedAt);

      if (!token || typeof token !== 'string') {
        throw new Error('Stream client returned invalid token');
      }

      // Store token in MongoDB
      user.streamToken = token;
      user.streamTokenExpiry = new Date(expirationTime * 1000);
      await user.save();

      return res.json({ token });
    } catch (tokenError: any) {
      console.error('Error generating Stream token:', {
        error: tokenError?.message,
        stack: tokenError?.stack,
        userId,
      });
      return res.status(500).json({ 
        error: 'Failed to generate Stream token',
        details: tokenError?.message || 'Unknown error during token generation'
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in Stream token generation:', {
      error: error?.message,
      stack: error?.stack,
      userId: req.userId,
    });
    res.status(500).json({ 
      error: 'Failed to generate Stream token',
      details: error?.message || 'An unexpected error occurred'
    });
  }
});

export { router as streamRoutes };

