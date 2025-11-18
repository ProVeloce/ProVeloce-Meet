# Clerk Production Deployment Guide

This guide will walk you through deploying your Clerk authentication to production.

## Prerequisites

- ✅ A domain you own (e.g., `proveloce.com` or `meet.proveloce.com`)
- ✅ Access to your domain's DNS settings
- ✅ OAuth credentials for any social sign-in providers you want to use

---

## Step 1: Create Production Clerk Instance

1. **Go to Clerk Dashboard**
   - Visit [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
   - Sign in to your account

2. **Create Production Instance**
   - Click on your current instance (likely named "Development" or similar)
   - Click **"Create Instance"** or **"Add Instance"**
   - Select **"Production"** environment
   - Name it (e.g., "ProVeloce Meet Production")

3. **Note Your Production Keys**
   - Go to **API Keys** in the sidebar
   - Copy your **Production Publishable Key** (starts with `pk_live_...`)
   - Copy your **Production Secret Key** (starts with `sk_live_...`)
   - ⚠️ **Keep these secure!** Never commit them to version control.

---

## Step 2: Configure Custom Domain

### 2.1 Add Custom Domain in Clerk

1. In your **Production** Clerk instance, go to **Domains** in the sidebar
2. Click **"Add Domain"**
3. Enter your domain (e.g., `accounts.proveloce.com` or `auth.proveloce.com`)
4. Clerk will provide you with DNS records to add

### 2.2 Add DNS Records

You'll need to add these DNS records to your domain:

#### Option A: Using a Subdomain (Recommended)
```
Type: CNAME
Name: accounts (or auth, login, etc.)
Value: [provided by Clerk]
TTL: 3600 (or default)
```

#### Option B: Using Root Domain
```
Type: A
Name: @
Value: [IP address provided by Clerk]
TTL: 3600
```

**Example DNS Configuration:**
- If your domain is `proveloce.com`
- And you want to use `accounts.proveloce.com`
- Add a CNAME record: `accounts` → `[Clerk-provided-value]`

### 2.3 Verify Domain

1. After adding DNS records, wait 5-60 minutes for DNS propagation
2. In Clerk Dashboard, click **"Verify Domain"**
3. Once verified, Clerk will issue SSL certificates automatically

---

## Step 3: Configure OAuth Providers (Social Sign-In)

For each OAuth provider you want to use in production:

### 3.1 Google OAuth

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://accounts.proveloce.com/v1/oauth_callback
     ```
     (Use your Clerk domain from Step 2)

3. **Copy Credentials**
   - Copy **Client ID** and **Client Secret**
   - Go to Clerk Dashboard → **User & Authentication** → **Social Connections**
   - Enable **Google** and paste your credentials

### 3.2 GitHub OAuth

1. **Go to GitHub Settings**
   - Visit [https://github.com/settings/developers](https://github.com/settings/developers)
   - Click **"New OAuth App"**

2. **Configure OAuth App**
   - **Application name**: ProVeloce Meet
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**:
     ```
     https://accounts.proveloce.com/v1/oauth_callback
     ```

3. **Copy Credentials**
   - Copy **Client ID** and **Client Secret**
   - Add to Clerk Dashboard → **Social Connections** → **GitHub**

### 3.3 Other Providers

Follow similar steps for:
- **Microsoft** - [Azure Portal](https://portal.azure.com/)
- **Apple** - [Apple Developer](https://developer.apple.com/)
- **Facebook** - [Facebook Developers](https://developers.facebook.com/)

Each provider has specific requirements. See Clerk's documentation for each:
- [Clerk OAuth Provider Guides](https://clerk.com/docs/authentication/social-connections)

---

## Step 4: Update Environment Variables

### 4.1 Frontend (Vercel)

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Update these variables:

```bash
# Production Clerk Keys
# Replace with your actual keys from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

# Clerk URLs (use your custom domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Optional: Custom Clerk Domain (if using custom domain)
NEXT_PUBLIC_CLERK_DOMAIN=https://accounts.proveloce.com
```

### 4.2 Backend (Render)

Go to **Render Dashboard** → Your Service → **Environment**

Update these variables:

```bash
# Production Clerk Secret Key
# Replace with your actual key from Clerk Dashboard
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

# Clerk Domain (your custom domain or default)
CLERK_DOMAIN=https://accounts.proveloce.com
```

---

## Step 5: Update Allowed Origins in Clerk

1. Go to Clerk Dashboard → **Settings** → **Paths**
2. Add your production frontend URL to **Allowed Origins**:
   ```
   https://your-domain.vercel.app
   https://your-custom-domain.com
   ```

3. Go to **Settings** → **Sessions**
4. Ensure **Session token lifetime** is appropriate for production

---

## Step 6: Update Application URLs

### 6.1 Frontend Application

In Clerk Dashboard → **Settings** → **Paths**:

- **Frontend API**: `https://your-domain.vercel.app`
- **After sign-in URL**: `https://your-domain.vercel.app`
- **After sign-up URL**: `https://your-domain.vercel.app`

### 6.2 Backend API

In Clerk Dashboard → **Settings** → **Paths**:

- **Backend API**: `https://proveloce-meet.onrender.com` (or your backend URL)

---

## Step 7: Test Production Deployment

1. **Test Sign-In/Sign-Up**
   - Visit your production frontend URL
   - Try signing up with email
   - Try signing in with social providers

2. **Verify Custom Domain**
   - Check that authentication flows use your custom domain
   - Verify SSL certificate is active (green lock icon)

3. **Test API Integration**
   - Verify backend can authenticate users
   - Check that JWT tokens are valid

---

## Step 8: Security Checklist

- [ ] Production keys are set (not test keys)
- [ ] Custom domain is verified and SSL is active
- [ ] Allowed origins are configured correctly
- [ ] OAuth redirect URIs use production domain
- [ ] Environment variables are set in both frontend and backend
- [ ] No test/development keys in production environment
- [ ] Session settings are appropriate for production

---

## Troubleshooting

### DNS Not Propagating
- Wait up to 48 hours for full DNS propagation
- Use [DNS Checker](https://dnschecker.org/) to verify globally
- Ensure TTL is set correctly

### SSL Certificate Issues
- Clerk automatically provisions SSL certificates
- Wait 5-15 minutes after domain verification
- Clear browser cache if issues persist

### OAuth Callbacks Failing
- Verify redirect URIs match exactly (including https://)
- Check that OAuth app is in production mode (not development)
- Ensure Client ID and Secret are correct

### Environment Variables Not Working
- Restart your Vercel deployment after adding variables
- Restart your Render service after adding variables
- Verify variable names match exactly (case-sensitive)

---

## Additional Resources

- [Clerk Production Deployment Docs](https://clerk.com/docs/deployments/overview)
- [Clerk Custom Domain Setup](https://clerk.com/docs/deployments/overview#custom-domains)
- [Clerk OAuth Provider Setup](https://clerk.com/docs/authentication/social-connections)
- [Clerk Environment Variables](https://clerk.com/docs/quickstarts/nextjs#environment-variables)

---

## Quick Reference: Environment Variables

### Frontend (Vercel)
```bash
# Replace with your actual keys from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_DOMAIN=https://accounts.proveloce.com  # Optional
```

### Backend (Render)
```bash
# Replace with your actual key from Clerk Dashboard
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
CLERK_DOMAIN=https://accounts.proveloce.com  # Optional, auto-detected if not set
```

---

**Need Help?** Check Clerk's [Support Documentation](https://clerk.com/docs) or their [Discord Community](https://discord.com/invite/clerk).

