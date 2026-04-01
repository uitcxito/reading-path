import { BookData, Chapter, ChapterRecommendation, Phase1Result, ReadingMap } from '@/types';

/**
 * Generate Phase 1 prompt: Bird's eye analysis
 * Sends chapter titles + previews to get initial relevance scores
 */
export function generatePhase1Prompt(bookData: BookData, userQuestion: string): string {
  const chaptersInfo = bookData.chapters
    .map(
      (ch) => `
### 第${ch.order + 1}章: ${ch.title}
字数: ${ch.wordCount}
摘要: ${ch.preview}
---`
    )
    .join('\n');

  return `你是一位专业的阅读顾问。用户正在准备阅读一本书，他带着一个具体的问题/目标。
你的任务是分析这本书的结构，帮用户判断每个章节与他的问题的相关程度。

## 书籍信息
- 书名：${bookData.title}
- 作者：${bookData.author}
- 语言：${bookData.language}

## 用户的问题/目标
${userQuestion}

## 章节列表（含摘要）
${chaptersInfo}

## 你的任务
请为每个章节评估与用户问题的相关程度（0-100分）：
- 90-100: 直接回答用户的核心问题
- 70-89: 提供重要的背景知识或相关论述
- 50-69: 有一定参考价值
- 30-49: 关系较远，但可能有启发
- 0-29: 与用户问题基本无关

请以JSON格式返回，只返回JSON，不要其他内容：
{
  "scores": [
    {
      "chapterId": "章节ID",
      "chapterTitle": "章节标题",
      "score": 85,
      "briefReason": "一句话说明为什么这个分数"
    }
  ]
}`;
}

/**
 * Generate Phase 2 prompt: Deep analysis
 * Sends full content of high-relevance chapters to generate detailed reading map
 */
export function generatePhase2Prompt(
  bookData: BookData,
  userQuestion: string,
  phase1Results: Phase1Result[],
  relevantChapters: Chapter[]
): string {
  const phase1Summary = phase1Results
    .map(
      (r) =>
        `- 第${bookData.chapters.findIndex((c) => c.id === r.chapterId) + 1}章「${r.chapterTitle}」: 初步评分 ${r.score} - ${r.briefReason}`
    )
    .join('\n');

  const chaptersContent = relevantChapters
    .map(
      (ch) => `
=== 第${ch.order + 1}章: ${ch.title} (${ch.wordCount}字) ===
${ch.content.substring(0, 8000)}
=== 章节结束 ===`
    )
    .join('\n');

  return `你是一位专业的阅读顾问，擅长帮助带着问题读书的人找到最高效的阅读路径。

## 背景
用户想解决这个问题：${userQuestion}
他准备阅读《${bookData.title}》（${bookData.author}），这本书共${bookData.totalChapters}章。
用户会阅读纸质书，所以你需要给出清晰的章节定位信息。

## 初步分析
在第一轮分析中，以下章节被判断为与用户问题高度相关：
${phase1Summary}

## 高相关章节全文
${chaptersContent}

## 你的任务

基于对这些章节的深入分析，生成一份**个性化阅读地图**。
请以JSON格式返回，只返回JSON：
{
  "summary": "2-3句话总结这本书如何帮助用户解决他的问题",
  "estimatedReadTime": "只读必读章节大约需要X小时",
  "chapters": [
    {
      "chapterId": "章节ID",
      "chapterTitle": "章节标题",
      "priority": "must_read / recommended / optional / skip",
      "relevanceScore": 92,
      "reason": "1-2句话说明为什么这章对用户的问题很重要",
      "keyPoints": ["这章中与用户问题相关的关键论点1", "关键论点2"],
      "pageHint": "本书第X章，大约在全书的前1/3处",
      "readOrder": 1
    }
  ]
}

## 要求
1. readOrder只给must_read和recommended的章节编号，从1开始
2. 阅读顺序不一定要按章节顺序，可以根据问题的逻辑重新排列
3. priority为skip的章节，readOrder设为0
4. reason要具体，不要泛泛而谈，要说明这章具体讲了什么、跟用户问题的什么方面相关
5. pageHint用"全书的前/中/后X分之X处"这种纸质书友好的描述
6. keyPoints要具体到观点级别，不要只是"本章讨论了XXX"
7. 所有章节都要包含在返回结果中，包括skip的`;
}

/**
 * Generate test questions prompt
 */
export function generateTestPrompt(
  userQuestion: string,
  mustReadChapters: Array<{
    chapterTitle: string;
    keyPoints: string[];
    content: string;
  }>
): string {
  const chaptersSummary = mustReadChapters
    .map((ch) => `- 「${ch.chapterTitle}」的关键论点：${ch.keyPoints.join('、')}`)
    .join('\n');

  const chaptersContent = mustReadChapters
    .map(
      (ch) => `
=== ${ch.chapterTitle} ===
${ch.content.substring(0, 6000)}
=== 结束 ===`
    )
    .join('\n');

  return `你是一位教育专家。用户刚读完一本书中与他问题相关的章节，
现在需要检测他是否真正理解了核心内容。

## 用户的问题/目标
${userQuestion}

## 用户阅读的章节内容摘要
${chaptersSummary}

## 必读章节的详细内容
${chaptersContent}

## 你的任务

生成5道理解测试题。题目应该测试的是**对核心概念的理解**，而不是记忆细节。
题目要与用户的原始问题相关——测试他是否从书中找到了问题的答案。

返回JSON格式，只返回JSON：
{
  "questions": [
    {
      "id": "q1",
      "question": "题目内容",
      "type": "multiple_choice",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "A",
      "explanation": "解释为什么这个答案正确，引用书中的论点",
      "relatedChapter": "关联的章节标题"
    },
    {
      "id": "q2",
      "question": "开放题：用你自己的话解释...",
      "type": "open_ended",
      "correctAnswer": "参考答案要点：1)... 2)... 3)...",
      "explanation": "好的回答应该包含这些要点",
      "relatedChapter": "关联的章节标题"
    }
  ]
}

## 要求
1. 5道题中：3道选择题 + 2道开放题
2. 选择题要有一定难度，选项之间有迷惑性，不能一眼看出答案
3. 开放题要求用户用自己的话解释概念或应用到实际场景
4. 每道题都要关联到用户的原始问题，不要考与用户问题无关的内容
5. explanation要引用书中的具体论点，帮助用户回忆`;
}
