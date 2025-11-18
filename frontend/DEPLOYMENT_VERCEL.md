# Frontend Deployment Guide - Vercel

This guide provides step-by-step instructions for deploying the ProVeloce Meet frontend to Vercel.

## 🚀 Quick Start

1. **Prepare your repository**
   - Ensure your frontend code is in the `frontend/` folder
   - Verify `vercel.json` exists and is configured
   - Check `package.json` has correct build scripts

2. **Create Vercel Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure the project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set environment variables** (see below)

5. **Deploy** and wait for build to complete

---

## 📝 Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

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
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

### Variable Notes

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Variables without `NEXT_PUBLIC_` are server-side only
- Update `NEXT_PUBLIC_BASE_URL` after first deployment with actual Vercel URL

---

## ⚙️ Configuration

### vercel.json

The `vercel.json` file is already configured. Update the rewrite destination:

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

### Build Settings

Vercel auto-detects Next.js, but you can verify:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

---

## ✅ Verification

After deployment, verify your frontend is working:

1. **Homepage**: Visit `https://your-project.vercel.app`
   - Should load without errors
   - Should show ProVeloce Meet interface

2. **Authentication**: Try signing in
   - Should redirect to Clerk sign-in
   - Should work after authentication

3. **API Connection**: Check browser console
   - Should not show CORS errors
   - API calls should succeed

4. **Video Calls**: Create a test meeting
   - Should connect to Stream.io
   - Video should work

---

## 🔧 Clerk Configuration

After deployment, update Clerk settings:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Settings** → **Domains**
3. Add your Vercel domain:
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/*`

4. Update **Allowed Origins**:
   - Add: `https://your-project.vercel.app`

---

## 🔍 Troubleshooting

### Build Fails

**Error**: `Module not found` or `TypeScript errors`
- **Solution**: Ensure all dependencies are in `package.json`
- **Solution**: Check `tsconfig.json` is correct
- **Solution**: Verify build runs locally: `npm run build`

**Error**: `Next.js build error`
- **Solution**: Check build logs for specific errors
- **Solution**: Verify all environment variables are set
- **Solution**: Clear `.next` folder and rebuild locally

### Runtime Errors

**Error**: `Failed to fetch` or CORS errors
- **Solution**: Verify `NEXT_PUBLIC_API_URL` is correct
- **Solution**: Check backend CORS allows your Vercel domain
- **Solution**: Ensure backend is running and accessible

**Error**: `Clerk authentication failed`
- **Solution**: Verify Clerk keys are correct
- **Solution**: Check Clerk dashboard for allowed origins
- **Solution**: Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL` matches your route

**Error**: `Stream.io token error`
- **Solution**: Verify Stream.io API keys are correct
- **Solution**: Check backend can generate Stream tokens
- **Solution**: Ensure backend is accessible from Vercel

### Environment Variable Issues

**Error**: `Environment variable not found`
- **Solution**: Verify variable name spelling (case-sensitive)
- **Solution**: Ensure `NEXT_PUBLIC_` prefix for client-side variables
- **Solution**: Redeploy after adding/changing variables

**Error**: Variables not updating
- **Solution**: Redeploy after changing environment variables
- **Solution**: Clear Vercel cache if needed
- **Solution**: Check variable scope (Production/Preview/Development)

---

## 📊 Monitoring

### View Logs
- Vercel Dashboard → Your Project → Logs
- Real-time function logs available
- Build logs for each deployment

### Analytics
- Enable Vercel Analytics in Dashboard
- View page views, performance metrics
- Monitor API route performance

### Performance
- Vercel automatically optimizes Next.js
- Edge Functions for better performance
- Automatic image optimization

---

## 🔄 Updating Deployment

### Automatic Deploys
- Vercel automatically deploys on git push
- Preview deployments for pull requests
- Production deployment for main branch

### Manual Deploy
- Go to Deploys tab
- Click "Redeploy" on any deployment

### Rollback
- Go to Deploys tab
- Click "Promote to Production" on previous deployment

---

## 🌍 Custom Domain

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_BASE_URL` environment variable
5. Update Clerk allowed origins

### SSL Certificate
- Vercel provides free SSL automatically
- Certificate is auto-renewed
- HTTPS is enabled by default

---

## 💰 Pricing

### Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Edge Functions

### Pro Tier ($20/month)
- ✅ Everything in Hobby
- ✅ Unlimited bandwidth
- ✅ Team collaboration
- ✅ Advanced analytics

### Recommended: Free tier is sufficient for most use cases

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **Clerk Keys**: Use separate keys for development/production
3. **API Keys**: Rotate keys regularly
4. **HTTPS**: Always use HTTPS (automatic on Vercel)
5. **CORS**: Configure backend CORS correctly

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Clerk with Next.js](https://clerk.com/docs/quickstarts/nextjs)

---

## 🆘 Support

If you encounter issues:
1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Test frontend locally with same environment variables
4. Review browser console for runtime errors
5. Check [main deployment guide](../DEPLOYMENT_GUIDE.md)

---

## 📋 Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Authentication works correctly
- [ ] API calls to backend succeed
- [ ] Video calls are functional
- [ ] All environment variables are set
- [ ] Clerk allowed origins updated
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)

