# ReadPath

Turn any EPUB book into a personalized reading plan. Upload a book, ask a question, and get an AI-generated reading map that tells you exactly which chapters to read, in what order, and how deeply — so you can solve real-world problems without reading cover to cover.

## Why ReadPath

Most people don't read technical or non-fiction books front to back. They have a specific question or goal — "How do I improve my team's decision-making?" or "What's the fastest way to understand distributed systems?" — and need to find the relevant parts fast. ReadPath uses AI to analyze book structure and content, then generates a targeted reading path with chapter-level and section-level recommendations.

## How It Works

1. **Choose a mode**: upload an EPUB file, or enter a book name for AI direct analysis
2. **Ask** your question or describe your goal
3. **Get a reading map** with:
   - Priority-ranked chapters (must read / recommended / optional / skip)
   - Section-level reading instructions (deep read, skim, or reference)
   - Chapter dependency graph (what to read before what)
   - Key points to look for in each chapter
   - Estimated reading time
4. **Read** the physical book using your personalized guide
5. **Test** your understanding with an AI-generated comprehension quiz

### Two Modes

- **EPUB Upload** — Parse your own EPUB file. Uses a cost-efficient two-phase AI analysis: first scores chapter relevance (0–100), then deep-dives into high-scoring chapters (≥ 40) for detailed reading instructions.
- **AI Direct Analysis** — Enter a book name and AI generates a reading map from its knowledge. No file needed. Includes a Z-Library search link if you want to find the EPUB.

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
│   ├── analyze/route.ts       # Two-phase EPUB analysis
│   ├── analyze-direct/route.ts # AI knowledge-based analysis
│   └── generate-test/route.ts # Comprehension test generation
├── page.tsx                    # Main app UI (4-state FSM)
├── layout.tsx
└── globals.css
components/
├── ModeSelector.tsx            # EPUB / AI direct mode toggle
├── UploadArea.tsx              # Drag-and-drop EPUB upload
├── BookNameInput.tsx           # Book name input for AI mode
├── QuestionInput.tsx           # User question textarea
├── ZLibraryLink.tsx            # Z-Library search link
├── ProgressBar.tsx             # Analysis progress steps
└── ComprehensionTestDisplay.tsx # Test UI
lib/
├── deepseek.ts                 # Deepseek API client with retry
├── epub-parser.ts              # EPUB → structured BookData
└── prompts.ts                  # All prompt templates
types/
└── index.ts                    # TypeScript interfaces
```

## License

MIT
