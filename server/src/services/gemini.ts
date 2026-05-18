import { Router } from 'express';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { z } from 'zod';

// ─── Zod schema ────────────────────────────────────────────────────────────────

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
  options: z.array(TriageOptionSchema).min(1),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseJSONFromStream(text: string): any {
  const start = text.lastIndexOf('{"options"');
  if (start === -1) return null;
  const end = text.lastIndexOf('}');
  if (end === -1) return null;
  try {
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return null;
  }
}

// ─── Mock triage (fallback when AI key unavailable) ────────────────────────────

function generateMockTriage(incident: any): { text: string; options: any[] } {
  const severityLabel = incident.severity === 1 ? 'CRITICAL' : incident.severity === 2 ? 'HIGH' : 'MEDIUM';
  const typeLabel = (incident.type || 'general').toUpperCase();
  const loc = incident.location_text || 'unknown location';

  const agencyMap: Record<string, string[]> = {
    flood:          ['SCDF Flood Response', 'PUB Flood Control', 'PA Evacuation Team'],
    medical:        ['SCDF Ambulance Service', 'Singapore General Hospital A&E', 'MOH Crisis Team'],
    fire:           ['SCDF Fire Station', 'SCDF Hazmat Unit', 'SPF Traffic Division'],
    road:           ['SPF Traffic Police', 'SCDF EMS', 'LTA Operations'],
    infrastructure: ['SCDF Engineering', 'BCA Structural Team', 'SP Group Utilities'],
    civil:          ['SPF Rapid Deployment Force', 'SCDF EMS', 'ISD Liaison'],
    other:          ['SCDF Response Team', 'SPF Patrol', 'MOH Ops'],
  };

  const agencies = agencyMap[incident.type] || agencyMap.other;

  const assessmentText = `[AI Triage — Demo Mode]\n\n${typeLabel} incident at ${loc}. Severity assessed as ${severityLabel}. ` +
    `Based on incident characteristics and current resource posture, three response options have been generated. ` +
    `Option 1 represents the optimal response given available resources. ` +
    `Human operator confirmation required before any dispatch action is taken. ` +
    `Recommend immediate acknowledgement and dispatch within the next 5 minutes.\n\n`;

  const options = [
    {
      rank: 1,
      action: `Immediate dispatch — ${agencies[0]} to ${loc}`,
      rationale: `Fastest available response for ${severityLabel} ${typeLabel} incident. Resource availability confirmed. Recommended as primary response.`,
      resources_required: [`2× ${agencies[0]} units`, '1× Ambulance (ALS)', 'SPF traffic support'],
      notify: [agencies[0], agencies[1] || 'MOH', 'Nearest Hospital A&E'],
      eta_minutes: incident.severity === 1 ? 6 : incident.severity === 2 ? 10 : 15,
      confidence: incident.severity === 1 ? 88 : 82,
    },
    {
      rank: 2,
      action: `Staged response — primary unit + medical standby`,
      rationale: `Moderate resource commitment with medical backup in case casualties are confirmed on scene. Slightly longer ETA but more sustainable for potentially prolonged incident.`,
      resources_required: [`1× ${agencies[0]} unit`, '2× Ambulance', `${agencies[2] || 'Community Volunteers'}`],
      notify: [agencies[0], 'SCDF Operations Centre', 'MOH'],
      eta_minutes: incident.severity === 1 ? 10 : 14,
      confidence: incident.severity === 1 ? 74 : 78,
    },
    {
      rank: 3,
      action: `Multi-agency coordinated response with community support`,
      rationale: `Larger-scale response appropriate if incident escalates. Activates PA and volunteer networks. Higher overhead but suitable if initial assessment underestimates severity.`,
      resources_required: [`3× ${agencies[0]} units`, agencies[1] || 'MOH Emergency', 'PA Community Response', 'Red Cross Volunteers'],
      notify: ['SCDF', 'SPF', 'MOH', 'PA Town Council', agencies[1] || 'MOH'],
      eta_minutes: incident.severity === 1 ? 14 : 18,
      confidence: 65,
    },
  ];

  return { text: assessmentText, options };
}

// ─── System prompt builder ─────────────────────────────────────────────────────

async function buildSystemPrompt(incident: any): Promise<string> {
  const [hospitalResult, volunteerResult] = await Promise.all([
    query({ text: 'SELECT name, short_name, available_beds, icu_available, trauma_bays, address, lat, lng FROM hospitals ORDER BY name', values: [] }).catch(() => ({ rows: [] })),
    query({ text: `SELECT unnest(skills) AS skill, COUNT(*) AS count FROM volunteers WHERE is_available = true GROUP BY unnest(skills)`, values: [] }).catch(() => ({ rows: [] })),
  ]);

  const iLat = incident.location_lat || 1.3521;
  const iLng = incident.location_lng || 103.8198;

  const hospitals = hospitalResult.rows.map((h: any) => ({
    name: h.name, shortName: h.short_name,
    availableBeds: h.available_beds, icuAvailable: h.icu_available, traumaBays: h.trauma_bays,
    address: h.address,
    distanceKm: calculateDistance(iLat, iLng, h.lat, h.lng).toFixed(1),
  }));

  const volunteerCounts = volunteerResult.rows.reduce((acc: any, r: any) => {
    acc[r.skill] = parseInt(r.count); return acc;
  }, {});

  const severityLabels: Record<number, string> = { 1: 'CRITICAL', 2: 'HIGH', 3: 'MEDIUM' };
  const age = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000);

  return `You are QuickAid Triage AI — Singapore Civil Defence Force emergency decision support system.
You assist trained operators. You NEVER make the final dispatch decision.

LIVE RESOURCE SNAPSHOT:
Hospitals: ${JSON.stringify(hospitals)}
Volunteer Skills Available: ${JSON.stringify(volunteerCounts)}

INCIDENT:
Ticket: ${incident.ticket_number || 'UNKNOWN'}
Type: ${incident.type}
Severity: ${incident.severity} (${severityLabels[incident.severity] || 'UNKNOWN'})
Location: ${incident.location_text} (${iLat}, ${iLng})
Description: ${incident.description}
Age: ${age} minutes

Respond with:
PART 1 — Triage assessment (3–5 sentences). Professional tone. Cover: incident nature, immediate risk, resource constraints.

PART 2 — Raw JSON only (no markdown fences):
{"options":[
  {"rank":1,"action":"...","rationale":"...","resources_required":["..."],"notify":["..."],"eta_minutes":N,"confidence":N},
  {"rank":2,"action":"...","rationale":"...","resources_required":["..."],"notify":["..."],"eta_minutes":N,"confidence":N},
  {"rank":3,"action":"...","rationale":"...","resources_required":["..."],"notify":["..."],"eta_minutes":N,"confidence":N}
]}

Rules: Name real Singapore hospitals/agencies. Options must differ meaningfully. confidence is 0–100. notify = auto-notification list if option approved.`;
}

// ─── Router ────────────────────────────────────────────────────────────────────

const router = Router();

router.post('/triage',
  requireAuth,
  requireRole('responder', 'supervisor', 'gov_admin'),
  aiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { incidentId } = req.body;

    if (!incidentId) {
      res.status(400).json({ error: { code: 'INCIDENT_ID_REQUIRED', message: 'incidentId is required' } });
      return;
    }

    // Fetch incident
    let incident: any;
    try {
      const r = await query({ text: 'SELECT * FROM incidents WHERE id = $1', values: [incidentId] });
      if (r.rows.length === 0) {
        res.status(404).json({ error: { code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' } });
        return;
      }
      incident = r.rows[0];
    } catch (err) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to fetch incident' } });
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    // ── Try real Gemini API ────────────────────────────────────────────────────
    const apiKey = env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const systemPrompt = await buildSystemPrompt(incident);
        let streamedText = '';

        const result = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.6 },
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            streamedText += text;
            res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
          }
        }

        const jsonData = parseJSONFromStream(streamedText);
        if (jsonData) {
          const validated = TriageResponseSchema.parse(jsonData);
          await query({
            text: `UPDATE incidents SET ai_triage_data = $1, status = 'triaging', updated_at = NOW() WHERE id = $2`,
            values: [JSON.stringify(validated), incidentId],
          }).catch(() => {});
          res.write(`data: ${JSON.stringify({ type: 'complete', options: validated.options })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        // Fall through to mock if JSON parse fails
      } catch (err) {
        logger.warn({ err }, 'Gemini API failed — falling back to mock triage');
      }
    } else {
      logger.info('GEMINI_API_KEY not set — using mock triage (demo mode)');
    }

    // ── Mock triage fallback ───────────────────────────────────────────────────
    const mock = generateMockTriage(incident);

    // Stream mock text character by character for realism
    const words = mock.text.split(' ');
    for (const word of words) {
      const chunk = word + ' ';
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
      await new Promise(r => setTimeout(r, 15)); // ~15ms per word
    }

    const mockPayload = { options: mock.options };
    await query({
      text: `UPDATE incidents SET ai_triage_data = $1, status = 'triaging', updated_at = NOW() WHERE id = $2`,
      values: [JSON.stringify(mockPayload), incidentId],
    }).catch(() => {});

    res.write(`data: ${JSON.stringify({ type: 'complete', options: mock.options })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  })
);

// POST /ai/broadcast-draft — used by gov broadcast composer
router.post('/broadcast-draft',
  requireAuth, requireRole('gov_admin', 'supervisor'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { context, audience, incidentId } = req.body;

    const audienceLabel = audience === 'all' ? 'general public' : audience === 'responders' ? 'emergency responders' : 'zone residents';

    const mockTitle = `⚠ Emergency Advisory — Immediate Action Required`;
    const mockMessage = `${context ? context + '\n\n' : ''}` +
      `Members of the public and ${audienceLabel} are advised to remain vigilant and follow all official instructions. ` +
      `Emergency services are on-site and coordinating the response. ` +
      `If you are in the affected area, please follow evacuation instructions and avoid the scene. ` +
      `Call 995 (fire/medical emergency) or 999 (police emergency) if you need immediate assistance. ` +
      `Further updates will be provided as the situation develops. ` +
      `Monitor gov.sg and 938Live for the latest advisories.`;

    // Try real API if available
    if (env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a Singapore government crisis communications officer.
Write a public broadcast advisory for ${audienceLabel}.
Context: ${context}
Keep it factual, calm, authoritative. Under 120 words.
Respond with JSON only: {"title":"...","message":"..."}`;

        const result = await model.generateContent(prompt);
        const text   = result.response.text();
        const match  = text.match(/\{[^}]+\}/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          res.json({ title: parsed.title, message: parsed.message });
          return;
        }
      } catch {
        // fall through to mock
      }
    }

    res.json({ title: mockTitle, message: mockMessage });
  })
);

// POST /ai/draft-incident — called from NewIncident wizard
router.post('/draft-incident',
  requireAuth, requireRole('responder', 'supervisor', 'gov_admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { signals } = req.body as { signals: any[] };

    if (!signals || signals.length === 0) {
      res.status(400).json({ error: { code: 'SIGNALS_REQUIRED', message: 'At least one signal is required' } });
      return;
    }

    // ── Try Gemini ────────────────────────────────────────────────────────────
    if (env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const sigSummary = signals.map((s: any) =>
          `[${s.source.toUpperCase()}] ${s.title}: ${s.description} (Location: ${s.location || 'unknown'})`
        ).join('\n');

        const prompt = `You are an emergency dispatch officer for Singapore Civil Defence Force.
Analyse the following live data signals from government monitoring systems and generate a formal incident report.

SIGNALS:
${sigSummary}

Respond ONLY with a valid JSON object (no markdown, no fences):
{
  "title": "<concise incident title, under 80 chars>",
  "type": "<one of: fire|flood|medical|road|infrastructure|civil|other>",
  "severity": <1 for critical, 2 for high, 3 for medium>,
  "locationText": "<primary location of the incident>",
  "description": "<3–5 sentences. What is happening, what is the immediate risk, what evidence supports this assessment>",
  "estimatedCasualties": <number or 0>,
  "estimatedAffectedPop": <estimated number of residents/people affected>,
  "immediateActions": "<2–3 most critical immediate actions for the first responding unit>",
  "resourcesNeeded": ["<resource 1>", "<resource 2>", "<resource 3>"],
  "confidence": <0–100, how confident the AI is based on available signal data>,
  "reasoning": "<one sentence explaining why these signals indicate this incident type>"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          res.json({ draft: parsed, source: 'ai' });
          return;
        }
      } catch (err) {
        logger.warn({ err }, 'Gemini draft-incident failed — using mock');
      }
    }

    // ── Mock draft (deterministic from signals) ──────────────────────────────
    const allText = signals.map((s: any) => `${s.title} ${s.description}`).join(' ').toLowerCase();
    const loc = signals.find((s: any) => s.location)?.location || 'Singapore';

    let type = 'other', severity = 3, title = 'Emergency Incident';
    let estimatedCasualties = 0, estimatedAffectedPop = 500;
    let resources: string[] = ['SCDF Response Team', 'Ambulance standby', 'SPF patrol'];

    if (allText.includes('flood') || allText.includes('water level') || allText.includes('drainage')) {
      type = 'flood'; severity = allText.includes('critical') || allText.includes('trapped') ? 1 : 2;
      title = `Flash Flood — ${loc}`;
      estimatedAffectedPop = 2000;
      resources = ['SCDF Flood Response', 'PUB Drainage Ops', '2× Ambulance', 'PA Evacuation Team'];
    } else if (allText.includes('fire') || allText.includes('blaze')) {
      type = 'fire'; severity = 1;
      title = `Fire Incident — ${loc}`;
      resources = ['SCDF Fire Engine', 'SCDF Rescue Tender', 'Ambulance'];
    } else if (allText.includes('medical') || allText.includes('outbreak') || allText.includes('dengue') || allText.includes('health')) {
      type = 'medical'; severity = 2;
      title = `Health Alert — ${loc}`;
      resources = ['MOH Emergency Team', 'Ambulance', 'SGH A&E Standby'];
    } else if (allText.includes('traffic') || allText.includes('road') || allText.includes('accident') || allText.includes('collision')) {
      type = 'road'; severity = 2;
      title = `Road Incident — ${loc}`;
      resources = ['SPF Traffic Police', 'SCDF Ambulance', 'LTA Traffic Ops'];
    } else if (allText.includes('haze') || allText.includes('psi') || allText.includes('rain') || allText.includes('weather')) {
      type = 'infrastructure'; severity = 3;
      title = `Weather Emergency — ${loc}`;
      resources = ['NEA Monitoring', 'PA Community Response', 'Ambulance standby'];
    }

    const signalCount = signals.length;
    const confidence = Math.min(50 + signalCount * 8, 85);

    res.json({
      draft: {
        title, type, severity, locationText: loc,
        description: `Multiple monitoring systems have flagged an emergency situation at ${loc}. ` +
          `${signalCount} data signal${signalCount > 1 ? 's' : ''} from ${[...new Set(signals.map((s: any) => s.source.toUpperCase()))].join(', ')} ` +
          `indicate an active ${type} event requiring immediate response. ` +
          `Community reports and sensor data corroborate the situation. ` +
          `Immediate dispatch is recommended pending on-ground confirmation.`,
        estimatedCasualties,
        estimatedAffectedPop,
        immediateActions: `1. Dispatch primary response unit to ${loc}. 2. Alert nearest hospital A&E for standby. 3. Notify PA Community Network for evacuation support if required.`,
        resourcesNeeded: resources,
        confidence,
        reasoning: `Convergent signals from ${signals.map((s: any) => s.source).join(', ')} consistently indicate ${type} event conditions at this location.`,
      },
      source: 'mock',
    });
  })
);

export default router;