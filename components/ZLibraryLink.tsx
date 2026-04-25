'use client';

interface ZLibraryLinkProps {
  bookName: string;
  variant?: 'epub' | 'ai';
}

export default function ZLibraryLink({ bookName, variant = 'epub' }: ZLibraryLinkProps) {
  const searchUrl = `https://zh.z-library.sk/s/${encodeURIComponent(bookName || '')}`;

  const label = variant === 'epub'
    ? '没有 EPUB？去 Z-Library 搜索下载 →'
    : '想读原文？去 Z-Library 搜索下载 →';

  return (
    <a
      href={bookName ? searchUrl : 'https://zh.z-library.sk/'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors pl-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
      {label}
    </a>
  );
}
