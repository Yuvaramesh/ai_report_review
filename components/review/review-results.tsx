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
  const warnings = Array.isArray(results?.warnings) ? results!.warnings : [];

  const isReadyForPartner = errors.length === 0;
  const partnerName =
    results?.summary?.partnerName || `Partner ${results?.partnerId}`;
  const partnerId = Number(results?.partnerId) || 1;
  const partnerProfile = getPartnerProfile(partnerId);
  const profileType = partnerProfile.profileType;
  const strictnessBadgeColor = getStrictnessBadgeColor(
    partnerProfile.strictness
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
- Errors: ${errors.length}
- Warnings: ${warnings.length}

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
            }`
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
            }`
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
          errorData.warning || errorData.error
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
      console.log("[v0] Starting PDF export process...");

      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("pdf-content");
      if (!element) {
        throw new Error("PDF content element not found");
      }

      console.log("[v0] Rendering HTML to canvas with html2canvas...");
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        allowTaint: true,
        useCORS: true,
        logging: false,
        removeContainer: true,
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
      });
      
      console.log("[v0] Canvas rendered successfully, converting to image...");
      const imgData = canvas.toDataURL("image/png", 0.95);

      console.log("[v0] Creating PDF document...");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      const filename = `ai-review-${partnerName.replace(
        /\s+/g,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.pdf`;
      
      console.log("[v0] Saving PDF with filename:", filename);
      pdf.save(filename);

      console.log("[v0] PDF export completed successfully");
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

      await handleSaveToDatabase();
    } catch (err) {
      console.error("[v0] PDF export error:", err);
      const errorMsg = err instanceof Error ? err.message : "Export failed";
      console.error("[v0] Error details:", errorMsg);
      alert(`Failed to export PDF: ${errorMsg}. Please try again.`);
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
          {/* AI Executive Summary */}
          {results?.summary?.executiveSummary && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 p-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">🤖</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    AI Executive Summary
                  </h2>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {results.summary.executiveSummary}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  Review Status
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
                    2
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
              <div className="grid gap-4 md:grid-cols-2">
                {errors.length > 0 && (
                  <div className="rounded-xl border-2 border-error/30 bg-error/5 dark:bg-error/10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-error" />
                      <h3 className="font-bold text-error">
                        Errors ({errors.length})
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {errors.map((err, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-neutral-700 dark:text-neutral-300 flex gap-2"
                        >
                          <span className="text-error">•</span>
                          {typeof err === "string"
                            ? err
                            : err?.message || JSON.stringify(err)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="rounded-xl border-2 border-warning/30 bg-warning/5 dark:bg-warning/10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <h3 className="font-bold text-warning">
                        Warnings ({warnings.length})
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {warnings.map((w, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-neutral-700 dark:text-neutral-300 flex gap-2"
                        >
                          <span className="text-warning">•</span>
                          {typeof w === "string"
                            ? w
                            : w?.message || JSON.stringify(w)}
                        </li>
                      ))}
                    </ul>
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
