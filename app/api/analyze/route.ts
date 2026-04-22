import { NextRequest, NextResponse } from 'next/server';
import { callDeepseekWithRetry } from '@/lib/deepseek';
import { generatePhase1Prompt, generatePhase2Prompt } from '@/lib/prompts';
import { BookData, Phase1Response, ReadingMap } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes timeout for deeper analysis

interface AnalyzeRequest {
  bookData: BookData;
  question: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { bookData, question } = body;

    if (!bookData || !question) {
      return NextResponse.json(
        { error: 'Missing bookData or question' },
        { status: 400 }
      );
    }

    // Phase 1: Bird's eye analysis with section-level detail
    console.log('Starting Phase 1: Section-level analysis...');
    const phase1Prompt = generatePhase1Prompt(bookData, question);

    const phase1Result = await callDeepseekWithRetry<Phase1Response>(
      [
        {
          role: 'system',
          content: '你是一位专业的阅读顾问，擅长分析书籍结构并帮助读者找到最相关的章节和小节。你必须返回严格的JSON格式。',
        },
        {
          role: 'user',
          content: phase1Prompt,
        },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    );

    console.log(`Phase 1 complete. Analyzed ${phase1Result.scores.length} chapters.`);

    // Filter chapters with score >= 40 (lower threshold to include more context)
    const relevantScores = phase1Result.scores.filter((s) => s.score >= 40);
    const relevantChapterIds = new Set(relevantScores.map((s) => s.chapterId));

    // Get full content of relevant chapters
    const relevantChapters = bookData.chapters.filter((ch) =>
      relevantChapterIds.has(ch.id)
    );

    console.log(
      `Found ${relevantChapters.length} relevant chapters for Phase 2 deep analysis.`
    );

    // Phase 2: Deep analysis with reading instructions
    console.log('Starting Phase 2: Generating reading map with instructions...');
    const phase2Prompt = generatePhase2Prompt(
      bookData,
      question,
      relevantScores,
      relevantChapters
    );

    const readingMap = await callDeepseekWithRetry<ReadingMap>(
      [
        {
          role: 'system',
          content:
            '你是一位专业的阅读顾问，擅长帮助读者制定高效的阅读计划。你需要提供小节级别的精确定位和具体的阅读指令。你必须返回严格的JSON格式。',
        },
        {
          role: 'user',
          content: phase2Prompt,
        },
      ],
      { temperature: 0.3, maxTokens: 8192 }
    );

    // Add book metadata to the result
    readingMap.bookTitle = bookData.title;
    readingMap.userQuestion = question;

    console.log('Phase 2 complete. Reading map generated with section-level detail.');

    return NextResponse.json(readingMap);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
