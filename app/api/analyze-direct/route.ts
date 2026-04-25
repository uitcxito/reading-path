import { NextRequest, NextResponse } from 'next/server';
import { callDeepseekWithRetry } from '@/lib/deepseek';
import { generateDirectAnalysisPrompt } from '@/lib/prompts';
import { ReadingMap } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface DirectAnalyzeRequest {
  bookName: string;
  question: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DirectAnalyzeRequest = await request.json();
    const { bookName, question } = body;

    if (!bookName || !bookName.trim()) {
      return NextResponse.json(
        { error: '请输入书名' },
        { status: 400 }
      );
    }

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: '请输入你的问题' },
        { status: 400 }
      );
    }

    const prompt = generateDirectAnalysisPrompt(bookName.trim(), question.trim());

    const result = await callDeepseekWithRetry<ReadingMap | { error: string }>(
      [
        {
          role: 'system',
          content:
            '你是一位专业的阅读顾问，擅长帮助带着问题读书的人找到最高效的阅读路径。你必须返回严格的JSON格式。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { temperature: 0.3, maxTokens: 8192 }
    );

    // Check if AI doesn't know the book
    if ('error' in result && result.error === 'unknown_book') {
      return NextResponse.json(
        { error: 'AI 不确定这本书的内容，请尝试上传 EPUB 文件' },
        { status: 400 }
      );
    }

    const readingMap = result as ReadingMap;
    readingMap.bookTitle = bookName.trim();
    readingMap.userQuestion = question.trim();

    return NextResponse.json(readingMap);
  } catch (error) {
    console.error('Direct analyze error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'AI 分析失败',
      },
      { status: 500 }
    );
  }
}
