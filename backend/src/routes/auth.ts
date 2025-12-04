import { Router, Request, Response, NextFunction } from 'express';
import { clerkClient } from '../config/clerk';
import { verifyClerkToken } from '../utils/jwt-verifier';

const router = Router();

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Verify user authentication middleware
export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Basic token format validation
    if (!token || token.trim().length === 0) {
      console.error('Token is empty or invalid');
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }
    
    // Check if token looks like a JWT (has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Token does not have JWT format (expected 3 parts, got', tokenParts.length, ')');
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }
    
    try {
      // Verify the JWT token using jsonwebtoken with Clerk's public key
      const decoded = await verifyClerkToken(token);
      
      if (!decoded || !decoded.sub) {
        console.error('Token verification failed: No sub in decoded token', decoded);
        return res.status(401).json({ error: 'Unauthorized: Invalid token - no user ID found' });
      }

      // Attach user info to request
      req.userId = decoded.sub;
      next();
    } catch (verifyError: any) {
      console.error('Token verification error:', {
        message: verifyError.message,
        name: verifyError.name,
        code: verifyError.code,
        tokenLength: token?.length || 0,
        tokenPreview: token?.substring(0, 30) + '...' || 'no token',
      });
      
      // Provide more specific error messages
      let errorMessage = 'Unauthorized: Token verification failed';
      if (verifyError.message?.includes('expired') || verifyError.name === 'TokenExpiredError') {
        errorMessage = 'Unauthorized: Token has expired';
      } else if (verifyError.message?.includes('invalid') || verifyError.name === 'JsonWebTokenError') {
        errorMessage = 'Unauthorized: Invalid token format';
      } else if (verifyError.name === 'NotBeforeError') {
        errorMessage = 'Unauthorized: Token not yet valid';
      }
      
      return res.status(401).json({ 
        error: errorMessage,
        details: verifyError.message || 'Unknown verification error'
      });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};

// Get current user info (syncs with MongoDB)
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Sync user with MongoDB
    const { User } = await import('../models/User');
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // Create new user in MongoDB
      user = new User({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || undefined,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        imageUrl: clerkUser.imageUrl || undefined,
      });
      await user.save();
    } else {
      // Update existing user
      user.email = clerkUser.emailAddresses[0]?.emailAddress || user.email;
      user.username = clerkUser.username || user.username;
      user.firstName = clerkUser.firstName || user.firstName;
      user.lastName = clerkUser.lastName || user.lastName;
      user.imageUrl = clerkUser.imageUrl || user.imageUrl;
      await user.save();
    }
    
    res.json({
      id: user.clerkId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

export { router as authRoutes };

