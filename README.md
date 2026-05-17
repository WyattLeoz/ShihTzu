# QuickAid - Emergency Triage Command Platform

A production-grade emergency triage command platform for Singapore government and emergency services.

## Features

- **AI-Powered Triage**: Real-time incident analysis with Claude AI, providing ranked response options
- **Real-time Updates**: Server-Sent Events (SSE) for live incident tracking
- **Three Portals**:
  - **Public Portal**: Citizen-facing incident reporting, alerts, and volunteer signup
  - **Responder Portal**: Professional incident management with AI recommendations
  - **Government Portal**: Command dashboard with analytics and broadcast system

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+ with pg_trgm for full-text search
- **Auth**: JWT with refresh tokens (httpOnly cookies)
- **AI**: Anthropic Claude API (streaming)
- **Real-time**: PostgreSQL LISTEN/NOTIFY → SSE
- **Logging**: Pino structured logging
- **Validation**: express-validator + Zod

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form + Zod
- **Animation**: Framer Motion
- **Maps**: React-Leaflet
- **Charts**: Recharts

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Anthropic API key

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ShihTzu2
```

### 2. Install dependencies

```bash
npm install:all
```

### 3. Set up environment variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Minimum 32 characters
- `JWT_REFRESH_SECRET`: Minimum 32 characters
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `PORT`: Backend port (default: 3001)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:5173)

### 4. Run database migrations

```bash
npm run migrate
```

### 5. Seed the database

```bash
npm run seed
```

This creates:
- 4 demo users (one per role)
- 15 realistic Singapore incidents
- 6 hospitals with bed capacity data
- 20 volunteers
- 5 sample broadcasts

### 6. Start the development servers

```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 5173) concurrently.

## Creating the First Gov Admin User

After seeding, you can log in with the demo admin account:

```
Email: admin@demo.sg
Password: Demo1234!
```

Or create a new gov admin user via the API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "fullName": "Admin User",
    "role": "gov_admin",
    "unit": "Gov Crisis Center"
  }'
```

## Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `.env` file as `ANTHROPIC_API_KEY`

## Project Structure

```
/
├── server/              # Backend application
│   ├── src/
│   │   ├── config/      # Database, environment, logger
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Claude AI, notifications
│   │   └── db/          # Migrations, seeds
│   └── package.json
├── client/              # Frontend application
│   ├── src/
│   │   ├── api/         # API client and endpoints
│   │   ├── components/  # Shared UI components
│   │   ├── features/    # Portal-specific features
│   │   ├── hooks/       # Custom React hooks
│   │   ├── stores/      # Zustand state stores
│   │   └── types/       # TypeScript types
│   └── package.json
├── .env.example         # Environment variables template
└── README.md
```

## Security Features

- Helmet.js security headers
- CORS restricted to configured origin
- Rate limiting (general, AI, auth)
- Bcrypt password hashing
- JWT with secure httpOnly refresh tokens
- Parameterized SQL queries
- Input validation on all routes
- Structured error logging (no stack traces to clients)

## Development

### Backend only:

```bash
cd server
npm run dev
```

### Frontend only:

```bash
cd client
npm run dev
```

### Build for production:

```bash
npm run build
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Incidents
- `GET /api/incidents` - List incidents (paginated, filtered)
- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id` - Get incident details
- `PATCH /api/incidents/:id` - Update incident
- `PATCH /api/incidents/:id/approve` - Approve AI option
- `PATCH /api/incidents/:id/status` - Update status
- `POST /api/tickets/:id/updates` - Add timeline note

### Resources
- `GET /api/resources/hospitals` - List hospitals
- `PATCH /api/resources/hospitals/:id` - Update hospital data
- `GET /api/resources/volunteers` - List volunteers
- `POST /api/volunteers` - Create volunteer

### Broadcasts
- `GET /api/broadcasts` - List broadcasts
- `POST /api/broadcasts` - Create broadcast

### AI
- `POST /api/ai/triage` - Stream AI triage analysis

### Real-time
- `GET /api/sse` - Server-Sent Events for live updates
- `GET /api/sse/public` - Public broadcast events

## User Roles

- **citizen**: Can report incidents, view public alerts, sign up as volunteer
- **responder**: Full incident management, AI triage, resource monitoring
- **supervisor**: All responder features + can approve critical decisions
- **gov_admin**: All features + broadcast system, hospital management, analytics

## Demo Accounts

After running seed, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@demo.sg | Demo1234! |
| Responder | responder@demo.sg | Demo1234! |
| Supervisor | supervisor@demo.sg | Demo1234! |
| Gov Admin | admin@demo.sg | Demo1234! |

## License

This is a production-grade system built for Singapore government and emergency services.

## Support

For technical issues or questions, contact the QuickAid development team.