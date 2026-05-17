import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Router } from 'express';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

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

  // Calculate distance to each hospital (simplified)
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

  const incidentAge = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000); // minutes

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

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Parse JSON from streamed text
function parseJSONFromStream(text: string): any {
  // Find the JSON block (starts with {"options" and ends with })
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
    let retries = 0;
    const maxRetries = 2;

    async function streamWithRetry(): Promise<void> {
      try {
        const stream = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: 'Provide triage assessment and response options.',
            },
          ],
          stream: true,
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
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
        if (retries < maxRetries && (error as any).status === 529) {
          retries++;
          logger.warn({ retries }, 'Retrying Claude API call (overloaded)');
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          await streamWithRetry();
        } else {
          logger.error({ error }, 'Claude API error');
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: 'Failed to get AI triage' })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          res.end();
        }
      }
    }

    // Start streaming
    await streamWithRetry();
  })
);

export default router;