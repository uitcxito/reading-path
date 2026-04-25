'use client';

import { useState, useCallback } from 'react';
import UploadArea from '@/components/UploadArea';
import QuestionInput from '@/components/QuestionInput';
import ModeSelector from '@/components/ModeSelector';
import BookNameInput from '@/components/BookNameInput';
import ZLibraryLink from '@/components/ZLibraryLink';
import ProgressBar, { AnalysisStep } from '@/components/ProgressBar';
import ComprehensionTestDisplay from '@/components/ComprehensionTestDisplay';
import { BookData, ReadingMap, TestQuestion, AnalysisMode, ChapterRecommendation, SectionRecommendation, ChapterDependency } from '@/types';

type AppState = 'upload' | 'analyzing' | 'result' | 'test';

const epubSteps: AnalysisStep[] = [
  { id: 'parse', label: '解析书籍结构（含小节）', status: 'pending' },
  { id: 'phase1', label: '初步分析章节相关性', status: 'pending' },
  { id: 'phase2', label: '生成阅读指令和依赖关系', status: 'pending' },
];

const aiDirectSteps: AnalysisStep[] = [
  { id: 'analyze', label: 'AI 基于知识生成阅读地图', status: 'pending' },
];

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [mode, setMode] = useState<AnalysisMode>('epub');
  const [file, setFile] = useState<File | null>(null);
  const [bookName, setBookName] = useState('');
  const [question, setQuestion] = useState('');
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [readingMap, setReadingMap] = useState<ReadingMap | null>(null);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>(epubSteps);

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

      // Step 2 & 3: Analyze
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

      const result: ReadingMap = await analyzeResponse.json();
      setReadingMap(result);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setState('upload');
      setSteps(epubSteps);
    }
  }, [file, question, updateStep]);

  const handleAnalyzeDirect = useCallback(async () => {
    if (!bookName.trim() || !question.trim()) {
      setError('请输入书名和问题');
      return;
    }

    setState('analyzing');
    setError(null);
    setSteps(aiDirectSteps);

    try {
      updateStep('analyze', 'in_progress');

      const response = await fetch('/api/analyze-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookName: bookName.trim(), question: question.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI 分析失败');
      }

      const result: ReadingMap = await response.json();
      setReadingMap(result);
      updateStep('analyze', 'completed');
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setState('upload');
      setSteps(aiDirectSteps);
    }
  }, [bookName, question, updateStep]);

  const handleStartTest = useCallback(async () => {
    if (!readingMap) return;
    if (mode === 'epub' && !bookData) return;

    setState('analyzing');
    setError(null);

    try {
      const body: Record<string, unknown> = { readingMap };

      if (mode === 'epub' && bookData) {
        body.chapters = bookData.chapters;
      } else {
        body.bookName = bookName;
      }

      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  }, [readingMap, bookData, mode, bookName]);

  const handleReset = useCallback(() => {
    setState('upload');
    setMode('epub');
    setFile(null);
    setBookName('');
    setQuestion('');
    setBookData(null);
    setReadingMap(null);
    setTestQuestions([]);
    setError(null);
    setSteps(epubSteps);
  }, []);

  const handleTestComplete = useCallback((score: { correct: number; total: number }) => {
    console.log('Test completed with score:', score);
  }, []);

  const canStart = mode === 'epub'
    ? !!file && question.trim().length > 0
    : bookName.trim().length > 0 && question.trim().length > 0;

  // Helper functions
  const getReadModeLabel = (mode: string) => {
    switch (mode) {
      case 'deep_read': return { text: '📖 精读', color: 'bg-red-100 text-red-700' };
      case 'skim': return { text: '👀 扫读', color: 'bg-yellow-100 text-yellow-700' };
      case 'reference': return { text: '📚 参考', color: 'bg-gray-100 text-gray-700' };
      default: return { text: mode, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'must_read': return { border: '#ef4444', label: '🔴 必读' };
      case 'recommended': return { border: '#f59e0b', label: '🟡 推荐' };
      case 'optional': return { border: '#6b7280', label: '⚪ 可选' };
      default: return { border: '#d1d5db', label: '⏭️ 跳过' };
    }
  };

  const getChapterTitle = (chapterId: string) => {
    const ch = readingMap?.chapters.find(c => c.chapterId === chapterId);
    return ch?.chapterTitle || chapterId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">ReadPath</h1>
          <p className="text-base text-gray-400">带着问题读书的最短路径</p>
        </header>

        {/* Main Content */}
        {state === 'upload' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
            <ModeSelector mode={mode} onModeChange={setMode} />

            {mode === 'epub' ? (
              <div className="space-y-3">
                <UploadArea onFileSelect={setFile} selectedFile={file} />
                <ZLibraryLink bookName={file?.name?.replace('.epub', '') || ''} variant="epub" />
              </div>
            ) : (
              <div className="space-y-3">
                <BookNameInput value={bookName} onChange={setBookName} />
                <ZLibraryLink bookName={bookName} variant="ai" />
              </div>
            )}

            <QuestionInput value={question} onChange={setQuestion} />

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{error}</div>
            )}

            <button
              onClick={mode === 'epub' ? handleAnalyze : handleAnalyzeDirect}
              disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 ${
                canStart
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              开始分析
            </button>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <ProgressBar steps={steps} bookTitle={mode === 'epub' ? bookData?.title : bookName} />
          </div>
        )}

        {state === 'result' && readingMap && (
          <div className="space-y-6">
            {/* AI Direct Disclaimer */}
            {mode === 'ai_direct' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                ⚠️ 章节结构基于 AI 知识，可能与实际版本有差异。建议对照纸质书确认。
              </div>
            )}

            {/* Header Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">📖 《{readingMap.bookTitle}》</h2>
              <p className="text-blue-100 mb-4">你的问题：{readingMap.userQuestion}</p>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">⏱️</span>
                  <div>
                    <p className="text-2xl font-bold">{readingMap.estimatedReadTime || '约2小时'}</p>
                    <p className="text-sm text-blue-200">预计阅读时间</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="text-2xl font-bold">
                      {readingMap.chapters.filter(c => c.priority === 'must_read').length}章
                    </p>
                    <p className="text-sm text-blue-200">必读章节</p>
                  </div>
                </div>
              </div>

              {readingMap.summary && (
                <p className="mt-6 pt-6 border-t border-blue-500 text-blue-100 italic">{readingMap.summary}</p>
              )}
            </div>

            {/* Reading Tasks */}
            {readingMap.readingTasks && readingMap.readingTasks.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <span>🎯</span> 阅读任务
                </h3>
                <p className="text-sm text-amber-700 mb-3">读完这些内容后，你应该能回答以下问题：</p>
                <ul className="space-y-2">
                  {readingMap.readingTasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-900">
                      <span className="font-medium">{idx + 1}.</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dependencies */}
            {readingMap.dependencies && readingMap.dependencies.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <span>🔗</span> 章节依赖关系
                </h3>
                <p className="text-sm text-purple-700 mb-3">建议按以下顺序阅读，因为概念有递进关系：</p>
                <div className="space-y-2">
                  {readingMap.dependencies.map((dep, idx) => (
                    <div key={idx} className="text-sm text-purple-900 bg-white rounded-lg p-3">
                      <strong>{getChapterTitle(dep.chapterId)}</strong>
                      {dep.dependsOn.length > 0 && (
                        <span className="text-purple-600">
                          {' '}← 需要先读：{dep.dependsOn.map(id => getChapterTitle(id)).join('、')}
                        </span>
                      )}
                      <p className="text-purple-500 text-xs mt-1">{dep.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter Recommendations */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">📍 阅读路径</h3>
              {readingMap.chapters
                .filter(ch => ch.priority !== 'skip')
                .sort((a, b) => (a.readOrder || 99) - (b.readOrder || 99))
                .map((chapter) => {
                  const style = getPriorityStyle(chapter.priority);
                  return (
                    <div
                      key={chapter.chapterId}
                      className="bg-white rounded-xl shadow-sm p-6 border-l-4"
                      style={{ borderLeftColor: style.border }}
                    >
                      {/* Chapter Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {chapter.readOrder && chapter.readOrder > 0 && (
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                              {chapter.readOrder}
                            </span>
                          )}
                          <span className="text-lg">{style.label}</span>
                          <span className="font-medium text-gray-900">{chapter.chapterTitle}</span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          相关度 {chapter.relevanceScore}%
                        </span>
                      </div>

                      {/* Page Hint */}
                      <p className="text-sm text-gray-500 mb-2 ml-9">📍 {chapter.pageHint}</p>

                      {/* Reason */}
                      <p className="text-gray-700 mb-3 ml-9">💡 {chapter.reason}</p>

                      {/* Reading Instruction */}
                      {chapter.readingInstruction && (
                        <div className="ml-9 mb-4 bg-blue-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-800 mb-2">📖 阅读方式</p>
                          <div className="text-sm text-blue-700 space-y-1">
                            {chapter.readingInstruction.lookFor && chapter.readingInstruction.lookFor.length > 0 && (
                              <p><strong>重点找：</strong>{chapter.readingInstruction.lookFor.join('、')}</p>
                            )}
                            {chapter.readingInstruction.skipIf && (
                              <p className="text-blue-500"><strong>可跳过：</strong>{chapter.readingInstruction.skipIf}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sections */}
                      {chapter.sections && chapter.sections.length > 0 && (
                        <div className="ml-9 space-y-2">
                          <p className="text-sm font-medium text-gray-600">📑 小节指南</p>
                          {chapter.sections.map((section, idx) => {
                            const modeStyle = getReadModeLabel(section.readMode);
                            return (
                              <div key={idx} className="flex items-start gap-3 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${modeStyle.color}`}>
                                  {modeStyle.text}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{section.sectionTitle}</p>
                                  <p className="text-gray-500 text-xs">{section.location}</p>
                                  {section.focusPoints && section.focusPoints.length > 0 && (
                                    <p className="text-gray-600 text-xs mt-1">
                                      找：{section.focusPoints.join('、')}
                                    </p>
                                  )}
                                </div>
                                {section.estimatedTime && (
                                  <span className="text-gray-400 text-xs">{section.estimatedTime}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Key Points */}
                      {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                        <div className="ml-9 mt-3 text-sm">
                          <p className="text-gray-600 font-medium">🔑 核心论点</p>
                          <ul className="mt-1 space-y-1">
                            {chapter.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-gray-700 pl-2">· {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Skip Chapters */}
            {readingMap.chapters.filter(ch => ch.priority === 'skip').length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-3">⏭️ 可跳过的章节</h3>
                <div className="space-y-1">
                  {readingMap.chapters
                    .filter(ch => ch.priority === 'skip')
                    .map((chapter) => (
                      <p key={chapter.chapterId} className="text-sm text-gray-500">
                        {chapter.chapterTitle} — {chapter.reason}
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

        <footer className="mt-16 text-center text-xs text-gray-300">
          <p>上传 EPUB 或让 AI 直接分析，帮你找到最高效的阅读路径</p>
        </footer>
      </div>
    </div>
  );
}
