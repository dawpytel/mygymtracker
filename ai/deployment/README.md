# Deployment Documentation

Complete deployment guides for MyGymTracker on Render.com with GitHub Actions CI/CD.

## 📚 Documentation Index

### Quick Start Guides

1. **[Quick Start: Deploy to Render.com](QUICK-START-RENDER-DEPLOY.md)** ⚡

   - Get deployed in under 30 minutes
   - Step-by-step beginner-friendly guide
   - Best for: First-time deployment, MVPs, side projects

2. **[Render.yaml Configuration Guide](render-yaml-guide.md)** 📝

   - Complete guide to the Blueprint file
   - Customization options explained
   - Best practices and troubleshooting

3. **[Secrets Setup Checklist](secrets-setup-checklist.md)** 🔐
   - Complete checklist for all secrets
   - Step-by-step secret generation
   - Troubleshooting guide included

### Comprehensive Guides

4. **[Render + GitHub Actions Integration Plan](render-github-actions-integration-plan.md)** 📋

   - Complete step-by-step integration guide
   - Production-ready deployment setup
   - Includes monitoring, scaling, and security
   - Best for: Production applications, teams

5. **[Deployment Strategies Comparison](deployment-strategies-comparison.md)** ⚖️
   - Compare manual vs auto-deploy
   - Pros/cons of each approach
   - Recommendations by use case
   - Migration guides

## 🚀 Quick Navigation

### I want to...

**Deploy quickly for testing/MVP**
→ Start with [Quick Start Guide](QUICK-START-RENDER-DEPLOY.md)
→ Use Auto-Deploy strategy

**Set up production deployment with full control**
→ Read [Complete Integration Plan](render-github-actions-integration-plan.md)
→ Use Manual Deployment strategy

**Compare deployment options**
→ Check [Strategies Comparison](deployment-strategies-comparison.md)

**Configure all secrets and environment variables**
→ Follow [Secrets Setup Checklist](secrets-setup-checklist.md)

**Customize the render.yaml Blueprint file**
→ Read [Render.yaml Configuration Guide](render-yaml-guide.md)

**Understand the differences between approaches**
→ Read [Strategies Comparison](deployment-strategies-comparison.md)

## 📊 Deployment Strategies Overview

### Strategy 1: Manual Deployment

- **Workflow File**: `.github/workflows/deploy-production.yml`
- **Complexity**: More complex
- **Control**: Full control
- **Best For**: Production apps, teams, when you need approvals
- **Setup Time**: ~30 minutes

### Strategy 2: Auto-Deploy

- **Workflow File**: `.github/workflows/ci-and-auto-deploy.yml`
- **Complexity**: Simpler
- **Control**: Less control
- **Best For**: MVPs, side projects, solo developers
- **Setup Time**: ~15 minutes

See [Deployment Strategies Comparison](deployment-strategies-comparison.md) for detailed comparison.

## 🎯 Recommended Reading Order

### For Beginners

1. Start with [Quick Start Guide](QUICK-START-RENDER-DEPLOY.md)
2. Follow [Secrets Setup Checklist](secrets-setup-checklist.md)
3. Optionally read [Strategies Comparison](deployment-strategies-comparison.md)

### For Production Setup

1. Read [Complete Integration Plan](render-github-actions-integration-plan.md)
2. Follow [Secrets Setup Checklist](secrets-setup-checklist.md)
3. Review [Strategies Comparison](deployment-strategies-comparison.md)
4. Implement monitoring and security from [Integration Plan](render-github-actions-integration-plan.md)

### For Teams

1. Review [Strategies Comparison](deployment-strategies-comparison.md)
2. Read [Complete Integration Plan](render-github-actions-integration-plan.md)
3. Set up approval workflows (covered in Integration Plan)
4. Configure team notifications

## 🛠️ Available Workflow Files

Located in `.github/workflows/`:

### 1. `deploy-production.yml`

**Manual Deployment Strategy**

- Runs CI checks (lint, unit tests, e2e tests)
- Explicitly deploys to Render via API
- Runs health checks
- Posts deployment summary
- Creates GitHub deployments

**When to use:** Production applications, need approval gates, want deployment tracking

### 2. `ci-and-auto-deploy.yml`

**Auto-Deploy Strategy**

- Runs CI checks (lint, unit tests, e2e tests)
- Notifies that Render will auto-deploy
- Simpler setup, fewer secrets

**When to use:** MVPs, side projects, prefer simplicity

### 3. `pull-request.yml`

**Existing PR CI**

- Runs on pull requests
- Lint, unit tests, e2e tests
- Posts PR status comment
- Already configured

**Note:** Both deployment strategies use these CI checks

## 📋 Prerequisites Checklist

Before deploying, ensure you have:

- [ ] GitHub repository set up
- [ ] Render.com account created
- [ ] All local tests passing
- [ ] `render.yaml` file in repository root
- [ ] Docker files configured (`backend/Dockerfile`, `frontend/Dockerfile`)
- [ ] Environment variables documented

## 🔑 Required Secrets Summary

### For Auto-Deploy (Minimum)

- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

### For Manual Deployment (Additional)

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID_BACKEND`
- `RENDER_SERVICE_ID_FRONTEND`

### Optional OAuth Secrets

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

Full details in [Secrets Setup Checklist](secrets-setup-checklist.md)

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│  GitHub Repository  │
│    (main branch)    │
└──────────┬──────────┘
           │
           │ Push/Merge
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  ├─ Lint            │
│  ├─ Unit Tests      │
│  ├─ E2E Tests       │
│  └─ Deploy          │
└──────────┬──────────┘
           │
           │ Deploy
           ▼
┌─────────────────────┐
│   Render.com        │
│  ├─ Backend API     │
│  ├─ Frontend Web    │
│  └─ PostgreSQL DB   │
└─────────────────────┘
```

## 💰 Cost Breakdown

### Free Tier (Development)

- Backend: Free (spins down after 15 min)
- Frontend: Free (always on)
- Database: Free (90-day trial)
- **Total: $0/month**

### Starter Tier (Production Recommended)

- Backend: $7/month (always on)
- Frontend: Free
- Database: $7/month (backups included)
- **Total: $14/month**

### Standard Tier (Growing Apps)

- Backend: $25/month
- Frontend: Free
- Database: $20/month
- **Total: $45/month**

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://mygymtracker-api.onrender.com/api/health

# Frontend
curl https://mygymtracker-web.onrender.com
```

### Logs

- **Render Dashboard**: Real-time logs for each service
- **GitHub Actions**: Workflow run logs

### Metrics

- Monitor in Render Dashboard → Service → Metrics tab
- CPU, Memory, Response times, Error rates

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
→ Check GitHub Actions logs
→ Verify all secrets are set
→ Check Render service logs

**Database Connection Issues**
→ Verify environment variables
→ Check database is running
→ Run migrations manually

**Cold Starts (Free Tier)**
→ Expected on free tier after 15 min inactivity
→ Upgrade to Starter tier ($7/month) for always-on

Full troubleshooting guide in [Integration Plan](render-github-actions-integration-plan.md#troubleshooting)

## 📖 Additional Resources

### Documentation

- [Render Documentation](https://render.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

### Support

- [Render Support](https://render.com/support)
- [Render Status](https://status.render.com)
- [GitHub Actions Community](https://github.community/c/actions)

## 🤝 Contributing

Found an issue or have a suggestion?

1. Open an issue in the repository
2. Submit a pull request with improvements
3. Update documentation as needed

## 📅 Version History

- **v1.0.0** (Oct 29, 2025)
  - Initial deployment documentation
  - Two deployment strategies
  - Complete integration guides
  - Secrets setup checklist
  - Strategies comparison

## 📞 Getting Help

**For deployment issues:**

1. Check troubleshooting sections in guides
2. Review Render Dashboard logs
3. Check GitHub Actions workflow logs
4. Contact Render support

**For CI/CD issues:**

1. Check GitHub Actions logs
2. Verify secrets are configured
3. Review workflow file syntax
4. Check GitHub Actions status page

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Verify backend health endpoint
- [ ] Verify frontend loads correctly
- [ ] Test user registration/login
- [ ] Test all major features
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up backup strategy
- [ ] Document deployment process for team
- [ ] Plan scaling strategy

## 🎓 Learning Path

**Level 1: Beginner**
→ Deploy using Quick Start Guide
→ Understand basic CI/CD concepts
→ Monitor deployments in Render

**Level 2: Intermediate**
→ Implement manual deployment strategy
→ Add deployment approvals
→ Set up staging environment
→ Configure monitoring

**Level 3: Advanced**
→ Implement blue-green deployments
→ Add canary deployments
→ Set up automated rollbacks
→ Implement custom deployment logic
→ Multi-region deployments

---

**Last Updated**: October 29, 2025  
**Maintained By**: MyGymTracker Team  
**Documentation Version**: 1.0.0

**Start Here**: [Quick Start Guide](QUICK-START-RENDER-DEPLOY.md) 🚀
