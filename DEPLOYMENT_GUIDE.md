# ProVeloce Meet - Deployment Guide

This guide will help you deploy ProVeloce Meet to production. The backend is deployed on **Render** and the frontend is deployed on **Vercel**.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ A GitHub account with your code repository
- ✅ A Render account (for backend)
- ✅ A Vercel account (for frontend)
- ✅ MongoDB Atlas account (or MongoDB database)
- ✅ Clerk account (for authentication)
- ✅ Stream.io account (for video calling)

---

## Backend Deployment (Render)

### Step 1: Prepare Backend Repository

1. Ensure your backend code is in a separate folder or branch
2. Make sure `backend/package.json` has the correct build scripts
3. Verify `backend/tsconfig.json` is properly configured

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `proveloce-meet-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Free tier or higher (recommended: Starter for better performance)

### Step 3: Set Environment Variables in Render

Add the following environment variables in Render Dashboard → Your Service → Environment:

```bash
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

# Stream.io Video
STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Server Port (Render sets this automatically, but you can override)
PORT=10000
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your backend URL: `https://your-service-name.onrender.com`

### Step 5: Verify Backend Deployment

1. Visit `https://your-service-name.onrender.com/health`
2. You should see: `{"status":"ok","message":"ProVeloce Meet Backend API is running"}`

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Repository

1. Ensure your frontend code is ready
2. Verify `frontend/vercel.json` exists (already created)
3. Make sure `frontend/package.json` has correct build scripts

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Step 3: Set Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stream.io Video
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key

# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api

# Frontend Base URL
NEXT_PUBLIC_BASE_URL=https://your-frontend-domain.vercel.app
```

### Step 4: Update vercel.json

Edit `frontend/vercel.json` and update the rewrite destination:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-service.onrender.com/api/:path*"
    }
  ]
}
```

Replace `your-backend-service.onrender.com` with your actual Render backend URL.

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment to complete (usually 1-3 minutes)
4. Your app will be live at: `https://your-project.vercel.app`

### Step 6: Update Clerk Allowed Origins

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Settings** → **Domains**
3. Add your Vercel domain to allowed origins:
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/*`

---

## Environment Variables

### Backend Environment Variables (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLERK_SECRET_KEY` | Clerk backend secret key | `sk_test_...` |
| `CLERK_DOMAIN` | Clerk domain (optional, auto-detected) | `https://xxx.clerk.accounts.dev` |
| `STREAM_API_KEY` | Stream.io API key | `your_api_key` |
| `STREAM_SECRET_KEY` | Stream.io secret key | `your_secret_key` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `PORT` | Server port (auto-set by Render) | `10000` |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (for API routes) | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page path | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page path | `/sign-up` |
| `NEXT_PUBLIC_STREAM_API_KEY` | Stream.io public API key | `your_api_key` |
| `STREAM_SECRET_KEY` | Stream.io secret (for API routes) | `your_secret_key` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend.onrender.com/api` |
| `NEXT_PUBLIC_BASE_URL` | Frontend base URL | `https://your-app.vercel.app` |

---

## Post-Deployment Checklist

### Backend (Render)

- [ ] Backend health check endpoint works: `/health`
- [ ] MongoDB connection is successful
- [ ] CORS is configured correctly for frontend domain
- [ ] All API endpoints are accessible
- [ ] Environment variables are set correctly

### Frontend (Vercel)

- [ ] Frontend loads without errors
- [ ] Authentication (Clerk) works correctly
- [ ] API calls to backend are successful
- [ ] Video calls (Stream.io) are functional
- [ ] All environment variables are set
- [ ] Clerk allowed origins include Vercel domain

### Integration

- [ ] Frontend can communicate with backend
- [ ] Authentication tokens are validated correctly
- [ ] Video calls can be created and joined
- [ ] Meeting room codes work correctly
- [ ] Database operations (create/read meetings) work

---

## Troubleshooting

### Backend Issues

**Problem**: Backend fails to start
- **Solution**: Check Render logs, verify all environment variables are set
- **Solution**: Ensure `MONGO_URI` is correctly formatted (URL-encode special characters)

**Problem**: CORS errors
- **Solution**: Verify `FRONTEND_URL` in backend matches your Vercel domain exactly
- **Solution**: Check backend CORS configuration in `server.ts`

**Problem**: MongoDB connection fails
- **Solution**: Verify MongoDB Atlas network access allows Render IPs (or allow all IPs: `0.0.0.0/0`)
- **Solution**: Check MongoDB connection string format

### Frontend Issues

**Problem**: Build fails on Vercel
- **Solution**: Check build logs, ensure all dependencies are in `package.json`
- **Solution**: Verify Node.js version compatibility

**Problem**: API calls fail
- **Solution**: Verify `NEXT_PUBLIC_API_URL` is set correctly
- **Solution**: Check browser console for CORS or network errors
- **Solution**: Ensure backend is running and accessible

**Problem**: Authentication doesn't work
- **Solution**: Verify Clerk keys are correct
- **Solution**: Check Clerk dashboard for allowed origins
- **Solution**: Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `SIGN_UP_URL` match your routes

**Problem**: Video calls don't work
- **Solution**: Verify Stream.io API keys are correct
- **Solution**: Check Stream.io dashboard for API key status
- **Solution**: Ensure backend can generate Stream tokens

### Common Issues

**Problem**: Environment variables not updating
- **Solution**: Redeploy after changing environment variables
- **Solution**: Clear Vercel/Render cache if needed

**Problem**: Slow response times
- **Solution**: Upgrade Render service tier (free tier can be slow)
- **Solution**: Enable Vercel Edge Functions if applicable
- **Solution**: Optimize database queries

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stream.io Documentation](https://getstream.io/video/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## Support

If you encounter issues not covered in this guide:

1. Check the application logs in Render/Vercel dashboards
2. Review browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure all services (MongoDB, Clerk, Stream.io) are active

For additional help, refer to the main [README.md](./README.md) file.

