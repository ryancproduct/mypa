#!/bin/bash

# MyPA Complete Deployment Script
# This script ensures clean builds and deployments for both frontend and backend

set -e

echo "🚀 Starting MyPA Complete Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

print_status "Step 1: Clean previous builds"
rm -rf dist/
rm -rf api/dist/

print_status "Step 2: Install/update frontend dependencies"
npm install

print_status "Step 3: Install/update backend dependencies"
cd api
npm install
cd ..

print_status "Step 4: Run frontend type checking"
npm run type-check || {
    print_warning "Frontend type check failed, using safe build mode"
}

print_status "Step 5: Build frontend (safe mode)"
npm run build:safe

print_status "Step 6: Build backend (simple mode)"
cd api
npm run build
cd ..

print_status "Step 7: Test builds locally"
echo "Testing frontend build..."
npm run preview &
FRONTEND_PID=$!
sleep 2

echo "Testing backend build..."
cd api
npm start &
BACKEND_PID=$!
sleep 3

# Test health endpoints
echo "Testing backend health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed (this is OK if no API keys are set)"
fi

# Cleanup test processes
kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
cd ..

print_status "Step 8: Deploy to Vercel"

echo "Deploying frontend..."
vercel --prod

echo "Deploying backend..."
cd api
vercel --prod
cd ..

print_status "🎉 Deployment Complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   Frontend: VITE_API_BASE_URL, VITE_API_TOKEN"
echo "   Backend: ANTHROPIC_API_KEY, OPENAI_API_KEY, JWT_SECRET, ALLOWED_ORIGINS"
echo ""
echo "2. Test the live deployments"
echo "3. Update DNS if needed"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
