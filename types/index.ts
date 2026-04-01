// ===== EPUB 解析后的数据结构 =====
export interface BookData {
  title: string;
  author: string;
  language: string;
  totalChapters: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  preview: string;
}

// ===== AI 分析后的阅读地图 =====
export interface ReadingMap {
  bookTitle: string;
  userQuestion: string;
  summary: string;
  estimatedReadTime: string;
  chapters: ChapterRecommendation[];
}

export interface ChapterRecommendation {
  chapterId: string;
  chapterTitle: string;
  priority: 'must_read' | 'recommended' | 'optional' | 'skip';
  relevanceScore: number;
  reason: string;
  keyPoints: string[];
  pageHint: string;
  readOrder: number;
}

// ===== 理解测试 =====
export interface ComprehensionTest {
  questions: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'open_ended';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  relatedChapter: string;
}

// ===== 阶段1分析结果 =====
export interface Phase1Result {
  chapterId: string;
  chapterTitle: string;
  score: number;
  briefReason: string;
}

export interface Phase1Response {
  scores: Phase1Result[];
}
