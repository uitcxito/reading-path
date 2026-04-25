# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
说中文

## Project Overview

ReadPath is a web app that generates personalized "reading maps" for EPUB books. Users upload an EPUB, state their question/goal, and AI produces a prioritized reading guide with chapter- and section-level recommendations. After reading, users take an AI-generated comprehension test. All UI text and AI prompts are in Chinese.

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint (flat config, v9)
```

No test framework is installed — there are no tests.

## Environment Variables

Required in `.env.local`:
```
DEEPSEEK_API_KEY=your_api_key
```

That is the only env var. The Deepseek API URL is hardcoded in `lib/deepseek.ts`.

## Architecture

### Single-Page State Machine

The entire frontend lives in `app/page.tsx` as a `'use client'` component with a 4-state FSM — no routing:

```
upload → analyzing → result → test
                              ↓
                          (back to result)
```

All state is in React `useState`. There is no database, no persistence, no user accounts. The app is fully stateless and ephemeral.

### Two-Phase AI Analysis (Token Optimization)

The core pattern in `app/api/analyze/route.ts`:

1. **Phase 1 (Bird's Eye)**: Sends chapter titles + 300-char previews (from 500-char `preview` field) + section titles → gets relevance scores (0–100) per chapter. `maxTokens: 4096`.
2. **Phase 2 (Deep Dive)**: Sends full content of chapters scoring ≥ 40 → generates detailed `ReadingMap` with section-level reading instructions. `maxTokens: 8192`.

The threshold is 40 (not 50) to include more context chapters.

### Data Flow

```
EPUB upload → POST /api/parse-epub → BookData (chapters + sections)
    ↓
POST /api/analyze → Phase 1 (scores) → Phase 2 (ReadingMap)
    ↓
Frontend renders reading map → user reads physical book
    ↓
POST /api/generate-test → ComprehensionTest (3 MC + 2 open-ended)
```

### Key Types (`types/index.ts`)

- `BookData` → `Chapter[]` → `Section[]` (hierarchical: chapters contain sections parsed from h2/h3/h4 headings)
- `ReadingMap` → `ChapterRecommendation[]` with `priority: 'must_read' | 'recommended' | 'optional' | 'skip'`
- `SectionRecommendation` with `readMode: 'deep_read' | 'skim' | 'reference'`
- `ReadingInstruction` with `approach: 'sequential' | 'selective' | 'reference'`
- `ComprehensionTest` → `TestQuestion[]` with `type: 'multiple_choice' | 'open_ended'`

### API Routes

All routes use `runtime = 'nodejs'` (not Edge) because `epub2` depends on Node.js `fs`.

| Route | Input | Output | Timeout |
|-------|-------|--------|---------|
| `POST /api/parse-epub` | FormData (`.epub`, max 50MB) | `BookData` | default |
| `POST /api/analyze` | `{ bookData, question }` | `ReadingMap` | 120s |
| `POST /api/generate-test` | `{ readingMap, chapters }` | `ComprehensionTest` | 60s |

### EPUB Parsing (`lib/epub-parser.ts`)

- `epub2` for server-side parsing; `cheerio` for HTML→text
- Writes temp file to `./tmp/`, parses, then deletes
- Skips chapters with < 100 chars (navigation/blank pages)
- Chinese: character count. English: word count.
- `extractSections()` parses h2/h3/h4 into `Section[]` with content

### AI Integration (`lib/deepseek.ts`)

- Deepseek API (OpenAI-compatible) at `https://api.deepseek.com/v1/chat/completions`
- `response_format: { type: 'json_object' }` for structured output
- Temperature 0.3 for stability
- `callDeepseekWithRetry()`: max 2 retries, exponential backoff (1s/2s)
- `safeParseJSON()`: strips markdown code block wrappers before parsing

### Prompts (`lib/prompts.ts`)

All prompts are in Chinese and request strict JSON output:
- `generatePhase1Prompt`: chapter scoring (titles + 300-char previews + section titles)
- `generatePhase2Prompt`: deep analysis (section content truncated to 2000 chars each)
- `generateTestPrompt`: 5 questions from `must_read` chapters (section content truncated to 3000 chars)

## Notes

- **Path alias**: `@/*` maps to the project root (see `tsconfig.json`)
- **Next.js 16**: Per `AGENTS.md`, this version has breaking changes — check `node_modules/next/dist/docs/` before writing code
- **Unused component**: `components/ReadingMapDisplay.tsx` is not used; `page.tsx` renders the reading map inline
- **Tailwind v4**: Uses `@tailwindcss/postcss` plugin, not the older `tailwind.config.js` approach
- **Blueprint**: `ReadPath_施工蓝图 (1).md` is the original Chinese design doc — the type system has evolved beyond it
