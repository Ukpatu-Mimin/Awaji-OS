# Awaji OS

Awaji OS is a local-first student productivity dashboard with an AI study companion. It combines class scheduling, deadline tracking, focused study tools, active recall, mood logging, habit streaks, notifications, and an AI copilot in one React application.

## Features

### Local User Profiles

Awaji OS includes a lightweight signup and login flow for creating separate student workspaces in the browser. Each profile stores its own classes, deadlines, theme, notifications, habits, streak count, and AI chat history through `localStorage`.

This makes the app simple to run without a database or cloud account system. It is useful for demos, prototypes, and personal local use, but it is not production-grade authentication because passwords are stored in browser storage.

### Home Dashboard

The home dashboard gives students a quick overview of the workspace. It shows registered classes, pending deadlines, current streak progress, a study call-to-action, and a feature carousel that links into the major modules.

The dashboard is designed as the starting point for daily use: check what is active, jump into the Study Arena, ask Awaji AI for help, or move directly into class and deadline management.

### Class Hub and Attendance

The Class Hub manages a student's academic schedule. Students can configure semester details, expected class days, semester duration, exam windows, and course schedules.

Each class can include a course name, code, instructor, room, color, duration, and weekly sessions. The attendance view lets students select a date, see scheduled sessions for that day, and mark whether they attended or missed each class.

The app also migrates older class records into structured weekly sessions when possible, so earlier simple schedule data can still work with the newer attendance system.

### Deadline and Workload Board

The Deadline module tracks assignments, exams, quizzes, projects, and other deliverables. Each task can include a subject, due date, priority, difficulty, estimated workload hours, completion status, and subtasks.

Students can view deadlines as a normal list or as a Kanban board with pending, in-progress, and completed columns. Subtasks help break large assignments into smaller actions, and workload totals help estimate how much effort is sitting in each status column.

The app also scans for overdue or soon-due deadlines and can create alerts in the notification center.

### Study Workspace

The Study Workspace combines several learning tools into one module:

- Pomodoro timer: standard focus sessions, short breaks, and long breaks, with optional ambient sounds.
- Ambient audio: generated white noise, rain, and wave-like sounds using the browser audio APIs.
- Active recall flashcards: manual cards plus AI-generated flashcards from uploaded or pasted study notes.
- Socratic tutor: an AI dialogue mode that asks probing questions instead of directly giving answers.
- Feynman technique evaluator: students explain a concept, and the AI evaluates clarity, jargon, gaps, analogies, and an improved explanation.

Study material can be pasted directly or uploaded as text/Markdown/PDF. For PDFs, the backend sends the file to the selected AI provider for extraction before generating notes or flashcards.

### Awaji AI Assistant

Awaji AI is the main chat companion for academic help. It can explain topics, draft study guides, generate practice quizzes, help with code debugging, structure proofs, and support general studying workflows.

The assistant also supports agentic action tags. When the model returns a supported hidden-style action tag, the frontend parses it and turns it into an app action. Supported actions include:

- Starting a Pomodoro timer
- Adding a class
- Adding a deadline
- Updating the streak count
- Triggering mood-based emoji rain

This allows natural language prompts such as asking the AI to add a deadline or start a focus session, while still keeping the actual state changes inside the frontend app.

### Mood Tracker and Breathing Coach

The Mood module lets students log daily emotional state with a short note. Supported moods include happy, sad, anxious, angry, numb, and tired. The latest log for a day updates the annual heatmap so students can see patterns over time.

Mood logging can trigger a full-screen emoji rain animation matching the selected emotion. The module also includes a breathing coach with inhale, hold, and exhale phases for quick regulation during stressful study sessions.

### Streak and Habit System

The Streak module tracks daily study rituals such as completing Pomodoro sessions, logging class lectures, and talking with Awaji AI. Completing rituals updates progress and can contribute to the student's streak count.

The module includes a progress bar, active streak display, and achievement-style badges. Other parts of the app can sync streak data through browser events, so AI actions and habit changes stay connected.

### Theme Customization

Awaji OS includes several theme presets for different study environments, including ivory, dark, amber, emerald, ninja blue, and purple. The selected theme is saved to `localStorage` and restored for the current profile.

The themes affect the main shell styling and are intended to make the workspace feel more personal for daytime, night study, coding, or calm focus sessions.

### Notification Center

The notification center collects workspace alerts in one dropdown. It supports deadline alerts, class reminders, streak messages, AI-related notifications, general alerts, unread counts, mark-as-read actions, clearing all notifications, and navigation back to the related module.

The app can also request native browser notification permission and display system notifications when custom alerts are created.

### AI Provider Support

The backend can use either OpenAI or Gemini. OpenAI is option 1 and Gemini is option 2 in the `.env.local` setup. The selected provider powers chat, PDF extraction, flashcard generation, Socratic tutoring, Feynman evaluation, and study-plan generation.

The API keys are read only on the Express server. The React frontend does not receive the keys directly.

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

## Clone and Run Locally

Prerequisites:

- Node.js
- npm
- Git
- An OpenAI API key or Gemini API key

1. Clone the repository:

```bash
git clone <your-repository-url>
```

2. Move into the project folder:

```bash
cd Awaji-OS
```

3. Create a `.env.local` file in the project root and add at least one API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
```

4. Install dependencies:

```bash
npm install
```

5. Start the local development server:

```bash
npm run dev
```

6. Open the app in your browser:

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
