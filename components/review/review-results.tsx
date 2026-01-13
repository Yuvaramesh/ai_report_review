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
} from "lucide-react";
import { saveReview } from "@/lib/review-history";

type ReviewResultShape = {
  errors?: Array<any>;
  warnings?: Array<any>;
  summary?: Record<string, any>;
  parsed?: any;
  rules?: any;
  partnerId?: string | number | null;
  scope?: string | null;
  message?: string;
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

  const errors = Array.isArray(results?.errors) ? results!.errors : [];
  const warnings = Array.isArray(results?.warnings) ? results!.warnings : [];

  const isReadyForPartner = errors.length === 0;
  const partnerName =
    results?.summary?.partnerName || `Partner ${results?.partnerId}`;

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
        "-"
      )}-${Date.now()}.pdf`;
      pdf.save(filename);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      // Save to history
      if (results?.partnerId) {
        saveReview({
          partnerId: String(results.partnerId),
          partnerName,
          scope: results?.scope || "full",
          status: isReadyForPartner ? "ready" : "needs-review",
          errorCount: errors.length,
          warningCount: warnings.length,
          files: {
            trialBalance: "trial-balance.xlsx",
            currentYearAccounts: "accounts.pdf",
          },
        });
      }
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
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              {partnerName} • {new Date().toLocaleDateString()} •{" "}
              {results?.scope || "full"} review
            </p>
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
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Summary
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {results?.message || "Review completed"}
                </p>
                <pre className="mt-4 bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs overflow-x-auto">
                  {JSON.stringify(
                    {
                      partnerId: results?.partnerId,
                      partnerName,
                      scope: results?.scope || "full",
                      status: isReadyForPartner
                        ? "Ready for Partner"
                        : "Review Required",
                      timestamp: new Date().toISOString(),
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
            Review completed at {new Date().toLocaleTimeString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.share?.({
                  title: "AI Review Results",
                  text: `AI Accounts Review - ${partnerName}`,
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
