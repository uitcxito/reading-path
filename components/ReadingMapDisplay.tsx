'use client';

import { ReadingMap, ChapterRecommendation } from '@/types';

interface ReadingMapDisplayProps {
  readingMap: ReadingMap;
  onStartTest: () => void;
  onReset: () => void;
}

const priorityConfig = {
  must_read: { icon: '🔴', label: '必读', color: 'border-red-500', bg: 'bg-red-50' },
  recommended: { icon: '🟡', label: '推荐', color: 'border-amber-500', bg: 'bg-amber-50' },
  optional: { icon: '⚪', label: '可选', color: 'border-gray-400', bg: 'bg-gray-50' },
  skip: { icon: '⏭️', label: '跳过', color: 'border-gray-200', bg: 'bg-gray-50' },
};

function ChapterCard({
  chapter,
  showOrder,
}: {
  chapter: ChapterRecommendation;
  showOrder: boolean;
}) {
  const config = priorityConfig[chapter.priority];

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${config.color} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {showOrder && chapter.readOrder > 0 && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
              {chapter.readOrder}
            </span>
          )}
          <span className="text-lg">
            {config.icon} {config.label}
          </span>
          <span className="font-medium text-gray-900">{chapter.chapterTitle}</span>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          相关度 {chapter.relevanceScore}%
        </span>
      </div>

      <div className="ml-9 space-y-2">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <span>📍</span> {chapter.pageHint}
        </p>

        <p className="text-gray-700">{chapter.reason}</p>

        {chapter.keyPoints.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">🔑 关键点</p>
            <ul className="space-y-1">
              {chapter.keyPoints.map((point, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400">·</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReadingMapDisplay({
  readingMap,
  onStartTest,
  onReset,
}: ReadingMapDisplayProps) {
  // Separate and sort chapters
  const mustReadChapters = readingMap.chapters
    .filter((ch) => ch.priority === 'must_read')
    .sort((a, b) => a.readOrder - b.readOrder);

  const recommendedChapters = readingMap.chapters
    .filter((ch) => ch.priority === 'recommended')
    .sort((a, b) => a.readOrder - b.readOrder);

  const optionalChapters = readingMap.chapters
    .filter((ch) => ch.priority === 'optional')
    .sort((a, b) => a.readOrder - b.readOrder);

  const skipChapters = readingMap.chapters.filter((ch) => ch.priority === 'skip');

  const totalMustRead = mustReadChapters.length + recommendedChapters.length;

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">
          📖 《{readingMap.bookTitle}》
        </h2>
        <p className="text-blue-100 mb-6">
          你的问题：{readingMap.userQuestion}
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-2xl font-bold">
                {totalMustRead} / {readingMap.chapters.length}
              </p>
              <p className="text-sm text-blue-200">需要阅读的章节</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">⏱️</span>
            <div>
              <p className="text-2xl font-bold">{readingMap.estimatedReadTime}</p>
              <p className="text-sm text-blue-200">预计阅读时间</p>
            </div>
          </div>
        </div>

        {readingMap.summary && (
          <div className="mt-6 pt-6 border-t border-blue-500">
            <p className="text-blue-100 italic">{readingMap.summary}</p>
          </div>
        )}
      </div>

      {/* Must Read Section */}
      {mustReadChapters.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔴</span> 必读章节
            <span className="text-sm font-normal text-gray-500">
              ({mustReadChapters.length} 章)
            </span>
          </h3>
          <div className="space-y-4">
            {mustReadChapters.map((chapter) => (
              <ChapterCard key={chapter.chapterId} chapter={chapter} showOrder />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Section */}
      {recommendedChapters.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🟡</span> 推荐阅读
            <span className="text-sm font-normal text-gray-500">
              ({recommendedChapters.length} 章)
            </span>
          </h3>
          <div className="space-y-4">
            {recommendedChapters.map((chapter) => (
              <ChapterCard key={chapter.chapterId} chapter={chapter} showOrder />
            ))}
          </div>
        </section>
      )}

      {/* Optional Section */}
      {optionalChapters.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚪</span> 可选阅读
            <span className="text-sm font-normal text-gray-500">
              ({optionalChapters.length} 章)
            </span>
          </h3>
          <div className="space-y-4">
            {optionalChapters.map((chapter) => (
              <ChapterCard key={chapter.chapterId} chapter={chapter} showOrder={false} />
            ))}
          </div>
        </section>
      )}

      {/* Skip Section */}
      {skipChapters.length > 0 && (
        <section className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <span>⏭️</span> 可跳过的章节
            <span className="text-sm font-normal">({skipChapters.length} 章)</span>
          </h3>
          <div className="grid gap-2">
            {skipChapters.map((chapter) => (
              <div key={chapter.chapterId} className="text-sm text-gray-500 flex gap-2">
                <span>·</span>
                <span>
                  <strong>{chapter.chapterTitle}</strong> — {chapter.reason}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          重新分析
        </button>
        <button
          onClick={onStartTest}
          className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
        >
          ✅ 我读完了，测试我
        </button>
      </div>
    </div>
  );
}
