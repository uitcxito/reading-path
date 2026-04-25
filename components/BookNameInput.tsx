'use client';

interface BookNameInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function BookNameInput({ value, onChange, disabled }: BookNameInputProps) {
  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-semibold text-gray-800">
        书名
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="例：思考，快与慢"
        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-300 text-gray-800"
      />
      <p className="text-xs text-gray-400 pl-1">
        输入你知道的书名，AI 会基于对该书的了解生成阅读地图
      </p>
    </div>
  );
}
