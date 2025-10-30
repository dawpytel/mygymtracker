# My Gym Tracker

A web application for tracking gym workouts, designed for experienced fitness enthusiasts who program their own workouts and need a simple yet effective tool to monitor their progress.

**Live Application:** [https://mygymtracker-web.onrender.com](https://mygymtracker-web.onrender.com)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Start Database](#3-start-database)
  - [4. Start Backend](#4-start-backend)
  - [5. Start Frontend](#5-start-frontend)
- [Environment Variables](#environment-variables)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Backend Commands](#backend-commands)
  - [Frontend Commands](#frontend-commands)
  - [Database Commands](#database-commands)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
  - [GitHub Workflows](#github-workflows)
  - [GitHub Secrets Configuration](#github-secrets-configuration)
- [Deployment](#deployment)
  - [Deploying to Render](#deploying-to-render)
  - [Post-Deployment Configuration](#post-deployment-configuration)
- [OAuth Configuration](#oauth-configuration)
  - [Google OAuth Setup](#google-oauth-setup)
- [Git Workflow](#git-workflow)
- [License](#license)

## Purpose

This application was created as part of the 10xdevs training program. I have no ambitions to develop it further (although who knows), it was created purely as a hobby project.

This is the first application I've created in 10 years. My last decade has been primarily spent working as an engineering leader at Jamf, where the workload and responsibilities didn't allow me to develop my skills as a programmer. In addition, in this project I worked with NodeJS and React, technologies with which I don't have professional experience.

Thanks to working on this application, I learned how to work within effective way with AI: how to use it as an assistant, coder, reviewer, but also how to build an effective workflow and processes to deliver solutions. Don't confuse it with "Vibe Coding" because the work process was very well thought out, structured, and efficient.

## Overview

My Gym Tracker is a web-based workout tracking application designed for experienced fitness enthusiasts like powerlifters and bodybuilders who can independently create training plans and only need a simple and efficient way to track their sessions and progress.

Unlike most workout apps designed for beginners, My Gym Tracker focuses solely on tracking training data without unnecessary complexity.

## Features

- **User Authentication**: Email/password and OAuth (Google) authentication
- **Workout Plans**: Create, edit, and delete reusable workout plan templates
- **Workout Sessions**: Execute workouts based on your plans with real-time tracking
- **Exercise Database**: Pre-populated with 100+ popular strength exercises
- **Smart Warmup Recommendations**: Intelligent warmup set suggestions based on historical data
- **Workout History**: View, edit, and manage all your completed workouts
- **Progress Tracking**: Track sets, reps, load, and RPE across all exercises

## Tech Stack

### Backend

- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **ORM**: TypeORM
- **Database**: PostgreSQL 15
- **Authentication**: JWT with Passport, OAuth (Google)
- **API Documentation**: Swagger/OpenAPI
- **Security**: Helmet, bcrypt password hashing

### Frontend

- **Framework**: React 19
- **Language**: TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **State Management**: Zustand
- **OAuth**: @react-oauth/google

### DevOps & Infrastructure

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Render.com
- **Database Management**: pgAdmin 4

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or 20.x (recommended: 20.x)
- **npm**: 9.x or higher (comes with Node.js)
- **Docker**: Latest version
- **Docker Compose**: v2.x or higher
- **Git**: Latest version
- **PostgreSQL Client** (optional, for manual database operations): psql 15.x

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mygymtracker.git
cd mygymtracker
```

### 2. Environment Configuration

The application requires environment variables for both backend and frontend. Create the following files:

#### Backend Environment File

Create `backend/.env` with the following configuration:

```bash
# Node Environment
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myapp_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# OAuth Configuration (Optional for local development)
GOOGLE_CLIENT_ID=your-google-client-id-from-console.cloud.google.com
```

#### Frontend Environment File

Create `frontend/.env.local` with the following configuration:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# OAuth Configuration (Optional for local development)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console.cloud.google.com
```

> **Note**: Replace placeholder values with your actual credentials. For OAuth setup, see the [OAuth Configuration](#oauth-configuration) section.

### 3. Start Database

Start PostgreSQL and pgAdmin using Docker Compose:

```bash
docker-compose up -d
```

Verify the database is running:

```bash
docker-compose ps
```

**Access pgAdmin**: http://localhost:5050

- Email: `admin@admin.com`
- Password: `admin`

### 4. Start Backend

```bash
cd backend
npm install

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

The backend will be available at:

- **API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

### 5. Start Frontend

Open a new terminal:

```bash
cd frontend
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

## Environment Variables

### Backend Environment Variables

| Variable           | Required | Default       | Description                                            |
| ------------------ | -------- | ------------- | ------------------------------------------------------ |
| `NODE_ENV`         | Yes      | `development` | Node environment (`development`, `production`, `test`) |
| `DB_HOST`          | Yes      | `localhost`   | PostgreSQL host                                        |
| `DB_PORT`          | Yes      | `5432`        | PostgreSQL port                                        |
| `DB_USERNAME`      | Yes      | `postgres`    | Database username                                      |
| `DB_PASSWORD`      | Yes      | `postgres`    | Database password                                      |
| `DB_NAME`          | Yes      | `myapp_dev`   | Database name                                          |
| `JWT_SECRET`       | Yes      | -             | Secret key for JWT tokens (use strong random string)   |
| `JWT_EXPIRES_IN`   | Yes      | `7d`          | JWT token expiration time                              |
| `PORT`             | Yes      | `3000`        | Backend server port                                    |
| `FRONTEND_URL`     | Yes      | -             | Frontend URL for CORS configuration                    |
| `GOOGLE_CLIENT_ID` | No       | -             | Google OAuth Client ID (required for Google login)     |

### Frontend Environment Variables

| Variable                | Required | Default | Description                                         |
| ----------------------- | -------- | ------- | --------------------------------------------------- |
| `VITE_API_URL`          | Yes      | -       | Backend API URL (e.g., `http://localhost:3000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | No       | -       | Google OAuth Client ID (required for Google login)  |

> **Security Note**: Never commit `.env` files to version control. Use `.env.example` files as templates.

## Project Structure

```
mygymtracker/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD workflows
│       ├── pull-request.yml # PR checks (lint, unit tests, e2e tests)
│       └── deploy-production.yml # Production deployment
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication module (JWT, OAuth)
│   │   ├── users/          # User management
│   │   ├── exercises/      # Exercise catalog
│   │   ├── workout-plans/  # Workout plan management
│   │   ├── sessions/       # Workout session tracking
│   │   ├── db/             # Database configuration and migrations
│   │   └── main.ts         # Application entry point
│   ├── test/               # E2E tests
│   ├── Dockerfile          # Backend container configuration
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── views/          # Page-level components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility functions
│   ├── Dockerfile          # Frontend container configuration
│   ├── nginx.conf          # Nginx configuration for production
│   └── package.json
├── docker-compose.yml       # Local development services
├── render.yaml             # Render.com deployment configuration
└── README.md
```

## Development

### Backend Commands

```bash
# Development
npm run start:dev           # Start with hot reload
npm run start:debug         # Start with debugger

# Build
npm run build               # Build for production

# Code Quality
npm run lint                # Run ESLint
npm run format              # Format code with Prettier

# Testing
npm run test                # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Run tests with coverage
npm run test:e2e            # Run end-to-end tests

# Database
npm run migration:generate  # Generate migration from entities
npm run migration:create    # Create empty migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
npm run migration:show      # Show migration status
```

### Frontend Commands

```bash
# Development
npm run dev                 # Start development server

# Build
npm run build               # Build for production
npm run preview             # Preview production build locally

# Code Quality
npm run lint                # Run ESLint
```

### Database Commands

```bash
# Start database services
docker-compose up -d

# Stop database services
docker-compose down

# View logs
docker-compose logs -f postgres

# Access PostgreSQL CLI
docker exec -it myapp-postgres psql -U postgres -d myapp_dev

# Backup database
docker exec myapp-postgres pg_dump -U postgres myapp_dev > backup.sql

# Restore database
docker exec -i myapp-postgres psql -U postgres myapp_dev < backup.sql
```

## Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests

```bash
cd backend
npm run test              # Run all unit tests
npm run test:cov          # Run with coverage report
```

### End-to-End Tests

E2E tests verify complete user workflows:

```bash
cd backend
npm run test:e2e
```

Tests cover:

- User authentication (email/password, OAuth)
- Workout plan CRUD operations
- Exercise management
- Workout session tracking
- Historical data access

### Test Coverage

Target coverage metrics:

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

### GitHub Workflows

#### 1. Pull Request CI (`pull-request.yml`)

Triggered on: Pull requests and pushes to `main` or `develop` branches

**Pipeline Steps:**

1. **Lint**: ESLint code quality checks
2. **Unit Tests**: Jest unit tests with coverage
3. **E2E Tests**: Full integration tests with PostgreSQL
4. **Status Comment**: Posts results to PR

**Duration**: ~5-7 minutes

#### 2. Production Deployment (`deploy-production.yml`)

Triggered on: Manual workflow dispatch (requires approval)

**Pipeline Steps:**

1. **Lint**: Code quality verification
2. **Unit Tests**: Unit test suite
3. **E2E Tests**: Integration test suite
4. **Deploy**: Deploy to Render (backend + frontend)
5. **Health Checks**: Verify deployment success
6. **Notify**: Post deployment status

**Duration**: ~10-15 minutes

### GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

#### For CI/CD Testing (Environment: `Integration`)

Navigate to: `Settings → Environments → Integration → Add secret`

| Secret Name            | Description            | Example                                 |
| ---------------------- | ---------------------- | --------------------------------------- |
| `DB_HOST`              | Test database host     | `localhost`                             |
| `DB_PORT`              | Test database port     | `5432`                                  |
| `DB_USERNAME`          | Test database username | `postgres`                              |
| `DB_PASSWORD`          | Test database password | `postgres`                              |
| `DB_NAME`              | Test database name     | `myapp_db`                              |
| `JWT_SECRET`           | JWT secret for tests   | Generate with `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret   | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID | From Google Cloud Console               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret    | From Google Cloud Console               |

#### For Production Deployment (Environment: `production`)

Navigate to: `Settings → Environments → production → Add secret`

| Secret Name                  | Description                     |
| ---------------------------- | ------------------------------- |
| `RENDER_API_KEY`             | API key from Render dashboard   |
| `RENDER_SERVICE_ID_BACKEND`  | Backend service ID from Render  |
| `RENDER_SERVICE_ID_FRONTEND` | Frontend service ID from Render |

**To get Render credentials:**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to Account Settings → API Keys
3. Create a new API key
4. Copy service IDs from each service's Settings page

## Deployment

### Deploying to Render

The project is configured for easy deployment to Render.com using Infrastructure as Code.

#### Prerequisites

1. Create a [Render.com](https://render.com) account
2. Set up a [Google OAuth Client](https://console.cloud.google.com/) (see [OAuth Configuration](#oauth-configuration))

#### Automatic Deployment

1. **Fork or push this repository to GitHub**

2. **Create a new Blueprint in Render:**

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the branch: `main`
   - Render will read `render.yaml` and create:
     - PostgreSQL database (`mygymtracker-db`)
     - Backend API service (`mygymtracker-api`)
     - Frontend static site (`mygymtracker-web`)

3. **Wait for initial deployment** (~10-15 minutes)

4. **Configure OAuth variables** (see [Post-Deployment Configuration](#post-deployment-configuration))

#### Manual Deployment (Alternative)

If you prefer manual setup:

1. **Create PostgreSQL Database:**

   - New → PostgreSQL
   - Name: `mygymtracker-db`
   - Plan: Free (or higher)

2. **Create Backend Service:**

   - New → Web Service
   - Build: Docker
   - Dockerfile Path: `./backend/Dockerfile`
   - Environment Variables: See `render.yaml` for reference

3. **Create Frontend Service:**
   - New → Static Site
   - Build Command: `cd frontend && npm ci && npm run build`
   - Publish Directory: `frontend/dist`

### Post-Deployment Configuration

After deployment, configure OAuth:

1. **Set up Google OAuth redirect URLs:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your OAuth Client
   - Add authorized origins:
     - `https://mygymtracker-web.onrender.com`
   - Add authorized redirect URIs:
     - `https://mygymtracker-web.onrender.com`

2. **Add OAuth environment variables in Render:**

   **Backend Service:**

   - Go to your backend service → Environment
   - Add `GOOGLE_CLIENT_ID` with your Client ID value

   **Frontend Service:**

   - Go to your frontend service → Environment
   - Add `VITE_GOOGLE_CLIENT_ID` with your Client ID value

3. **Trigger redeploy** for both services

4. **Verify deployment:**
   - Backend health: `https://mygymtracker-api.onrender.com/api/health`
   - Frontend: `https://mygymtracker-web.onrender.com`
   - API Docs: `https://mygymtracker-api.onrender.com/api/docs`

> **Note**: Free tier services on Render spin down after 15 minutes of inactivity. First request after sleep may take 30-60 seconds.

## OAuth Configuration

The application supports Google OAuth for streamlined authentication.

### Google OAuth Setup

#### For Local Development

1. **Create OAuth Client:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google+ API"
   - Navigate to: Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Name: "My Gym Tracker (Local)"

2. **Configure OAuth Client:**

   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173`

3. **Copy Client ID** and add to environment variables:
   - Backend `.env`: `GOOGLE_CLIENT_ID=your-client-id`
   - Frontend `.env.local`: `VITE_GOOGLE_CLIENT_ID=your-client-id`

#### For Production

1. **Create Production OAuth Client:**

   - Follow same steps as local
   - Name: "My Gym Tracker (Production)"

2. **Configure Production URLs:**

   - **Authorized JavaScript origins**: `https://mygymtracker-web.onrender.com`
   - **Authorized redirect URIs**: `https://mygymtracker-web.onrender.com`

3. **Add to Render Environment Variables** (see [Post-Deployment Configuration](#post-deployment-configuration))

> **Security Note**: OAuth Client ID is public information and safe to expose in frontend code. Never expose Client Secret in frontend code.

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

**Examples:**

```bash
git commit -m "feat: add warmup calculator for workout sessions"
git commit -m "fix: resolve authentication token expiration issue"
git commit -m "docs: update environment variables documentation"
```

### Common Git Commands

```bash
# Check current status
git status

# Create feature branch
git checkout -b feature/workout-history

# Stage changes
git add .

# Commit with message
git commit -m "feat: add workout history view"

# Push to remote
git push origin feature/workout-history

# Pull latest changes
git pull origin main

# View commit history
git log --oneline --graph

# Switch branches
git checkout main
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make your changes and commit
3. Push branch to GitHub
4. Create Pull Request to `develop`
5. Wait for CI checks to pass
6. Request code review
7. Merge after approval

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for fitness enthusiasts who know how to train**

For questions or issues, please open a GitHub issue.
