# Ports & AI Integration Guide (Development)

This guide documents the critical locations and configurations that must be checked when changing server ports or troubleshooting AI integration in TurkAmerica.

## 1. Port Changes (Local Development)

When changing the server port (e.g., from `3000` to `3002`), update these locations:

### Backend
- **`.env`**: Update the `PORT` variable.
- **`server/server.js`**: 
    - Verify **CORS** configuration. It should allow the new local origin.
    - Verify **Content Security Policy (CSP)**. The `connect-src` must allow the new port (using a regex like `localhost:*` in development is recommended).
- **`nodemon.json`**: Ensure nodemon is configured to watch only relevant files (e.g., `server/`) and ignore generated static files (e.g., `_site/`) to avoid infinite restart loops.
- **`server/services/ragService.js`**: Add `checkCompatibility: false` to the `QdrantClient` constructor to silence server version warnings if using a custom local Docker image.

### Frontend
- **`src/js/config.js`**: Use `globalThis.location.origin` for `API_BASE_URL` in development instead of hardcoding a port. This makes the frontend port-agnostic.
- **`src/sw.js`**: 
    - Increment `CACHE_VERSION` (e.g., `v1.0.30`) to force the browser to clear old cached logic that might be pointing to the wrong port.
    - Check for any hardcoded URLs in the fetch interceptors.

---

## 2. AI Integration Troubleshooting (Groq & Vercel AI SDK)

### SDK Compatibility (v3.x+)
The Vercel AI SDK version 3+ uses the OpenAI **Responses API** (`/v1/responses`) by default. **Groq does not support this.**
- **Fix**: Use `groq.chat('model-name')` instead of `groq('model-name')` to force the standard Chat Completions API (`/v1/chat/completions`).

### Structured Output (JSON Mode)
If `generateObject` (JSON schema mode) fails or timeouts:
- **Strategy**: Use `generateText` with a strict system prompt and manually extract/parse the JSON.
- **Regex**: Use `rawText.match(/\{[\s\S]*\}/)` to find the JSON object within the AI response.
- **Model Selection**: `moonshotai/kimi-k2-instruct` is excellent for Turkish but requires manual JSON parsing via `generateText` for maximum reliability on Groq.

### Cache Management
AI responses are cached in MongoDB (`DailyWord` collection) and Redis.
- **Busting Cache**: If the AI output is corrupted or uses an old model version, increment the `cacheKey` in `server/routes/ai.js` (e.g., change `_v4_` to `_v5_`).

---

## 3. Common Pitfalls & What NOT To Do

- **â DO NOT use `redisClient.isOpen` alone**: In development, if Redis is down, `isOpen` might return `true` while the client is still in a "reconnecting" loop. Any `await redisClient.get()` will **hang the entire request** indefinitely.
    - **â Fix**: Always check `if (redisClient.isOpen && redisClient.isReady)`.
- **â DO NOT let nodemon watch everything**: If nodemon watches the build output folder (like `_site/`), every time the frontend builds, the server will restart. This creates an infinite loop.
    - **â Fix**: Use a `nodemon.json` to `ignore` the build folder and only `watch` the `server/` directory.
- **â DO NOT ignore "Phantom" processes**: If you change the `PORT` in `.env` and the server still behaves like the old version (or returns 503 without logging anything), an old Node process might be "zombie" blocking the port.
    - **â Fix**: Run `taskkill /f /im node.exe` in a terminal to clear all stale processes and restart.
- **â DO NOT use generic `generateObject`**: Some Groq models claim JSON support but time out or fail with complex schemas.
    - **â Fix**: Use `generateText` with a strict system prompt and regex extraction: `text.match(/\{[\s\S]*\}/)`. This is much more reliable across different models.

---

## 4. Case Study: Solving the "Static" Word-of-Day (503 Error)

When the "Word of the Day" stopped loading and showed a 503 error in the browser, these were the **exact steps** taken to fix it:

1.  **Identify the SDK Conflict**: Upgrading to `@ai-sdk/openai` v3 changed the default API to `/v1/responses`. Groq failed with a "400 Bad Request".
    - *Solution*: Added `compatibility: 'compatible'` in the provider config and changed model calls to `groq.chat('model')`.
2.  **Trace the Hang**: The logs showed the request reached the server but "died" before sending a response. This was caused by the Redis client.
    - *Solution*: Replaced `if (redisClient.isOpen)` with `if (redisClient.isOpen && redisClient.isReady)`. This prevented the server from waiting forever for a Redis connection that didn't exist locally.
3.  **Force Cache Refresh**: The browser was caching old "broken" responses.
    - *Solution*: Bumped the `CACHE_VERSION` in `sw.js` and changed the `cacheKey` prefix in `ai.js` (e.g., to `_v7_`) to force a clean generation.
4.  **Verify the Port**: Ensured the frontend was hitting the correct backend port by using `globalThis.location.origin` instead of a hardcoded `localhost:3000`.
