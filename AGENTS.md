# Turkamerica AI Agent Context

You are an AI assistant helping build **Turkamerica**, an educational platform for learning Turkish.

## System Architecture
Turkamerica uses a hybrid, high-performance architecture:
- **Frontend Engine**: Eleventy (11ty) Static Site Generator using HTML and Vanilla JavaScript. *(No React or Next.js components should be created for the frontend)*.
- **Styling**: TailwindCSS (`src/css/tailwind.css`). Utility-first approach.
- **Backend API**: Node.js and Express (`server/`).
- **Database**: MongoDB with Mongoose (`server/models/`).
- **Authentication**: JWT & OAuth2 (Google).
- **AI Core**: Vercel AI SDK (`@ai-sdk/openai`) configured with Groq API. Models: `moonshotai/kimi-k2-instruct` (Kimi) and `llama-3.3-70b`. Features: Chat, Word of the Day, DNA (Suffix) analysis, Exams.
- **AI Content Generation Rules (Critical)**:
  1. **Turkish Integrity**: Ensure suffixes and vowel harmony are respected.
  2. **Format Persistence**: `exampleTranslation` MUST include the target word (e.g., "I see my Anne").
  3. **Unicode Support**: Use proper Turkish characters (ç, �, ı, ö, �, ü).
  4. **One-Shot Guard**: Always provide a JSON example in the messages array to anchor the expected output structure.
  5. **Groq JSON Strategy**: MUST use `generateText` with `responseFormat: 'json'`.
- **Rate Limiting & Testing**:
  - Daily limits for DNA and Exams are enforced in `server/routes/ai.js`.
  - **Developer Bypass**: Set `BYPASS_LAB_LIMITS=true` in `.env` to ignore these limits during development/testing.
- **Exam Architecture (Updated)**: Exams feature 3 sections (Listening, Reading, Writing) with level-specific question counts.
  - **Listening**: Uses a single `listening_passage` (long conversation/monologue) for all section questions.
  - **Reading**: Uses a `reading_passage` displayed in a dedicated modal.
  - **Writing**: Level-specific Turkish grammar and essay tasks.
  - **Persistence**: Results, history, and user feedback are persisted in `LabExam` model.
  - **Audio**: Played via **Browser Native Speech Synthesis** (`tr-TR`) with a server-side robotic fallback.
- **TTS Strategy**: Prefer Browser Native SpeechSynthesis for realistic Turkish pronunciation. Fallback to `/api/chat/tts` only if unsupported.

## Coding Standards & Architecture

### 1. Directory Structure
- `src/js/`: Modularized by function.
  - `auth/`: Session and user management.
  - `lab/`: AI-driven experimental features (`lab-exams.js`, `lab-story.js`, `lab-dna.js`).
  - `admin/`: Internal management tools.
  - `ui/`: Reusable interface components.
  - `core/`: Global application logic.
- `scripts/`: Development and maintenance utilities (outside `src/`).

### 2. Multi-language (i18n) Strategy
- **Data-Driven Templates**: Avoid cloning `.html` files. Use Eleventy Pagination from `src/_data/i18n/*.json`.
- **Initialization**: Each lab page (`ADN`, `Examenes`, `StoryLab`, `Analisis`) parses `i18n-messages` into `window.I18N` for client-side logic to ensure consistent translation in dynamic UI updates.
- **Routing & SEO**: Use a directory-based structure for localized pages (e.g., `permalink: "{{ t.dir }}PageName/index.html"`). All links in `base.njk` are normalized to avoid double-slash issues in localized paths.
- **Supported Languages**: **es** (Spanish - Native), **en** (English), **pt** (Portuguese).
- **AI Language Context**: Pass the `lang` parameter to AI routes (`/generate-exam`, `/start-story`) to ensure the agent generates content (instructions, feedback) in the user's native tongue. 

## Coding Guidelines
1. **Frontend**: Keep the frontend purely static and vanilla. Use `localStorage` for state management where needed.
2. **Backend**: Follow strict security practices (input sanitization with `mongo-sanitize`, rate limiting, helmet, and CORS protection).
3. **Consistency**: Follow existing configurations (like Prettier/ESLint rules, Tailwind setup).
4. **UI Performance**: To avoid "flicker" between page loads, do NOT use `opacity: 0` fadeIn transitions in `base.njk`. Pages should load immediately (`opacity: 1`).
5. **Tailwind Safelist**: Any dynamic color class (e.g., based on level levels) MUST be explicitly added to `tailwind.config.js` safelist/regex.

## Vercel AI SDK Implementation
The project is fully integrated with the **Vercel AI SDK**:
- `@ai-sdk/openai` configured with Groq baseURL to standardize text generation.
- **Groq JSON Strategy**: MUST use `generateText` with `responseFormat: 'json'` and manual JSON extraction via Regex (`.match(/\{[\s\S]*\}/)`) to ensure compatibility. `generateObject` is deprecated for Groq routes due to periodic schema validation failures.
- `streamText` for faster real-time UX in the AI Chat (`/server/routes/ai.js`).

## MongoDB Setup for WSL Ubuntu

When migrating from Windows to WSL Ubuntu, MongoDB needs to be properly installed and configured:

### Installation Steps:
1. Add MongoDB repository:
   ```bash
   sudo apt-get install -y gnupg curl
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```

2. Install MongoDB:
   ```bash
   sudo apt-get update && sudo apt-get install -y mongodb-org
   ```

3. Start and enable MongoDB service:
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

### Environment Variables:
Ensure `.env` file has correct MongoDB URI:
```
MONGO_URI=mongodb://127.0.0.1:27017/turkamerica
```

## Agent Protocol

### Environment
- You are operating NATIVELY inside a Linux (Ubuntu/WSL) environment.
- Use standard bash commands.
- The absolute root is `/home/$USER/...` (never use Windows paths).

### Memory
- Engram is active. Use `engram stats` and `engram save` directly in the terminal to manage architectural knowledge.

## Server Health Monitoring
Useful commands for troubleshooting the Oracle Cloud 2GB RAM environment:
- **PM2**: `pm2 status`, `pm2 monit`, `pm2 logs`
- **Redis**: `redis-cli ping`
- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`
- **System**: `free -h` (check swap/RAM), `htop`, `df -h`
