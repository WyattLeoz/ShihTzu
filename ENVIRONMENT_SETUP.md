# Environment Variables Setup Guide

## 📋 Overview

QuickAid uses different environment files for different deployment stages. Here's how to set them up properly.

---

## 🗂️ Environment Files Structure

### Development Files (Local)
```
server/.env                # Local development server config (gitignored)
server/.env.example        # Template for local development

client/.env                # Local development client config (gitignored)
client/.env.example        # Template for local development
```

### Production Files (Deployment)
```
server/.env.production     # Production server config (gitignored)
server/.env.production.example  # Template for production

client/.env.production     # Production client config (gitignored)
client/.env.production.example  # Template for production
```

---

## 🔧 Setup Instructions

### 1. Local Development Setup

#### Server (Backend):
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your local values:
```bash
DATABASE_URL=postgresql://postgres:leo0329480@localhost:5432/quickaid
JWT_SECRET=your-local-dev-secret-32-chars
JWT_REFRESH_SECRET=your-local-refresh-secret-32-chars
GEMINI_API_KEY=AIzaSyDq-lTwjkQkSPvJlTlbNThJ7zZ8X8VPAas
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
BCRYPT_ROUNDS=12
```

#### Client (Frontend):
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env` with your local values:
```bash
VITE_API_URL=http://localhost:3001
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

### 2. Production Setup

#### Server (Backend):
```bash
cd server
cp .env.production.example .env.production
```

Edit `server/.env.production` with production values:
```bash
# Database (use Neon/Supabase)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# JWT Secrets (GENERATE SECURE RANDOM STRINGS)
JWT_SECRET=YOUR_SECURE_PRODUCTION_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=YOUR_DIFFERENT_SECURE_SECRET_32_CHARS_MIN

# Gemini API Key
GEMINI_API_KEY=your-production-gemini-key

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS (your deployed frontend URL)
CORS_ORIGIN=https://your-app.vercel.app

# Security
BCRYPT_ROUNDS=12
```

#### Client (Frontend):
```bash
cd ../client
cp .env.production.example .env.production
```

Edit `client/.env.production` with production values:
```bash
# API URL (your deployed backend URL)
VITE_API_URL=https://your-backend.vercel.app

# Map Configuration
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

---

## 🔐 Security Best Practices

### Generate Secure JWT Secrets

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Generate Refresh Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Important Rules:
1. ❌ **NEVER commit** actual `.env` or `.env.production` files
2. ✅ **DO commit** `.env.example` and `.env.production.example` templates
3. ✅ **DO share** the example files with team members
4. ✅ **DO rotate** secrets periodically
5. ✅ **DO use** different secrets for dev/prod

---

## 🚀 Deployment Configuration

### Vercel Environment Variables

For Vercel deployment, you can add environment variables in the Vercel Dashboard:

**Backend Variables:**
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`
- `CORS_ORIGIN`
- `BCRYPT_ROUNDS`

**Frontend Variables:**
- `VITE_API_URL`
- `VITE_MAP_CENTER_LAT`
- `VITE_MAP_CENTER_LNG`
- `VITE_MAP_DEFAULT_ZOOM`

### GitHub Secrets (for CI/CD)

Add these secrets in GitHub Settings → Secrets and variables → Actions:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_BACKEND_PROJECT_ID`
- `VERCEL_FRONTEND_PROJECT_ID`

---

## 📝 File Descriptions

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `server/.env` | Local development server config | ❌ No |
| `server/.env.example` | Template for local dev config | ✅ Yes |
| `server/.env.production` | Production server config | ❌ No |
| `server/.env.production.example` | Template for production config | ✅ Yes |
| `client/.env` | Local development client config | ❌ No |
| `client/.env.example` | Template for local dev config | ✅ Yes |
| `client/.env.production` | Production client config | ❌ No |
| `client/.env.production.example` | Template for production config | ✅ Yes |

---

## ⚠️ Common Mistakes to Avoid

1. **Committing sensitive data:**
   ```bash
   # ❌ BAD - Don't commit actual env files
   git add server/.env

   # ✅ GOOD - Only commit example files
   git add server/.env.example
   ```

2. **Using the same secrets everywhere:**
   ```bash
   # ❌ BAD - Same secret for dev and prod
   JWT_SECRET=shared-secret

   # ✅ GOOD - Different secrets for each environment
   Local: JWT_SECRET=dev-secret
   Prod: JWT_SECRET=prod-secret
   ```

3. **Ignoring .env files in .gitignore:**
   ```bash
   # ✅ GOOD - This is in your .gitignore
   .env
   .env.local
   .env.production
   ```

---

## 🔄 Environment Switching

### From Development to Production:

1. **Server:**
   ```bash
   cd server
   # For local production testing
   NODE_ENV=production npm start

   # For deployment to Vercel
   # Add variables in Vercel Dashboard
   ```

2. **Client:**
   ```bash
   cd client
   # Build for production
   npm run build

   # Preview production build
   npm run preview
   ```

---

## 📊 Quick Reference

### Local Development:
```bash
# Server
cd server && npm run dev        # Uses .env

# Client
cd client && npm run dev        # Uses .env
```

### Production Build:
```bash
# Server
cd server && npm run build      # Uses .env.production (if set)

# Client
cd client && npm run build      # Uses .env.production
```

---

## 🔍 Troubleshooting

### Issue: "DATABASE_URL not found"
- **Solution**: Ensure you have the correct `.env` file in the `server/` directory

### Issue: "CORS errors in production"
- **Solution**: Check `CORS_ORIGIN` matches your frontend URL exactly

### Issue: "Environment variables not loading"
- **Solution**: Restart your development server after changing `.env` files

### Issue: "Vercel deployment fails"
- **Solution**: Add environment variables in Vercel Dashboard, not in `.env` files

---

**Status**: ✅ Ready for Configuration
**Last Updated**: 2026-05-18