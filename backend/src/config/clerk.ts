import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';

// Lazy initialization function to ensure dotenv.config() is called first
let _clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
  if (!_clerkClient) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables. Make sure to create a .env file in the backend directory.');
    }
    _clerkClient = createClerkClient({
      secretKey,
    });
  }
  return _clerkClient;
}

// Export clerkClient with proper method forwarding
// This ensures lazy initialization while maintaining the same API
const clerkClientProxy = {
  get users() {
    return getClerkClient().users;
  },
  verifyToken(token: string, options?: any) {
    // Use the verifyToken function directly from @clerk/backend
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not set');
    }
    return clerkVerifyToken(token, {
      secretKey,
      ...options,
    });
  },
};

// Type assertion to maintain type safety
export const clerkClient = clerkClientProxy as ReturnType<typeof createClerkClient>;

