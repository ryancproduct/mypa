#!/bin/bash

# MyPA Backend Deployment Script
# This script deploys the backend API to Vercel

set -e

echo "🚀 Deploying MyPA Backend API to Vercel..."

# Check if we're in the right directory
if [ ! -f "api/package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Navigate to API directory
cd api

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Backend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - JWT_SECRET"
echo "   - ALLOWED_ORIGINS"
echo ""
echo "2. Update frontend VITE_API_BASE_URL to point to your Vercel URL"
echo "3. Generate JWT tokens for frontend authentication"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
