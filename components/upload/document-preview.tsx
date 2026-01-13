"use client";

import { useState, useEffect } from "react";
import { X, File, AlertCircle } from "lucide-react";

interface DocumentPreviewProps {
  file: File | null;
  onClose: () => void;
}

export default function DocumentPreview({
  file,
  onClose,
}: DocumentPreviewProps) {
  const [preview, setPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    setIsLoading(true);
    setError("");

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setPreview(text.substring(0, 1000)); // First 1000 chars
        setIsLoading(false);
      } catch (err) {
        setError("Unable to preview file");
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setIsLoading(false);
    };

    if (
      file.type.includes("text") ||
      file.type.includes("pdf") ||
      file.type.includes("spreadsheet")
    ) {
      reader.readAsText(file);
    } else {
      setError("Preview not available for this file type");
      setIsLoading(false);
    }
  }, [file]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {file.name}
              </h3>
              <p className="text-xs text-neutral-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-neutral-500">
              Loading preview...
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 text-error">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Preview Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <pre className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words font-mono">
              {preview}
              {preview.length === 1000 && "..."}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
