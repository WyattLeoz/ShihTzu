# QuickAid - Complete Vercel Deployment Guide

## 🚀 QuickAid Emergency Triage Platform - Vercel Deployment Guide

This guide will help you deploy the complete QuickAid application (both frontend and backend) to Vercel. QuickAid is a full-stack emergency response platform with React frontend, Express backend, and PostgreSQL database.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Migrations](#database-migrations)
- [Post-Deployment Testing](#post-deployment-testing)
- [Troubleshooting](#troubleshooting)
- [Maintenance & Updates](#maintenance--updates)

---

## 🎯 Prerequisites

### Required Accounts & Services

1. **GitHub Account** - For code repository and Vercel integration
2. **Vercel Account** - Free tier is sufficient
3. **Neon PostgreSQL** or **Supabase** - Database hosting (recommended: Neon for simplicity)
4. **Google Cloud Account** - For Gemini AI API key
5. **Git** - Installed locally
6. **Node.js** - v18+ installed locally

### Required Tools

- **Vercel CLI** - `npm install -g vercel`
- **PostgreSQL Client** - Optional, for database management
- **Git** - Version control

---

## 🏗️ Project Overview

### Architecture

```
QuickAid/
├── client/          # React + Vite Frontend
├── server/          # Express + TypeScript Backend
├── .env.example     # Environment variables template
├── README.md        # Project documentation
└── SETUP.md         # Local setup guide
```

### Technology Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Zustand
- **Backend**: Express, TypeScript, PostgreSQL, JWT Auth
- **AI Integration**: Google Gemini API
- **Real-time**: Server-Sent Events (SSE)
- **Database**: PostgreSQL

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database (Neon)

1. **Sign up for Neon**: https://neon.tech
2. **Create a new project**:
   - Click "Create a project"
   - Choose a name (e.g., `quickaid-prod`)
   - Select a region closest to your users
   - Click "Create Project"

3. **Get connection details**:
   - Go to the Neon dashboard
   - Find your project
   - Copy the connection string (format: `postgresql://username:password@host/database`)

### Step 2: Configure Database Connection

Your Neon connection string will look like:
```
postgresql://username:password@ep-cool-region.aws.neon.tech/quickaid?sslmode=require
```

Save this for later use in environment variables.

### Step 3: Enable Connection Pooling (Recommended)

For better performance in serverless environments:

1. In Neon dashboard, go to your project
2. Go to "Connection Details" → "Pooling"
3. Copy the pooled connection string
4. Use this format: `postgresql://quickaid:password@ep-cool-region.aws.neon.tech/quickaid?pgbouncer=true`

---

## 🔐 Environment Variables

### Backend Environment Variables (.env for server/)

Create a `.env` file in the `server/` directory:

```bash
# Database Connection
DATABASE_URL=postgresql://username:password@ep-cool-region.aws.neon.tech/quickaid?sslmode=require

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-MAKE-THIS-SECURE
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-MAKE-THIS-DIFFERENT

# AI Configuration
GEMINI_API_KEY=your-google-gemini-api-key

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS (frontend domain after deployment)
CORS_ORIGIN=https://your-app.vercel.app

# Security
BCRYPT_ROUNDS=12

# Frontend Configuration (for reference)
VITE_API_URL=https://your-backend.vercel.app

# Map Configuration
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

### Frontend Environment Variables (.env for client/)

Create a `.env.production` file in the `client/` directory:

```bash
# API URL (backend domain after deployment)
VITE_API_URL=https://your-backend.vercel.app

# Map Configuration
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

### Generate Secure JWT Secrets

Run this command to generate secure secrets:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 Backend Deployment

### Step 1: Prepare Server for Vercel

Create a `vercel.json` file in the `server/` directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Package.json for Production

Ensure your `server/package.json` has the correct scripts:

```json
{
  "name": "quickaid-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "tsx src/db/migrate.ts",
    "seed": "tsx src/db/seed.ts",
    "reset-db": "tsx reset-db.ts"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "express-validator": "^7.2.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.13.1",
    "pino": "^9.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.10.5",
    "@types/pg": "^8.11.10",
    "pino-pretty": "^13.1.3",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

### Step 3: Create .gitignore for Server

Ensure `server/.gitignore` includes:

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

### Step 4: Deploy to Vercel

#### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to server directory**:
   ```bash
   cd server
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Follow the prompts**:
   - Link to existing project or create new
   - Project name: `quickaid-backend` (or your preferred name)
   - Override defaults if needed
   - Add environment variables when prompted

6. **Set environment variables**:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add JWT_REFRESH_SECRET production
   vercel env add GEMINI_API_KEY production
   vercel env add CORS_ORIGIN production
   vercel env add BCRYPT_ROUNDS production
   ```

#### Option B: Deploy via Vercel Dashboard

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/quickaid.git
   git push -u origin main
   ```

2. **Deploy from Vercel Dashboard**:
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset**: "Other"
     - **Root Directory**: `server/`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist/`
     - **Install Command**: `npm install`
   - Click "Deploy"

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all the required variables from the Environment Variables section
   - Click "Save"

### Step 5: Deploy to Production

```bash
cd server
vercel --prod
```

Your backend will be deployed at: `https://quickaid-backend.vercel.app`

---

## 🎨 Frontend Deployment

### Step 1: Prepare Client for Vercel

Create a `vercel.json` file in the `client/` directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Vite Config for Production

Update `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/', // Important for proper deployment
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sse': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion', 'tailwind-merge'],
          'data-vendor': ['@tanstack/react-query', 'axios', 'zustand'],
        },
      },
    },
  },
})
```

### Step 3: Create .gitignore for Client

Ensure `client/.gitignore` includes:

```
node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
```

### Step 4: Deploy to Vercel

#### Option A: Deploy via Vercel CLI

1. **Navigate to client directory**:
   ```bash
   cd ../client
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Project name: `quickaid-frontend` (or your preferred name)
   - Add environment variables when prompted

4. **Set environment variables**:
   ```bash
   vercel env add VITE_API_URL production
   vercel env add VITE_MAP_CENTER_LAT production
   vercel env add VITE_MAP_CENTER_LNG production
   vercel env add VITE_MAP_DEFAULT_ZOOM production
   ```

#### Option B: Deploy via Vercel Dashboard

1. **Import Repository** (if not already done):
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import the same repository
   - Configure:
     - **Framework Preset**: "Vite"
     - **Root Directory**: `client/`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist/`
   - Click "Deploy"

2. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_URL`: `https://quickaid-backend.vercel.app`
   - Add other required variables

### Step 5: Deploy to Production

```bash
cd client
vercel --prod
```

Your frontend will be deployed at: `https://quickaid-frontend.vercel.app`

---

## 🔄 Database Migrations

### Step 1: Connect to Database

Locally, set up a temporary connection to your production database:

```bash
# Create a temporary local .env file
cd server
cat > .env.prod << EOF
DATABASE_URL=your-neon-connection-string
JWT_SECRET=temp-secret
JWT_REFRESH_SECRET=temp-refresh-secret
GEMINI_API_KEY=temp-key
EOF

# Load environment variables
export $(cat .env.prod | xargs)
```

### Step 2: Run Migrations

```bash
# Run database migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### Step 3: Clean Up

```bash
rm .env.prod
```

### Alternative: Remote Database Migration

If you prefer to run migrations remotely:

1. **SSH into your deployment** (if available) or use Vercel's build hooks
2. **Add migration to build process** in `server/package.json`:

```json
{
  "scripts": {
    "postinstall": "npm run build && npm run migrate"
  }
}
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check

Test your backend health endpoint:

```bash
curl https://quickaid-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-18T10:00:00.000Z"
}
```

### 2. Database Connection

Test database connectivity by checking server logs in Vercel Dashboard.

### 3. Frontend Access

1. **Open your frontend URL**: `https://quickaid-frontend.vercel.app`
2. **Test user registration**:
   - Click "Register"
   - Fill in the form
   - Submit and verify successful registration

### 4. API Endpoints

Test key endpoints:

```bash
# Registration
curl -X POST https://quickaid-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "responder"
  }'

# Login
curl -X POST https://quickaid-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 5. AI Integration

Test the AI triage functionality:
1. Login as a responder or supervisor
2. Navigate to an incident
3. Click "Start AI Triage"
4. Verify AI response streaming

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. CORS Errors

**Problem**: Frontend can't communicate with backend
**Solution**:
- Check `CORS_ORIGIN` environment variable in backend
- Ensure it matches your frontend URL exactly
- In Vercel Dashboard, verify environment variables are set

#### 2. Database Connection Issues

**Problem**: Server can't connect to PostgreSQL
**Solution**:
- Verify `DATABASE_URL` is correct
- Ensure SSL is enabled (Neon requires SSL)
- Check if connection pooling is needed for serverless
- Test connection locally first:

```bash
psql $DATABASE_URL
```

#### 3. 404 Errors on API Calls

**Problem**: API endpoints returning 404
**Solution**:
- Check `vercel.json` routing configuration
- Ensure backend is properly built and deployed
- Verify build output directory is correct
- Check Vercel deployment logs

#### 4. Environment Variables Not Loading

**Problem**: Configuration values not available
**Solution**:
- Ensure variables are added in Vercel Dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding environment variables
- Use Vercel CLI: `vercel env ls`

#### 5. Build Failures

**Problem**: Build process fails
**Solution**:
- Check deployment logs in Vercel Dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation works locally
- Check for missing type definitions

#### 6. Authentication Issues

**Problem**: JWT tokens not working
**Solution**:
- Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure they match between environments
- Check token expiration times
- Verify CORS is configured correctly

#### 7. Map Not Loading

**Problem**: Leaflet maps not displaying
**Solution**:
- Check map configuration variables
- Ensure Leaflet CSS/JS are properly loaded
- Verify map container has defined height
- Check console for specific map errors

---

## 🛠️ Maintenance & Updates

### Updating the Application

1. **Make changes locally**
2. **Test locally**:
   ```bash
   # Test backend
   cd server && npm run dev

   # Test frontend
   cd client && npm run dev
   ```

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```

4. **Deploy updates**:
   ```bash
   # Update backend
   cd server && vercel --prod

   # Update frontend
   cd client && vercel --prod
   ```

### Database Updates

For schema changes:

1. **Create migration file** in `server/src/db/migrations/`
2. **Run migration**:
   ```bash
   cd server
   npm run migrate
   ```
3. **Deploy backend** with updated migration

### Monitoring

- **Vercel Dashboard**: Monitor deployments and logs
- **Neon Dashboard**: Monitor database performance
- **Vercel Analytics**: Track frontend performance
- **Error Tracking**: Consider adding Sentry or similar

### Backup Strategy

- **Neon**: Automatic backups included
- **Manual backups**: Export database periodically
- **Environment variables**: Keep secure backups locally

---

## 📊 Performance Optimization

### Backend Optimizations

1. **Database Connection Pooling**:
   - Use Neon's connection pooling
   - Adjust pool size based on traffic

2. **Caching Strategy**:
   - Implement Redis for frequently accessed data
   - Cache API responses where appropriate

3. **Rate Limiting**:
   - Current implementation uses `express-rate-limit`
   - Adjust limits based on production usage

### Frontend Optimizations

1. **Code Splitting**:
   - Already configured in vite.config.ts
   - Review chunk sizes and optimize

2. **Image Optimization**:
   - Use Vercel's image optimization
   - Implement lazy loading

3. **Bundle Analysis**:
   ```bash
   cd client
   npm run build
   npx vite-bundle-visualizer
   ```

---

## 🔒 Security Considerations

### Backend Security

- ✅ **Helmet.js** - Security headers
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **JWT Authentication** - Secure token handling
- ✅ **CORS Configuration** - Controlled access
- ✅ **Input Validation** - Zod schemas
- ✅ **Password Hashing** - Bcrypt

### Frontend Security

- ✅ **Environment Variables** - Server-side only
- ✅ **HTTPS Only** - Secure communication
- ✅ **Secure Cookies** - HttpOnly cookies
- ✅ **XSS Protection** - React's built-in protection

### Production Security Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS everywhere
- [ ] Set up monitoring and alerts
- [ ] Implement proper logging
- [ ] Regular security updates
- [ ] Database backup strategy
- [ ] API rate limiting configured
- [ ] Input validation comprehensive
- [ ] Error messages don't leak info
- [ ] CORS properly configured

---

## 📞 Support & Resources

### Documentation

- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Google Gemini API**: https://ai.google.dev/docs
- **React Documentation**: https://react.dev
- **Express Documentation**: https://expressjs.com

### Getting Help

- **Vercel Support**: support@vercel.com
- **Neon Support**: support@neon.tech
- **GitHub Issues**: Create issues in your repository

---

## 🎉 Conclusion

Congratulations! You now have your QuickAid emergency response platform deployed to Vercel with a production-ready PostgreSQL database. Your application is accessible worldwide with automatic SSL, global CDN, and continuous deployment.

### Next Steps

1. **Monitor performance** - Set up analytics and monitoring
2. **Gather feedback** - Collect user feedback for improvements
3. **Scale as needed** - Vercel scales automatically
4. **Regular updates** - Keep dependencies updated
5. **Backup strategy** - Ensure regular database backups

### Quick Reference

- **Backend URL**: `https://quickaid-backend.vercel.app`
- **Frontend URL**: `https://quickaid-frontend.vercel.app`
- **Database**: Neon PostgreSQL
- **AI Service**: Google Gemini API
- **Monitoring**: Vercel Dashboard

---

**Deployment Status**: ✅ Ready for Production

**Last Updated**: 2026-05-18

**Version**: 1.0.0