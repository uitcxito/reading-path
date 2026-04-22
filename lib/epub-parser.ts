import EPub from 'epub2';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { BookData, Chapter, Section } from '@/types';

/**
 * Strip HTML tags and extract plain text
 */
function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script').remove();
  $('style').remove();
  const text = $('body').text() || $.root().text();
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Extract sections from HTML based on h2/h3 headings
 */
function extractSections(html: string, chapterId: string): Section[] {
  const $ = cheerio.load(html);
  const sections: Section[] = [];

  // Find all h2 and h3 headings
  const headings = $('h2, h3, h4').toArray();

  if (headings.length === 0) {
    // No headings found, return single section for entire chapter
    return [{
      id: `${chapterId}-s0`,
      title: '全文',
      level: 2,
      order: 0,
      content: stripHtml(html),
      wordCount: 0,
      startLocation: '章节开头',
    }];
  }

  // Extract content between headings
  headings.forEach((heading, index) => {
    const $heading = $(heading);
    const tagName = 'name' in heading ? heading.name : ($heading.get(0) as any)?.name || 'h2';
    const level = parseInt(tagName.charAt(1)); // h2 -> 2, h3 -> 3
    const title = $heading.text().trim() || `小节 ${index + 1}`;

    // Get content between this heading and the next
    let content = '';
    let $current = $heading.next();

    while ($current.length > 0 && !$current.is('h2, h3, h4')) {
      content += $current.text() + ' ';
      $current = $current.next();
    }

    content = content.trim();

    if (content.length > 50) { // Only include sections with meaningful content
      sections.push({
        id: `${chapterId}-s${index}`,
        title,
        level,
        order: index,
        content,
        wordCount: 0, // Will be calculated later
        startLocation: index === 0 ? '章节开头' : `第${index}小节`,
      });
    }
  });

  // If no valid sections were found, create one for the entire chapter
  if (sections.length === 0) {
    return [{
      id: `${chapterId}-s0`,
      title: '全文',
      level: 2,
      order: 0,
      content: stripHtml(html),
      wordCount: 0,
      startLocation: '章节开头',
    }];
  }

  return sections;
}

/**
 * Count words - different logic for Chinese vs English
 */
function countWords(text: string, language: string): number {
  if (language === 'zh' || language === 'zh-cn' || language === 'zh-tw') {
    const chineseChars = text.replace(/[\s\p{P}]/gu, '');
    return chineseChars.length;
  } else {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }
}

/**
 * Generate preview text (first 500 characters)
 */
function generatePreview(text: string, maxLength: number = 500): string {
  const cleaned = text.trim().substring(0, maxLength);
  return cleaned.length < text.length ? cleaned + '...' : cleaned;
}

/**
 * Get chapter content as promise
 */
function getChapterContent(epub: EPub, chapterId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (err: Error | null, text?: string) => {
      if (err) reject(err);
      else resolve(text || '');
    });
  });
}

/**
 * Parse EPUB file and extract book data with section-level structure
 */
export async function parseEpub(filePath: string): Promise<BookData> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const epub = await EPub.createAsync(filePath);

  await new Promise<void>((resolve, reject) => {
    epub.on('end', () => resolve());
    epub.on('error', (err: Error) => reject(err));
    epub.parse();
  });

  const title = epub.metadata.title || 'Unknown Title';
  const author = epub.metadata.creator || 'Unknown Author';
  const language = epub.metadata.language || 'en';

  const chapters: Chapter[] = [];
  const flow = epub.flow as Array<{ id: string; title?: string; order?: number }>;

  for (let i = 0; i < flow.length; i++) {
    const chapterInfo = flow[i];
    if (!chapterInfo || !chapterInfo.id) continue;

    try {
      const htmlContent = await getChapterContent(epub as EPub, chapterInfo.id);
      const plainText = stripHtml(htmlContent);

      if (plainText.length < 100) continue;

      // Extract section-level structure
      const sections = extractSections(htmlContent, chapterInfo.id);

      // Calculate word counts for sections
      sections.forEach(section => {
        section.wordCount = countWords(section.content, language);
      });

      const chapter: Chapter = {
        id: chapterInfo.id,
        title: chapterInfo.title || `Chapter ${chapters.length + 1}`,
        order: chapters.length,
        content: plainText,
        wordCount: countWords(plainText, language),
        preview: generatePreview(plainText),
        sections,
      };

      chapters.push(chapter);
    } catch (err) {
      console.warn(`Failed to parse chapter ${chapterInfo?.id}:`, err);
    }
  }

  return {
    title,
    author,
    language,
    totalChapters: chapters.length,
    chapters,
  };
}

/**
 * Parse EPUB from buffer (for file uploads)
 */
export async function parseEpubFromBuffer(buffer: Buffer, filename: string): Promise<BookData> {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `epub-${Date.now()}.epub`);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    const bookData = await parseEpub(tempFilePath);
    return bookData;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
