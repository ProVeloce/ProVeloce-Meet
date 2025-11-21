# Backend Deployment Guide - Render

This guide provides step-by-step instructions for deploying the ProVeloce Meet backend to Render.

## 🚀 Quick Start

1. **Prepare your repository**
   - Ensure your backend code is in the `backend/` folder
   - Verify `package.json` has correct build and start scripts

2. **Create Render Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**
   - **Name**: `proveloce-meet-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

4. **Set environment variables** (see below)

5. **Deploy** and wait for build to complete

---

## 📝 Environment Variables

Add these environment variables in Render Dashboard → Your Service → Environment:

### Required Variables

```bash
# MongoDB Connection
MONGO_URI=mongodb+srv://proveloce-meet:ProVeloce%4012345@proveloce-meet.ut6jcqt.mongodb.net/

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

# Stream.io Video
STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Optional Variables

```bash
# Server Port (Render sets this automatically)
PORT=10000
```

---

## 🔧 Configuration Details

### Build Command
```bash
npm install && npm run build
```

This will:
1. Install all dependencies
2. Compile TypeScript to JavaScript in `dist/` folder

### Start Command
```bash
npm run start:prod
```

This runs the compiled JavaScript from `dist/server.js`.

### Root Directory
Set to `backend` so Render knows where your backend code is located.

---

## ✅ Verification

After deployment, verify your backend is running:

1. **Health Check**: Visit `https://your-service.onrender.com/health`
   - Should return: `{"status":"ok","message":"ProVeloce Meet Backend API is running"}`

2. **Check Logs**: In Render Dashboard → Logs
   - Should see: `✅ MongoDB connected successfully`
   - Should see: `🚀 Backend server running on http://localhost:PORT`

---

## 🔍 Troubleshooting

### Build Fails

**Error**: `Cannot find module` or `TypeScript errors`
- **Solution**: Ensure all dependencies are in `package.json`
- **Solution**: Check `tsconfig.json` is correct
- **Solution**: Verify build command runs locally first

**Error**: `npm install` fails
- **Solution**: Check Node.js version (should be 18+)
- **Solution**: Clear npm cache if needed

### Runtime Errors

**Error**: `MongoDB connection error`
- **Solution**: Verify `MONGO_URI` is correct and URL-encoded
- **Solution**: Check MongoDB Atlas network access (allow all IPs: `0.0.0.0/0`)
- **Solution**: Ensure database user has correct permissions

**Error**: `CLERK_SECRET_KEY is not set`
- **Solution**: Verify environment variable is set in Render
- **Solution**: Check variable name spelling (case-sensitive)

**Error**: `CORS error` from frontend
- **Solution**: Verify `FRONTEND_URL` matches your Vercel domain exactly
- **Solution**: Check backend `server.ts` CORS configuration

### Performance Issues

**Issue**: Slow response times
- **Solution**: Upgrade from Free tier to Starter ($7/month)
- **Solution**: Enable auto-sleep prevention (for free tier)
- **Solution**: Optimize database queries

**Issue**: Service goes to sleep (Free tier)
- **Solution**: Use a service like UptimeRobot to ping your service every 5 minutes
- **Solution**: Upgrade to paid tier for always-on service

---

## 📊 Monitoring

### View Logs
- Render Dashboard → Your Service → Logs
- Real-time logs are available
- Historical logs are stored

### Health Checks
- Render automatically monitors your service
- Configure custom health check endpoint: `/health`

### Metrics
- View CPU, Memory, and Network usage in Render Dashboard
- Set up alerts for high resource usage

---

## 🔄 Updating Deployment

### Automatic Deploys
- Render automatically deploys on git push to connected branch
- Manual deploys available in Dashboard

### Rollback
- Go to Deploys tab
- Click "Rollback" on previous successful deployment

---

## 💰 Pricing

### Free Tier
- ✅ 750 hours/month
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ⚠️ Service sleeps after 15 minutes of inactivity
- ⚠️ Slow cold starts

### Starter Tier ($7/month)
- ✅ Always on
- ✅ 512 MB RAM
- ✅ 0.5 CPU
- ✅ Better performance

### Recommended: Starter tier for production use

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **MongoDB**: Use strong passwords, enable IP whitelisting
3. **CORS**: Only allow your frontend domain
4. **Rate Limiting**: Consider adding rate limiting for production
5. **HTTPS**: Render provides HTTPS automatically

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/node)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Clerk Backend Setup](https://clerk.com/docs/backend-requests/overview)

---

## 🆘 Support

If you encounter issues:
1. Check Render logs for error messages
2. Verify all environment variables are set
3. Test backend locally with same environment variables
4. Review [main deployment guide](../DEPLOYMENT_GUIDE.md)

