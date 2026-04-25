// ===== 分析模式 =====
export type AnalysisMode = 'epub' | 'ai_direct';

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
  sections: Section[];  // 新增：小节级别结构
}

export interface Section {
  id: string;
  title: string;
  level: number;  // h2=2, h3=3
  order: number;
  content: string;
  wordCount: number;
  startLocation: string;  // 在章节中的位置描述
}

// ===== AI 分析后的阅读地图 =====
export interface ReadingMap {
  bookTitle: string;
  userQuestion: string;
  summary: string;
  estimatedReadTime: string;
  readingPath: ReadingPathItem[];  // 新增：有序阅读路径
  chapters: ChapterRecommendation[];
  dependencies: ChapterDependency[];  // 新增：章节依赖关系
  readingTasks: string[];  // 新增：阅读后应能回答的问题
}

// 新增：阅读路径项
export interface ReadingPathItem {
  order: number;
  chapterId: string;
  chapterTitle: string;
  sections: SectionRecommendation[];
}

// 新增：小节级别推荐
export interface SectionRecommendation {
  sectionId: string;
  sectionTitle: string;
  readMode: 'deep_read' | 'skim' | 'reference';  // 阅读方式
  location: string;  // 页码或位置描述
  focusPoints: string[];  // 精读时要找的内容
  estimatedTime: string;  // 预计阅读时间
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
  sections: SectionRecommendation[];  // 新增：小节级别
  readingInstruction: ReadingInstruction;  // 新增：阅读指令
}

// 新增：阅读指令
export interface ReadingInstruction {
  approach: 'sequential' | 'selective' | 'reference';
  skimSections: string[];  // 快速扫的小节
  deepReadSections: string[];  // 精读的小节
  lookFor: string[];  // 阅读时要找的内容
  skipIf: string;  // 在什么情况下可以跳过
}

// 新增：章节依赖关系
export interface ChapterDependency {
  chapterId: string;
  dependsOn: string[];  // 依赖的章节ID
  reason: string;  // 为什么有这个依赖
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
  relatedSection?: string;  // 新增：关联到具体小节
}

// ===== 阶段1分析结果 =====
export interface Phase1Result {
  chapterId: string;
  chapterTitle: string;
  score: number;
  briefReason: string;
  relevantSections: string[];  // 新增：相关小节
}

export interface Phase1Response {
  scores: Phase1Result[];
}
