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
        relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
        ${isDragging
          ? 'border-blue-400 bg-blue-50/80 scale-[1.02] shadow-lg shadow-blue-100'
          : selectedFile
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
        }
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
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900">{selectedFile.name}</p>
          <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
          <p className="text-xs text-emerald-600 font-medium">点击可重新选择</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-700">拖拽上传 .epub 文件</p>
            <p className="text-sm text-gray-400 mt-1">或点击选择文件</p>
          </div>
        </div>
      )}
    </div>
  );
}
