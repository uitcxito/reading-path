import { NextRequest, NextResponse } from 'next/server';
import { callDeepseekWithRetry } from '@/lib/deepseek';
import { generateTestPrompt } from '@/lib/prompts';
import { ComprehensionTest, ReadingMap, Chapter } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GenerateTestRequest {
  readingMap: ReadingMap;
  chapters: Chapter[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTestRequest = await request.json();
    const { readingMap, chapters } = body;

    if (!readingMap || !chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: 'Missing readingMap or chapters' },
        { status: 400 }
      );
    }

    // Get must_read chapters with their content
    const mustReadChapterIds = new Set(
      readingMap.chapters
        .filter((ch) => ch.priority === 'must_read')
        .map((ch) => ch.chapterId)
    );

    const mustReadChapters = chapters
      .filter((ch) => mustReadChapterIds.has(ch.id))
      .map((ch) => {
        const recommendation = readingMap.chapters.find((r) => r.chapterId === ch.id);
        return {
          chapterTitle: ch.title,
          keyPoints: recommendation?.keyPoints || [],
          content: ch.content,
        };
      });

    if (mustReadChapters.length === 0) {
      return NextResponse.json(
        { error: 'No must-read chapters found' },
        { status: 400 }
      );
    }

    // Generate test questions
    const prompt = generateTestPrompt(readingMap.userQuestion, mustReadChapters);

    const test = await callDeepseekWithRetry<ComprehensionTest>(
      [
        {
          role: 'system',
          content:
            '你是一位教育专家，擅长设计测试题来检测学生对核心概念的理解。你必须返回严格的JSON格式。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { temperature: 0.4, maxTokens: 4096 }
    );

    // Ensure questions have IDs
    test.questions = test.questions.map((q, idx) => ({
      ...q,
      id: q.id || `q${idx + 1}`,
    }));

    return NextResponse.json(test);
  } catch (error) {
    console.error('Generate test error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate test',
      },
      { status: 500 }
    );
  }
}
