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
  Sparkles,
  Brain,
  TrendingUp,
  Info,
} from "lucide-react";
import { saveReview } from "@/lib/review-history";
import {
  getPartnerProfile,
  getStrictnessBadgeColor,
} from "@/lib/utils/partner-utils";

type ReviewResultShape = {
  errors?: Array<any>;
  queries?: Array<any>;
  presentation?: Array<any>;
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
  aiEnhanced?: boolean; // NEW
  executiveSummary?: string; // NEW
  aiInsights?: Array<{ type: string; [key: string]: any }>; // NEW
  [k: string]: any;
};

type ReviewResultsProps = {
  results: ReviewResultShape | null;
  onReset: () => void;
};

export default function ReviewResultsEnhanced({
  results,
  onReset,
}: ReviewResultsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);

  const errors = Array.isArray(results?.errors) ? results!.errors : [];
  const queries = Array.isArray(results?.queries) ? results!.queries : [];
  const presentation = Array.isArray(results?.presentation)
    ? results!.presentation
    : [];
  const warnings = Array.isArray(results?.warnings) ? results!.warnings : [];

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

  const aiEnhanced = results?.aiEnhanced || false;
  const executiveSummary = results?.executiveSummary;
  const aiInsights = results?.aiInsights || [];

  // Separate AI-generated findings from rule-based ones
  const aiFindings = [
    ...errors.filter((e) => e.source?.includes("ai")),
    ...queries.filter((q) => q.source?.includes("ai")),
  ];
  const ruleBasedFindings = [
    ...errors.filter((e) => !e.source?.includes("ai")),
    ...queries.filter((q) => !q.source?.includes("ai")),
  ];

  const handleCopyId = () => {
    navigator.clipboard.writeText(reviewId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySummary = () => {
    const summary = `AI Accounts Review Summary
================================
Review ID: ${reviewId}
Partner: ${partnerName} (${profileType})
AI Enhanced: ${aiEnhanced ? "Yes" : "No"}
Timestamp: ${timestamp}

${executiveSummary || "Review completed successfully."}

Status: ${isReadyForPartner ? "✓ Ready for Partner" : "⚠ Review Required"}

Findings:
- Errors: ${errors.length}
- Queries: ${queries.length}
- Presentation: ${presentation.length}

${aiEnhanced ? `\nAI Insights: ${aiInsights.length} detected\n` : ""}
`;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("pdf-content");
      if (!element) {
        throw new Error("PDF content not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= 280;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= 280;
      }

      const filename = `ai-review-${partnerName.replace(
        /\s+/g,
        "-",
      )}-${Date.now()}.pdf`;
      pdf.save(filename);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      if (results?.partnerId) {
        saveReview({
          partnerId: String(results.partnerId),
          partnerName,
          scope: results?.scope || "full",
          status: isReadyForPartner ? "ready" : "needs-review",
          errorCount: errors.length,
          warningCount: queries.length,
          files: {
            trialBalance:
              results?.uploadedFileNames?.trialBalance || "trial-balance.xlsx",
            currentYearAccounts:
              results?.uploadedFileNames?.currentYearAccounts || "accounts.pdf",
          },
        });
      }
    } catch (err) {
      console.error("[AI Review] Export error:", err);
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
            <div className="flex items-center gap-3 mb-2">
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
              {aiEnhanced && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                  AI Enhanced
                </span>
              )}
            </div>
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
          {/* Executive Summary (AI-Generated) */}
          {aiEnhanced && executiveSummary && (
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
              <div className="flex items-start gap-4">
                <Brain className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    AI Executive Summary
                  </h2>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {executiveSummary}
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
                  Review Summary
                </h2>
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Total Findings
                    </p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {errors.length + queries.length + presentation.length}
                    </p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-error">{errors.length} errors</span>
                      <span className="text-warning">
                        {queries.length} queries
                      </span>
                      <span className="text-success">
                        {presentation.length} tips
                      </span>
                    </div>
                  </div>

                  {aiEnhanced && (
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-primary/30 dark:border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI-Detected Issues
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {aiFindings.length}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                        Contextual analysis findings
                      </p>
                    </div>
                  )}

                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Review ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-neutral-900 dark:text-white">
                        {reviewId.substring(0, 20)}...
                      </code>
                      <button
                        onClick={handleCopyId}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                      >
                        {copiedId ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          {aiEnhanced && aiInsights.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-white dark:bg-neutral-900/50 overflow-hidden">
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    AI Insights & Analysis
                  </h2>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {aiInsights.length} insights
                  </span>
                </div>
                <AlertTriangle
                  className={`h-5 w-5 text-neutral-400 transition-transform ${
                    showAIInsights ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAIInsights && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                  {aiInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                            {insight.type.replace(/-/g, " ").toUpperCase()}
                          </p>
                          {insight.summary && (
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                              {insight.summary}
                            </p>
                          )}
                          {insight.count !== undefined && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                              {insight.count} items analyzed
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Findings Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Detailed Findings
            </h2>

            {errors.length === 0 && queries.length === 0 ? (
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
              <div className="grid gap-4">
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
                          className="text-sm text-neutral-700 dark:text-neutral-300 flex gap-2 items-start"
                        >
                          <span className="text-error flex-shrink-0">•</span>
                          <div className="flex-1">
                            <span>
                              {typeof err === "string"
                                ? err
                                : err?.issue ||
                                  err?.message ||
                                  JSON.stringify(err)}
                            </span>
                            {err.source?.includes("ai") && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                <Sparkles className="h-2.5 w-2.5" />
                                AI
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {queries.length > 0 && (
                  <div className="rounded-xl border-2 border-warning/30 bg-warning/5 dark:bg-warning/10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <h3 className="font-bold text-warning">
                        Queries ({queries.length})
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {queries.map((q, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-neutral-700 dark:text-neutral-300 flex gap-2 items-start"
                        >
                          <span className="text-warning flex-shrink-0">•</span>
                          <div className="flex-1">
                            <span>
                              {typeof q === "string"
                                ? q
                                : q?.query || q?.message || JSON.stringify(q)}
                            </span>
                            {q.source?.includes("ai") && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                <Sparkles className="h-2.5 w-2.5" />
                                AI
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {aiEnhanced && (
              <span className="inline-flex items-center gap-1 mr-3 text-primary font-medium">
                <Sparkles className="h-3 w-3" />
                AI-Enhanced Review
              </span>
            )}
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
