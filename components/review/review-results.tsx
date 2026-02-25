"use client";

import { useState } from "react";
import {
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Copy,
} from "lucide-react";
import { saveReview } from "@/lib/review-history";
import {
  getPartnerProfile,
  getStrictnessBadgeColor,
} from "@/lib/utils/partner-utils";

type ReviewResultShape = {
  errors?: Array<any>;
  warnings?: Array<any>;
  summary?: Record<string, any>;
  parsed?: any;
  rules?: any;
  partnerId?: string | number | null;
  scope?: string | null;
  message?: string;
  reviewId?: string;
  uploadedFileNames?: {
    trialBalance: string;
    currentYearAccounts: string;
    priorYearAccounts?: string;
  };
  timestamp?: string;
  [k: string]: any;
};

type ReviewResultsProps = {
  results: ReviewResultShape | null;
  onReset: () => void;
};

export default function ReviewResults({
  results,
  onReset,
}: ReviewResultsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);

  const errors = Array.isArray(results?.errors) ? results!.errors : [];
  const warnings = Array.isArray(results?.queries)
    ? results!.queries
    : Array.isArray(results?.warnings)
      ? results!.warnings
      : [];
  const queries = Array.isArray(results?.queries) ? results!.queries : [];

  const isReadyForPartner = errors.length === 0;
  const partnerName =
    results?.summary?.partnerName || `Partner ${results?.partnerId}`;
  const partnerId = Number(results?.partnerId) || 1;
  const partnerProfile = getPartnerProfile(partnerId);
  const profileType = partnerProfile.profileType;
  const strictnessBadgeColor = getStrictnessBadgeColor(
    partnerProfile.strictness,
  );

  const reviewId = results?.reviewId || "N/A";
  const timestamp = results?.timestamp
    ? new Date(results.timestamp).toLocaleString()
    : new Date().toLocaleString();

  const generateReviewSummary = () => {
    return `AI Accounts Review Summary
================================
Review ID: ${reviewId}
Partner: ${partnerName} (${profileType})
Strictness: ${partnerProfile.strictness}
Review Scope: ${results?.scope || "full"}
Timestamp: ${timestamp}

Status: ${isReadyForPartner ? "✓ Ready for Partner" : "⚠ Review Required"}

Findings:
- Errors (Critical): ${errors.length}
- Queries/Recommendations: ${queries.length}
- Presentation Suggestions: ${results?.presentation?.length || 0}

Files Reviewed:
- Trial Balance: ${results?.uploadedFileNames?.trialBalance || "N/A"}
- Current Year Accounts: ${
      results?.uploadedFileNames?.currentYearAccounts || "N/A"
    }

${
  errors.length > 0
    ? `\nErrors:\n${errors
        .map(
          (e, i) =>
            `${i + 1}. ${
              typeof e === "string" ? e : e?.message || JSON.stringify(e)
            }`,
        )
        .join("\n")}`
    : ""
}

${
  warnings.length > 0
    ? `\nWarnings:\n${warnings
        .map(
          (w, i) =>
            `${i + 1}. ${
              typeof w === "string" ? w : w?.message || JSON.stringify(w)
            }`,
        )
        .join("\n")}`
    : ""
}
`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(reviewId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySummary = () => {
    const summary = generateReviewSummary();
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSaveToDatabase = async () => {
    setSavingToDb(true);
    try {
      const reviewData = {
        reviewId,
        partnerId,
        partnerName,
        profileType,
        scope: results?.scope || "full",
        status: isReadyForPartner ? "ready" : "needs-review",
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
        uploadedFileNames: results?.uploadedFileNames || {},
        timestamp,
      };

      const response = await fetch("/api/save-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(
          "[v0] Database save warning:",
          errorData.warning || errorData.error,
        );
      } else {
        console.log("[v0] Review saved to MongoDB successfully");
      }
    } catch (err) {
      console.error("[v0] Error saving to database:", err);
    } finally {
      setSavingToDb(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      const { PDFGenerator } = await import("@/lib/export/pdf-generator");

      // Prepare comprehensive review data for PDF
      const reviewData = {
        partner: {
          id: partnerId,
          name: partnerName,
          title: profileType,
        },
        config: {
          scope: results?.scope || "full",
        },
        errors: errors || [],
        queries: queries || [],
        warnings: warnings || [],
        presentation: results?.presentation || [],
        parsed: results?.parsed || {},
        summary: results?.summary || {},
        timestamp: timestamp,
        totalFindings:
          (errors?.length || 0) +
          (queries?.length || 0) +
          (results?.presentation?.length || 0),
        uploadedFileNames: results?.uploadedFileNames || {},
      };

      const generator = new PDFGenerator();
      const pdfBlob = generator.generatePDF(
        reviewData,
        `ai-review-${partnerName.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
      );

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-review-${partnerName.replace(
        /\s+/g,
        "-",
      )}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      if (results?.partnerId) {
        saveReview({
          partnerId: String(results.partnerId),
          partnerName,
          scope: results?.scope || "full",
          status: isReadyForPartner ? "ready" : "needs-review",
          errorCount: errors.length,
          warningCount: warnings.length,
          files: {
            trialBalance:
              results?.uploadedFileNames?.trialBalance || "trial-balance.xlsx",
            currentYearAccounts:
              results?.uploadedFileNames?.currentYearAccounts || "accounts.pdf",
          },
        });
      }

      // Save to database after export
      await handleSaveToDatabase();
    } catch (err) {
      console.error("[v0] Export error:", err);
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Status */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              <span className="text-3xl">{partnerProfile.icon}</span>
              {isReadyForPartner ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  Ready for Partner
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-error" />
                  Review Required
                </>
              )}
            </h1>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {partnerName}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${strictnessBadgeColor}`}
                >
                  {partnerProfile.strictness}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {profileType} • Reviewed on {timestamp} •{" "}
                {results?.scope || "full"} review
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              New Review
            </button>
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                exportSuccess
                  ? "bg-success text-white"
                  : isExporting
                    ? "bg-primary/50 text-white cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white"
              }`}
              disabled={isExporting}
            >
              {exportSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Exported
                </>
              ) : isExporting ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div id="pdf-content" className="space-y-6">
          {/* Summary Card */}
          <div
            className={`rounded-xl border-2 p-6 ${
              isReadyForPartner
                ? "border-success/30 bg-success/5 dark:bg-success/10"
                : "border-error/30 bg-error/5 dark:bg-error/10"
            }`}
          >
            <div className="flex items-start gap-4">
              {isReadyForPartner ? (
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-error flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Summary
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {results?.message || "Review completed"}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {/* Review ID Card */}
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Review ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-neutral-900 dark:text-white">
                        {reviewId}
                      </code>
                      <button
                        onClick={handleCopyId}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Copy Review ID"
                      >
                        {copiedId ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Files Info Card */}
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                      Files Reviewed
                    </p>
                    <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                      <li>
                        <span className="font-medium">TB:</span>{" "}
                        {results?.uploadedFileNames?.trialBalance ||
                          "trial-balance"}
                      </li>
                      <li>
                        <span className="font-medium">Accounts:</span>{" "}
                        {results?.uploadedFileNames?.currentYearAccounts ||
                          "accounts"}
                      </li>
                    </ul>
                  </div>
                </div>

                <div
                  className={`mt-4 p-4 rounded-lg border ${partnerProfile.borderColor} ${partnerProfile.bgColor}`}
                >
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Partner Profile
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Name:</span> {profileType}
                    </div>
                    <div>
                      <span className="font-medium">Strictness:</span>{" "}
                      {partnerProfile.strictness}
                    </div>
                    <div>
                      <span className="font-medium">Rules:</span>{" "}
                      {partnerProfile.ruleCount}
                    </div>
                    <div>
                      <span className="font-medium">Scope:</span>{" "}
                      {results?.scope || "full"}
                    </div>
                  </div>
                </div>

                <pre className="mt-4 bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs overflow-x-auto">
                  {JSON.stringify(
                    {
                      partnerId: results?.partnerId,
                      partnerName,
                      profileType,
                      strictness: partnerProfile.strictness,
                      reviewId,
                      scope: results?.scope || "full",
                      status: isReadyForPartner
                        ? "Ready for Partner"
                        : "Review Required",
                      timestamp: timestamp,
                      filesReviewed: {
                        trialBalance: results?.uploadedFileNames?.trialBalance,
                        currentYearAccounts:
                          results?.uploadedFileNames?.currentYearAccounts,
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </div>

          {/* Findings Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Findings
            </h2>

            {errors.length === 0 && warnings.length === 0 ? (
              <div className="rounded-xl border-2 border-success/30 bg-success/5 dark:bg-success/10 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Perfect! No issues found. This file is ready for partner
                    review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {errors.length > 0 && (
                  <div className="rounded-xl border-2 border-error/30 bg-error/5 dark:bg-error/10 p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-error" />
                        <h3 className="font-bold text-error">
                          Errors ({errors.length})
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-error/70 mb-4">
                      Critical issues that must be corrected before partner
                      review
                    </p>
                    <div className="space-y-4">
                      {errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-error/20 bg-white dark:bg-neutral-900 p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-mono text-xs font-bold text-error">
                              {err.id || `E${idx + 1}`}
                            </div>
                            {err.severity && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-error/20 text-error">
                                {err.severity.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {err.issue || err.message || JSON.stringify(err)}
                            </p>
                            {err.location && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                <span className="font-semibold">Location:</span>{" "}
                                {err.location}
                              </p>
                            )}
                            {err.tbRef && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                <span className="font-semibold">
                                  Reference:
                                </span>{" "}
                                {err.tbRef}
                              </p>
                            )}
                          </div>
                          {err.action && (
                            <div className="bg-error/10 rounded p-3 border-l-2 border-error">
                              <p className="text-xs font-semibold text-error mb-1">
                                Action Required:
                              </p>
                              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                                {err.action}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="rounded-xl border-2 border-warning/30 bg-warning/5 dark:bg-warning/10 p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <h3 className="font-bold text-warning">
                          Queries / Recommendations ({warnings.length})
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-warning/70 mb-4">
                      Questions and recommendations for partner decision or
                      clarification
                    </p>
                    <div className="space-y-4">
                      {warnings.map((w, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-warning/20 bg-white dark:bg-neutral-900 p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-mono text-xs font-bold text-warning">
                              {w.id || `Q${idx + 1}`}
                            </div>
                            {w.severity && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-warning/20 text-warning">
                                {w.severity.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {w.query || w.message || JSON.stringify(w)}
                            </p>
                            {w.location && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                <span className="font-semibold">Location:</span>{" "}
                                {w.location}
                              </p>
                            )}
                          </div>
                          {w.evidence && (
                            <div className="bg-warning/10 rounded p-3 border-l-2 border-warning">
                              <p className="text-xs font-semibold text-warning mb-1">
                                Evidence:
                              </p>
                              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                                {w.evidence}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.presentation?.length > 0 && (
                  <div className="rounded-xl border-2 border-info/30 bg-info/5 dark:bg-info/10 p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-info" />
                        <h3 className="font-bold text-info">
                          Presentation Suggestions (
                          {results.presentation.length})
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-info/70 mb-4">
                      Optional improvements for formatting, consistency, and
                      presentation
                    </p>
                    <div className="space-y-4">
                      {results.presentation.map((p, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-info/20 bg-white dark:bg-neutral-900 p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-mono text-xs font-bold text-info">
                              {p.id || `P${idx + 1}`}
                            </div>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {p.item}
                            </p>
                            {p.location && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                <span className="font-semibold">Location:</span>{" "}
                                {p.location}
                              </p>
                            )}
                          </div>
                          {p.suggestion && (
                            <div className="bg-info/10 rounded p-3 border-l-2 border-info">
                              <p className="text-xs font-semibold text-info mb-1">
                                Suggestion:
                              </p>
                              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                                {p.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parsed Data */}
          {results?.parsed && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                Parsed Data
              </h2>
              <pre className="overflow-auto text-xs bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 max-h-96">
                {JSON.stringify(results.parsed, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Review ID: <span className="font-mono">{reviewId}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopySummary}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                copiedSummary
                  ? "border-success bg-success/10 text-success"
                  : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}
              title="Copy review summary to clipboard"
            >
              {copiedSummary ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Summary
                </>
              )}
            </button>

            <button
              onClick={() => {
                navigator.share?.({
                  title: "AI Review Results",
                  text: `AI Accounts Review - ${partnerName} (${reviewId})`,
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={onReset}
              className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              Start New Review
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
