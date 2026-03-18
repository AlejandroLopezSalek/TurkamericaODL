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
- **Exam Architecture (Updated)**: Exams feature 3 sections (Listening, Reading, Writing) with level-specific question counts. Results, history, and user feedback are persisted in `LabExam` model. Users can view past results from a dedicated history view. Audio is played via **Browser Native Speech Synthesis** (`tr-TR` voice) with a server-side robotic fallback.
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

## Vercel AI SDK Implementation
The project is fully integrated with the **Vercel AI SDK**:
- `@ai-sdk/openai` configured with Groq baseURL to standardize text generation.
- `generateObject` for structured JSON data schemas (grammar quizzes, DNA analysis, vocabulary lists).
- `streamText` for faster real-time UX in the AI Chat (`/server/routes/ai.js`).

## Persistence & Context Rule
> [!IMPORTANT]
> ANY change to the project's core architecture, tech stack, or rules MUST be reflected in this file (`AGENTS.md`) and saved to Engram immediately. Documentation is the source of truth for all AI agents.

## Agent Protocol

### Environment
- You are operating NATIVELY inside a Linux (Ubuntu/WSL) environment.
- Use standard bash commands.
- The absolute root is `/home/$USER/...` (never use Windows paths).

### Memory
- Engram is active. Use `engram stats` and `engram save` directly in the terminal to manage architectural knowledge.
