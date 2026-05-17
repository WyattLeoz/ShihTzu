# Gemini Migration - Quick Summary

## What I Changed

### ✅ Server Files Updated

1. **`server/src/config/env.ts`**
   - Changed: `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`

2. **`server/src/services/gemini.ts`** (NEW FILE)
   - Replaced: `server/src/services/claude.ts`
   - Uses Google Generative AI SDK
   - Same streaming capabilities
   - Same prompt and response format

3. **`server/src/index.ts`**
   - Changed import: `claudeRouter` → `geminiRouter`
   - Same route: `/api/ai/triage`

4. **`server/src/middleware/errorHandler.ts`**
   - Removed Anthropic-specific error handling
   - Added Gemini error handling

5. **`server/package.json`**
   - Removed: `@anthropic-ai/sdk`
   - Added: `@google/generative-ai`

6. **`.env.example`**
   - Changed: `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`

---

## Migration Steps

### 1. Get Gemini API Key

Go to: https://aistudio.google.com/app/apikey

1. Click "Create API key"
2. Copy the key (starts with `AIza...`)

### 2. Update Your `.env` File

Replace:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

With:
```env
GEMINI_API_KEY=AIza-your-gemini-key-here
```

### 3. Install New Dependencies

From the server folder:

```bash
cd server
npm install @google/generative-ai
```

### 4. Remove Old Dependencies

```bash
npm uninstall @anthropic-ai/sdk
```

### 5. Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## What's the Same?

✅ **Frontend** - No changes needed
✅ **API Endpoint** - Still `/api/ai/triage`
✅ **Response Format** - Same JSON structure
✅ **Streaming** - Real-time streaming works
✅ **Prompt** - Same triage analysis prompt
✅ **Validation** - Same Zod schema validation

---

## What's Different?

| Feature | Claude | Gemini |
|---------|--------|--------|
| **API Key** | `sk-ant-...` | `AIza...` |
| **Model** | `claude-sonnet-4` | `gemini-1.5-pro` |
| **Free Tier** | Limited credits | ✅ Available |
| **SDK** | `@anthropic-ai/sdk` | `@google/generative-ai` |

---

## Quick Test

1. Login as responder: `responder@demo.sg` / `Demo1234!`
2. Navigate to any incident
3. Click "RUN AI TRIAGE"
4. Watch the AI analysis stream in real-time

---

## Troubleshooting

**Error: "GEMINI_API_KEY is required"**
→ Add `GEMINI_API_KEY=AIza...` to your `.env` file

**Error: "API key not valid"**
→ Verify your key at https://console.cloud.google.com/ai/gemini

**Streaming not working**
→ Check server logs for Gemini-specific errors

---

## Clean Up (Optional)

If you want to remove old files:

```bash
# Remove old Claude service
rm server/src/services/claude.ts
rm server/src/routes/claude.ts

# Remove old Claude AI routes file if it exists
```

---

**Done! You're now using Google Gemini instead of Claude! 🎉**

The same AI-powered triage, now with free tier access!