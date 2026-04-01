'use client';

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressBarProps {
  steps: AnalysisStep[];
  bookTitle?: string;
}

export default function ProgressBar({ steps, bookTitle }: ProgressBarProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      default:
        return '○';
    }
  };

  return (
    <div className="space-y-6">
      {bookTitle && (
        <p className="text-lg text-center text-gray-700">
          正在分析《{bookTitle}》...
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress percentage */}
      <p className="text-center text-sm text-gray-500">{Math.round(progress)}%</p>

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${step.status === 'in_progress' ? 'bg-blue-50' : ''}
            `}
          >
            <span className="text-lg">{getStepIcon(step.status)}</span>
            <span
              className={`
                ${step.status === 'completed' ? 'text-gray-600' : ''}
                ${step.status === 'in_progress' ? 'text-blue-700 font-medium' : ''}
                ${step.status === 'pending' ? 'text-gray-400' : ''}
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
