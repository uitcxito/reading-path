'use client';

import { useState, useCallback } from 'react';
import { TestQuestion } from '@/types';

interface ComprehensionTestDisplayProps {
  questions: TestQuestion[];
  onComplete: (score: { correct: number; total: number }) => void;
  onBack: () => void;
}

export default function ComprehensionTestDisplay({
  questions,
  onComplete,
  onBack,
}: ComprehensionTestDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = useCallback((answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      // Calculate score
      let correct = 0;
      questions.forEach((q) => {
        const userAnswer = answers[q.id];
        if (q.type === 'multiple_choice') {
          if (userAnswer === q.correctAnswer) correct++;
        }
      });

      const multipleChoiceQuestions = questions.filter(
        (q) => q.type === 'multiple_choice'
      );

      setScore({
        correct,
        total: multipleChoiceQuestions.length,
      });
      setShowResults(true);
      onComplete({ correct, total: multipleChoiceQuestions.length });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastQuestion, questions, answers, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const getOptionLabel = (option: string): string => {
    const match = option.match(/^([A-D])\./);
    return match ? match[1] : option;
  };

  if (!currentQuestion) {
    return <div>加载中...</div>;
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 测试结果</h2>

          <div className="text-6xl font-bold text-blue-600 mb-2">
            {score.correct} / {score.total}
          </div>
          <p className="text-gray-600 mb-6">
            选择题正确率：{Math.round((score.correct / score.total) * 100)}%
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">
              💡 开放题的答案已记录，你可以对照下方的参考答案检查自己的理解程度。
            </p>
          </div>
        </div>

        {/* Show all questions with answers and explanations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">答案解析</h3>
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect =
              q.type === 'multiple_choice' && userAnswer === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                  q.type === 'multiple_choice'
                    ? isCorrect
                      ? 'border-green-500'
                      : 'border-red-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg font-medium text-gray-600">
                    Q{idx + 1}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      q.type === 'multiple_choice'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {q.type === 'multiple_choice' ? '选择题' : '开放题'}
                  </span>
                </div>

                <p className="text-gray-900 mb-4">{q.question}</p>

                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      const optLabel = getOptionLabel(opt);
                      const isSelected = userAnswer === optLabel;
                      const isCorrectOption = q.correctAnswer === optLabel;

                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-lg ${
                            isCorrectOption
                              ? 'bg-green-100 border border-green-300'
                              : isSelected
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span
                            className={
                              isCorrectOption
                                ? 'font-medium text-green-800'
                                : isSelected
                                ? 'text-red-800'
                                : ''
                            }
                          >
                            {opt}
                          </span>
                          {isCorrectOption && (
                            <span className="ml-2 text-green-600">✓ 正确答案</span>
                          )}
                          {isSelected && !isCorrectOption && (
                            <span className="ml-2 text-red-600">✗ 你的答案</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'open_ended' && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">你的回答：</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                      {userAnswer || '（未作答）'}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    📖 参考答案
                  </p>
                  <p className="text-gray-700">{q.correctAnswer}</p>
                </div>

                <div className="mt-4 text-gray-600">
                  <p className="text-sm">
                    <strong>💡 解析：</strong>
                    {q.explanation}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>📚 关联章节：</strong>
                    {q.relatedChapter}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          返回阅读地图
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          问题 {currentIndex + 1} / {questions.length}
        </span>
        <span>
          {questions.filter((q) => q.type === 'multiple_choice').length} 道选择题
          {' + '}
          {questions.filter((q) => q.type === 'open_ended').length} 道开放题
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs px-2 py-1 rounded ${
              currentQuestion.type === 'multiple_choice'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {currentQuestion.type === 'multiple_choice' ? '选择题' : '开放题'}
          </span>
          <span className="text-xs text-gray-500">
            📚 {currentQuestion.relatedChapter}
          </span>
        </div>

        <h3 className="text-xl font-medium text-gray-900 mb-6">
          {currentQuestion.question}
        </h3>

        {/* Multiple choice options */}
        {currentQuestion.type === 'multiple_choice' &&
          currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const optLabel = getOptionLabel(opt);
                const isSelected = answers[currentQuestion.id] === optLabel;

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(optLabel)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={isSelected ? 'text-blue-700' : ''}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        {/* Open-ended input */}
        {currentQuestion.type === 'open_ended' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="在这里输入你的回答..."
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-0 transition-colors"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            currentIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          上一题
        </button>
        <button
          onClick={handleNext}
          disabled={
            !answers[currentQuestion.id] ||
            (currentQuestion.type === 'open_ended' &&
              (!answers[currentQuestion.id] ||
                answers[currentQuestion.id].trim().length < 10))
          }
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            !answers[currentQuestion.id] ||
            (currentQuestion.type === 'open_ended' &&
              (!answers[currentQuestion.id] ||
                answers[currentQuestion.id].trim().length < 10))
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLastQuestion ? '提交答案' : '下一题'}
        </button>
      </div>
    </div>
  );
}
