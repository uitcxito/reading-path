'use client';

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function QuestionInput({ value, onChange, disabled }: QuestionInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        你想解决什么问题？
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="例：我想了解人类决策中的常见偏误，以及如何在投资决策中避免这些偏误"
        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
        rows={4}
      />
      <p className="text-xs text-gray-500">
        描述越具体，AI 生成的阅读地图越精准
      </p>
    </div>
  );
}
