# My Gym Tracker

NestJS backend + React frontend application for tracking gym workouts.

## Prerequisites

- Node.js 18.x or 20.x
- Docker and Docker Compose
- Git

## Initial Git Setup (First Time)

If you're setting up the project for the first time, follow these steps to commit the new project structure:

### 1. Check Current Status

```bash
git status
```

### 2. Remove Old Files from Git

```bash
# Remove all deleted files from the old structure
git add -u
```

### 3. Add New Project Files

```bash
# Add the new backend directory
git add backend/

# Add the new frontend directory
git add frontend/

# Add docker-compose configuration
git add docker-compose.yml

# Add updated README and gitignore
git add README.md .gitignore
```

### 4. Commit the New Structure

```bash
git commit -m "feat: migrate to NestJS backend and React frontend

- Replace JHipster with custom NestJS + React stack
- Add TypeORM for database ORM
- Add Tailwind CSS for frontend styling
- Configure Docker Compose for PostgreSQL and PgAdmin
- Update project documentation"
```

### 5. Push to Remote (Optional)

```bash
# Push to your repository
git push origin main
```

## Getting Started

### 1. Clone and Setup

\`\`\`bash
git clone <your-repo-url>
cd my-fullstack-app
\`\`\`

### 2. Environment Configuration

\`\`\`bash

# Backend

cp backend/.env.example backend/.env

# Edit backend/.env with your configuration

# Frontend

cp frontend/.env.example frontend/.env

# Edit frontend/.env with your configuration

\`\`\`

### 3. Start Database

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Start Backend

\`\`\`bash
cd backend
npm install
npm run start:dev
\`\`\`

Backend runs at: http://localhost:3000
API Docs: http://localhost:3000/api/docs

### 5. Start Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Frontend runs at: http://localhost:5173

## Project Structure

\`\`\`
my-fullstack-app/
├── backend/ # NestJS API
├── frontend/ # React application
├── docker-compose.yml
└── README.md
\`\`\`

## Useful Commands

### Backend

- \`npm run start:dev\` - Development mode with hot reload
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`nest g resource <name>\` - Generate CRUD resource

### Frontend

- \`npm run dev\` - Development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

### Database

- \`docker-compose up -d\` - Start database
- \`docker-compose down\` - Stop database
- PgAdmin: http://localhost:5050 (admin@admin.com / admin)

## Tech Stack

**Backend:**

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

**Frontend:**

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

## Git Workflow

### Common Git Commands

```bash
# Check current status
git status

# Stage specific files
git add <file-name>

# Stage all changes
git add .

# Commit with message
git commit -m "your commit message"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main
```

### Commit Message Convention

Follow conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:

```bash
git commit -m "feat: add user authentication endpoint"
```

## License

MIT
