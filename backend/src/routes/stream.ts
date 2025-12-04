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

// Generate Stream token for authenticated user
// IMPORTANT: Token generation should ALWAYS work if authentication passes
// MongoDB caching is optional and should never block token generation
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

    // Generate Stream token immediately - this is the core functionality
    // MongoDB operations are OPTIONAL and should not block this
    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = streamClient.createToken(userId, expirationTime, issuedAt);

    if (!token || typeof token !== 'string') {
      console.error('Stream client returned invalid token');
      return res.status(500).json({
        error: 'Failed to generate Stream token',
        details: 'Stream SDK returned an invalid token'
      });
    }

    // Try to cache in MongoDB, but don't fail if it doesn't work
    // This is a background operation that shouldn't block the response
    try {
      const { User } = await import('../models/User');
      let user = await User.findOne({ clerkId: userId });

      if (user) {
        // Update existing user with new token
        user.streamToken = token;
        user.streamTokenExpiry = new Date(expirationTime * 1000);
        await user.save();
      } else {
        // Try to create user in background (non-blocking)
        try {
          const { clerkClient } = await import('../config/clerk');
          const clerkUser = await clerkClient.users.getUser(userId);

          if (clerkUser) {
            const newUser = new User({
              clerkId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@no-email.com`,
              username: clerkUser.username || undefined,
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
              imageUrl: clerkUser.imageUrl || undefined,
              streamToken: token,
              streamTokenExpiry: new Date(expirationTime * 1000),
            });
            await newUser.save();
            console.log('Created user in MongoDB:', userId);
          }
        } catch (userCreateError: any) {
          // Log but don't fail - user creation is optional
          console.warn('Could not create user in MongoDB (non-blocking):', userCreateError?.message);
        }
      }
    } catch (dbError: any) {
      // Log but don't fail - MongoDB caching is optional
      console.warn('MongoDB operation failed (non-blocking):', dbError?.message);
    }

    // Always return the token if we got this far
    return res.json({ token });
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

