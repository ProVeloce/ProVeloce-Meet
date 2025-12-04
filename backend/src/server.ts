import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import after dotenv.config()
import connectDB from './config/database';
import { authRoutes } from './routes/auth';
import { streamRoutes } from './routes/stream';
import { meetingRoutes } from './routes/meeting';
import { chatRoutes } from './routes/chat';
import { historyRoutes } from './routes/history';
import { meetingParticipantRoutes } from './routes/meeting-participants';
import { recordingRoutes } from './routes/recordings';
import { meetingHistoryRoutes } from './routes/meeting-history';
import { webhookRoutes } from './routes/webhooks';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Normalize FRONTEND_URL to remove trailing slashes for CORS matching
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const normalizedFrontendUrl = frontendUrl.replace(/\/+$/, ''); // Remove trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Normalize the origin by removing trailing slashes
    const normalizedOrigin = origin.replace(/\/+$/, '');
    
    // Check if the normalized origin matches the normalized frontend URL
    if (normalizedOrigin === normalizedFrontendUrl) {
      callback(null, true);
    } else {
      // Also allow localhost for development
      if (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('https://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
app.use(express.json());

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/participants', meetingParticipantRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/meeting-history', meetingHistoryRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProVeloce Meet Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

