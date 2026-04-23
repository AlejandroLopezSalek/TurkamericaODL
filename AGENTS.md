# Turkamerica AI Agent Context

You are an AI assistant helping build **Turkamerica**, an educational platform for Spanish/English speakers learning Turkish.

## System Architecture
Turkamerica uses a hybrid, high-performance architecture:
- **Frontend Engine**: Eleventy (11ty) Static Site Generator using HTML and Vanilla JavaScript. *(No React or Next.js components should be created for the frontend)*.
- **Styling**: TailwindCSS (`src/css/tailwind.css`). Utility-first approach.
- **Backend API**: Node.js and Express (`server/`).
- **Database**: MongoDB with Mongoose (`server/models/`).
- **Authentication**: JWT & OAuth2 (Google).
- **AI Core**: Vercel AI SDK (`@ai-sdk/openai`). Features: Chat, Word of the Day (WoD), DNA analysis, Exams.
- **AI Content Generation Rules (Critical)**:
  1. **Unicode Pinyin**: (Not applicable to Turkish, but keep UTF-8 standard).
  2. **Format Persistence**: Ensure specific target words are used in translations.
  3. **Groq JSON Strategy**: MUST use `generateText` with `responseFormat: 'json'`.
  4. **AI Chat Retention**: AI Chat history is limited to the **last 2 hours** (server-side filter) for all users to ensure context freshness and privacy.
- **Modal Design Standard**: ALL modals MUST use a full-screen backdrop with `backdrop-blur-md` (or higher) and `bg-slate-900/80` (or darker) for a premium feel. Centers MUST be used for content.
- **Rate Limiting & Testing**:
  - Daily limits for DNA, Exams, and StoryLab are enforced in `server/routes/ai.js` using `toISOString().split('T')[0]`.
  - **Developer Bypass**: Set `BYPASS_LAB_LIMITS=true` in `.env` to ignore these limits during development/testing.
- **Exam Architecture (Updated)**: Exams feature 3 sections (Listening, Reading, Writing) with level-specific question counts. 
  - **Listening**: Uses a single `listening_passage` (long conversation/monologue) for all section questions.
  - **Reading**: Uses a `reading_passage` displayed in a dedicated modal.
  - **Writing**: Level-specific A1-C1 tasks. A2+ uses long-form production.
  - **Persistence**: Results, history, and user feedback are persisted in `LabExam` model.
  - **Audio**: Played via **Browser Native Speech Synthesis** (`tr-TR`) with a server-side robotic fallback.
- **Community Contributions & Admin Review**: Platform supports user-submitted content.
  - **Contribution Types**: `lesson_edit`, `book_upload`, `community_exam`.
  - **Flow**: User submits -> `Contribution` model (status: `pending`) -> Admin review via `/Admin-Contributions.html` -> Status change to `approved`/`rejected`.
  - **Exam Sharing**: Approved `community_exam` entries are flagged for public visibility in the lab gallery.
- **TTS Strategy**: Prefer Browser Native SpeechSynthesis for realistic Turkish pronunciation. Fallback to `/api/chat/tts` only if unsupported.

## Coding Standards & Architecture (New)

### 1. Directory Structure
- `src/js/`: Modularized by function.
  - `auth/`: Session and user management.
  - `lab/`: AI-driven experimental features (`lab-exams.js`, `lab-story.js`, `lab-dna.js`).
  - `admin/`: Internal management tools.
  - `ui/`: Reusable interface components (e.g., `ai-mascot.js`).
  - `core/`: Global application logic.
- `scripts/`: Development and maintenance utilities (outside `src/`).

### 2. Multi-language (i18n) Strategy
- **Data-Driven Templates**: Avoid cloning `.html` files. Use Eleventy Pagination from `src/_data/i18n/*.json`.
- **Initialization**: Each lab page parses `i18n-messages` into `window.I18N` for client-side logic.
- **Routing & SEO**: Use a directory-based structure for localized pages.
- **AI Language Context**: Pass the `lang` parameter to AI routes.

## Coding Guidelines
1. **Frontend**: Keep the frontend purely static and vanilla. Use `localStorage` for state management where needed.
2. **Backend**: Follow strict security practices (input sanitization with `mongo-sanitize`, rate limiting, helmet, and CORS protection).
3. **User Property Access**: ALWAYS use safety guards or optional chaining (`?.`) when accessing `user.stats` or `user.profile`.
4. **Language**: User-facing interfaces and content English, Turkish and Spanish.
5. **Consistency**: Follow existing configurations (like Prettier/ESLint rules, Tailwind setup).
5. **UI Performance**: To avoid "flicker" between page loads, do NOT use `opacity: 0` fadeIn transitions in `base.njk`. Pages should load immediately (`opacity: 1`).
6. **Premium Modals**: Every modal wrapper (`fixed inset-0`) MUST include `backdrop-blur-md` and a semi-transparent dark background (`bg-slate-900/90`). Content should animate with `animate-slideUp`.
7. **Tailwind Safelist**: Any dynamic color class MUST be explicitly added to `tailwind.config.js` safelist/regex.

## Authentication & UI Logic (Critical)
1. **Auth Flicker Prevention**: To prevent the registration banner from "flashing" for logged-in users, a blocking script in `base.njk` `<head>` must check `localStorage.getItem('authToken')` and inject a critical style `#noticeBar { display: none !important; }` before rendering.
2. **Context-Aware Mascot**: The AI mascot (Panda/Capi) MUST be hidden on `/login/` and `/register/` pages to ensure a clean authentication UI.
3. **Google OAuth Completion**: Users registering via Google must be prompted to complete their profile (Username and Country) via a mandatory `backdrop-blur-md` modal if these fields are missing. The modal uses `window.GLOBAL_COUNTRIES` for dynamic, localized selection.
4. **Global Country Support**: The registration and profile completion forms MUST support a full list of global countries (ISO codes) via `src/_data/countries.json`.

### Dynamic Localization & Auth Standards
- **Source of Truth**: All country-related data is centralized in `src/_data/countries.json`.
- **Unified Layouts**: Authentication pages (`login.html`, `register.html`) must use `auth_base.njk`. Avoid creating language-specific auth layouts.
- **Permalink Pattern**: All authentication and main pages must use the `{{ t.dir }}<page>/index.html` permalink pattern for consistent SEO and i18n routing.
- **Dynamic Selects**: Use Eleventy's data loop to populate country selectors in templates: `{% for country in countries %}...{% endfor %}`.

## Vercel AI SDK Implementation
The project is fully integrated with the **Vercel AI SDK**:
- `@ai-sdk/openai` configured with Groq baseURL.
- **Groq JSON Strategy**: MUST use `generateText` with `responseFormat: 'json'` and manual JSON extraction via Regex.
- `streamText` for faster real-time UX in the AI Chat.

## Persistence & Context Rule
> [!IMPORTANT]
> ANY change to the project's core architecture, tech stack, or rules MUST be reflected in this file (`AGENTS.md`) and saved to Engram immediately. Documentation is the source of truth for all AI agents.

## MongoDB Setup for WSL Ubuntu

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

4. Verify installation:
   ```bash
   sudo systemctl status mongod
   mongosh --eval "db.adminCommand('ping')"
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

## ⚠️ Estado de GGA (Gentleman Guardian Angel)
> [!WARNING]
> El hook de pre-commit de **GGA** ha sido **DESACTIVADO** temporalmente (Marzo 2026) debido a errores recurrentes en el escaneo de IA que bloqueaban los commits.
> Para rehabilitarlo, se debe descomentar la línea `gga run || exit 1` en el archivo `.git/hooks/pre-commit`.
