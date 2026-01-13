"use client";

import { useState } from "react";

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

  const errors = Array.isArray(results?.errors) ? results!.errors : [];
  const warnings = Array.isArray(results?.warnings) ? results!.warnings : [];

  const isReadyForPartner = errors.length === 0;

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

      pdf.save(`ai-review-${Date.now()}.pdf`);
    } catch (err) {
      console.error("[v0] Export error:", err);
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Review Results</h1>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              aria-label="Start a new review"
            >
              New Review
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </header>

        <div id="pdf-content" className="space-y-6">
          <section className="rounded-lg border p-4 bg-white">
            <h2 className="font-medium text-lg mb-2">Summary</h2>
            <p className="text-sm text-neutral-600 mt-2">
              {results?.message ?? "No summary available."}
            </p>
            <pre className="mt-4 overflow-auto text-xs bg-neutral-50 p-3 rounded border">
              {JSON.stringify(
                {
                  partnerId: results?.partnerId ?? null,
                  scope: results?.scope ?? null,
                  status: isReadyForPartner
                    ? "Ready for Partner"
                    : "Review Required",
                },
                null,
                2
              )}
            </pre>
          </section>

          <section className="rounded-lg border p-4 bg-white">
            <h2 className="font-medium text-lg mb-4">Findings</h2>

            {errors.length === 0 && warnings.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-800">
                  ✓ No issues found. This file is ready for partner review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-700 mb-2">
                      Errors ({errors.length})
                    </h3>
                    <ul className="space-y-2">
                      {errors.map((err, idx) => (
                        <li
                          key={idx}
                          className="text-sm bg-red-50 border border-red-200 rounded p-2 text-red-800"
                        >
                          •{" "}
                          {typeof err === "string"
                            ? err
                            : err?.message || JSON.stringify(err)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div>
                    <h3 className="font-medium text-yellow-700 mb-2">
                      Warnings ({warnings.length})
                    </h3>
                    <ul className="space-y-2">
                      {warnings.map((w, idx) => (
                        <li
                          key={idx}
                          className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800"
                        >
                          •{" "}
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
          </section>

          {results?.parsed && (
            <section className="rounded-lg border p-4 bg-white">
              <h2 className="font-medium text-lg mb-2">Parsed Data</h2>
              <pre className="overflow-auto text-xs bg-neutral-50 p-3 rounded border max-h-64">
                {JSON.stringify(results.parsed, null, 2)}
              </pre>
            </section>
          )}
        </div>

        <footer className="flex justify-end gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-50"
          >
            Back to Upload
          </button>
        </footer>
      </div>
    </main>
  );
}
