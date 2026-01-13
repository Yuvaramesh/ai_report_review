/**
 * Generates a unique review ID for tracking
 * Format: AIREVIEW-YYYYMMDD-HHMMSS-RANDOM
 */
export function generateReviewId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `AIREVIEW-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}
