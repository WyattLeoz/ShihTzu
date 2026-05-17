# QuickAid - Gemini API Integration Guide

This guide walks you through replacing Anthropic Claude API with Google Gemini API.

## Table of Contents

1. [Why Use Gemini Instead](#why-use-gemini-instead)
2. [Get Gemini API Key](#get-gemini-api-key)
3. [Install Gemini Dependencies](#install-gemini-dependencies)
4. [Update Server Code](#update-server-code)
5. [Update Environment Variables](#update-environment-variables)
6. [Test the Integration](#test-the-integration)
7. [Key Differences](#key-differences)

---

## Why Use Gemini Instead

**Gemini Advantages:**
- Free tier available (up to certain limits)
- No credit card required for free tier
- Same AI capabilities for triage analysis
- Similar streaming support
- Easy migration from Claude

---

## Get Gemini API Key

### Step 1: Create Google Cloud Account

1. Go to [https://cloud.google.com](https://cloud.google.com)
2. Sign in with your Google account (or create one)
3. Create a new project if you don't have one

### Step 2: Enable Gemini API

1. Go to [https://console.cloud.google.com/ai/gemini](https://console.cloud.google.com/ai/gemini)
2. Click "Enable API" or "Get API Key"
3. You may need to create a Google Cloud project first

### Step 3: Generate API Key

1. Click "Create API key"
2. Give it a name like "QuickAid"
3. Copy the API key (starts with `AIza...`)
4. Save it somewhere safe!

**Alternative: Quick Setup**
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click "Create API key"
3. Copy the key

---

## Install Gemini Dependencies

### Step 1: Remove Claude SDK

From the server folder:

```bash
cd server
npm uninstall @anthropic-ai/sdk
```

### Step 2: Install Gemini SDK

```bash
npm install @google/generative-ai
```

---

## Update Environment Variables

### Edit `.env` file

Replace:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

With:

```env
# Google Gemini API Configuration
GEMINI_API_KEY=AIza-your-gemini-api-key-here
```

**Note:** Keep the other environment variables the same (DATABASE_URL, JWT_SECRET, etc.)

---

## Update Server Code

### Create New Gemini Service

I'll create a new file `server/src/services/gemini.ts` to replace the Claude service:

```typescript
import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';
import { z } from 'zod';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Zod schema for AI response validation
const TriageOptionSchema = z.object({
  rank: z.number().int().min(1).max(3),
  action: z.string(),
  rationale: z.string(),
  resources_required: z.array(z.string()),
  notify: z.array(z.string()),
  eta_minutes: z.number().int().min(1),
  confidence: z.number().min(0).max(100),
});

const TriageResponseSchema = z.object({
  options: z.array(TriageOptionSchema).length(3),
});

// Helper: Build system prompt with live data
async function buildSystemPrompt(incident: any): Promise<string> {
  // Get live hospital data
  const hospitalResult = await query({
    text: 'SELECT name, short_name, available_beds, icu_available, trauma_bays, address, lat, lng FROM hospitals ORDER BY name',
    values: [],
  });

  const hospitals = hospitalResult.rows.map((h: any) => ({
    name: h.name,
    shortName: h.short_name,
    availableBeds: h.available_beds,
    icuAvailable: h.icu_available,
    traumaBays: h.trauma_bays,
    address: h.address,
    lat: h.lat,
    lng: h.lng,
  }));

  // Get volunteer counts by skill
  const volunteerResult = await query({
    text: `SELECT unnest(skills) as skill, COUNT(*) as count
           FROM volunteers
           WHERE is_available = true
           GROUP BY unnest(skills)
           ORDER BY skill`,
    values: [],
  });

  const volunteerCounts = volunteerResult.rows.reduce((acc: any, row: any) => {
    acc[row.skill] = parseInt(row.count);
    return acc;
  }, {});

  // Calculate distance to each hospital
  const incidentLat = incident.location_lat || 1.3521;
  const incidentLng = incident.location_lng || 103.8198;

  const hospitalsWithDistance = hospitals.map(h => ({
    ...h,
    distanceKm: calculateDistance(incidentLat, incidentLng, h.lat, h.lng),
  }));

  const severityLabels: Record<number, string> = {
    1: 'CRITICAL',
    2: 'HIGH',
    3: 'MEDIUM',
  };

  const incidentAge = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000);

  return `You are QuickAid Triage AI, deployed by the Singapore Civil Defence Force and Ministry of Health.
You assist human operators in making fast, informed emergency dispatch decisions.
You never make the final call — you support the human operator.

Current resource snapshot (live data injected here):
HOSPITALS: ${JSON.stringify(hospitalsWithDistance)}
VOLUNTEERS ON DUTY: ${JSON.stringify(volunteerCounts)}

INCIDENT:
Type: ${incident.type}
Severity: ${incident.severity} (${severityLabels[incident.severity]})
Location: ${incident.location_text} (${incident.location_lat}, ${incident.location_lng})
Description: ${incident.description}
Reported: ${incidentAge} minutes ago

Respond in two parts:
PART 1 — Write a concise triage assessment (3–5 sentences). Cover: nature of incident, immediate risk, key resource constraints. Write for a trained operator — no hand-holding.

PART 2 — Output exactly this JSON block (no markdown fences, just raw JSON after the text):
{"options":[
  {"rank":1,"action":"...","rationale":"...","resources_required":["..."],"notify":["..."],"eta_minutes":N,"confidence":N},
  {"rank":2,...},
  {"rank":3,...}
]}

Rules:
- Name real Singapore hospitals, agencies (SCDF, SPF, MOH, SFA, PUB, LTA), and landmarks
- Options must be meaningfully different (different resource tradeoffs, not just rewordings)
- confidence is 0–100. Be honest — if data is insufficient, say so in rationale and lower confidence
- notify array = who gets auto-notified if this option is approved
- Never recommend an action you don't have resources for`;
}

// Helper: Calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Parse JSON from streamed text
function parseJSONFromStream(text: string): any {
  const jsonStart = text.lastIndexOf('{"options"');
  if (jsonStart === -1) return null;

  const jsonEnd = text.lastIndexOf('}');
  if (jsonEnd === -1) return null;

  try {
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.warn({ error }, 'Failed to parse JSON from stream');
    return null;
  }
}

// Route: POST /api/ai/triage
import { Router } from 'express';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/triage',
  requireAuth,
  requireRole('responder', 'supervisor', 'gov_admin'),
  aiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { incidentId } = req.body;

    if (!incidentId) {
      res.status(400).json({
        error: {
          code: 'INCIDENT_ID_REQUIRED',
          message: 'incidentId is required',
        },
      });
      return;
    }

    // Get incident
    const incidentResult = await query({
      text: 'SELECT * FROM incidents WHERE id = $1',
      values: [incidentId],
    });

    if (incidentResult.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: 'Incident not found',
        },
      });
      return;
    }

    const incident = incidentResult.rows[0];

    // Build system prompt
    const systemPrompt = await buildSystemPrompt(incident);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    let streamedText = '';

    try {
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          streamedText += text;

          // Send text chunk to client
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
        }
      }

      // Parse JSON from complete text
      const jsonData = parseJSONFromStream(streamedText);

      if (!jsonData) {
        throw new Error('Failed to parse AI response');
      }

      // Validate with Zod
      const validated = TriageResponseSchema.parse(jsonData);

      // Save to database
      await query({
        text: `UPDATE incidents
               SET ai_triage_data = $1,
                   status = 'triaging',
                   updated_at = NOW()
               WHERE id = $2`,
        values: [JSON.stringify(validated), incidentId],
      });

      // Send completion event
      res.write(
        `data: ${JSON.stringify({ type: 'complete', options: validated.options })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error({ error }, 'Gemini API error');
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: 'Failed to get AI triage' })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    }
  })
);

export default router;
```

### Update env.ts to validate GEMINI_API_KEY

Replace in `server/src/config/env.ts`:

```typescript
// Replace ANTHROPIC_API_KEY with:
GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
```

### Update AI routes

Replace the import in `server/src/index.ts`:

```typescript
// Replace:
import claudeRouter from './routes/claude.js';

// With:
import geminiRouter from './services/gemini.js';

// And replace:
app.use('/api/ai', claudeRouter);

// With:
app.use('/api/ai', geminiRouter);
```

### Delete old Claude service

```bash
rm server/src/services/claude.ts
```

---

## Test the Integration

### Step 1: Restart Server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 2: Test AI Triage

1. Login as responder: `responder@demo.sg` / `Demo1234!`
2. Navigate to any incident in the queue
3. Click "RUN AI TRIAGE"
4. You should see the AI analysis streaming in

### Step 3: Verify Response

The response should include:
- Triage assessment (3-5 sentences)
- Three ranked response options with:
  - Action plan
  - Rationale
  - Required resources
  - Notifications
  - ETA
  - Confidence score

---

## Key Differences

### Claude vs Gemini

| Feature | Claude | Gemini |
|---------|--------|--------|
| **Free Tier** | Limited | ✅ Available |
| **API Key Format** | `sk-ant-...` | `AIza...` |
| **Streaming** | Native | ✅ Supported |
| **JSON Parsing** | Requires extraction | Same |
| **Model** | `claude-sonnet-4` | `gemini-1.5-pro` |
| **Rate Limits** | 10 req/min | Based on plan |

### Prompt Compatibility

The same prompt works for both - no changes needed to the triage prompt!

### Response Format

Both return text + JSON in the same format, so the frontend doesn't need changes.

---

## Troubleshooting

### Issue: "GEMINI_API_KEY is required"

**Solution:**
1. Check `.env` file has `GEMINI_API_KEY`
2. Ensure the key starts with `AIza...`
3. Restart the server

### Issue: "API key not valid"

**Solution:**
1. Verify your key at [https://console.cloud.google.com/ai/gemini](https://console.cloud.google.com/ai/gemini)
2. Make sure the API is enabled
3. Check for typos in the key

### Issue: "Model not found"

**Solution:**
1. Ensure you have access to `gemini-1.5-pro`
2. Try `gemini-1.5-flash` instead (faster, cheaper)

### Issue: Streaming not working

**Solution:**
1. Check server logs for errors
2. Verify `gemini-1.5-pro` supports streaming
3. Try without streaming first

---

## Updated Demo

After switching to Gemini, the AI triage will:

1. **Analyze the incident** using live resource data
2. **Provide ranked options** based on hospital capacity
3. **Include Singapore-specific** agencies and locations
4. **Stream in real-time** for better UX
5. **Work with free tier** if you're on the free plan

---

## Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Claude** | Limited credits | Usage-based |
| **Gemini** | 15 requests/day (pro) or higher (free tier) | Usage-based |

**Note:** Free tier limits may change. Check current pricing for the most accurate information.

---

## Complete Migration Checklist

- [ ] Get Gemini API key
- [ ] Update `.env` with `GEMINI_API_KEY`
- [ ] Install `@google/generative-ai`
- [ ] Remove `@anthropic-ai/sdk`
- [ ] Create `server/src/services/gemini.ts`
- [ ] Update `server/src/config/env.ts`
- [ ] Update `server/src/index.ts`
- [ ] Delete `server/src/services/claude.ts`
- [ ] Restart server
- [ ] Test AI triage feature

---

**You're now using Google Gemini instead of Claude! 🎉**

The same AI-powered triage capabilities, with free tier access!