#!/bin/bash
# ViSort-Defense Deployment Script
# This script helps you deploy your project step by step

echo "🚀 ViSort-Defense Deployment Script"
echo "===================================="

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

echo ""
echo "📋 Deployment Checklist:"
echo "1. GitHub repository setup"
echo "2. MongoDB Atlas database"
echo "3. Backend deployment (Railway)"
echo "4. Frontend deployment (Vercel)"
echo "5. Model deployment"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not found. Please initialize git first."
    exit 1
fi

print_status "Git repository found"

# Check if required files exist
if [ ! -f "visort-last/frontend/package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi

if [ ! -f "visort-last/backend/package.json" ]; then
    print_error "Backend package.json not found"
    exit 1
fi

if [ ! -f "visort-last/backend/public/model/model.json" ]; then
    print_error "TensorFlow.js model not found"
    exit 1
fi

print_status "All required files found"

echo ""
echo "🔧 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git remote add origin https://github.com/yourusername/visort-defense.git"
echo "   git push -u origin main"
echo ""
echo "2. Set up MongoDB Atlas:"
echo "   - Go to https://cloud.mongodb.com"
echo "   - Create a new cluster"
echo "   - Get your connection string"
echo "   - Update backend_env_example.txt with your credentials"
echo ""
echo "3. Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub repository"
echo "   - Deploy the backend folder"
echo "   - Add environment variables from backend_env_example.txt"
echo ""
echo "4. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Connect your GitHub repository"
echo "   - Deploy the frontend folder"
echo "   - Add environment variables from frontend_env_example.txt"
echo ""
echo "5. Update API URLs:"
echo "   - Copy your Railway backend URL"
echo "   - Update REACT_APP_API_URL in Vercel"
echo ""

print_status "Deployment script completed!"
print_warning "Don't forget to update your environment variables with real values!"
