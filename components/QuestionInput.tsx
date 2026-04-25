'use client';

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function QuestionInput({ value, onChange, disabled }: QuestionInputProps) {
  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-semibold text-gray-800">
        你想解决什么问题？
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="例：我想了解人类决策中的常见偏误，以及如何在投资决策中避免这些偏误"
        className="w-full h-32 px-4 py-3.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-300 text-gray-800"
        rows={4}
      />
      <p className="text-xs text-gray-400 pl-1">
        描述越具体，AI 生成的阅读地图越精准
      </p>
    </div>
  );
}
