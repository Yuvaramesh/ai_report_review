"use client";

import { useState } from "react";
import {
  ChevronDown,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { ReviewRecord } from "@/lib/review-history";
import { getReviewHistory, clearReviewHistory } from "@/lib/review-history";

interface ReviewHistorySidebarProps {
  onSelectReview?: (review: ReviewRecord) => void;
}

export default function ReviewHistorySidebar({
  onSelectReview,
}: ReviewHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ReviewRecord[]>(() =>
    getReviewHistory()
  );

  const handleClear = () => {
    if (confirm("Clear all review history?")) {
      clearReviewHistory();
      setHistory([]);
    }
  };

  const getStatusIcon = (status: ReviewRecord["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-error" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-neutral-900/95 backdrop-blur border-l border-neutral-800 text-white z-40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between font-semibold hover:text-neutral-300 transition-colors"
        >
          <span>Review History</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-4 text-center text-neutral-400 text-sm">
              No reviews yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => onSelectReview?.(record)}
                  className="w-full text-left p-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800/50"
                >
                  <div className="flex items-start gap-2 mb-1">
                    {getStatusIcon(record.status)}
                    <span className="text-xs font-semibold text-neutral-300">
                      {record.partnerName}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(record.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {record.errorCount} errors, {record.warningCount} warnings
                  </div>
                </button>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="border-t border-neutral-800 p-4">
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
