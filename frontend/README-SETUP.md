# ProVeloce Meet - Backend & Frontend Separation Setup

This application has been separated into a backend (Express/Node.js) and frontend (Next.js) architecture.

## Project Structure

```
ProVeloce Meet/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── config/   # Configuration files
│   │   └── server.ts # Main server file
│   └── package.json
└── (root)/           # Next.js frontend
    ├── app/          # Next.js app directory
    ├── components/   # React components
    ├── lib/          # Utilities (including API client)
    └── package.json
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/` directory:
```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
STREAM_API_KEY=your_stream_api_key_here
STREAM_SECRET_KEY=your_stream_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

1. Navigate to the root directory (if not already there):
```bash
cd ..
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Running Both Servers

You need to run both servers simultaneously:

1. **Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

2. **Terminal 2 - Frontend:**
```bash
npm run dev
```

## API Endpoints

### Backend API (http://localhost:5000/api)

- `POST /api/stream/token` - Generate Stream.io token (requires authentication)
- `GET /api/auth/me` - Get current user info (requires authentication)
- `GET /health` - Health check endpoint

## Changes Made

1. **Backend:**
   - Created Express server with TypeScript
   - Moved Stream token generation to backend API
   - Added Clerk authentication verification middleware
   - Configured CORS for frontend communication

2. **Frontend:**
   - Removed server-side dependencies (`@stream-io/node-sdk`)
   - Created API client utility (`lib/api-client.ts`)
   - Updated `StreamClientProvider` to fetch tokens from backend
   - All API calls now go through the backend server

3. **Security:**
   - Stream secret key is now only in the backend
   - Frontend only has access to public API keys
   - Authentication tokens are verified on the backend

## Troubleshooting

- **CORS errors:** Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- **Authentication errors:** Verify your Clerk keys are correct in both environments
- **Stream token errors:** Check that `STREAM_SECRET_KEY` is set in backend `.env`
- **Connection refused:** Ensure both servers are running on their respective ports

