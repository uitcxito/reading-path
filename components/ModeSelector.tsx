'use client';

import { AnalysisMode } from '@/types';

interface ModeSelectorProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

export default function ModeSelector({ mode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="relative flex rounded-2xl bg-gray-100/80 p-1.5 gap-1 backdrop-blur-sm">
      {/* Sliding indicator */}
      <div
        className={`absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-md transition-all duration-300 ease-out ${
          mode === 'epub' ? 'left-1.5 right-[calc(50%+2px)]' : 'left-[calc(50%+2px)] right-1.5'
        }`}
      />
      <button
        onClick={() => onModeChange('epub')}
        disabled={disabled}
        className={`relative z-10 flex-1 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
          mode === 'epub'
            ? 'text-blue-700'
            : 'text-gray-400 hover:text-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          上传 EPUB
        </span>
      </button>
      <button
        onClick={() => onModeChange('ai_direct')}
        disabled={disabled}
        className={`relative z-10 flex-1 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
          mode === 'ai_direct'
            ? 'text-blue-700'
            : 'text-gray-400 hover:text-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          AI 直接分析
        </span>
      </button>
    </div>
  );
}
