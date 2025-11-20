# Vercel Deployment Guide - Quick Reference

## 🚀 Quick Deploy

### Step 1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `ProVeloce/ProVeloce-Meet`

### Step 2: Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `frontend` ⚠️ **IMPORTANT**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3: Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stream.io (Required)
NEXT_PUBLIC_STREAM_API_KEY=your_key
STREAM_SECRET_KEY=your_secret

# Backend API (Required)
NEXT_PUBLIC_API_URL=https://proveloce-meet.onrender.com/api

# Frontend URL (Update after first deploy)
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

### Step 4: Deploy
Click "Deploy" and wait 1-3 minutes.

### Step 5: Post-Deploy
1. Copy your Vercel URL (e.g., `https://proveloce-meet.vercel.app`)
2. Update `NEXT_PUBLIC_BASE_URL` in Vercel environment variables
3. Redeploy (or wait for auto-redeploy)
4. Add Vercel URL to Clerk allowed origins

## ✅ Verification

After deployment, verify:
- [ ] Homepage loads
- [ ] Sign-in/Sign-up works
- [ ] Can create meetings
- [ ] Video calls work
- [ ] No console errors

## 🔧 Troubleshooting

### Build Fails
- Check Root Directory is set to `frontend`
- Verify all environment variables are set
- Check build logs in Vercel Dashboard

### Runtime Errors
- Check browser console for errors
- Verify environment variables are correct
- Check backend API is accessible

### API Calls Fail
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS settings
- Verify backend is running

---

**Status**: ✅ Ready for Production  
**Build**: ✅ Passing  
**TypeScript**: ✅ 0 Errors

