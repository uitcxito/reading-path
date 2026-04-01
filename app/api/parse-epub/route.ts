import { NextRequest, NextResponse } from 'next/server';
import { parseEpubFromBuffer } from '@/lib/epub-parser';

// Force Node.js runtime (required for epub2 which uses fs)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.epub')) {
      return NextResponse.json(
        { error: 'Only .epub files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse EPUB
    const bookData = await parseEpubFromBuffer(buffer, file.name);

    return NextResponse.json(bookData);
  } catch (error) {
    console.error('EPUB parsing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse EPUB' },
      { status: 500 }
    );
  }
}
