# Render.com + GitHub Actions Integration Plan

## Overview

This document provides a complete step-by-step plan to integrate the MyGymTracker project with Render.com for production deployment through GitHub Actions. This setup enables automatic deployment on successful merges to the main branch while maintaining quality through CI/CD checks.

## Architecture

```
GitHub Repository (main branch)
    ↓ (push/merge)
GitHub Actions CI/CD
    ├── Lint Code
    ├── Run Unit Tests
    ├── Run E2E Tests
    └── Deploy to Render ✓
         ↓
Render.com Production
    ├── Backend API (Docker)
    ├── Frontend Web (Static)
    └── PostgreSQL Database
```

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Render.com Setup](#phase-1-rendercom-setup)
3. [Phase 2: GitHub Repository Configuration](#phase-2-github-repository-configuration)
4. [Phase 3: GitHub Actions Deployment Workflow](#phase-3-github-actions-deployment-workflow)
5. [Phase 4: Environment Variables & Secrets](#phase-4-environment-variables--secrets)
6. [Phase 5: Deploy & Verify](#phase-5-deploy--verify)
7. [Phase 6: Monitoring & Maintenance](#phase-6-monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with admin access to the repository
- [ ] Render.com account (free tier is sufficient for testing)
- [ ] Git installed locally
- [ ] Node.js 20.x installed locally
- [ ] All code committed and pushed to GitHub
- [ ] Current CI/CD pipeline passing (lint, unit tests, e2e tests)

---

## Phase 1: Render.com Setup

### Step 1.1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up using your GitHub account (recommended for easier integration)
3. Verify your email address
4. Complete account setup

### Step 1.2: Connect GitHub Repository

1. In Render Dashboard, go to **Account Settings** → **GitHub**
2. Click **Connect GitHub Account**
3. Authorize Render to access your GitHub account
4. Select repository access:
   - Choose **Only select repositories**
   - Select `mygymtracker` repository
   - Click **Install & Authorize**

### Step 1.3: Deploy from Blueprint (Recommended)

**Option A: Using render.yaml (Infrastructure as Code)**

1. Push `render.yaml` to your repository:

   ```bash
   git add render.yaml
   git commit -m "feat: add Render blueprint configuration"
   git push origin main
   ```

2. In Render Dashboard:

   - Click **New +** → **Blueprint**
   - Select your `mygymtracker` repository
   - Render will detect `render.yaml` automatically
   - Review the services to be created:
     - `mygymtracker-api` (Backend API)
     - `mygymtracker-web` (Frontend)
     - `mygymtracker-db` (PostgreSQL Database)
   - Click **Apply**

3. Wait for initial deployment (5-10 minutes)

**Option B: Manual Service Creation**

If you prefer manual setup or need to customize:

<details>
<summary>Click to expand manual setup instructions</summary>

#### Database Setup

1. Click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `mygymtracker-db`
   - **Database**: `mygymtracker`
   - **Region**: Oregon (or closest to your users)
   - **Plan**: Free or Starter
3. Click **Create Database**
4. Wait for database provisioning (2-3 minutes)
5. Note down connection details from **Info** tab

#### Backend API Setup

1. Click **New +** → **Web Service**
2. Select your repository
3. Configure:
   - **Name**: `mygymtracker-api`
   - **Region**: Oregon (same as database)
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Plan**: Free or Starter
4. Add environment variables (see Phase 4)
5. Click **Create Web Service**

#### Frontend Setup

1. Click **New +** → **Static Site**
2. Select your repository
3. Configure:
   - **Name**: `mygymtracker-web`
   - **Branch**: `main`
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Publish Directory**: `./frontend/dist`
4. Add environment variable:
   - `VITE_API_URL`: `https://mygymtracker-api.onrender.com`
5. Click **Create Static Site**

</details>

### Step 1.4: Configure Service Settings

After deployment, configure each service:

#### Backend API Configuration

1. Go to `mygymtracker-api` service
2. **Settings** → **Health Check Path**: `/api/health`
3. **Settings** → **Auto-Deploy**: Enable (for GitHub integration)
4. Click **Save Changes**

#### Frontend Configuration

1. Go to `mygymtracker-web` service
2. **Settings** → **Redirects/Rewrites**:
   - Type: `Rewrite`
   - Source: `/*`
   - Destination: `/index.html`
3. **Settings** → **Pull Request Previews**: Enable (optional)
4. Click **Save Changes**

### Step 1.5: Run Database Migrations

After backend is deployed:

1. Go to `mygymtracker-api` service
2. Click **Shell** tab
3. Run migration command:
   ```bash
   npm run migration:run
   ```
4. Verify migrations completed successfully
5. (Optional) Seed initial data if needed

### Step 1.6: Get Render API Key

For GitHub Actions integration:

1. Go to **Account Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `GitHub Actions Deploy`
4. Copy the key immediately (you won't see it again)
5. Store it securely - you'll need it in Phase 4

---

## Phase 2: GitHub Repository Configuration

### Step 2.1: Create Deployment Environment

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it: `Production`
5. Configure environment protection rules:
   - ☑️ **Required reviewers** (optional, for manual approval)
   - ☑️ **Wait timer** (optional, e.g., 5 minutes)
   - ☑️ **Deployment branches**: Only `main` branch
6. Click **Save protection rules**

### Step 2.2: Configure Repository Settings

1. **Settings** → **Actions** → **General**
2. **Workflow permissions**:
   - Select: ☑️ **Read and write permissions**
   - Enable: ☑️ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

---

## Phase 3: GitHub Actions Deployment Workflow

### Step 3.1: Create Deployment Workflow File

Create a new workflow file for production deployment:

**File**: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch: # Allows manual triggering

permissions:
  contents: read
  deployments: write

jobs:
  # Run existing CI checks first
  ci:
    name: Run CI Checks
    uses: ./.github/workflows/pull-request.yml
    secrets: inherit

  # Deploy to Render.com
  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest
    needs: ci # Only deploy if CI passes
    environment:
      name: Production
      url: https://mygymtracker-web.onrender.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy Backend to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID_BACKEND }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true

      - name: Deploy Frontend to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID_FRONTEND }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true

      - name: Run Database Migrations
        run: |
          echo "Triggering database migrations..."
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": "clear"}' \
            "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_BACKEND }}/deploys"

      - name: Verify Deployment
        run: |
          echo "Waiting for services to be healthy..."
          sleep 30

          # Check backend health
          BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mygymtracker-api.onrender.com/api/health)
          if [ $BACKEND_STATUS -eq 200 ]; then
            echo "✅ Backend is healthy"
          else
            echo "❌ Backend health check failed (status: $BACKEND_STATUS)"
            exit 1
          fi

          # Check frontend
          FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mygymtracker-web.onrender.com)
          if [ $FRONTEND_STATUS -eq 200 ]; then
            echo "✅ Frontend is accessible"
          else
            echo "❌ Frontend check failed (status: $FRONTEND_STATUS)"
            exit 1
          fi

      - name: Post Deployment Summary
        if: always()
        run: |
          echo "### 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Backend**: https://mygymtracker-api.onrender.com" >> $GITHUB_STEP_SUMMARY
          echo "- **Frontend**: https://mygymtracker-web.onrender.com" >> $GITHUB_STEP_SUMMARY
          echo "- **API Docs**: https://mygymtracker-api.onrender.com/api/docs" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Status**: ${{ job.status }}" >> $GITHUB_STEP_SUMMARY

  # Notify on deployment status
  notify:
    name: Notification
    runs-on: ubuntu-latest
    needs: [ci, deploy]
    if: always()

    steps:
      - name: Deployment Status
        run: |
          if [ "${{ needs.deploy.result }}" == "success" ]; then
            echo "✅ Deployment successful!"
          else
            echo "❌ Deployment failed!"
            exit 1
          fi
```

### Step 3.2: Alternative: Using Render's Native GitHub Integration

If you prefer Render's built-in auto-deploy (simpler but less control):

**File**: `.github/workflows/trigger-render-deploy.yml`

```yaml
name: Trigger Render Deploy

on:
  push:
    branches:
      - main

jobs:
  ci:
    name: Run CI Checks
    uses: ./.github/workflows/pull-request.yml
    secrets: inherit

  trigger-deploy:
    name: Trigger Render Auto-Deploy
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Notify Success
        run: |
          echo "✅ CI passed! Render will auto-deploy from main branch."
          echo "Monitor deployment at: https://dashboard.render.com"
```

**Note**: With this approach, Render automatically deploys when commits are pushed to `main`. The GitHub Action only ensures CI passes first.

---

## Phase 4: Environment Variables & Secrets

### Step 4.1: Generate Secrets

Generate secure secrets for your application:

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate another for refresh tokens (if using)
openssl rand -base64 64
```

### Step 4.2: Add Secrets to GitHub

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name                  | Description                    | How to Get                              |
| ---------------------------- | ------------------------------ | --------------------------------------- |
| `RENDER_API_KEY`             | Render API key for deployments | From Render Account Settings → API Keys |
| `RENDER_SERVICE_ID_BACKEND`  | Backend service ID             | From Render service URL: `srv-xxxxx`    |
| `RENDER_SERVICE_ID_FRONTEND` | Frontend service ID            | From Render service URL: `srv-yyyyy`    |
| `JWT_SECRET`                 | JWT signing secret             | Generated with openssl (see above)      |
| `REFRESH_TOKEN_SECRET`       | Refresh token secret           | Generated with openssl (see above)      |
| `GOOGLE_CLIENT_ID`           | Google OAuth client ID         | From Google Cloud Console               |
| `GOOGLE_CLIENT_SECRET`       | Google OAuth secret            | From Google Cloud Console               |
| `APPLE_CLIENT_ID`            | Apple OAuth service ID         | From Apple Developer                    |
| `APPLE_TEAM_ID`              | Apple team ID                  | From Apple Developer                    |
| `APPLE_KEY_ID`               | Apple key ID                   | From Apple Developer                    |
| `APPLE_PRIVATE_KEY`          | Apple private key              | From Apple Developer                    |

**To get Render Service IDs**:

1. Go to Render Dashboard
2. Click on your service (e.g., `mygymtracker-api`)
3. Look at the URL: `https://dashboard.render.com/web/srv-xxxxx`
4. Copy the `srv-xxxxx` part

### Step 4.3: Configure Environment Variables in Render

The `render.yaml` file already configures most environment variables, but verify:

1. **Backend Service** (`mygymtracker-api`):

   - Go to service → **Environment** tab
   - Verify these are set:
     - `NODE_ENV`: `production`
     - `DB_HOST`: (auto-configured from database)
     - `DB_PORT`: (auto-configured from database)
     - `DB_USERNAME`: (auto-configured from database)
     - `DB_PASSWORD`: (auto-configured from database)
     - `DB_NAME`: (auto-configured from database)
     - `JWT_SECRET`: (auto-generated or set manually)
     - `JWT_EXPIRES_IN`: `7d`
     - `FRONTEND_URL`: `https://mygymtracker-web.onrender.com`
     - `PORT`: `3000`

2. **Frontend Service** (`mygymtracker-web`):

   - Go to service → **Environment** tab
   - Verify:
     - `VITE_API_URL`: `https://mygymtracker-api.onrender.com`

3. Add OAuth credentials (if not using GitHub secrets):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APPLE_CLIENT_ID`
   - `APPLE_TEAM_ID`
   - `APPLE_KEY_ID`
   - `APPLE_PRIVATE_KEY`

---

## Phase 5: Deploy & Verify

### Step 5.1: Test CI/CD Pipeline

1. Make a small, safe change (e.g., update README.md):

   ```bash
   echo "Testing deployment pipeline" >> README.md
   git add README.md
   git commit -m "test: verify deployment pipeline"
   git push origin main
   ```

2. Monitor GitHub Actions:

   - Go to **Actions** tab in GitHub
   - Watch the workflow run:
     - ✅ Lint should pass
     - ✅ Unit tests should pass
     - ✅ E2E tests should pass
     - ✅ Deploy should trigger

3. Monitor Render Deployment:
   - Go to Render Dashboard
   - Watch services update
   - Check deployment logs for errors

### Step 5.2: Verify Services

Once deployment completes:

1. **Backend API Health Check**:

   ```bash
   curl https://mygymtracker-api.onrender.com/api/health
   ```

   Expected response: `{"status":"ok"}`

2. **Frontend Accessibility**:

   - Visit: https://mygymtracker-web.onrender.com
   - Should load the login page

3. **API Documentation**:

   - Visit: https://mygymtracker-api.onrender.com/api/docs
   - Should show Swagger UI

4. **Database Connection**:
   - Try logging in or creating an account
   - Verify data persistence

### Step 5.3: Test Authentication Flow

1. Register a new user through the frontend
2. Login with credentials
3. Test JWT token generation
4. Test protected endpoints
5. Verify OAuth flows (Google/Apple) if configured

### Step 5.4: Performance Check

1. **Check Response Times**:

   ```bash
   curl -w "@-" -o /dev/null -s https://mygymtracker-api.onrender.com/api/health <<'EOF'
   time_total: %{time_total}s
   EOF
   ```

2. **Monitor Cold Start** (Free tier):
   - Free tier services spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds
   - Upgrade to paid tier for always-on services

---

## Phase 6: Monitoring & Maintenance

### Step 6.1: Set Up Monitoring

1. **Render Dashboard Monitoring**:

   - Check **Metrics** tab for each service
   - Monitor CPU, Memory, Response times
   - Set up alerts (paid plans)

2. **GitHub Actions Monitoring**:

   - Subscribe to workflow notifications
   - Settings → Notifications → Actions

3. **Uptime Monitoring** (Optional):
   - Use services like UptimeRobot, Pingdom, or StatusCake
   - Monitor: `https://mygymtracker-api.onrender.com/api/health`

### Step 6.2: Log Management

1. **View Logs in Render**:

   - Go to service → **Logs** tab
   - Use filters to find specific issues
   - Download logs for local analysis

2. **Log Streaming** (Advanced):
   - Consider Render's log streaming to external services
   - Options: Datadog, Loggly, Papertrail

### Step 6.3: Database Backups

1. **Automatic Backups** (Render managed):

   - Free tier: No automatic backups
   - Starter/Standard: Daily automatic backups
   - Verify backup schedule in Database → **Backups**

2. **Manual Backup**:

   ```bash
   # Using pg_dump (run from Render shell or locally)
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

3. **Backup to S3** (Advanced):
   - Set up automated backups to AWS S3
   - Use cron job or GitHub Actions scheduled workflow

### Step 6.4: Rollback Strategy

If deployment fails:

1. **Render Rollback**:

   - Go to service → **Deploys** tab
   - Find last successful deploy
   - Click **Rollback to this deploy**

2. **Git Rollback**:

   ```bash
   # Revert last commit
   git revert HEAD
   git push origin main

   # Or reset to previous commit (use with caution)
   git reset --hard HEAD~1
   git push --force origin main
   ```

3. **Database Migration Rollback**:
   - Access Render shell for backend
   - Run: `npm run migration:revert`

### Step 6.5: Scaling Strategy

As your application grows:

1. **Vertical Scaling**:

   - Upgrade to higher Render plans
   - More CPU, memory, bandwidth

2. **Horizontal Scaling** (Render Standard+):

   - Add more instances
   - Load balancing (automatic on Render)

3. **Database Scaling**:
   - Upgrade database plan
   - Add read replicas (Pro plan)

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Deployment Fails with "Build Failed"

**Symptoms**: Build fails during Docker image creation

**Solutions**:

1. Check Dockerfile syntax
2. Verify all dependencies in package.json
3. Check build logs in Render for specific errors
4. Test Docker build locally:
   ```bash
   cd backend
   docker build -t test-backend .
   ```

#### Issue 2: Database Connection Fails

**Symptoms**: Backend can't connect to database

**Solutions**:

1. Verify environment variables are set correctly
2. Check database is running (Render Dashboard)
3. Verify internal connection URL is used (not external)
4. Check TypeORM configuration in `src/db/data-source.ts`

#### Issue 3: Migrations Don't Run

**Symptoms**: Database schema is outdated

**Solutions**:

1. Manually run migrations via Render Shell:
   ```bash
   npm run migration:run
   ```
2. Check migration files exist in `dist/db/migrations/`
3. Verify TypeORM CLI configuration
4. Add migration run to start script (not recommended for production)

#### Issue 4: GitHub Actions Deployment Times Out

**Symptoms**: Workflow exceeds time limit

**Solutions**:

1. Increase `wait-for-success` timeout in workflow
2. Check Render service isn't stuck deploying
3. Optimize Docker image size (use multi-stage builds)
4. Check for hanging processes

#### Issue 5: Frontend Can't Connect to Backend

**Symptoms**: CORS errors or 404s

**Solutions**:

1. Verify `VITE_API_URL` environment variable
2. Check CORS configuration in backend
3. Verify backend is accessible at API URL
4. Check network tab in browser DevTools

#### Issue 6: Cold Starts Are Too Slow (Free Tier)

**Symptoms**: First request takes 30-60 seconds

**Solutions**:

1. Upgrade to paid tier (removes spin-down)
2. Implement health check pinger:
   ```yaml
   # .github/workflows/keep-alive.yml
   name: Keep Services Alive
   on:
     schedule:
       - cron: "*/10 * * * *" # Every 10 minutes
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - run: curl https://mygymtracker-api.onrender.com/api/health
   ```
3. Accept cold starts for low-traffic development environments

#### Issue 7: JWT Secret Not Set

**Symptoms**: Authentication fails with cryptic errors

**Solutions**:

1. Verify `JWT_SECRET` is set in Render environment
2. Check GitHub secrets are configured
3. Generate new secret if compromised:
   ```bash
   openssl rand -base64 64
   ```
4. Update in both GitHub and Render

#### Issue 8: OAuth Not Working in Production

**Symptoms**: Google/Apple login fails

**Solutions**:

1. Update OAuth redirect URIs in provider consoles
   - Google: Add `https://mygymtracker-web.onrender.com`
   - Apple: Add domain in Service ID configuration
2. Verify OAuth secrets in Render environment
3. Check `FRONTEND_URL` matches actual frontend URL
4. Test OAuth flow in browser DevTools (Network tab)

---

## Security Best Practices

### 1. Secrets Management

- ✅ Never commit secrets to repository
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Render Environment Variables for runtime
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use different secrets for dev/staging/production

### 2. Database Security

- ✅ Use internal database URLs (not external)
- ✅ Enable SSL connections (Render default)
- ✅ Restrict database access to backend only
- ✅ Implement rate limiting on endpoints
- ✅ Use prepared statements (TypeORM default)

### 3. API Security

- ✅ Enable CORS with specific origins
- ✅ Use Helmet for security headers (already configured)
- ✅ Implement request rate limiting
- ✅ Validate all inputs with class-validator
- ✅ Use HTTPS only (Render default)

### 4. Dependency Security

- ✅ Regularly update dependencies:
  ```bash
  npm audit
  npm audit fix
  ```
- ✅ Enable Dependabot in GitHub:
  - Settings → Security → Dependabot alerts
- ✅ Review security advisories

---

## Cost Optimization

### Free Tier Setup (Good for Development/Testing)

- **Backend**: Free Web Service (spins down after 15 min inactivity)
- **Frontend**: Free Static Site (always on)
- **Database**: Free PostgreSQL (90 day trial, 1GB limit)

**Total**: $0/month (with limitations)

### Starter Tier Setup (Recommended for Production)

- **Backend**: Starter Web Service ($7/month)
  - Always on, no spin-down
  - 512 MB RAM, 0.5 CPU
  - 100 GB bandwidth/month
- **Frontend**: Free Static Site (sufficient)
- **Database**: Starter PostgreSQL ($7/month)
  - 256 MB RAM
  - 1 GB storage
  - Daily backups

**Total**: $14/month

### Standard Tier Setup (For Growing Apps)

- **Backend**: Standard Web Service ($25/month)
- **Database**: Standard PostgreSQL ($20/month)
- **Frontend**: Free Static Site

**Total**: $45/month

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain (Settings → Custom Domains)
2. ✅ Configure SSL certificate (automatic with custom domain)
3. ✅ Set up monitoring and alerts
4. ✅ Create staging environment for testing
5. ✅ Document deployment process for team
6. ✅ Set up backup and recovery procedures
7. ✅ Plan scaling strategy

---

## Additional Resources

- **Render Documentation**: https://render.com/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **NestJS Deployment**: https://docs.nestjs.com/deployment
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **TypeORM Migrations**: https://typeorm.io/migrations

---

## Support

If you encounter issues:

1. Check Render service logs
2. Review GitHub Actions workflow logs
3. Consult Render documentation
4. Check Render status page: https://status.render.com
5. Contact Render support: https://render.com/support

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Maintained By**: MyGymTracker Team
