# Secrets Setup Checklist

Complete checklist for setting up all required secrets and environment variables for production deployment.

## Overview

This checklist covers:
- GitHub Secrets (for CI/CD)
- Render Environment Variables (for runtime)
- OAuth Provider Configuration (optional)

## Part 1: GitHub Secrets

### Required Secrets (Core Application)

Navigate to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

- [ ] **RENDER_API_KEY**
  - **What**: API key for Render.com deployments
  - **How to get**: 
    1. Go to Render Dashboard → Account Settings → API Keys
    2. Create new API key named "GitHub Actions Deploy"
    3. Copy the key immediately (you won't see it again)
  - **Format**: `rnd_xxxxxxxxxxxxxxxxxxxxx`

- [ ] **RENDER_SERVICE_ID_BACKEND**
  - **What**: Service ID for backend API
  - **How to get**:
    1. Go to Render Dashboard
    2. Click on `mygymtracker-api` service
    3. Look at URL: `https://dashboard.render.com/web/srv-xxxxx`
    4. Copy the `srv-xxxxx` part
  - **Format**: `srv-xxxxxxxxxxxxx`

- [ ] **RENDER_SERVICE_ID_FRONTEND**
  - **What**: Service ID for frontend
  - **How to get**:
    1. Go to Render Dashboard
    2. Click on `mygymtracker-web` service
    3. Look at URL: `https://dashboard.render.com/web/srv-yyyyy`
    4. Copy the `srv-yyyyy` part
  - **Format**: `srv-yyyyyyyyyyyyyyy`

- [ ] **JWT_SECRET**
  - **What**: Secret key for signing JWT tokens
  - **How to generate**:
    ```bash
    openssl rand -base64 64
    ```
  - **Format**: Random 64-character base64 string
  - **Security**: Keep this secret! If compromised, all tokens are invalid

- [ ] **REFRESH_TOKEN_SECRET**
  - **What**: Secret key for refresh tokens
  - **How to generate**:
    ```bash
    openssl rand -base64 64
    ```
  - **Format**: Random 64-character base64 string
  - **Security**: Must be different from JWT_SECRET

### Optional Secrets (OAuth Authentication)

Only required if you're implementing Google/Apple login:

#### Google OAuth

- [ ] **GOOGLE_CLIENT_ID**
  - **What**: Google OAuth 2.0 client ID
  - **How to get**:
    1. Go to [Google Cloud Console](https://console.cloud.google.com)
    2. Create or select project
    3. APIs & Services → Credentials
    4. Create OAuth 2.0 Client ID (Web application)
    5. Add authorized origins and redirect URIs
  - **Format**: `xxxxx.apps.googleusercontent.com`

- [ ] **GOOGLE_CLIENT_SECRET**
  - **What**: Google OAuth 2.0 client secret
  - **How to get**: Same as above, shown after creating client ID
  - **Format**: `GOCSPX-xxxxxxxxxxxxx`
  - **Security**: Keep secret!

#### Apple OAuth

- [ ] **APPLE_CLIENT_ID**
  - **What**: Apple Service ID
  - **How to get**:
    1. Go to [Apple Developer](https://developer.apple.com)
    2. Certificates, Identifiers & Profiles
    3. Create Service ID
    4. Enable "Sign in with Apple"
    5. Configure domain and return URL
  - **Format**: `com.yourcompany.serviceid`

- [ ] **APPLE_TEAM_ID**
  - **What**: Apple Developer Team ID
  - **How to get**: Apple Developer → Membership → Team ID
  - **Format**: `XXXXXXXXXX` (10 characters)

- [ ] **APPLE_KEY_ID**
  - **What**: Sign in with Apple Key ID
  - **How to get**:
    1. Apple Developer → Keys
    2. Create new key
    3. Enable "Sign in with Apple"
    4. Note the Key ID
  - **Format**: `YYYYYYYYYY` (10 characters)

- [ ] **APPLE_PRIVATE_KEY**
  - **What**: Private key for Apple authentication
  - **How to get**: Download .p8 file when creating key (one-time download)
  - **Format**: Multi-line string starting with `-----BEGIN PRIVATE KEY-----`
  - **Security**: Extremely sensitive! Never commit to repository

## Part 2: GitHub Environment Configuration

Navigate to: **GitHub Repository** → **Settings** → **Environments**

### Integration Environment

- [ ] Create environment named: **Integration**
- [ ] Add environment secrets (for E2E tests):
  - `JWT_SECRET` (same as repository secret)
  - `REFRESH_TOKEN_SECRET` (same as repository secret)
  - `GOOGLE_CLIENT_ID` (if using OAuth)
  - `GOOGLE_CLIENT_SECRET` (if using OAuth)
- [ ] Protection rules: None (allow all branches for testing)

### Production Environment

- [ ] Create environment named: **Production**
- [ ] Protection rules:
  - ☑️ Deployment branches: Only `main`
  - ☑️ Required reviewers (optional): Add team members
  - ☑️ Wait timer (optional): 5 minutes
- [ ] No additional secrets needed (uses repository secrets)

## Part 3: Render Environment Variables

Navigate to: **Render Dashboard** → Select Service → **Environment** tab

### Backend Service (`mygymtracker-api`)

#### Auto-configured (from render.yaml)

These should already be set if you deployed using the blueprint:

- [ ] **NODE_ENV** = `production`
- [ ] **DB_HOST** = (from database connection)
- [ ] **DB_PORT** = (from database connection)
- [ ] **DB_USERNAME** = (from database connection)
- [ ] **DB_PASSWORD** = (from database connection)
- [ ] **DB_NAME** = (from database connection)
- [ ] **JWT_SECRET** = (auto-generated or set manually)
- [ ] **JWT_EXPIRES_IN** = `7d`
- [ ] **FRONTEND_URL** = `https://mygymtracker-web.onrender.com`
- [ ] **PORT** = `3000`

#### Manual configuration (if needed)

Add these if using OAuth authentication:

- [ ] **GOOGLE_CLIENT_ID** = (from Google Cloud Console)
- [ ] **GOOGLE_CLIENT_SECRET** = (from Google Cloud Console)
- [ ] **APPLE_CLIENT_ID** = (from Apple Developer)
- [ ] **APPLE_TEAM_ID** = (from Apple Developer)
- [ ] **APPLE_KEY_ID** = (from Apple Developer)
- [ ] **APPLE_PRIVATE_KEY** = (from Apple Developer .p8 file)

**How to add:**
1. Go to service → **Environment** tab
2. Click **Add Environment Variable**
3. Enter key and value
4. Click **Save Changes**
5. Service will automatically redeploy

### Frontend Service (`mygymtracker-web`)

- [ ] **VITE_API_URL** = `https://mygymtracker-api.onrender.com`

If using OAuth in frontend:

- [ ] **VITE_GOOGLE_CLIENT_ID** = (same as backend)
- [ ] **VITE_APPLE_CLIENT_ID** = (same as backend)

### Database Service (`mygymtracker-db`)

No manual configuration needed. Connection details are auto-generated.

## Part 4: OAuth Provider Configuration

Only complete if implementing OAuth authentication.

### Google Cloud Console Setup

- [ ] Create or select project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized JavaScript origins:
  - `http://localhost:5173` (development)
  - `https://mygymtracker-web.onrender.com` (production)
- [ ] Add authorized redirect URIs:
  - `http://localhost:5173/auth/callback` (development)
  - `https://mygymtracker-web.onrender.com/auth/callback` (production)
- [ ] Save credentials

### Apple Developer Setup

- [ ] Register App ID
- [ ] Create Service ID
- [ ] Enable "Sign in with Apple" for Service ID
- [ ] Configure domains and return URLs:
  - Domain: `mygymtracker-web.onrender.com`
  - Return URL: `https://mygymtracker-web.onrender.com/auth/callback`
- [ ] Create Sign in with Apple Key
- [ ] Download .p8 private key file (one-time download!)
- [ ] Save all IDs and keys

## Verification Checklist

After setting up all secrets:

### GitHub Secrets Verification

```bash
# In your repository, check if secrets are set:
# Settings → Secrets and variables → Actions

# You should see:
# - RENDER_API_KEY
# - RENDER_SERVICE_ID_BACKEND
# - RENDER_SERVICE_ID_FRONTEND
# - JWT_SECRET
# - REFRESH_TOKEN_SECRET
# Plus any OAuth secrets you added
```

### Render Environment Variables Verification

1. Go to each service in Render Dashboard
2. Click **Environment** tab
3. Verify all required variables are present
4. Click **Restart** if you made changes

### Test Secret Access

```bash
# Create a test commit and push to main
echo "test" >> README.md
git add README.md
git commit -m "test: verify secrets setup"
git push origin main

# Watch GitHub Actions workflow
# - Go to Actions tab
# - Verify workflow uses secrets correctly
# - Check for any "Secret not found" errors
```

### Production Verification

After successful deployment:

```bash
# Test backend health
curl https://mygymtracker-api.onrender.com/api/health

# Test JWT authentication
curl -X POST https://mygymtracker-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

# Test OAuth (if configured)
# Visit: https://mygymtracker-web.onrender.com/login
# Try "Sign in with Google" or "Sign in with Apple"
```

## Security Best Practices

- [ ] ✅ Never commit secrets to repository
- [ ] ✅ Use different secrets for dev/staging/production
- [ ] ✅ Rotate secrets every 90 days
- [ ] ✅ Use strong, randomly generated secrets
- [ ] ✅ Limit secret access to necessary team members
- [ ] ✅ Enable two-factor authentication on GitHub and Render
- [ ] ✅ Review GitHub Actions logs for secret leaks
- [ ] ✅ Use GitHub's secret scanning feature
- [ ] ✅ Audit secret usage regularly

## Secret Rotation Procedure

When rotating secrets:

1. **Generate new secret**:
   ```bash
   openssl rand -base64 64
   ```

2. **Update GitHub Secret**:
   - Go to repository → Settings → Secrets
   - Edit existing secret
   - Update value
   - Save

3. **Update Render Environment Variable**:
   - Go to service → Environment
   - Edit variable
   - Update value
   - Save (triggers auto-redeploy)

4. **Verify deployment**:
   - Check service restarts successfully
   - Test authentication still works
   - Monitor logs for errors

5. **Document rotation**:
   - Note date of rotation
   - Schedule next rotation (90 days)

## Troubleshooting

### "Secret not found" error in GitHub Actions

- Verify secret name matches exactly (case-sensitive)
- Check secret is in correct scope (repository vs environment)
- Ensure workflow has permission to access secrets

### Environment variable not available in Render

- Check spelling and case
- Verify service was redeployed after adding variable
- Check Render service logs for startup errors

### JWT authentication fails in production

- Verify `JWT_SECRET` is set in both GitHub and Render
- Ensure secrets match in both places
- Check token expiration settings

### OAuth authentication fails

- Verify redirect URIs match exactly in provider settings
- Check OAuth secrets are set correctly
- Verify `FRONTEND_URL` matches actual frontend URL
- Test OAuth flow in browser DevTools (Network tab)

## Support

- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Render Environment Variables**: https://render.com/docs/environment-variables
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Apple Sign In**: https://developer.apple.com/sign-in-with-apple/

---

**Last Updated**: October 29, 2025
**Maintained By**: MyGymTracker Team

