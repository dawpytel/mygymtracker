# Render.yaml Configuration Guide

This guide explains the `render.yaml` Blueprint file and how to customize it for your MyGymTracker deployment.

## What is render.yaml?

The `render.yaml` file is Render's **Infrastructure as Code** (IaC) configuration. It defines:

- All services (backend, frontend, database)
- Environment variables
- Build configurations
- Deployment settings

**Benefits:**

- ✅ One-click deployment of entire stack
- ✅ Version-controlled infrastructure
- ✅ Reproducible deployments
- ✅ Easy to share and replicate

## File Structure Overview

```yaml
services: # Web services and static sites
  - backend API # NestJS application
  - frontend # React application

databases: # Database services
  - PostgreSQL # Primary database
```

## Detailed Configuration

### Backend API Service

```yaml
- type: web
  name: mygymtracker-api
  runtime: docker # Use Docker for deployment
  dockerfilePath: ./backend/Dockerfile # Path to Dockerfile
  dockerContext: ./backend # Build context
  region: oregon # Deployment region
  plan: starter # Service plan
  branch: main # Git branch to deploy
  healthCheckPath: /api/health # Health check endpoint
  autoDeploy: true # Auto-deploy on push
```

#### Customization Options

**Region** - Choose closest to your users:

- `oregon` (US West)
- `ohio` (US East)
- `frankfurt` (Europe)
- `singapore` (Asia)

**Plan Options:**

- `free` - Free tier, spins down after 15 min inactivity
- `starter` - $7/month, always on, 512 MB RAM
- `standard` - $25/month, 2 GB RAM
- `pro` - $85/month, 4 GB RAM

**Build Filter** (optional):

```yaml
buildFilter:
  paths:
    - backend/** # Only rebuild when backend changes
    - render.yaml # Or when blueprint changes
```

This prevents unnecessary rebuilds when only frontend changes.

**Environment Variables:**

Auto-configured (no changes needed):

```yaml
envVars:
  - key: DB_HOST
    fromDatabase:
      name: mygymtracker-db # Automatically populated
      property: host
```

Manually set:

```yaml
- key: FRONTEND_URL
  value: https://mygymtracker-web.onrender.com # Update if using custom domain
```

Auto-generated secrets:

```yaml
- key: JWT_SECRET
  generateValue: true # Render generates secure secret
```

### Frontend Static Site

```yaml
- type: web
  name: mygymtracker-web
  runtime: static # Static site hosting
  buildCommand: cd frontend && npm ci && npm run build # Build command
  staticPublishPath: ./frontend/dist # Output directory
  pullRequestPreviewsEnabled: true # PR previews
  branch: main
  region: oregon
```

#### Customization Options

**Build Command:**

- Current: `cd frontend && npm ci && npm run build`
- For monorepo: Adjust path as needed
- For custom build: Modify build script

**Static Publish Path:**

- Current: `./frontend/dist` (Vite default)
- Verify this matches your build output directory

**SPA Routing:**

```yaml
routes:
  - type: rewrite
    source: /* # All routes
    destination: /index.html # Redirect to index.html (React Router)
```

This ensures client-side routing works correctly.

**Security Headers:**

```yaml
headers:
  - path: /*
    name: X-Frame-Options
    value: DENY # Prevent clickjacking
  - path: /*
    name: X-Content-Type-Options
    value: nosniff # Prevent MIME sniffing
  # ... more security headers
```

**Environment Variables:**

```yaml
envVars:
  - key: VITE_API_URL
    value: https://mygymtracker-api.onrender.com # Backend API URL
```

**Important:** Update this if using a custom domain!

### PostgreSQL Database

```yaml
- name: mygymtracker-db
  databaseName: mygymtracker # Database name
  user: mygymtracker_user # Database user
  region: oregon # Should match services
  plan: starter # Database plan
  postgresMajorVersion: 15 # PostgreSQL version
```

#### Customization Options

**Plan Options:**

- `free` - Free 90-day trial, 1 GB storage, no backups
- `starter` - $7/month, 1 GB storage, daily backups
- `standard` - $20/month, 10 GB storage, daily backups
- `pro` - $90/month, 50 GB storage, continuous backups

**Region:**

- **Must match** your backend service region for best performance
- Same options as backend (oregon, ohio, frankfurt, singapore)

**Version:**

- Current: PostgreSQL 15 (recommended)
- Other options: 12, 13, 14, 16
- Stick with 15 unless you have specific requirements

## Common Customizations

### 1. Change Service Names

If you want different service names:

```yaml
services:
  - type: web
    name: my-custom-api-name # Change this
    # ... rest of config

  - type: web
    name: my-custom-web-name # Change this
    # ... rest of config
```

**Important:** Update environment variables that reference service URLs!

### 2. Use Custom Domain

After deployment, set up custom domain in Render Dashboard, then update:

```yaml
# Backend
envVars:
  - key: FRONTEND_URL
    value: https://app.yourdomain.com  # Your custom frontend domain

# Frontend
envVars:
  - key: VITE_API_URL
    value: https://api.yourdomain.com  # Your custom backend domain
```

### 3. Add OAuth Credentials

After initial deployment, add OAuth secrets via Render Dashboard:

1. Go to service → **Environment** tab
2. Add environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APPLE_CLIENT_ID`
   - etc.

**Why not in render.yaml?**

- Secrets shouldn't be in version control
- `generateValue: true` only works for new values
- Manual entry is more secure

### 4. Enable Different Regions

For better global performance, deploy in multiple regions:

```yaml
# US deployment
services:
  - type: web
    name: mygymtracker-api-us
    region: ohio
    # ... config

  # EU deployment
  - type: web
    name: mygymtracker-api-eu
    region: frankfurt
    # ... config
```

**Note:** Requires load balancing setup (advanced)

### 5. Separate Environments

For staging environment, create separate services:

```yaml
services:
  # Production
  - type: web
    name: mygymtracker-api-prod
    branch: main
    # ... config

  # Staging
  - type: web
    name: mygymtracker-api-staging
    branch: develop
    plan: free # Use free tier for staging
    # ... config
```

### 6. Disable Auto-Deploy

If you want manual deployment control only:

```yaml
services:
  - type: web
    name: mygymtracker-api
    autoDeploy: false # Disable auto-deploy
    # ... config
```

Then use GitHub Actions workflow for deployments.

### 7. Add More Services

To add additional services (e.g., Redis, worker):

```yaml
services:
  # ... existing services

  # Redis Cache
  - type: redis
    name: mygymtracker-cache
    plan: starter
    region: oregon
    maxmemoryPolicy: allkeys-lru

  # Background Worker
  - type: worker
    name: mygymtracker-worker
    runtime: docker
    dockerfilePath: ./worker/Dockerfile
    dockerContext: ./worker
    # ... config
```

## Environment Variables Reference

### Backend Required Variables

| Variable         | Source             | Description                   |
| ---------------- | ------------------ | ----------------------------- |
| `NODE_ENV`       | Set manually       | `production`                  |
| `DB_HOST`        | Auto from database | Database host                 |
| `DB_PORT`        | Auto from database | Database port                 |
| `DB_USERNAME`    | Auto from database | Database user                 |
| `DB_PASSWORD`    | Auto from database | Database password             |
| `DB_NAME`        | Auto from database | Database name                 |
| `JWT_SECRET`     | Auto-generated     | JWT signing secret            |
| `JWT_EXPIRES_IN` | Set manually       | Token expiration (e.g., `7d`) |
| `FRONTEND_URL`   | Set manually       | Frontend URL for CORS         |
| `PORT`           | Set manually       | Server port (usually `3000`)  |

### Backend Optional Variables (OAuth)

| Variable               | Source | Description            |
| ---------------------- | ------ | ---------------------- |
| `GOOGLE_CLIENT_ID`     | Manual | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Manual | Google OAuth secret    |
| `APPLE_CLIENT_ID`      | Manual | Apple service ID       |
| `APPLE_TEAM_ID`        | Manual | Apple team ID          |
| `APPLE_KEY_ID`         | Manual | Apple key ID           |
| `APPLE_PRIVATE_KEY`    | Manual | Apple private key      |

### Frontend Required Variables

| Variable       | Source       | Description     |
| -------------- | ------------ | --------------- |
| `VITE_API_URL` | Set manually | Backend API URL |

### Frontend Optional Variables (OAuth)

| Variable                | Source | Description            |
| ----------------------- | ------ | ---------------------- |
| `VITE_GOOGLE_CLIENT_ID` | Manual | Google OAuth client ID |
| `VITE_APPLE_CLIENT_ID`  | Manual | Apple service ID       |

## Validation

Before deploying, validate your `render.yaml`:

### 1. Syntax Check

```bash
# Install Render CLI (optional)
npm install -g render-cli

# Validate blueprint
render blueprint validate render.yaml
```

### 2. Manual Checks

- [ ] All service names are unique
- [ ] Regions match between database and backend
- [ ] Dockerfile paths are correct
- [ ] Build commands are valid
- [ ] Environment variables reference correct services
- [ ] Frontend URL matches backend CORS configuration

## Deployment Process

### Initial Deployment

1. **Commit render.yaml:**

   ```bash
   git add render.yaml
   git commit -m "feat: add Render deployment blueprint"
   git push origin main
   ```

2. **Deploy via Render Dashboard:**

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New +** → **Blueprint**
   - Select your repository
   - Render detects `render.yaml`
   - Click **Apply**

3. **Wait for deployment** (5-10 minutes)

4. **Run migrations:**
   - Go to backend service → **Shell**
   - Run: `npm run migration:run`

### Updates to render.yaml

When you update `render.yaml`:

1. Commit and push changes
2. Render detects changes automatically
3. Services are updated accordingly
4. Check Render Dashboard for status

**Note:** Some changes require service restart or redeployment.

## Troubleshooting

### "Blueprint parse error"

**Cause:** YAML syntax error

**Solution:**

1. Validate YAML syntax online: [yamllint.com](https://www.yamllint.com)
2. Check indentation (use spaces, not tabs)
3. Verify all strings with special characters are quoted

### "Service failed to deploy"

**Cause:** Invalid configuration

**Solution:**

1. Check Dockerfile paths are correct
2. Verify build commands work locally
3. Check environment variables are set
4. Review Render logs for specific error

### "Database connection failed"

**Cause:** Database not ready or wrong credentials

**Solution:**

1. Verify database service is running
2. Check `fromDatabase` references are correct
3. Wait for database to fully provision
4. Verify region matches

### "Frontend shows blank page"

**Cause:** Build output path mismatch

**Solution:**

1. Verify `staticPublishPath: ./frontend/dist`
2. Check `npm run build` creates `dist` folder
3. Verify SPA routing is configured
4. Check browser console for errors

## Best Practices

### Security

1. ✅ Never commit secrets to `render.yaml`
2. ✅ Use `generateValue: true` for secrets
3. ✅ Add OAuth credentials via Dashboard
4. ✅ Enable security headers for frontend
5. ✅ Use HTTPS only (Render default)

### Performance

1. ✅ Choose region close to users
2. ✅ Use build filters to reduce rebuild time
3. ✅ Enable PR previews for testing
4. ✅ Match database and backend regions
5. ✅ Use appropriate service plans

### Maintenance

1. ✅ Version control `render.yaml`
2. ✅ Document customizations
3. ✅ Test changes in staging first
4. ✅ Monitor service health
5. ✅ Keep PostgreSQL version updated

### Cost Optimization

1. ✅ Use free tier for development
2. ✅ Use build filters to reduce build time
3. ✅ Start with starter plans
4. ✅ Scale up as needed
5. ✅ Monitor usage in Dashboard

## Additional Resources

- **Render Blueprint Spec**: https://render.com/docs/blueprint-spec
- **Render Services**: https://render.com/docs/services
- **Environment Variables**: https://render.com/docs/environment-variables
- **Custom Domains**: https://render.com/docs/custom-domains
- **Deployment**: [render-github-actions-integration-plan.md](./render-github-actions-integration-plan.md)

## Next Steps

After understanding `render.yaml`:

1. ✅ Customize service names if needed
2. ✅ Choose appropriate regions
3. ✅ Select service plans
4. ✅ Commit and push to GitHub
5. ✅ Deploy via Blueprint
6. ✅ Add OAuth credentials (optional)
7. ✅ Run database migrations
8. ✅ Test deployment

**Ready to deploy?** Follow the [Quick Start Guide](./QUICK-START-RENDER-DEPLOY.md)

---

**Last Updated**: October 29, 2025
**Blueprint Version**: 1.0.0
**Render API Version**: v1
