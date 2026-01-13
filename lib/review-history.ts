export type ReviewRecord = {
  id: string;
  partnerId: string;
  partnerName: string;
  scope: string;
  status: "ready" | "needs-review" | "error";
  errorCount: number;
  warningCount: number;
  timestamp: string;
  files: {
    trialBalance: string;
    currentYearAccounts: string;
  };
};

const STORAGE_KEY = "ai-review-history";
const MAX_HISTORY = 20;

export function saveReview(
  review: Omit<ReviewRecord, "id" | "timestamp">
): ReviewRecord {
  if (typeof window === "undefined") return review as ReviewRecord;

  const record: ReviewRecord = {
    ...review,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    ) as ReviewRecord[];
    const updated = [record, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("[v0] Failed to save review history:", e);
  }

  return record;
}

export function getReviewHistory(): ReviewRecord[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    ) as ReviewRecord[];
  } catch (e) {
    console.error("[v0] Failed to load review history:", e);
    return [];
  }
}

export function clearReviewHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[v0] Failed to clear review history:", e);
  }
}
