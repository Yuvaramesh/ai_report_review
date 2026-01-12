"use client";

import React, { useState } from "react";

type ReviewResultShape = {
  errors?: Array<any>;
  summary?: Record<string, any>;
  partnerId?: string | number | null;
  scope?: string | null;
  message?: string;
  // allow any other fields returned by the API
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

  // Defensive: normalize errors to an array so UI logic never throws
  const errors = Array.isArray(results?.errors) ? results!.errors : [];

  const isReadyForPartner = errors.length === 0;

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      // example: call an API endpoint to create a PDF from the review results
      // adapt to your real export flow
      const resp = await fetch("/api/export-review-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-review-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
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
              className="btn-secondary"
              aria-label="Start a new review"
            >
              New Review
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-primary"
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </header>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Summary</h2>
          <p className="text-sm text-muted mt-2">
            {results?.message ?? "No summary available from server."}
          </p>
          <pre className="mt-4 overflow-auto text-xs bg-neutral-50 p-3 rounded">
            {JSON.stringify(
              results?.summary ?? {
                partnerId: results?.partnerId ?? null,
                scope: results?.scope ?? null,
              },
              null,
              2
            )}
          </pre>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Errors & Warnings</h2>

          {errors.length === 0 ? (
            <p className="text-sm text-success mt-2">
              No issues found. This file looks ready for partner review.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 list-disc pl-5">
              {errors.map((err, idx) => (
                <li key={idx} className="text-sm text-neutral-800">
                  {typeof err === "string" ? err : JSON.stringify(err)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex justify-end">
          <button onClick={onReset} className="btn-ghost">
            Back
          </button>
        </footer>
      </div>
    </main>
  );
}
