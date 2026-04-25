import { BookData, Chapter, Phase1Result, ReadingMap } from '@/types';

/**
 * Generate Phase 1 prompt: Bird's eye analysis with section-level detail
 */
export function generatePhase1Prompt(bookData: BookData, userQuestion: string): string {
  const chaptersInfo = bookData.chapters
    .map((ch) => {
      const sectionsInfo = ch.sections
        .map((s) => `    - ${s.title} (${s.wordCount}字)`)
        .join('\n');

      return `
### 第${ch.order + 1}章: ${ch.title}
字数: ${ch.wordCount}
摘要: ${ch.preview.substring(0, 300)}
小节结构:
${sectionsInfo}
---`;
    })
    .join('\n');

  return `你是一位专业的阅读顾问。用户正在准备阅读一本书，他带着一个具体的问题/目标。
你的任务是分析这本书的结构，帮用户判断每个章节和**小节**与他的问题的相关程度。

## 书籍信息
- 书名：${bookData.title}
- 作者：${bookData.author}
- 语言：${bookData.language}
- 总章节：${bookData.totalChapters}

## 用户的问题/目标
${userQuestion}

## 章节结构（含小节）
${chaptersInfo}

## 你的任务

请为每个章节评估相关程度（0-100分），并**识别该章节中与用户问题最相关的小节**。

返回JSON格式，只返回JSON：
{
  "scores": [
    {
      "chapterId": "章节ID",
      "chapterTitle": "章节标题",
      "score": 85,
      "briefReason": "一句话说明为什么这个分数",
      "relevantSections": ["相关小节标题1", "相关小节标题2"]
    }
  ]
}

## 评分标准
- 90-100: 直接回答用户的核心问题
- 70-89: 提供重要的背景知识或相关论述
- 50-69: 有一定参考价值
- 30-49: 关系较远，但可能有启发
- 0-29: 与用户问题基本无关`;
}

/**
 * Generate Phase 2 prompt: Deep analysis with reading instructions
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
        `- 第${bookData.chapters.findIndex((c) => c.id === r.chapterId) + 1}章「${r.chapterTitle}」: 评分 ${r.score} - ${r.briefReason}`
    )
    .join('\n');

  const chaptersContent = relevantChapters
    .map((ch) => {
      const sectionsContent = ch.sections
        .map((s) => `
【${s.title}】(${s.wordCount}字)
${s.content.substring(0, 2000)}
`)
        .join('\n');

      return `
=== 第${ch.order + 1}章: ${ch.title} ===
${sectionsContent}
=== 章节结束 ===`;
    })
    .join('\n');

  return `你是一位专业的阅读顾问，擅长帮助带着问题读书的人找到最高效的阅读路径。

## 背景
用户想解决这个问题：**${userQuestion}**
他准备阅读《${bookData.title}》（${bookData.author}），这本书共${bookData.totalChapters}章。
用户会阅读**纸质书**，所以你需要给出清晰的定位信息。

## 初步分析
在第一轮分析中，以下章节被判断为与用户问题相关：
${phase1Summary}

## 高相关章节内容
${chaptersContent}

## 你的任务

基于这些章节的深入分析，生成一份**高精度阅读地图**。

返回JSON格式，只返回JSON：
{
  "summary": "2-3句话总结这本书如何帮助用户解决他的问题",
  "estimatedReadTime": "只读重点内容大约需要X小时",
  "readingTasks": [
    "读完应该能回答：问题1",
    "读完应该能回答：问题2",
    "读完应该能回答：问题3"
  ],
  "dependencies": [
    {
      "chapterId": "章节ID",
      "dependsOn": ["必须先读的章节ID"],
      "reason": "因为概念X在前面章节定义"
    }
  ],
  "chapters": [
    {
      "chapterId": "章节ID",
      "chapterTitle": "章节标题",
      "priority": "must_read / recommended / optional / skip",
      "relevanceScore": 92,
      "reason": "1-2句话说明这章的重要性",
      "pageHint": "全书第X章，大约在前/中/后1/3处",
      "readOrder": 1,
      "readingInstruction": {
        "approach": "sequential / selective / reference",
        "skimSections": ["可以快速扫的小节标题"],
        "deepReadSections": ["必须精读的小节标题"],
        "lookFor": ["精读时要找的具体论点1", "要找的具体案例2"],
        "skipIf": "什么情况下可以跳过这章"
      },
      "sections": [
        {
          "sectionTitle": "小节标题",
          "readMode": "deep_read / skim / reference",
          "location": "本章第X节，约第X页",
          "focusPoints": ["这个小节要重点找的内容"],
          "estimatedTime": "约X分钟"
        }
      ],
      "keyPoints": ["这章的核心论点1", "核心论点2"]
    }
  ]
}

## 关键要求

1. **定位精度**：小节级别定位，让用户拿着纸质书能直接翻到
2. **阅读指令**：明确告诉用户哪些小节skim、哪些deep_read、精读时找什么
3. **阅读任务**：给出3-5个"读完应该能回答的问题"
4. **依赖关系**：标注章节间的概念依赖，建议阅读顺序

## readMode 说明
- deep_read: 精读，逐字阅读，做笔记
- skim: 快速扫读，抓主旨即可
- reference: 作为参考，需要时查阅

## approach 说明
- sequential: 按顺序从头读到尾
- selective: 选择性阅读指定小节
- reference: 作为参考资料查阅`;
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
    sections: Array<{ title: string; content: string }>;
  }>
): string {
  const chaptersSummary = mustReadChapters
    .map((ch) => {
      const sections = ch.sections.map((s) => s.title).join('、');
      return `- 「${ch.chapterTitle}」小节：${sections}\n  关键论点：${ch.keyPoints.join('、')}`;
    })
    .join('\n');

  const chaptersContent = mustReadChapters
    .map((ch) => {
      const sectionsContent = ch.sections
        .map((s) => `
【${s.title}】
${s.content.substring(0, 3000)}
`)
        .join('\n');

      return `
=== ${ch.chapterTitle} ===
${sectionsContent}
=== 结束 ===`;
    })
    .join('\n');

  return `你是一位教育专家。用户刚读完一本书中与他问题相关的章节，
现在需要检测他是否真正理解了核心内容。

## 用户的问题/目标
${userQuestion}

## 用户阅读的章节
${chaptersSummary}

## 详细内容
${chaptersContent}

## 你的任务

生成5道理解测试题，测试用户是否：
1. 找到了他问题的答案
2. 理解了核心概念
3. 能将知识应用到实际场景

返回JSON格式，只返回JSON：
{
  "questions": [
    {
      "id": "q1",
      "question": "题目内容",
      "type": "multiple_choice",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "A",
      "explanation": "解释为什么这个答案正确，引用书中的具体论点",
      "relatedChapter": "关联章节标题",
      "relatedSection": "关联小节标题"
    },
    {
      "id": "q2",
      "question": "开放题：用你自己的话解释...",
      "type": "open_ended",
      "correctAnswer": "参考答案要点：1)... 2)... 3)...",
      "explanation": "好的回答应该包含这些要点",
      "relatedChapter": "关联章节标题",
      "relatedSection": "关联小节标题"
    }
  ]
}

## 要求
1. 5道题中：3道选择题 + 2道开放题
2. 选择题要有迷惑性，不能一眼看出答案
3. 开放题要求用户用自己的话解释概念或应用到实际场景
4. 每道题都要关联到用户的原始问题
5. 题目要能检测用户是否从书中找到了问题的答案`;
}

/**
 * Generate AI-direct analysis prompt (no EPUB, based on AI knowledge)
 */
export function generateDirectAnalysisPrompt(bookName: string, userQuestion: string): string {
  return `你是一位专业的阅读顾问。用户想阅读《${bookName}》并带着以下问题：
${userQuestion}

请你基于对这本书的了解，生成一份完整的阅读地图。

**重要**：请先确认你知道这本书。如果你不确定这本书的具体内容和章节结构，返回：
{ "error": "unknown_book" }

如果你知道这本书，请分析其真实章节结构，为每个章节评估与用户问题的相关度，并生成详细的阅读地图。

返回JSON格式，只返回JSON：
{
  "summary": "2-3句话总结这本书如何帮助用户解决他的问题",
  "estimatedReadTime": "只读重点内容大约需要X小时",
  "readingTasks": [
    "读完应该能回答：问题1",
    "读完应该能回答：问题2",
    "读完应该能回答：问题3"
  ],
  "dependencies": [
    {
      "chapterId": "ch_1",
      "dependsOn": ["ch_0"],
      "reason": "因为概念X在前面章节定义"
    }
  ],
  "chapters": [
    {
      "chapterId": "ch_1",
      "chapterTitle": "真实章节标题",
      "priority": "must_read / recommended / optional / skip",
      "relevanceScore": 92,
      "reason": "1-2句话说明这章的重要性",
      "pageHint": "全书第X章，大约在前/中/后1/3处",
      "readOrder": 1,
      "readingInstruction": {
        "approach": "sequential / selective / reference",
        "skimSections": ["可以快速扫的小节标题"],
        "deepReadSections": ["必须精读的小节标题"],
        "lookFor": ["精读时要找的具体论点1", "要找的具体案例2"],
        "skipIf": "什么情况下可以跳过这章"
      },
      "sections": [
        {
          "sectionId": "s_1_1",
          "sectionTitle": "小节标题",
          "readMode": "deep_read / skim / reference",
          "location": "本章第X节约第X页",
          "focusPoints": ["这个小节要重点找的内容"],
          "estimatedTime": "约X分钟"
        }
      ],
      "keyPoints": ["这章的核心论点1", "核心论点2"]
    }
  ]
}

## 关键要求
1. 使用书籍的**真实章节标题和结构**，不要编造
2. chapterId 使用 "ch_1", "ch_2" 等格式
3. sectionId 使用 "s_1_1", "s_1_2" 等格式（章_节）
4. 小节级别定位，让用户拿着纸质书能直接翻到
5. 明确告诉用户哪些小节skim、哪些deep_read、精读时找什么
6. 给出3-5个"读完应该能回答的问题"
7. 标注章节间的概念依赖，建议阅读顺序

## readMode 说明
- deep_read: 精读，逐字阅读，做笔记
- skim: 快速扫读，抓主旨即可
- reference: 作为参考，需要时查阅

## approach 说明
- sequential: 按顺序从头读到尾
- selective: 选择性阅读指定小节
- reference: 作为参考资料查阅`;
}

/**
 * Generate AI-direct test prompt (no real chapter content)
 */
export function generateAITestPrompt(
  bookName: string,
  userQuestion: string,
  readingMap: ReadingMap
): string {
  const chaptersSummary = readingMap.chapters
    .filter((ch) => ch.priority === 'must_read')
    .map((ch) => {
      const sections = ch.sections?.map((s) => s.sectionTitle).join('、') || '';
      return `- 「${ch.chapterTitle}」${sections ? `小节：${sections}` : ''}\n  关键论点：${ch.keyPoints.join('、')}`;
    })
    .join('\n');

  return `你是一位教育专家。用户阅读了《${bookName}》中的以下章节，现在需要检测他是否真正理解了核心内容。

## 用户的问题/目标
${userQuestion}

## 用户阅读的章节
${chaptersSummary}

## 你的任务

基于你对《${bookName}》的了解，生成5道理解测试题，测试用户是否：
1. 找到了他问题的答案
2. 理解了核心概念
3. 能将知识应用到实际场景

返回JSON格式，只返回JSON：
{
  "questions": [
    {
      "id": "q1",
      "question": "题目内容",
      "type": "multiple_choice",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "A",
      "explanation": "解释为什么这个答案正确，引用书中的具体论点",
      "relatedChapter": "关联章节标题",
      "relatedSection": "关联小节标题"
    },
    {
      "id": "q2",
      "question": "开放题：用你自己的话解释...",
      "type": "open_ended",
      "correctAnswer": "参考答案要点：1)... 2)... 3)...",
      "explanation": "好的回答应该包含这些要点",
      "relatedChapter": "关联章节标题",
      "relatedSection": "关联小节标题"
    }
  ]
}

## 要求
1. 5道题中：3道选择题 + 2道开放题
2. 选择题要有迷惑性，不能一眼看出答案
3. 开放题要求用户用自己的话解释概念或应用到实际场景
4. 每道题都要关联到用户的原始问题
5. 题目基于你对这本书的真实知识，不要编造内容`;
}
