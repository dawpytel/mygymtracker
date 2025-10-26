#!/bin/bash

# MyGymTracker Development Startup Script
# This script starts all necessary services for development

set -e

echo "🚀 Starting MyGymTracker Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Start PostgreSQL
echo -e "${BLUE}📦 Starting PostgreSQL...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 3

until docker exec myapp-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}   Still waiting...${NC}"
    sleep 1
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found. Creating one...${NC}"
    cat > backend/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myapp_dev

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

PORT=3000
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Backend .env created!${NC}"
    echo ""
fi

# Check if frontend .env exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env file not found. Creating one...${NC}"
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3000/api
EOF
    echo -e "${GREEN}✅ Frontend .env created!${NC}"
    echo ""
fi

# Run migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
cd backend
npm run migration:run || echo -e "${YELLOW}⚠️  Migrations may have already been run${NC}"
cd ..
echo ""

echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo ""
echo -e "   1. Start the backend (in a new terminal):"
echo -e "      ${GREEN}cd backend && npm run start:dev${NC}"
echo ""
echo -e "   2. Start the frontend (in another new terminal):"
echo -e "      ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "   3. Open your browser:"
echo -e "      ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   - Quick Start Guide: ${GREEN}QUICK-START.md${NC}"
echo -e "   - Frontend Docs: ${GREEN}frontend/IMPLEMENTATION-SUMMARY.md${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: You can run both servers in parallel with:${NC}"
echo -e "   ${GREEN}./start-servers.sh${NC}"
echo ""

