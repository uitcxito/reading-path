# ReadPath — 完整施工蓝图 v1.0

> 目标：一个新手开发者配合AI编程助手，按此文档可以完整搭建出MVP。

---

## 一、产品回顾

**一句话**：上传epub + 输入问题 → AI生成阅读地图 → 读纸质书 → 回来做理解测试

**用户路径（共4个页面/状态）**：

```
[页面1: 首页]        → [页面2: 分析中]      → [页面3: 阅读地图]    → [页面4: 理解测试]
上传epub              AI正在分析              展示阅读地图            3-5道理解题
输入你的问题           显示进度                用户去读纸质书           提交后显示评分
点击"开始分析"         等待30-60秒             点击"我读完了，测试我"   可选：重新分析
```

---

## 二、技术栈

| 层级 | 选择 | 理由 |
|------|------|------|
| 框架 | **Next.js 14 (App Router)** | 前后端一体，部署方便 |
| 语言 | **TypeScript** | AI生成代码质量更高 |
| 样式 | **Tailwind CSS** | 快速出样式，新手友好 |
| EPUB解析 | **epub2** (Node.js包) | 服务端解析，稳定可靠 |
| AI | **Deepseek API** | 用户选择，兼容OpenAI格式 |
| 部署 | **Vercel** | Next.js原生支持，免费额度 |

---

## 三、项目结构

```
readpath/
├── app/
│   ├── layout.tsx                 # 全局布局
│   ├── page.tsx                   # 首页：上传 + 输入问题
│   ├── globals.css                # 全局样式
│   └── api/
│       ├── parse-epub/
│       │   └── route.ts           # API: 解析epub文件
│       ├── analyze/
│       │   └── route.ts           # API: AI生成阅读地图
│       └── generate-test/
│           └── route.ts           # API: AI生成理解测试
├── components/
│   ├── UploadArea.tsx             # 文件上传组件
│   ├── QuestionInput.tsx          # 问题输入组件
│   ├── ReadingMap.tsx             # 阅读地图展示组件
│   ├── ComprehensionTest.tsx      # 理解测试组件
│   └── ProgressBar.tsx            # 分析进度条
├── lib/
│   ├── epub-parser.ts             # EPUB解析逻辑
│   ├── deepseek.ts                # Deepseek API封装
│   └── prompts.ts                 # 所有AI提示词
├── types/
│   └── index.ts                   # TypeScript类型定义
├── package.json
├── .env.local                     # 环境变量（API密钥）
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 四、数据流与核心类型

### 4.1 TypeScript 类型定义 (`types/index.ts`)

```typescript
// ===== EPUB 解析后的数据结构 =====
interface BookData {
  title: string;              // 书名
  author: string;             // 作者
  language: string;           // 语言 (zh/en)
  totalChapters: number;      // 总章节数
  chapters: Chapter[];        // 章节列表
}

interface Chapter {
  id: string;                 // 章节ID
  title: string;              // 章节标题
  order: number;              // 章节顺序
  content: string;            // 章节全文
  wordCount: number;          // 字数
  preview: string;            // 前500字摘要（用于第一阶段分析）
}

// ===== AI 分析后的阅读地图 =====
interface ReadingMap {
  bookTitle: string;
  userQuestion: string;
  summary: string;            // AI对全书与问题关系的总结（2-3句话）
  estimatedReadTime: string;  // 预计只读重点章节的时间
  chapters: ChapterRecommendation[];
}

interface ChapterRecommendation {
  chapterId: string;
  chapterTitle: string;
  priority: 'must_read' | 'recommended' | 'optional' | 'skip';
  relevanceScore: number;     // 0-100，与问题的相关度
  reason: string;             // 为什么要读/不读这章（1-2句话）
  keyPoints: string[];        // 这章中与问题相关的关键点
  pageHint: string;           // 在纸质书中的大概位置提示
  readOrder: number;          // 建议的阅读顺序（0=不需要读）
}

// ===== 理解测试 =====
interface ComprehensionTest {
  questions: TestQuestion[];
}

interface TestQuestion {
  id: string;
  question: string;           // 题目
  type: 'multiple_choice' | 'open_ended';
  options?: string[];         // 选择题选项
  correctAnswer: string;      // 正确答案
  explanation: string;        // 答案解释
  relatedChapter: string;     // 关联章节
}
```

### 4.2 完整数据流

```
用户上传 .epub 文件 + 输入问题
        │
        ▼
  ┌─────────────────────┐
  │  POST /api/parse-epub │ ◄── 接收epub文件，解析为BookData
  └─────────┬───────────┘
            │ 返回 BookData (含章节摘要)
            ▼
  ┌─────────────────────┐
  │  POST /api/analyze    │ ◄── 接收 BookData + 用户问题
  │                       │
  │  阶段1: 发送目录+摘要  │ ──► Deepseek API ──► 初步相关性评分
  │  阶段2: 发送高相关章节  │ ──► Deepseek API ──► 详细阅读地图
  └─────────┬───────────┘
            │ 返回 ReadingMap
            ▼
  ┌─────────────────────┐
  │  前端展示阅读地图      │ ◄── 用户去读纸质书（产品外）
  └─────────┬───────────┘
            │ 用户点击"我读完了"
            ▼
  ┌──────────────────────────┐
  │  POST /api/generate-test   │ ◄── 接收 ReadingMap + must_read章节内容
  └─────────┬────────────────┘
            │ 返回 ComprehensionTest
            ▼
  ┌─────────────────────┐
  │  前端展示测试题        │ ◄── 用户答题 → 前端判分 → 显示结果
  └─────────────────────┘
```

---

## 五、三个API的详细设计

### 5.1 POST /api/parse-epub

**输入**: FormData（包含epub文件）
**输出**: BookData JSON

**处理逻辑**:
```
1. 接收上传的epub文件，保存到临时目录
2. 使用epub2库解析epub：
   a. 提取metadata（书名、作者、语言）
   b. 遍历目录(TOC)获取章节列表
   c. 提取每个章节的HTML内容 → 转为纯文本
   d. 为每个章节生成preview（前500个字符）
   e. 统计每个章节的字数
3. 返回完整的BookData对象
4. 删除临时文件
```

**关键代码逻辑** (`lib/epub-parser.ts`):
```typescript
// 伪代码 - 实际实现时用epub2库
import EPub from 'epub2';

export async function parseEpub(filePath: string): Promise<BookData> {
  const epub = await EPub.createAsync(filePath);

  // 提取metadata
  const title = epub.metadata.title;
  const author = epub.metadata.creator;
  const language = epub.metadata.language || 'unknown';

  // 提取章节
  const chapters: Chapter[] = [];
  for (let i = 0; i < epub.flow.length; i++) {
    const chapterInfo = epub.flow[i];
    const content = await getChapterTextAsync(epub, chapterInfo.id);
    const plainText = stripHtml(content); // 去除HTML标签

    chapters.push({
      id: chapterInfo.id,
      title: chapterInfo.title || `Chapter ${i + 1}`,
      order: i,
      content: plainText,
      wordCount: countWords(plainText, language),
      preview: plainText.substring(0, 500),
    });
  }

  return { title, author, language, totalChapters: chapters.length, chapters };
}
```

---

### 5.2 POST /api/analyze（核心！两阶段分析）

**输入**: `{ bookData: BookData, question: string }`
**输出**: ReadingMap JSON

#### 阶段1：鸟瞰分析（用摘要，省token）

发送给Deepseek的内容：
- 书名、作者
- 所有章节的标题 + preview（前500字）
- 用户的问题

目标：让AI对每个章节做初步相关性评分（0-100）

#### 阶段2：深度分析（只发高相关章节的全文）

发送给Deepseek的内容：
- 阶段1评分 ≥ 50 的章节全文
- 用户的问题
- 阶段1的初步判断

目标：生成最终的ReadingMap，包含精确的优先级、阅读顺序、关键点

**处理逻辑**:
```
1. 接收BookData和用户问题
2. 【阶段1】构造鸟瞰prompt → 调用Deepseek → 获得每章相关性评分
3. 筛选评分≥50的章节
4. 【阶段2】构造深度分析prompt（含高相关章节全文）→ 调用Deepseek → 获得完整阅读地图
5. 返回ReadingMap
```

---

### 5.3 POST /api/generate-test

**输入**: `{ readingMap: ReadingMap, chapters: Chapter[] }` (只传must_read的章节)
**输出**: ComprehensionTest JSON

**处理逻辑**:
```
1. 接收阅读地图和必读章节内容
2. 构造测试生成prompt → 调用Deepseek
3. 返回3-5道测试题
```

---

## 六、AI提示词设计（产品的灵魂）

### 6.1 阶段1提示词：鸟瞰分析

```
你是一位专业的阅读顾问。用户正在准备阅读一本书，他带着一个具体的问题/目标。
你的任务是分析这本书的结构，帮用户判断每个章节与他的问题的相关程度。

## 书籍信息
- 书名：{{bookTitle}}
- 作者：{{bookAuthor}}
- 语言：{{bookLanguage}}

## 用户的问题/目标
{{userQuestion}}

## 章节列表（含摘要）
{{#each chapters}}
### 第{{this.order}}章: {{this.title}}
字数: {{this.wordCount}}
摘要: {{this.preview}}
---
{{/each}}

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
}
```

### 6.2 阶段2提示词：深度分析 + 生成阅读地图

```
你是一位专业的阅读顾问，擅长帮助带着问题读书的人找到最高效的阅读路径。

## 背景
用户想解决这个问题：{{userQuestion}}
他准备阅读《{{bookTitle}}》（{{bookAuthor}}），这本书共{{totalChapters}}章。
用户会阅读纸质书，所以你需要给出清晰的章节定位信息。

## 初步分析
在第一轮分析中，以下章节被判断为与用户问题高度相关：
{{#each phase1Results}}
- 第{{this.order}}章「{{this.title}}」: 初步评分 {{this.score}} - {{this.briefReason}}
{{/each}}

## 高相关章节全文
{{#each relevantChapters}}
=== 第{{this.order}}章: {{this.title}} ({{this.wordCount}}字) ===
{{this.content}}
=== 章节结束 ===
{{/each}}

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
7. 所有章节都要包含在返回结果中，包括skip的
```

### 6.3 测试生成提示词

```
你是一位教育专家。用户刚读完一本书中与他问题相关的章节，
现在需要检测他是否真正理解了核心内容。

## 用户的问题/目标
{{userQuestion}}

## 用户阅读的章节内容摘要
{{#each mustReadChapters}}
- 「{{this.chapterTitle}}」的关键论点：{{this.keyPoints.join('、')}}
{{/each}}

## 必读章节的详细内容
{{#each mustReadChapters}}
=== {{this.chapterTitle}} ===
{{this.content}}
=== 结束 ===
{{/each}}

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
5. explanation要引用书中的具体论点，帮助用户回忆
```

---

## 七、Deepseek API 封装 (`lib/deepseek.ts`)

```typescript
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callDeepseek(
  messages: DeepseekMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.3,  // 低温度=更稳定的输出
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: 'json_object' }, // 强制JSON输出
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

---

## 八、前端页面设计

### 8.1 页面1：首页（上传 + 输入）

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              📖 ReadPath                           │
│     带着问题读书的最短路径                           │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │                                          │      │
│  │     拖拽上传 .epub 文件                   │      │
│  │     或 点击选择文件                       │      │
│  │                                          │      │
│  │     ✅ 已上传：思考快与慢.epub (2.3MB)     │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  你想解决什么问题？                                 │
│  ┌──────────────────────────────────────────┐      │
│  │ 例：我想了解人类决策中的常见偏误，          │      │
│  │ 以及如何在投资决策中避免这些偏误            │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│           [ 🔍 开始分析 ]                          │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 8.2 页面2：分析中

```
┌──────────────────────────────────────────────────┐
│                                                    │
│     正在分析《思考快与慢》...                       │
│                                                    │
│     ████████████░░░░░░░░  60%                     │
│                                                    │
│     ✅ 步骤1: 解析书籍结构（38章，约30万字）       │
│     ✅ 步骤2: 初步分析章节相关性                    │
│     🔄 步骤3: 深入分析重点章节...                   │
│     ○  步骤4: 生成个性化阅读地图                    │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 8.3 页面3：阅读地图（核心页面）

```
┌──────────────────────────────────────────────────┐
│  📖 《思考快与慢》— 你的阅读地图                    │
│                                                    │
│  你的问题：投资决策中如何避免认知偏误                │
│                                                    │
│  📊 全书38章，你只需要重点阅读 8 章                 │
│  ⏱️ 预计阅读时间：3.5小时（原书预计12小时）         │
│                                                    │
│  ─── 建议阅读顺序 ───                              │
│                                                    │
│  1️⃣ 🔴必读  第1章「两个系统」                      │
│     📍 全书开头                                    │
│     💡 为什么读：建立系统1/系统2的基础框架，        │
│        这是理解所有决策偏误的前提                    │
│     🔑 关键点：                                    │
│        · 系统1：快速、直觉、自动化                  │
│        · 系统2：缓慢、理性、需要注意力              │
│        · 大多数投资决策由系统1主导                   │
│                                                    │
│  2️⃣ 🔴必读  第11章「锚定效应」                     │
│     📍 全书前1/3处                                 │
│     💡 为什么读：锚定效应直接影响估值判断，          │
│        是投资中最常见的偏误之一                      │
│     🔑 关键点：                                    │
│        · 初始数字如何扭曲后续判断                   │
│        · 股价锚定如何导致错误买卖决策               │
│                                                    │
│  ...                                               │
│                                                    │
│  ─── 可跳过的章节 ───                              │
│  ⚪ 第15章「琳达问题」— 偏学术讨论，与投资关系不大   │
│  ⚪ 第23章「外部观点」— 有价值但非核心...            │
│                                                    │
│           [ ✅ 我读完了，测试我 ]                   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 8.4 页面4：理解测试

```
┌──────────────────────────────────────────────────┐
│  📝 理解测试 — 检验你的阅读收获                     │
│                                                    │
│  Q1 (选择题)                                       │
│  当投资者看到一只股票从100元跌到60元时，             │
│  倾向于认为"便宜了"而买入。这主要是哪种偏误？       │
│                                                    │
│  ○ A. 确认偏误                                     │
│  ● B. 锚定效应                                     │
│  ○ C. 可得性启发                                   │
│  ○ D. 损失厌恶                                     │
│                                                    │
│  Q2 (开放题)                                       │
│  用你自己的话解释：在做投资决策时，                  │
│  如何有意识地激活"系统2"来对抗"系统1"的偏误？       │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │ 在这里输入你的回答...                     │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│           [ 提交答案 ]                              │
│                                                    │
│  ─── 测试结果 ───                                  │
│  选择题: 2/3 正确                                   │
│  开放题: AI评估你的回答覆盖了核心要点               │
│                                                    │
│  💡 Q1解析：正确！100元就是一个"锚"，                │
│     它让你以这个价格为参照来判断60元是否便宜...      │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

## 九、关键实现细节

### 9.1 EPUB解析的坑

```
问题1: epub2库在某些epub上会解析失败
解决: 加try-catch，如果epub2失败，尝试用adm-zip直接解包，
     手动解析content.opf和章节HTML文件

问题2: 有些epub的章节没有标题
解决: 用"Chapter 1, Chapter 2..."作为fallback标题

问题3: 章节内容是HTML，需要转纯文本
解决: 用正则去除HTML标签，或用cheerio库解析

问题4: 中文字数统计与英文不同
解决: 英文按空格分词计数，中文直接计字符数
```

### 9.2 超长文本的处理策略

```
Deepseek上下文窗口: 约128K tokens

一本30万字的中文书 ≈ 约150K-200K tokens（会超出）

策略:
- 阶段1只发目录+摘要（约5K-10K tokens）→ 安全
- 阶段2只发高相关章节（通常3-8章）→ 约30K-60K tokens → 安全
- 如果高相关章节仍然太多，按相关性分数排序，取top 5
- 在prompt中明确告诉AI：这些是全书中与问题最相关的章节
```

### 9.3 JSON解析的防御性处理

```typescript
// Deepseek有时会在JSON外面包一层markdown代码块
function safeParseJSON(text: string): any {
  // 去除可能的markdown代码块包裹
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}
```

### 9.4 环境变量

`.env.local` 文件内容：
```
DEEPSEEK_API_KEY=你的deepseek_api_key
```

---

## 十、逐步施工顺序

按这个顺序来，每一步完成后都可以测试：

### 第1步：初始化项目（预计15分钟）
```bash
npx create-next-app@latest readpath --typescript --tailwind --app --src=no
cd readpath
npm install epub2 cheerio
```
创建 `.env.local`，填入Deepseek API Key

### 第2步：实现EPUB解析（预计1小时）
- 写 `lib/epub-parser.ts`
- 写 `app/api/parse-epub/route.ts`
- 测试：上传一个epub，看console能不能打印出章节列表

### 第3步：实现AI分析（预计1.5小时）
- 写 `lib/deepseek.ts`（API封装）
- 写 `lib/prompts.ts`（提示词模板）
- 写 `app/api/analyze/route.ts`（两阶段分析）
- 测试：用hardcode的BookData调用，看返回的ReadingMap是否合理

### 第4步：实现前端首页（预计1小时）
- 写 `components/UploadArea.tsx`
- 写 `components/QuestionInput.tsx`
- 写 `app/page.tsx`
- 测试：能上传文件、输入问题、点按钮

### 第5步：实现阅读地图展示（预计1小时）
- 写 `components/ReadingMap.tsx`
- 串联首页→分析→展示的完整流程
- 测试：上传epub → 输入问题 → 看到阅读地图

### 第6步：实现理解测试（预计1小时）
- 写 `app/api/generate-test/route.ts`
- 写 `components/ComprehensionTest.tsx`
- 串联"我读完了"→生成测试→答题→评分
- 测试：完整流程走通

### 第7步：优化和部署（预计1小时）
- 添加错误处理和loading状态
- 样式优化
- 部署到Vercel

**总预计时间：7-8小时（可以分2-3天完成）**

---

## 十一、可能遇到的问题与解决方案

| 问题 | 解决方案 |
|------|---------|
| epub2在Vercel部署时报错 | epub2依赖Node.js fs模块，确保API路由运行在Node runtime（非Edge） |
| Deepseek返回的JSON格式不对 | 用safeParseJSON处理，加retry机制（最多重试2次） |
| 分析时间太长用户等不及 | 前端用streaming显示进度，或分阶段返回结果 |
| 某些epub结构特殊，解析出错 | 加fallback：如果epub2失败，提示用户转换格式后重试 |
| Deepseek API超时 | 设置合理timeout（60秒），阶段2可能需要更长 |
| 中文epub编码问题 | epub2通常能处理UTF-8，如遇问题用iconv-lite转码 |

---

*文档版本：v1.0 | 创建日期：2026-04-01*
*配合AI编程助手（如Claude Code、Cursor等）使用效果最佳*
