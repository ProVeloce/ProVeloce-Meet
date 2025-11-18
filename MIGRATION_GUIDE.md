# ProVeloce Meet - Migration Guide

## Overview

This document outlines the major changes made to migrate the application from Yoom to ProVeloce Meet, including MongoDB integration and UI revamp.

## Key Changes

### 1. MongoDB Integration

All application data is now stored in MongoDB instead of temporary storage:

- **Users**: Stored in MongoDB with Clerk ID synchronization
- **Meetings**: All meeting data (scheduled, ongoing, ended) stored in MongoDB
- **Chat Messages**: Persistent chat history in MongoDB
- **History**: User and meeting activity history tracked in MongoDB
- **Stream Tokens**: Cached in MongoDB for better performance

### 2. Backend API Changes

#### New Endpoints:
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings` - Get all meetings for a user
- `GET /api/meetings/:id` - Get a specific meeting
- `PATCH /api/meetings/:id/status` - Update meeting status
- `POST /api/meetings/:id/participants` - Add participant
- `DELETE /api/meetings/:id` - Delete meeting
- `GET /api/chat/:meetingId` - Get chat messages
- `POST /api/chat/:meetingId` - Send chat message
- `DELETE /api/chat/:meetingId/:messageId` - Delete message
- `GET /api/history/user/:userId` - Get user history
- `GET /api/history/meeting/:meetingId` - Get meeting history
- `POST /api/history` - Create history entry

#### Updated Endpoints:
- `GET /api/auth/me` - Now syncs user with MongoDB
- `POST /api/stream/token` - Now caches tokens in MongoDB

### 3. Frontend Changes

#### New API Clients:
- `lib/meeting-api.ts` - Meeting management API
- `lib/chat-api.ts` - Chat API
- `lib/history-api.ts` - History API

#### Updated Hooks:
- `hooks/useGetCalls.ts` - Now fetches from MongoDB via API
- `hooks/useGetCallById.ts` - Now fetches from MongoDB via API

### 4. UI/Theme Revamp

#### Color Palette:
- **Primary Dark**: `#0F172A` (Slate 900)
- **Secondary Dark**: `#1E293B` (Slate 800)
- **Primary Blue**: `#3B82F6` (Blue 500)
- **Hover Blue**: `#2563EB` (Blue 600)

#### Design Improvements:
- Modern glassmorphism effects
- Smooth transitions and hover states
- Professional gradient backgrounds
- Enhanced shadows and borders
- Improved Stream.io video controls styling

### 5. Environment Variables

#### Backend (.env):
```env
MONGO_URI=mongodb+srv://proveloce-meet:ProVeloce@12345@proveloce-meet.ut6jcqt.mongodb.net/
CLERK_SECRET_KEY=your_clerk_secret_key
STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# Create .env.local with your credentials
npm run dev
```

## Database Models

### User Model
- `clerkId`: Unique Clerk user ID
- `email`: User email
- `username`: Username
- `streamToken`: Cached Stream.io token
- `streamTokenExpiry`: Token expiration date

### Meeting Model
- `streamCallId`: Stream.io call ID
- `title`: Meeting title
- `type`: instant | scheduled | personal
- `hostId`: Host user ID
- `participants`: Array of participant IDs
- `status`: scheduled | ongoing | ended | cancelled
- `scheduledTime`: When meeting is scheduled
- `startTime`: When meeting started
- `endTime`: When meeting ended
- `recordingUrl`: Recording URL if available

### Chat Model
- `meetingId`: Associated meeting ID
- `userId`: Sender user ID
- `message`: Chat message content
- `timestamp`: Message timestamp

### History Model
- `userId`: User ID
- `meetingId`: Meeting ID
- `action`: Type of action (joined, left, started, etc.)
- `timestamp`: When action occurred
- `metadata`: Additional action data

## Migration Notes

1. **Backward Compatibility**: The application maintains backward compatibility with existing Stream.io calls while adding MongoDB persistence.

2. **Data Migration**: Existing meetings in Stream.io will be created in MongoDB when accessed through the new API endpoints.

3. **Token Caching**: Stream.io tokens are now cached in MongoDB to reduce API calls and improve performance.

4. **Real-time Updates**: While MongoDB stores persistent data, Stream.io still handles real-time video/audio streaming.

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGO_URI` is correct in backend `.env`
- Check network connectivity to MongoDB Atlas
- Ensure MongoDB user has proper permissions

### API Errors
- Verify all environment variables are set
- Check backend server is running on correct port
- Verify CORS settings match frontend URL

### Frontend Issues
- Clear browser cache
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Check browser console for detailed error messages

