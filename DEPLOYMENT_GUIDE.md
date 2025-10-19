#!/bin/bash
# ViSort-Defense Deployment Guide

echo "🚀 ViSort-Defense Deployment Guide 🚀"
echo "======================================"
echo ""

echo "📋 DEPLOYMENT STATUS:"
echo "✅ Backend: Railway (https://your-backend.railway.app)"
echo "⏳ Frontend: Deploy to Vercel"
echo ""

echo "🎯 FRONTEND DEPLOYMENT (Vercel):"
echo "1. Go to https://vercel.com"
echo "2. Sign up with GitHub account (risingkap)"
echo "3. Click 'New Project'"
echo "4. Select repository: risingkap/visort-defense"
echo "5. Set Root Directory: visort-last/frontend"
echo "6. Add Environment Variable:"
echo "   REACT_APP_API_URL=https://your-backend.railway.app"
echo "7. Deploy!"
echo ""

echo "🔧 BACKEND DEPLOYMENT (Railway):"
echo "1. Go to https://railway.app"
echo "2. Sign up with GitHub account (risingkap)"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select repository: risingkap/visort-defense"
echo "5. Add Environment Variables:"
echo "   NODE_ENV=production"
echo "   MONGODB_URI=your_mongodb_connection_string"
echo "6. Deploy!"
echo ""

echo "📊 FINAL RESULT:"
echo "Frontend: https://your-frontend.vercel.app"
echo "Backend API: https://your-backend.railway.app/api"
echo "TensorFlow Model: https://your-backend.railway.app/model"
echo ""

echo "🎉 Your AI waste classification system will be live!"