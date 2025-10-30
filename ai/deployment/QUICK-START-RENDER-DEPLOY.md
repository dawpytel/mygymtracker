# Quick Start: Deploy to Render.com via GitHub Actions

Get your MyGymTracker app deployed to production in under 30 minutes!

## Prerequisites Checklist

- [ ] GitHub repository is set up and code is pushed
- [ ] All local tests pass (`npm run test` and `npm run test:e2e`)
- [ ] You have a Render.com account (create at [render.com](https://render.com))

## Step 1: Deploy to Render (10 minutes)

### 1.1 Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign in with GitHub (recommended)
3. Authorize Render to access your repository

### 1.2 Deploy from Blueprint

1. Click **New +** → **Blueprint**
2. Select your `mygymtracker` repository
3. Render detects `render.yaml` automatically
4. Click **Apply**
5. Wait 5-10 minutes for initial deployment

**Services created:**
- `mygymtracker-api` - Backend API
- `mygymtracker-web` - Frontend
- `mygymtracker-db` - PostgreSQL Database

### 1.3 Run Database Migrations

1. Go to `mygymtracker-api` service
2. Click **Shell** tab
3. Run: `npm run migration:run`
4. Verify success ✅

## Step 2: Get Render Credentials (5 minutes)

### 2.1 Get Render API Key

1. Go to **Account Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `GitHub Actions Deploy`
4. Copy the key (save it securely!) 🔑

### 2.2 Get Service IDs

1. Go to `mygymtracker-api` service
2. Look at URL: `https://dashboard.render.com/web/srv-xxxxx`
3. Copy the `srv-xxxxx` part (Backend Service ID)
4. Repeat for `mygymtracker-web` (Frontend Service ID)

## Step 3: Configure GitHub (10 minutes)

### 3.1 Create Production Environment

1. Go to your GitHub repo → **Settings** → **Environments**
2. Click **New environment**
3. Name: `Production`
4. Protection rules:
   - ☑️ Deployment branches: Only `main`
5. Save

### 3.2 Add GitHub Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `RENDER_API_KEY` | Your Render API key | Step 2.1 |
| `RENDER_SERVICE_ID_BACKEND` | `srv-xxxxx` | Step 2.2 |
| `RENDER_SERVICE_ID_FRONTEND` | `srv-yyyyy` | Step 2.2 |
| `JWT_SECRET` | Generate: `openssl rand -base64 64` | Your terminal |
| `REFRESH_TOKEN_SECRET` | Generate: `openssl rand -base64 64` | Your terminal |

**Optional OAuth Secrets** (if using Google/Apple login):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

### 3.3 Generate JWT Secrets

```bash
# In your terminal, run:
openssl rand -base64 64

# Run again for REFRESH_TOKEN_SECRET:
openssl rand -base64 64
```

Copy each output and add to GitHub secrets.

## Step 4: Choose Deployment Strategy (2 minutes)

You have **two options** for deployment:

### Option A: Manual Deployment (Recommended)

Use the workflow that explicitly triggers Render deployments.

**Activate:**
```bash
# Keep the deploy-production.yml workflow
# Delete or disable ci-and-auto-deploy.yml if it exists
```

**Benefits:**
- Full control over deployment timing
- Deployment status visible in GitHub
- Can manually approve deployments

### Option B: Auto-Deploy (Simpler)

Let Render automatically deploy when code is pushed to `main`.

**Activate:**
1. In Render Dashboard, go to each service
2. **Settings** → **Auto-Deploy**: Enable ✅
3. Use `ci-and-auto-deploy.yml` workflow (just runs tests)

**Benefits:**
- Simpler setup
- Fewer moving parts
- Native Render integration

## Step 5: Test Deployment (5 minutes)

### 5.1 Trigger Deployment

Make a test commit:

```bash
echo "# Deployment Test" >> README.md
git add README.md
git commit -m "test: verify deployment pipeline"
git push origin main
```

### 5.2 Monitor Deployment

**GitHub Actions:**
1. Go to **Actions** tab
2. Watch workflow run
3. All checks should pass ✅

**Render Dashboard:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Watch services update
3. Check logs for any errors

### 5.3 Verify Services

**Backend Health Check:**
```bash
curl https://mygymtracker-api.onrender.com/api/health
# Expected: {"status":"ok"}
```

**Frontend:**
- Visit: https://mygymtracker-web.onrender.com
- Should see login page ✅

**API Documentation:**
- Visit: https://mygymtracker-api.onrender.com/api/docs
- Should see Swagger UI ✅

## Step 6: Post-Deployment

### 6.1 Test Application

1. Register a new user
2. Login
3. Create a workout plan
4. Log a session
5. Test all major features

### 6.2 Monitor Performance

1. Check **Metrics** tab in Render Dashboard
2. Monitor response times
3. Check for errors in logs

### 6.3 Set Up Monitoring (Optional)

Use a service like [UptimeRobot](https://uptimerobot.com) to monitor:
- `https://mygymtracker-api.onrender.com/api/health`

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Check Render service logs
3. Verify all secrets are set correctly
4. Check database is running

### Backend Health Check Fails

```bash
# Check logs in Render Dashboard
# Verify database connection
# Ensure migrations ran successfully
```

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` in frontend environment variables
2. Check CORS settings in backend
3. Test backend directly: `curl https://mygymtracker-api.onrender.com/api/health`

### Cold Starts (Free Tier)

Free tier services spin down after 15 minutes of inactivity.
- First request takes 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on services

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Enable SSL (automatic with custom domain)
- [ ] Set up staging environment
- [ ] Configure backup strategy
- [ ] Plan scaling strategy

## Cost Summary

### Free Tier (Development/Testing)
- Backend: Free (spins down after 15 min)
- Frontend: Free (always on)
- Database: Free 90-day trial

**Total: $0/month**

### Production (Recommended)
- Backend: Starter ($7/month)
- Frontend: Free
- Database: Starter ($7/month)

**Total: $14/month**

## Support

- **Full Documentation**: See [render-github-actions-integration-plan.md](./render-github-actions-integration-plan.md)
- **Render Docs**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Render Status**: https://status.render.com

---

**Estimated Setup Time**: 30 minutes
**Difficulty**: Beginner-Friendly
**Last Updated**: October 29, 2025

