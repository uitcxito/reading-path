import EPub from 'epub2';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { BookData, Chapter } from '@/types';

/**
 * Strip HTML tags and extract plain text
 */
function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  // Remove script and style elements
  $('script').remove();
  $('style').remove();
  // Get text and normalize whitespace
  const text = $('body').text() || $.root().text();
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Count words - different logic for Chinese vs English
 * Chinese: count characters (excluding spaces and punctuation)
 * English: count words by splitting on whitespace
 */
function countWords(text: string, language: string): number {
  if (language === 'zh' || language === 'zh-cn' || language === 'zh-tw') {
    // Chinese: count characters excluding spaces and common punctuation
    const chineseChars = text.replace(/[\s\p{P}]/gu, '');
    return chineseChars.length;
  } else {
    // English and other languages: count words
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
 * Parse EPUB file and extract book data
 */
export async function parseEpub(filePath: string): Promise<BookData> {
  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Create EPub instance
  const epub = await EPub.createAsync(filePath);

  // Wait for EPub to be ready
  await new Promise<void>((resolve, reject) => {
    epub.on('end', () => resolve());
    epub.on('error', (err: Error) => reject(err));
    epub.parse();
  });

  // Extract metadata
  const title = epub.metadata.title || 'Unknown Title';
  const author = epub.metadata.creator || 'Unknown Author';
  const language = epub.metadata.language || 'en';

  // Extract chapters
  const chapters: Chapter[] = [];
  const flow = epub.flow as Array<{ id: string; title?: string; order?: number }>;

  for (let i = 0; i < flow.length; i++) {
    const chapterInfo = flow[i];

    // Skip non-chapter items (like nav, toc, cover)
    if (!chapterInfo || !chapterInfo.id) continue;

    try {
      const htmlContent = await getChapterContent(epub as EPub, chapterInfo.id);
      const plainText = stripHtml(htmlContent);

      // Skip empty or very short chapters (likely navigation or blank pages)
      if (plainText.length < 100) continue;

      const chapter: Chapter = {
        id: chapterInfo.id,
        title: chapterInfo.title || `Chapter ${chapters.length + 1}`,
        order: chapters.length,
        content: plainText,
        wordCount: countWords(plainText, language),
        preview: generatePreview(plainText),
      };

      chapters.push(chapter);
    } catch (err) {
      console.warn(`Failed to parse chapter ${chapterInfo?.id}:`, err);
      // Continue with other chapters
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
  // Write buffer to temp file
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
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
