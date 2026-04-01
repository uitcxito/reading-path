# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReadPath is a web application that generates personalized "reading maps" for EPUB books. Users upload an EPUB file and input their question/goal, then AI analyzes which chapters are most relevant and generates a reading guide with prioritized chapter recommendations. After reading the physical book, users can take a comprehension test.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env.local`:
```
DEEPSEEK_API_KEY=your_api_key
```

## Architecture

### Two-Phase AI Analysis

The core analysis happens in `/api/analyze/route.ts` using a two-phase approach:

1. **Phase 1 (Bird's Eye)**: Sends chapter titles + 500-char previews to Deepseek to get initial relevance scores (0-100) for each chapter
2. **Phase 2 (Deep Dive)**: Sends full content of chapters with score ≥ 50 to generate detailed reading map with priorities, reading order, and key points

This approach saves tokens by only sending full content for relevant chapters.

### Data Flow

```
EPUB Upload → parse-epub API → BookData (chapters with content + preview)
    ↓
analyze API → Phase 1 (scores) → Phase 2 (ReadingMap)
    ↓
Frontend displays reading map → User reads physical book
    ↓
generate-test API → ComprehensionTest (3 multiple choice + 2 open questions)
```

### Key Types (`types/index.ts`)

- `BookData`: Parsed EPUB with `Chapter[]` (id, title, content, wordCount, preview)
- `ReadingMap`: AI-generated guide with `ChapterRecommendation[]` (priority, relevanceScore, keyPoints, readOrder)
- `ChapterRecommendation.priority`: `'must_read' | 'recommended' | 'optional' | 'skip'`

### API Routes

All routes use `runtime = 'nodejs'` (not Edge) because epub2 depends on Node.js `fs` module.

- `POST /api/parse-epub`: Accepts FormData with EPUB file, returns `BookData`
- `POST /api/analyze`: Accepts `{ bookData, question }`, returns `ReadingMap`
- `POST /api/generate-test`: Accepts `{ readingMap, chapters }`, returns `ComprehensionTest`

### EPUB Parsing (`lib/epub-parser.ts`)

- Uses `epub2` library for server-side parsing
- Converts HTML to plain text with `cheerio`
- Skips chapters with < 100 characters (navigation/blank pages)
- Different word counting logic for Chinese (character count) vs English (word count)

### AI Integration (`lib/deepseek.ts`)

- Calls Deepseek API (OpenAI-compatible format) at `https://api.deepseek.com/v1/chat/completions`
- Uses `response_format: { type: 'json_object' }` for structured output
- Temperature 0.3 for stable outputs
- Includes retry logic with exponential backoff
- `safeParseJSON` handles markdown code block wrappers

### Prompt Templates (`lib/prompts.ts`)

Contains Chinese prompts for:
- `generatePhase1Prompt`: Bird's eye chapter scoring
- `generatePhase2Prompt`: Deep analysis with full chapter content
- `generateTestPrompt`: Comprehension test generation

All prompts request strict JSON output with specific schemas.
