# QuickAid Vercel Deployment - Quick Start

## 🚀 Fast Track Deployment (5 Minutes)

This is the fastest way to get QuickAid deployed to Vercel.

### Prerequisites Checklist
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] Neon PostgreSQL account (free)
- [ ] Google Gemini API key

---

## ⚡ Step-by-Step Deployment

### 1️⃣ Setup Database (2 minutes)

1. Go to [Neon](https://neon.tech) and sign up
2. Create a new project named `quickaid`
3. Copy the connection string (save it!)

**Example connection string:**
```
postgresql://your-username:your-password@ep-cool-region.aws.neon.tech/quickaid
```

### 2️⃣ Push to GitHub (1 minute)

```bash
# From your project root
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quickaid.git
git push -u origin main
```

### 3️⃣ Deploy Backend to Vercel (1 minute)

1. Go to [Vercel](https://vercel.com/dashboard)
2. Click "Add New Project" → Import from GitHub
3. **Import Repository**: Select your `quickaid` repo
4. **Configure Backend**:
   - Project Name: `quickaid-backend`
   - Root Directory: `server/`
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/`
5. **Add Environment Variables**:
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=your-secure-random-string-32chars
   JWT_REFRESH_SECRET=another-secure-string-32chars
   GEMINI_API_KEY=your-google-gemini-api-key
   CORS_ORIGIN=https://quickaid-frontend.vercel.app
   BCRYPT_ROUNDS=12
   NODE_ENV=production
   ```
6. Click "Deploy"
7. **Save the backend URL**: `https://quickaid-backend.vercel.app`

### 4️⃣ Deploy Frontend to Vercel (1 minute)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project" → Import same repository
3. **Configure Frontend**:
   - Project Name: `quickaid-frontend`
   - Root Directory: `client/`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist/`
4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://quickaid-backend.vercel.app
   VITE_MAP_CENTER_LAT=1.3521
   VITE_MAP_CENTER_LNG=103.8198
   VITE_MAP_DEFAULT_ZOOM=12
   ```
5. Click "Deploy"
6. **Your app is live!**: `https://quickaid-frontend.vercel.app`

---

## 🔧 Post-Deployment Setup (2 minutes)

### 1. Run Database Migrations

You need to run the database migrations to set up the tables:

**Option A: Local Migration (Recommended)**
```bash
# Create temporary .env file
cd server
cat > .env.prod << EOF
DATABASE_URL=your-neon-connection-string
JWT_SECRET=temp-secret-32-chars-long-for-migration
JWT_REFRESH_SECRET=temp-refresh-secret-32-chars
GEMINI_API_KEY=temp-key-for-migration
EOF

# Run migrations
export $(cat .env.prod | xargs)
npm run migrate

# Clean up
rm .env.prod
```

**Option B: Use Neon Console**
1. Go to Neon Dashboard
2. Click "SQL Editor"
3. Run the migration SQL from `server/src/db/schema.sql`

### 2. Test Your Deployment

1. **Visit your frontend**: `https://quickaid-frontend.vercel.app`
2. **Test registration**: Sign up a new user
3. **Test login**: Log in with your credentials
4. **Check functionality**: Try creating/viewing incidents

---

## 🎉 That's It!

Your QuickAid emergency response platform is now live!

### Your Live URLs:
- **Frontend**: `https://quickaid-frontend.vercel.app`
- **Backend**: `https://quickaid-backend.vercel.app`
- **Database**: Neon PostgreSQL

### What to Monitor:
- Vercel Dashboard for deployment status
- Neon Dashboard for database performance
- Google Cloud Console for Gemini API usage

---

## 🆘 Need Help?

### Common Quick Fixes

**Frontend won't load?**
- Check Vite config base path is set to `/`
- Verify `VITE_API_URL` is correct
- Clear browser cache and retry

**Backend returns 500 errors?**
- Check Vercel deployment logs
- Verify `DATABASE_URL` is correct
- Ensure SSL is enabled in connection string

**Can't create users?**
- Run database migrations (Step 5)
- Check JWT secrets are properly set
- Verify CORS origin matches frontend URL

### Getting More Help

- **Full Guide**: See `VERCEL_DEPLOYMENT_GUIDE.md`
- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/support

---

## 🔄 Updating Your App

When you make changes:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically redeploy both frontend and backend!

---

**Deployment Time**: ~5 minutes ⚡
**Status**: Production Ready ✅
**Last Updated**: 2026-05-18