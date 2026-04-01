'use client';

import { useCallback, useState } from 'react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export default function UploadArea({ onFileSelect, selectedFile, disabled }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.epub')) {
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".epub"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      {selectedFile ? (
        <div className="space-y-2">
          <div className="text-4xl">✅</div>
          <p className="font-medium text-gray-900">{selectedFile.name}</p>
          <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-4xl">📚</div>
          <p className="font-medium text-gray-700">拖拽上传 .epub 文件</p>
          <p className="text-sm text-gray-500">或点击选择文件</p>
        </div>
      )}
    </div>
  );
}
