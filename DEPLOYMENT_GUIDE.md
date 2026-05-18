# 🚀 QuickAid Deployment Guide

Complete guide to deploy QuickAid frontend on Vercel and backend on Render.

---

## 📋 Overview

This guide will walk you through deploying:
- **Frontend** → Vercel (React + Vite)
- **Backend** → Render (Node.js + Express + PostgreSQL)

---

## 🔧 Prerequisites

Before starting, ensure you have:

1. **Accounts Required:**
   - [Vercel Account](https://vercel.com/signup) (Free tier)
   - [Render Account](https://render.com/register) (Free tier available)
   - [GitHub Account](https://github.com/signup) (For repository hosting)
   - [Neon/Supabase Account](https://neon.tech/signup) or [Supabase](https://supabase.com/) (For PostgreSQL database)

2. **Local Environment:**
   - Node.js 20+ installed
   - Git installed
   - Your QuickAid project ready

3. **API Keys Needed:**
   - Gemini API Key (for AI functionality)
   - Generated JWT secrets (32+ characters each)

---

## 🎯 Deployment Architecture

```
┌─────────────────┐
│   Vercel        │ ← Frontend (React)
│   quickaid.vercel.app
└────────┬────────┘
         │
         │ HTTPS API calls
         │
┌────────▼────────┐
│   Render        │ ← Backend (Express + PostgreSQL)
│   quickaid-api.onrender.com
└─────────────────┘
         │
         │ Database connection
         │
┌────────▼────────┐
│   Neon/Supabase │ ← PostgreSQL Database
└─────────────────┘
```

---

## 📦 Step 1: Set Up PostgreSQL Database

### Option A: Neon (Recommended)

1. **Create Neon Account:**
   - Go to [neon.tech](https://neon.tech/signup)
   - Sign up with GitHub

2. **Create Database:**
   - Click "Create a project"
   - Name: `quickaid-prod`
   - Region: Choose closest to Singapore (e.g., Singapore)
   - Click "Create project"

3. **Get Connection String:**
   - Go to Dashboard → quickaid-prod
   - Copy the "Connection string"
   - Format: `postgresql://username:password@ep-xxxxx.aws.neon.tech/quickaid-prod?sslmode=require`

4. **Enable pg_trgm Extension:**
   - Go to SQL Editor in Neon Dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

### Option B: Supabase

1. **Create Supabase Account:**
   - Go to [supabase.com](https://supabase.com/)
   - Click "Start your project"

2. **Create Project:**
   - Name: `quickaid-prod`
   - Database Password: (generate strong password)
   - Region: Southeast Asia (Singapore)

3. **Get Connection String:**
   - Go to Settings → Database
   - Copy "Connection string" (URI format)
   - Add `?sslmode=require` at the end

4. **Enable pg_trgm:**
   - Go to SQL Editor → New query
   - Run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

---

## 🔐 Step 2: Generate Secure JWT Secrets

Generate production-ready JWT secrets:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save these secrets - you'll need them for environment variables.

---

## 🗃️ Step 3: Prepare Your Code Repository

### 1. Create GitHub Repository

```bash
# Initialize git if not already done
git init

# Create .gitignore if needed
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
coverage/
.vercel/
build/
EOF

# Commit your code
git add .
git commit -m "Initial commit - Ready for deployment"

# Create repository on GitHub first, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quickaid.git
git push -u origin main
```

### 2. Create Production Environment Files

**Server Production Variables (for reference only):**
```bash
# server/.env.production.example (already exists)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
GEMINI_API_KEY=your-production-gemini-api-key
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
BCRYPT_ROUNDS=12
```

**Client Production Variables (for reference only):**
```bash
# client/.env.production.example (already exists)
VITE_API_URL=https://your-backend.onrender.com
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

---

## 🌐 Step 4: Deploy Backend to Render

### 4.1 Create Render Account & Connect GitHub

1. **Sign up/Login to Render:**
   - Go to [render.com](https://render.com)
   - Click "Sign Up" or "Login"

2. **Connect GitHub:**
   - Go to Dashboard → "New +" → "Web Service"
   - Click "Connect GitHub" (authorize access)

### 4.2 Configure Render Web Service

1. **Select Repository:**
   - Find and select your `quickaid` repository
   - Click "Connect"

2. **Configure Build Settings:**
   ```
   Name: quickaid-api
   Region: Singapore (or closest)
   Branch: main

   Runtime: Node
   Build Command: cd server && npm install && npm run build
   Start Command: cd server && npm start
   ```

3. **Add Environment Variables:**

   Click "Advanced" → "Add Environment Variable":

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://username:password@ep-xxxxx.aws.neon.tech/quickaid-prod?sslmode=require` |
   | `JWT_SECRET` | Your generated JWT secret (32+ chars) |
   | `JWT_REFRESH_SECRET` | Your generated refresh secret (32+ chars) |
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `PORT` | `3001` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | Leave blank for now, will update after frontend |
   | `BCRYPT_ROUNDS` | `12` |

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for build and deployment (2-5 minutes)

5. **Get Backend URL:**
   - After deployment, Render will provide a URL like: `https://quickaid-api.onrender.com`
   - **Save this URL** - you'll need it for frontend configuration

### 4.3 Run Database Migrations

After deployment, you need to set up your database:

1. **Access Render Shell:**
   - Go to your service in Render Dashboard
   - Click "Shell" (top right)

2. **Run Migrations:**
   ```bash
   cd server
   npm run migrate
   ```

3. **Seed Database (Optional):**
   ```bash
   npm run seed
   ```

### 4.4 Update CORS Configuration

1. Go back to Render Dashboard → quickaid-api
2. Click "Environment" tab
3. Find `CORS_ORIGIN` variable
4. Update it: `https://your-frontend.vercel.app` (will get this after frontend deployment)
5. Click "Save Changes"
6. Click "Manual Deploy" → "Clear build cache & deploy"

---

## 🎨 Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Account & Connect GitHub

1. **Sign up/Login to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Login" with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Find your `quickaid` repository
   - Click "Import"

### 5.2 Configure Vercel Project

1. **Framework Preset:**
   - Framework: `Vite`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Add Environment Variables:**

   Click "Environment Variables" → "Add New":

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://quickaid-api.onrender.com` (from Step 4.4) |
   | `VITE_MAP_CENTER_LAT` | `1.3521` |
   | `VITE_MAP_CENTER_LNG` | `103.8198` |
   | `VITE_MAP_DEFAULT_ZOOM` | `12` |

3. **Deploy:**
   - Click "Deploy"
   - Wait for build and deployment (1-3 minutes)

4. **Get Frontend URL:**
   - Vercel will provide a URL like: `https://quickaid.vercel.app`
   - **Save this URL** - you'll need it to update backend CORS

### 5.3 Update Backend CORS

1. Go back to Render Dashboard → quickaid-api
2. Click "Environment" tab
3. Update `CORS_ORIGIN` to your Vercel URL: `https://quickaid.vercel.app`
4. Click "Save Changes"
5. Click "Manual Deploy" → "Clear build cache & deploy"

---

## 🔄 Step 6: Update Environment Variables (Cross-Referencing)

After both deployments, ensure proper cross-referencing:

### Frontend Environment (Vercel)
- `VITE_API_URL` → Must point to Render backend
- Example: `https://quickaid-api.onrender.com`

### Backend Environment (Render)
- `CORS_ORIGIN` → Must point to Vercel frontend
- Example: `https://quickaid.vercel.app`

---

## ✅ Step 7: Test Your Deployment

### 7.1 Test Backend API

```bash
# Test health endpoint
curl https://quickaid-api.onrender.com/api/auth/me

# Test registration
curl -X POST https://quickaid-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "fullName": "Test User",
    "role": "citizen"
  }'
```

### 7.2 Test Frontend

1. **Open your Vercel URL:** `https://quickaid.vercel.app`
2. **Test functionality:**
   - Navigate to Public Portal
   - Try registering a new user
   - Check console for any CORS errors
   - Test incident reporting
   - Verify map functionality

### 7.3 Check Common Issues

**CORS Errors:**
- Verify `CORS_ORIGIN` in backend matches frontend URL exactly
- Check both `http://` and `https://` protocols

**Database Connection:**
- Verify `DATABASE_URL` is correct
- Ensure SSL mode is enabled (`?sslmode=require`)

**Environment Variables:**
- Check all variables are set in both platforms
- Ensure no typos in variable names

---

## 🛠️ Step 8: Post-Deployment Configuration

### 8.1 Custom Domain (Optional)

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**For Render:**
1. Go to Service Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

### 8.2 Monitoring & Logs

**Vercel Monitoring:**
- Go to Project → Analytics
- Monitor build times, bandwidth, errors

**Render Monitoring:**
- Go to Dashboard → quickaid-api
- View metrics: CPU, memory, response times
- Check logs for errors

### 8.3 Database Monitoring

**Neon:**
- Dashboard → Metrics
- Monitor storage, connections, query performance

**Supabase:**
- Dashboard → Database
- Monitor storage, API requests, performance

---

## 🔒 Step 9: Security Best Practices

### 9.1 Environment Variables Security

- ✅ Never commit `.env` files
- ✅ Use different secrets for dev/prod
- ✅ Rotate JWT secrets periodically
- ✅ Limit database user permissions
- ✅ Enable SSL for all connections

### 9.2 API Security

- ✅ CORS is properly configured
- ✅ Rate limiting is enabled
- ✅ Input validation on all endpoints
- ✅ Secure httpOnly cookies for auth
- ✅ Bcrypt for password hashing

### 9.3 Regular Maintenance

- Monitor logs regularly
- Update dependencies monthly
- Backup database regularly
- Test disaster recovery procedures
- Review access permissions

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. **Build Fails on Render - TypeScript Error**

**Problem:** `error TS2688: Cannot find type definition file for 'node'`

**Solution:** This is a TypeScript configuration issue. Fix it by:

1. **Edit `server/tsconfig.json`:**
   - Remove the `"types": ["node"]` line
   - The file should look like this:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "allowSyntheticDefaultImports": true,
       "lib": ["ES2022"]
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

2. **Create `server/.npmrc`:**
   - Add this file to ensure devDependencies are installed:
   ```
   legacy-peer-deps=false
   ```

3. **Push the changes:**
   ```bash
   git add server/tsconfig.json server/.npmrc
   git commit -m "fix: TypeScript build configuration for Render deployment"
   git push origin main
   ```

4. **Trigger redeployment on Render:**
   - Go to Render Dashboard → quickaid-api
   - Click "Manual Deploy" → "Clear build cache & deploy"

#### 2. **Other Build Failures**

**Problem:** Build fails during deployment (other issues)

**Solutions:**
- Check build logs in Render Dashboard
- Ensure all dependencies are in `package.json`
- Verify build command is correct: `cd server && npm install && npm run build`

#### 2. **CORS Errors in Production**

**Problem:** Frontend can't connect to backend

**Solutions:**
- Check `CORS_ORIGIN` matches frontend URL exactly
- Ensure both use HTTPS
- Clear browser cache
- Check browser console for specific error

#### 3. **Database Connection Failed**

**Problem:** Backend can't connect to PostgreSQL

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check SSL mode is enabled
- Ensure database is running
- Test connection locally with same credentials

#### 4. **Environment Variables Not Loading**

**Problem:** App crashes due to missing variables

**Solutions:**
- Verify variable names match exactly
- Check for typos in values
- Ensure sensitive variables aren't exposed
- Restart service after adding variables

#### 5. **Frontend Build Success but 404 Errors**

**Problem:** Vercel serves 404 for API routes

**Solutions:**
- Check `VITE_API_URL` is correct
- Verify backend is running and accessible
- Test backend URL directly in browser

#### 6. **Deployments Taking Too Long**

**Problem:** Builds are very slow

**Solutions:**
- Clear build cache in both platforms
- Remove unnecessary dependencies
- Optimize build process
- Check for network issues

---

## 📊 Deployment Checklist

Use this checklist to ensure complete deployment:

### Pre-Deployment
- [ ] GitHub repository created and pushed
- [ ] PostgreSQL database set up (Neon/Supabase)
- [ ] pg_trgm extension enabled
- [ ] JWT secrets generated (32+ chars each)
- [ ] Gemini API key obtained

### Backend Deployment (Render)
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service configured
- [ ] All environment variables added
- [ ] Initial deployment successful
- [ ] Database migrations run
- [ ] Database seeded (optional)
- [ ] CORS origin configured

### Frontend Deployment (Vercel)
- [ ] Vercel account created
- [ ] GitHub repository imported
- [ ] Project configured with Vite
- [ ] Environment variables added
- [ ] Initial deployment successful
- [ ] Backend URL configured

### Post-Deployment
- [ ] Backend API tested
- [ ] Frontend functionality tested
- [ ] CORS verified working
- [ ] Database connection confirmed
- [ ] User registration/login tested
- [ ] Map functionality verified
- [ ] Monitoring set up
- [ ] Custom domain configured (optional)

### Security & Maintenance
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Access permissions reviewed
- [ ] Security headers verified
- [ ] Monitoring alerts set up
- [ ] Dependency update schedule established

---

## 🔄 CI/CD Pipeline Setup (Optional)

### Automated Deployments

**Frontend (Vercel):**
- Vercel automatically deploys on git push to main branch
- Pull requests create preview deployments

**Backend (Render):**
- Render automatically deploys on git push to main branch
- Configure in Service Settings → Auto-Deploy

### GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Backend
        run: |
          cd server
          npm install
          npm test
      - name: Test Frontend
        run: |
          cd client
          npm install
          npm test
```

---

## 💰 Cost Analysis

### Free Tier Limits (2025)

**Vercel (Hobby):**
- ✅ 100GB bandwidth/month
- ✅ 6,000 minutes of build time/month
- ✅ Unlimited projects
- ✅ SSL certificates
- ✅ Automatic deployments

**Render (Free):**
- ✅ 750 hours/month
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold starts (30-50 sec delay)

**Neon (Free):**
- ✅ 0.5GB storage
- ✅ 1 project
- ✅ 400 hours/month compute time

**Estimated Monthly Cost (Free Tier):** $0

### Recommended Upgrade (Production)

**Render (Starter - $7/month):**
- No spin downs
- Better performance
- More resources

**Neon (Scale - $19/month):**
- 8GB storage
- Better performance
- More connections

---

## 📚 Additional Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Monitoring & Analytics
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - User session recording

### Best Practices
- [12-Factor App](https://12factor.net/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🆘 Support

If you encounter issues during deployment:

1. **Check Logs:**
   - Vercel: Project → Deployments → Build logs
   - Render: Dashboard → Service → Logs

2. **Common Solutions:**
   - Clear build cache and redeploy
   - Verify environment variables
   - Check database connection
   - Review CORS configuration

3. **Get Help:**
   - QuickAid development team
   - Platform support (Vercel/Render)
   - Community forums

---

## 📝 Summary

You've successfully deployed QuickAid with:
- ✅ Frontend on Vercel (React + Vite)
- ✅ Backend on Render (Node.js + Express)
- ✅ Database on Neon/Supabase (PostgreSQL)
- ✅ Proper CORS configuration
- ✅ Secure environment variables
- ✅ Production-ready setup

**Your Application URLs:**
- Frontend: `https://quickaid.vercel.app`
- Backend: `https://quickaid-api.onrender.com`

---

**Deployment Status:** ✅ Complete
**Last Updated:** 2025-05-18
**Version:** 1.0.0