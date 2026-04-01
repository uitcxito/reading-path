'use client';

import { useState, useCallback } from 'react';
import UploadArea from '@/components/UploadArea';
import QuestionInput from '@/components/QuestionInput';
import ProgressBar, { AnalysisStep } from '@/components/ProgressBar';
import ComprehensionTestDisplay from '@/components/ComprehensionTestDisplay';
import { BookData, ReadingMap, TestQuestion } from '@/types';

type AppState = 'upload' | 'analyzing' | 'result' | 'test';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [readingMap, setReadingMap] = useState<ReadingMap | null>(null);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'parse', label: '解析书籍结构', status: 'pending' },
    { id: 'phase1', label: '初步分析章节相关性', status: 'pending' },
    { id: 'phase2', label: '深入分析重点章节', status: 'pending' },
    { id: 'generate', label: '生成个性化阅读地图', status: 'pending' },
  ]);

  const updateStep = useCallback((stepId: string, status: AnalysisStep['status']) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file || !question.trim()) {
      setError('请上传文件并输入问题');
      return;
    }

    setState('analyzing');
    setError(null);

    try {
      // Step 1: Parse EPUB
      updateStep('parse', 'in_progress');
      const formData = new FormData();
      formData.append('file', file);

      const parseResponse = await fetch('/api/parse-epub', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        const err = await parseResponse.json();
        throw new Error(err.error || 'EPUB 解析失败');
      }

      const parsedBookData: BookData = await parseResponse.json();
      setBookData(parsedBookData);
      updateStep('parse', 'completed');

      // Step 2 & 3 & 4: Analyze (combined in single API call for now)
      updateStep('phase1', 'in_progress');

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookData: parsedBookData,
          question,
        }),
      });

      if (!analyzeResponse.ok) {
        const err = await analyzeResponse.json();
        throw new Error(err.error || '分析失败');
      }

      updateStep('phase1', 'completed');
      updateStep('phase2', 'completed');
      updateStep('generate', 'completed');

      const result: ReadingMap = await analyzeResponse.json();
      setReadingMap(result);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setState('upload');
      // Reset steps
      setSteps([
        { id: 'parse', label: '解析书籍结构', status: 'pending' },
        { id: 'phase1', label: '初步分析章节相关性', status: 'pending' },
        { id: 'phase2', label: '深入分析重点章节', status: 'pending' },
        { id: 'generate', label: '生成个性化阅读地图', status: 'pending' },
      ]);
    }
  }, [file, question, updateStep]);

  const handleStartTest = useCallback(async () => {
    if (!readingMap || !bookData) return;

    setState('analyzing');
    setError(null);

    try {
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingMap,
          chapters: bookData.chapters,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '生成测试失败');
      }

      const result = await response.json();
      setTestQuestions(result.questions);
      setState('test');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成测试失败');
      setState('result');
    }
  }, [readingMap, bookData]);

  const handleReset = useCallback(() => {
    setState('upload');
    setFile(null);
    setQuestion('');
    setBookData(null);
    setReadingMap(null);
    setTestQuestions([]);
    setError(null);
    setSteps([
      { id: 'parse', label: '解析书籍结构', status: 'pending' },
      { id: 'phase1', label: '初步分析章节相关性', status: 'pending' },
      { id: 'phase2', label: '深入分析重点章节', status: 'pending' },
      { id: 'generate', label: '生成个性化阅读地图', status: 'pending' },
    ]);
  }, []);

  const handleTestComplete = useCallback((score: { correct: number; total: number }) => {
    console.log('Test completed with score:', score);
  }, []);

  const canStart = file && question.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            📖 ReadPath
          </h1>
          <p className="text-lg text-gray-600">
            带着问题读书的最短路径
          </p>
        </header>

        {/* Main Content */}
        {state === 'upload' && (
          <div className="space-y-8">
            <UploadArea
              onFileSelect={setFile}
              selectedFile={file}
            />

            <QuestionInput
              value={question}
              onChange={setQuestion}
            />

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!canStart}
              className={`
                w-full py-4 rounded-xl font-medium text-lg transition-all
                ${canStart
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              🔍 开始分析
            </button>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <ProgressBar steps={steps} bookTitle={bookData?.title} />
          </div>
        )}

        {state === 'result' && readingMap && (
          <div className="space-y-6">
            {/* Result header */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📖 《{readingMap.bookTitle}》— 你的阅读地图
              </h2>
              <p className="text-gray-600 mb-4">
                你的问题：{readingMap.userQuestion}
              </p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span>
                    全书 {readingMap.chapters.length} 章，重点阅读{' '}
                    {readingMap.chapters.filter(c => c.priority === 'must_read').length} 章
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <span>{readingMap.estimatedReadTime}</span>
                </div>
              </div>

              {readingMap.summary && (
                <p className="mt-4 text-gray-700 italic border-l-4 border-blue-200 pl-4">
                  {readingMap.summary}
                </p>
              )}
            </div>

            {/* Chapter recommendations */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">建议阅读顺序</h3>
              {readingMap.chapters
                .filter(ch => ch.priority !== 'skip')
                .sort((a, b) => a.readOrder - b.readOrder)
                .map((chapter) => (
                  <div
                    key={chapter.chapterId}
                    className="bg-white rounded-xl shadow-sm p-6 border-l-4"
                    style={{
                      borderLeftColor:
                        chapter.priority === 'must_read' ? '#ef4444' :
                        chapter.priority === 'recommended' ? '#f59e0b' : '#6b7280'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                          {chapter.readOrder}
                        </span>
                        <span className="text-lg">
                          {chapter.priority === 'must_read' && '🔴必读'}
                          {chapter.priority === 'recommended' && '🟡推荐'}
                          {chapter.priority === 'optional' && '⚪可选'}
                        </span>
                        <span className="font-medium text-gray-900">
                          {chapter.chapterTitle}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        相关度 {chapter.relevanceScore}%
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2 ml-9">
                      📍 {chapter.pageHint}
                    </p>

                    <p className="text-gray-700 mb-3 ml-9">
                      💡 {chapter.reason}
                    </p>

                    {chapter.keyPoints.length > 0 && (
                      <div className="text-sm ml-9">
                        <span className="text-gray-600">🔑 关键点：</span>
                        <ul className="mt-1 space-y-1">
                          {chapter.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-gray-700 pl-2">
                              · {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Skip chapters */}
            {readingMap.chapters.filter(ch => ch.priority === 'skip').length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">可跳过的章节</h3>
                <div className="space-y-2">
                  {readingMap.chapters
                    .filter(ch => ch.priority === 'skip')
                    .map((chapter) => (
                      <p key={chapter.chapterId} className="text-sm text-gray-500">
                        ⏭️ {chapter.chapterTitle} — {chapter.reason}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                重新分析
              </button>
              <button
                onClick={handleStartTest}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg"
              >
                ✅ 我读完了，测试我
              </button>
            </div>
          </div>
        )}

        {state === 'test' && testQuestions.length > 0 && (
          <ComprehensionTestDisplay
            questions={testQuestions}
            onComplete={handleTestComplete}
            onBack={() => setState('result')}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>上传你的 EPUB，让 AI 帮你找到最高效的阅读路径</p>
        </footer>
      </div>
    </div>
  );
}
