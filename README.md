# ReadPath

Turn any EPUB book into a personalized reading plan. Upload a book, ask a question, and get an AI-generated reading map that tells you exactly which chapters to read, in what order, and how deeply — so you can solve real-world problems without reading cover to cover.

## Why ReadPath

Most people don't read technical or non-fiction books front to back. They have a specific question or goal — "How do I improve my team's decision-making?" or "What's the fastest way to understand distributed systems?" — and need to find the relevant parts fast. ReadPath uses AI to analyze book structure and content, then generates a targeted reading path with chapter-level and section-level recommendations.

## How It Works

1. **Upload** an EPUB file
2. **Ask** your question or describe your goal
3. **Get a reading map** with:
   - Priority-ranked chapters (must read / recommended / optional / skip)
   - Section-level reading instructions (deep read, skim, or reference)
   - Chapter dependency graph (what to read before what)
   - Key points to look for in each chapter
   - Estimated reading time
4. **Read** the physical book using your personalized guide
5. **Test** your understanding with an AI-generated comprehension quiz

### Two-Phase AI Analysis

ReadPath uses a cost-efficient two-phase approach:

- **Phase 1 — Bird's Eye**: Sends chapter titles and 500-character previews to score each chapter's relevance (0–100)
- **Phase 2 — Deep Dive**: Sends full content of high-scoring chapters (≥ 50) to generate detailed reading instructions and dependencies

This dramatically reduces token usage by only processing relevant chapters in depth.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS 4
- **EPUB Parsing**: epub2, cheerio (HTML-to-text)
- **AI**: Deepseek API (OpenAI-compatible format)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A [Deepseek API key](https://platform.deepseek.com/)

### Setup

```bash
git clone https://github.com/uitcxito/reading-path.git
cd reading-path
npm install
```

Create a `.env.local` file:

```
DEEPSEEK_API_KEY=your_api_key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── api/
│   ├── parse-epub/route.ts    # EPUB upload & parsing
│   ├── analyze/route.ts       # Two-phase AI analysis
│   └── generate-test/route.ts # Comprehension test generation
├── page.tsx                    # Main app UI
components/
├── UploadArea.tsx
├── QuestionInput.tsx
├── ProgressBar.tsx
├── ReadingMapDisplay.tsx
└── ComprehensionTestDisplay.tsx
lib/
├── deepseek.ts                 # API client with retry logic
├── epub-parser.ts              # EPUB → structured book data
└── prompts.ts                  # Prompt templates
types/
└── index.ts                    # TypeScript interfaces
```

## License

MIT
