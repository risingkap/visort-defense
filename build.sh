#!/bin/bash
# Railway build script for ViSort-Defense
# This script builds both frontend and backend for production deployment

echo "🚀 Building ViSort-Defense for Railway deployment..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd visort-last/backend
npm install

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🔨 Building React frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "🎯 Ready for Railway deployment!"
