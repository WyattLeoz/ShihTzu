# QuickAid - Complete Setup Guide

This guide walks you through every single step required to set up and run the QuickAid Emergency Triage Command Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Required Software](#step-1-install-required-software)
3. [Step 2: Database Setup](#step-2-database-setup)
4. [Step 3: Get API Keys](#step-3-get-api-keys)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Install Dependencies](#step-5-install-dependencies)
7. [Step 6: Run Database Migrations](#step-6-run-database-migrations)
8. [Step 7: Seed the Database](#step-7-seed-the-database)
9. [Step 8: Start the Application](#step-8-start-the-application)
10. [Step 9: Verify Everything Works](#step-9-verify-everything-works)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Administrator access** to your computer
- **~2 GB free disk space**
- **Active internet connection** (for downloading dependencies)

---

## Step 1: Install Required Software

### 1.1 Install Node.js (Version 20 or higher)

**For Windows:**

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (recommended: 20.x or higher)
3. Run the installer with default settings
4. After installation, open Command Prompt and verify:

```cmd
node --version
npm --version
```

You should see version numbers like:
```
node --version  →  v20.x.x
npm --version   →  10.x.x
```

**For macOS:**

```bash
# Using Homebrew (recommended)
brew install node@20

# Or download from https://nodejs.org
```

**For Linux:**

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 1.2 Install PostgreSQL (Version 15 or higher)

**For Windows:**

1. Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Download the installer for PostgreSQL 15.x or higher
3. Run the installer with these settings:
   - **Port**: 5432 (default)
   - **Password**: Choose a secure password and remember it!
   - **Components**: Install all components
4. After installation, open **pgAdmin 4** (installed with PostgreSQL)
5. Verify it's running by opening Command Prompt:

```cmd
psql --version
```

**For macOS:**

```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15
```

**For Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql-15 postgresql-client-15

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.3 Create PostgreSQL User and Database

**For Windows (using pgAdmin 4):**

1. Open pgAdmin 4
2. Right-click on "Databases" → "Create" → "Database..."
3. Name it: `quickaid`
4. Click "Save"

**For macOS/Linux (using command line):**

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE quickaid;

# Create user (optional - you can use postgres user)
CREATE USER quickaid_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE quickaid TO quickaid_user;

# Exit
\q
```

**Test your connection:**

```bash
psql -U postgres -d quickaid
# Or with custom user:
# psql -U quickaid_user -d quickaid
```

If you see `quickaid=#`, you're connected! Type `\q` to exit.

---

## Step 2: Database Setup

### 2.1 Verify PostgreSQL Extensions

Open PostgreSQL command line and run:

```bash
psql -U postgres -d quickaid

# Check if extensions are available
SELECT * FROM pg_available_extensions WHERE name IN ('uuid-ossp', 'pg_trgm');
```

You should see both extensions listed.

### 2.2 Create the Connection String

Your database connection string should look like this:

```
postgresql://username:password@localhost:5432/quickaid
```

**Examples:**

- Using default postgres user:
  ```
  postgresql://postgres:your_password@localhost:5432/quickaid
  ```

- Using custom user:
  ```
  postgresql://quickaid_user:your_password@localhost:5432/quickaid
  ```

**Note:** Replace `your_password` with your actual PostgreSQL password.

---

## Step 3: Get API Keys

### 3.1 Get Anthropic API Key (Required for AI Features)

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up for a free account (or log in if you have one)
3. Navigate to **API Keys** section in the sidebar
4. Click **"Create Key"**
5. Give it a name like "QuickAid Development"
6. Copy the key (starts with `sk-ant-...`)
7. **Save this key somewhere safe** - you won't see it again!

### 3.2 Alternative: Use Free Credits

If you don't have an Anthropic account:
- Sign up at [https://console.anthropic.com](https://console.anthropic.com)
- New accounts get free credits for testing

---

## Step 4: Configure Environment Variables

### 4.1 Create the .env File

Navigate to your QuickAid project folder:

```bash
cd C:\Users\user\OneDrive\Desktop\ShihTzu2
```

Copy the example file:

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

### 4.2 Edit the .env File

Open `.env` in a text editor (Notepad, VS Code, etc.) and fill in your values:

```env
# ========================================
# Database Configuration
# ========================================
# Replace with your PostgreSQL connection string
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/quickaid

# ========================================
# JWT Secrets (IMPORTANT!)
# ========================================
# These must be AT LEAST 32 characters each
# Generate secure random strings:
#   - Online: https://www.random.org/strings/
#   - Or run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long

# ========================================
# Anthropic AI Configuration
# ========================================
# Paste your API key from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# ========================================
# Server Configuration
# ========================================
PORT=3001
NODE_ENV=development

# ========================================
# CORS Configuration
# ========================================
# This should match your frontend URL
CORS_ORIGIN=http://localhost:5173

# ========================================
# Security Configuration
# ========================================
# Bcrypt rounds for password hashing (12 is secure & fast)
BCRYPT_ROUNDS=12

# ========================================
# Frontend Configuration (Vite)
# ========================================
VITE_API_URL=http://localhost:3001

# ========================================
# Optional: Map Configuration
# ========================================
VITE_MAP_CENTER_LAT=1.3521
VITE_MAP_CENTER_LNG=103.8198
VITE_MAP_DEFAULT_ZOOM=12
```

### 4.3 Generate Secure JWT Secrets

Open Command Prompt/PowerShell and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets. Replace the placeholder values in `.env`:

```env
JWT_SECRET=your-first-random-32-char-string
JWT_REFRESH_SECRET=your-second-random-32-char-string
```

---

## Step 5: Install Dependencies

### 5.1 Install Root Dependencies

From the project root folder:

```bash
npm install concurrently
```

### 5.2 Install Server Dependencies

```bash
cd server
npm install
```

**What's being installed:**
- `@anthropic-ai/sdk` - Claude API client
- `bcrypt` - Password hashing
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable loading
- `express` - Web framework
- `express-rate-limit` - Rate limiting middleware
- `express-validator` - Input validation
- `helmet` - Security headers
- `jsonwebtoken` - JWT authentication
- `pg` - PostgreSQL client
- `pino` - Structured logging
- `zod` - Schema validation

### 5.3 Install Client Dependencies

```bash
cd ../client
npm install
```

**What's being installed:**
- `react` - UI framework
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `framer-motion` - Animations
- `react-hook-form` - Form handling
- `zod` - Form validation
- `axios` - HTTP client
- `recharts` - Charts
- `react-leaflet` - Maps
- `tailwindcss` - CSS framework

### 5.4 Alternative: Install All at Once

From the project root:

```bash
npm install:all
```

This will install dependencies for root, server, and client in one command.

---

## Step 6: Run Database Migrations

Migrations create the database tables and structure.

### 6.1 Run Migrations

From the project root:

```bash
npm run migrate
```

Or directly from the server folder:

```bash
cd server
npm run migrate
```

### 6.2 What Migrations Do

You should see output like:

```
✓ 001_extensions.sql completed
✓ 002_users.sql completed
✓ 003_incidents.sql completed
✓ 004_incident_updates.sql completed
✓ 005_resources.sql completed
✓ 006_broadcasts.sql completed
✓ 007_notifications_trigger.sql completed
All migrations completed successfully
```

**Tables Created:**
- `users` - User accounts
- `incidents` - Emergency incidents
- `incident_updates` - Incident timeline
- `hospitals` - Hospital resource data
- `volunteers` - Volunteer information
- `broadcasts` - Public broadcasts
- Triggers for real-time notifications

### 6.3 Verify Tables

Connect to your database and verify:

```bash
psql -U postgres -d quickaid
```

Then run:

```sql
\dt
```

You should see all tables listed.

---

## Step 7: Seed the Database

Seeding populates the database with sample data for testing.

### 7.1 Run Seed Command

From the project root:

```bash
npm run seed
```

Or from server folder:

```bash
cd server
npm run seed
```

### 7.2 What Gets Created

You should see output like:

```
✓ 001_seed.sql completed
All seeds completed successfully
```

**Sample Data Created:**

**Users (4 accounts):**
1. `citizen@demo.sg` - Role: citizen
2. `responder@demo.sg` - Role: responder
3. `supervisor@demo.sg` - Role: supervisor
4. `admin@demo.sg` - Role: gov_admin

**All passwords are:** `Demo1234!`

**Incidents (15 realistic examples):**
- Medical emergencies (cardiac arrest, food poisoning, etc.)
- Fire incidents (HDB flats, factory fire)
- Flood incidents (flash floods)
- Road incidents (collisions)
- Infrastructure issues (MRT faults, power outages)

**Hospitals (6 major Singapore hospitals):**
- Singapore General Hospital (SGH)
- Tan Tock Seng Hospital (TTSH)
- National University Hospital (NUH)
- Changi General Hospital (CGH)
- Khoo Teck Puat Hospital (KTPH)
- Alexandra Hospital (AH)

**Volunteers (20 with diverse skills):**
- First aid, CPR, medical support
- Vehicle operators, transport
- Translation services
- Heavy lifting, etc.

**Broadcasts (5 sample alerts):**
- Flood warnings
- Emergency notifications
- Volunteer calls

---

## Step 8: Start the Application

### 8.1 Start Both Backend and Frontend

From the project root folder:

```bash
npm run dev
```

This starts both servers concurrently.

### 8.2 What You Should See

```
[concurrently] Starting:
[0] dev:server  [1] dev:client

[0] ✓ Environment variables validated
[0] ✓ Database connection established
[0] QuickAid server started { port: 3001, environment: 'development', ... }
[1] VITE v5.x.x  ready in xxx ms
[1] ➜  Local:   http://localhost:5173/
```

### 8.3 Alternative: Start Servers Separately

**Backend only:**

```bash
cd server
npm run dev
```

Access backend at: `http://localhost:3001`

**Frontend only:**

```bash
cd client
npm run dev
```

Access frontend at: `http://localhost:5173`

---

## Step 9: Verify Everything Works

### 9.1 Test Backend Health

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-xx-xxTxx:xx:xx.xxxZ"
}
```

### 9.2 Access Frontend

Open your browser and navigate to:

```
http://localhost:5173
```

You should see the QuickAid login page.

### 9.3 Login with Demo Account

Use any of these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.sg | Demo1234! |
| Supervisor | supervisor@demo.sg | Demo1234! |
| Responder | responder@demo.sg | Demo1234! |
| Citizen | citizen@demo.sg | Demo1234! |

### 9.4 Test Features by Role

**As Responder/Supervisor/Admin:**

1. Login at `http://localhost:5173/login`
2. You'll be redirected to the Responder Portal
3. Click "New Incident" to create a test incident
4. View the Queue to see seeded incidents
5. Click on an incident to see details
6. Try "Run AI Triage" (requires Anthropic API key)

**As Citizen:**

1. Logout and login as citizen
2. You'll see the Public Portal
3. View alerts and incident feed
4. Report a new incident

---

## Troubleshooting

### Issue: "Command not found: node"

**Solution:**
1. Restart your terminal/command prompt
2. Verify Node.js is installed: `node --version`
3. If not installed, follow Step 1.1

### Issue: "Connection refused" or "Database connection failed"

**Solution:**
1. Check if PostgreSQL is running:
   - Windows: Check Services for "postgresql-x64-15"
   - macOS/Linux: `sudo systemctl status postgresql`
2. Verify DATABASE_URL in `.env` matches your PostgreSQL credentials
3. Test connection manually:
   ```bash
   psql -U postgres -d quickaid
   ```

### Issue: "JWT_SECRET must be at least 32 characters"

**Solution:**
1. Open `.env` file
2. Generate new secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Update `JWT_SECRET` and `JWT_REFRESH_SECRET` with 64-character strings

### Issue: "PORT 3001 is already in use"

**Solution:**
1. Find what's using the port:
   - Windows: `netstat -ano | findstr :3001`
   - macOS/Linux: `lsof -i :3001`
2. Kill the process or change PORT in `.env`

### Issue: "Module not found: Cannot resolve '@/...'"

**Solution:**
1. This is a Vite configuration issue
2. Ensure `vite.config.ts` has the path alias configured
3. Restart the dev server

### Issue: Frontend loads but API calls fail

**Solution:**
1. Check if backend is running on port 3001
2. Verify CORS_ORIGIN in `.env` matches frontend URL
3. Check browser console for CORS errors
4. Ensure `VITE_API_URL` is set correctly

### Issue: AI triage not working

**Solution:**
1. Verify `ANTHROPIC_API_KEY` is set in `.env`
2. Check the API key is valid at [https://console.anthropic.com](https://console.anthropic.com)
3. Check browser console for API errors
4. Verify backend has access to Anthropic API

### Issue: "Rate limit exceeded" errors

**Solution:**
1. These are intentional security features
2. Wait for the rate limit to expire
3. For AI requests: limit is 10 per minute per user
4. For auth requests: limit is 5 per 15 minutes

### Issue: Database migration errors

**Solution:**
1. Drop and recreate the database:
   ```sql
   DROP DATABASE quickaid;
   CREATE DATABASE quickaid;
   ```
2. Run migrations again:
   ```bash
   npm run migrate
   npm run seed
   ```

### Issue: TypeScript compilation errors

**Solution:**
1. Ensure you're in the correct directory (server or client)
2. Run `npm install` to ensure all dependencies are installed
3. Check TypeScript version in `package.json` matches installed version

---

## Next Steps

### Development Mode

You're now running in development mode with:
- Hot module replacement (frontend)
- Auto-restart on file changes (backend with tsx watch)
- Detailed error messages
- CORS enabled

### Building for Production

When ready to deploy:

```bash
# Build frontend
cd client
npm run build

# Build backend
cd ../server
npm run build

# Start production servers
npm start
```

### Stopping the Application

Press `Ctrl+C` in the terminal where you started the application.

---

## Support

If you encounter issues not covered here:

1. Check the browser console for errors
2. Check the terminal output for server errors
3. Review the [README.md](README.md) for additional information
4. Contact the QuickAid development team

---

## Quick Reference

**Environment Variables:**
- Database: `DATABASE_URL`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- AI: `ANTHROPIC_API_KEY`
- Ports: Backend `3001`, Frontend `5173`

**Demo Accounts:**
- All passwords: `Demo1234!`
- Email patterns: `{role}@demo.sg`

**Useful Commands:**
```bash
npm run dev          # Start both servers
npm run migrate      # Run DB migrations
npm run seed         # Seed DB with sample data
npm install:all      # Install all dependencies
```

---

**Congratulations! You've successfully set up QuickAid! 🎉**