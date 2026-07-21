# Awaji OS

Awaji OS is a local-first student productivity dashboard with an AI study companion. It combines class scheduling, deadline tracking, focused study tools, active recall, mood logging, habit streaks, notifications, and an AI copilot in one React application.

## Features

- Local signup/login profiles stored in browser `localStorage`
- Class hub with academic calendar setup, weekly sessions, and attendance tracking
- Deadline board with priorities, estimated workload, subtasks, list view, and Kanban view
- Study workspace with Pomodoro timers, ambient sound, active recall flashcards, Socratic tutoring, and Feynman technique evaluation
- PDF/text study-material ingestion for AI-generated notes and flashcards
- Awaji AI chat assistant with action tags that can add classes, add deadlines, start Pomodoro timers, update streaks, and trigger mood effects
- Mood tracker with daily logs, heatmap, breathing coach, and emoji rain
- Streak system for daily study rituals
- Theme presets for different study environments
- Notification center for deadline, class, streak, AI, and custom alerts

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Express
- Gemini API through `@google/genai`
- OpenAI API through server-side HTTPS requests

## AI Provider Setup

Awaji OS supports both OpenAI and Gemini API keys. API keys must stay on the server and should never be placed in client-side React code.

Create a `.env.local` file in the project root:

```bash
# Option 1: OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Option 2: Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: force one provider when both keys are present.
# Defaults to OpenAI first, then Gemini.
AI_PROVIDER=openai
# AI_PROVIDER=gemini

# Optional OpenAI model override.
OPENAI_MODEL=gpt-4.1-mini
```

Provider selection:

- If `AI_PROVIDER=openai`, the server requires `OPENAI_API_KEY`.
- If `AI_PROVIDER=gemini`, the server requires `GEMINI_API_KEY`.
- If `AI_PROVIDER` is not set, the server uses OpenAI when `OPENAI_API_KEY` exists, otherwise Gemini when `GEMINI_API_KEY` exists.

The frontend still calls routes named `/api/gemini/...` for compatibility with the existing code, but the backend can now route those requests to either Gemini or OpenAI.

## Run Locally

Prerequisite: Node.js

```bash
npm install
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start the Express + Vite development server
npm run build    # Build the React app and bundle the server
npm run start    # Run the production server from dist/server.cjs
npm run lint     # Type-check with TypeScript
npm run clean    # Remove generated build output
```

## Important Notes

- User accounts and passwords are stored in browser `localStorage`; this is prototype auth, not production-grade security.
- Clearing browser storage will remove local profiles, classes, deadlines, streaks, mood logs, and study data.
- The backend needs internet access for Gemini/OpenAI features.
- AI PDF parsing depends on the selected provider's file-input support and account access.
