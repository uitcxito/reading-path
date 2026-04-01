import { NextRequest, NextResponse } from 'next/server';
import { callDeepseekWithRetry } from '@/lib/deepseek';
import { generatePhase1Prompt, generatePhase2Prompt } from '@/lib/prompts';
import { BookData, Phase1Response, ReadingMap } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

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

    // Phase 1: Bird's eye analysis
    console.log('Starting Phase 1: Bird\'s eye analysis...');
    const phase1Prompt = generatePhase1Prompt(bookData, question);

    const phase1Result = await callDeepseekWithRetry<Phase1Response>(
      [
        {
          role: 'system',
          content: '你是一位专业的阅读顾问，擅长分析书籍结构并帮助读者找到最相关的章节。',
        },
        {
          role: 'user',
          content: phase1Prompt,
        },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    );

    console.log(`Phase 1 complete. Analyzed ${phase1Result.scores.length} chapters.`);

    // Filter chapters with score >= 50
    const relevantScores = phase1Result.scores.filter((s) => s.score >= 50);
    const relevantChapterIds = new Set(relevantScores.map((s) => s.chapterId));

    // Get full content of relevant chapters
    const relevantChapters = bookData.chapters.filter((ch) =>
      relevantChapterIds.has(ch.id)
    );

    console.log(
      `Found ${relevantChapters.length} relevant chapters for Phase 2.`
    );

    // Phase 2: Deep analysis
    console.log('Starting Phase 2: Deep analysis...');
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
            '你是一位专业的阅读顾问，擅长帮助读者制定高效的阅读计划。你必须返回严格的JSON格式。',
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

    console.log('Phase 2 complete. Reading map generated.');

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
