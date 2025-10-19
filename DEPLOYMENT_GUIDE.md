# ViSort-Defense Deployment Guide

## 🎯 Deployment Strategy
- **Frontend**: Vercel (React App)
- **Backend**: Railway (Node.js + Express)
- **Database**: MongoDB Atlas
- **Model**: TensorFlow.js (Client-side + Server-side)

## 📁 Project Structure
```
ViSort-Defense/
├── frontend/          # React App (→ Vercel)
├── backend/           # Node.js API (→ Railway)
├── model/             # TensorFlow.js Model
└── deployment/        # Deployment configs
```

## 🔧 Environment Variables Needed

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/visort
PORT=5000
NODE_ENV=production
```

## 📋 Deployment Checklist
- [ ] GitHub repository setup
- [ ] Environment variables configured
- [ ] Model files optimized
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] MongoDB Atlas database setup
- [ ] Domain configuration
- [ ] SSL certificates
- [ ] Performance optimization

## 🚀 Next Steps
1. Set up GitHub repository
2. Configure environment variables
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Test end-to-end functionality
