"use client";

import React, { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import PartnerSelection from "./partner-selection";
import ReviewConfiguration from "./review-configuration";
import ReviewResults from "./review-results";

// exported type so Home (or other parents) can reuse it if needed
export type UploadedFiles = {
  trialBalance: File | null;
  currentYearAccounts: File | null;
  priorYearAccounts: File | null;
};

type ReviewFlowProps = {
  uploadedFiles: UploadedFiles;
};

export default function ReviewFlow({ uploadedFiles }: ReviewFlowProps) {
  const [step, setStep] = useState<"partner" | "config" | "results">("partner");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [reviewResults, setReviewResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePartnerSelect = (partner: any) => {
    setSelectedPartner(partner);
    setStep("config");
  };

  // (only the handleReviewRun portion is shown - drop into your existing file)
  const handleReviewRun = async (config: any) => {
    try {
      setError(null);
      setIsLoading(true);

      const formData = new FormData();

      const { trialBalance, currentYearAccounts } = uploadedFiles;

      // Debug logs - open browser console and confirm these values are File objects
      console.log("DEBUG uploadedFiles:", {
        trialBalance,
        currentYearAccounts,
      });
      console.log(
        "trialBalance instanceof File:",
        trialBalance instanceof File
      );
      console.log(
        "currentYearAccounts instanceof File:",
        currentYearAccounts instanceof File
      );
      console.log(
        "trialBalance keys:",
        trialBalance ? Object.keys(trialBalance as any) : null
      );
      console.log(
        "currentYearAccounts keys:",
        currentYearAccounts ? Object.keys(currentYearAccounts as any) : null
      );

      // Validate
      if (!trialBalance || !currentYearAccounts) {
        throw new Error("Trial balance and accounts files are required");
      }

      if (!selectedPartner) {
        throw new Error("Partner selection is required");
      }

      // Helper: convert data:base64 URI to Blob/File
      async function dataUrlToFile(dataUrl: string, filename = "file") {
        // Use fetch to convert data URL to Blob (works in browser)
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
      }

      // Defensive: if client passed a data URL string, convert
      let tbToAppend: File | null = null;
      let acToAppend: File | null = null;

      if (typeof trialBalance === "string") {
        if (trialBalance.startsWith("data:")) {
          tbToAppend = await dataUrlToFile(trialBalance, "trial-balance");
        } else {
          // likely a filename or metadata — can't upload local file from filename only
          throw new Error(
            "Trial balance was not a File. Ensure your uploader passes the actual File object (input.files[0])."
          );
        }
      } else {
        tbToAppend = trialBalance as File;
      }

      if (typeof currentYearAccounts === "string") {
        if (currentYearAccounts.startsWith("data:")) {
          acToAppend = await dataUrlToFile(currentYearAccounts, "accounts");
        } else {
          throw new Error(
            "Accounts was not a File. Ensure your uploader passes the actual File object (input.files[0])."
          );
        }
      } else {
        acToAppend = currentYearAccounts as File;
      }

      formData.append("accountsFile", acToAppend as File);
      formData.append("trialBalanceFile", tbToAppend as File);
      formData.append(
        "partnerId",
        String(selectedPartner.id ?? selectedPartner)
      );
      formData.append("scope", config?.scope ?? "");

      const response = await fetch("/api/review", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to run review";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const results = await response.json();

      const normalized = {
        ...results,
        errors: Array.isArray(results?.errors) ? results.errors : [],
      };
      setReviewResults(normalized);
      setStep("results");
    } catch (err) {
      console.error("[v0] Review error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to run review. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border-2 border-error bg-error-light p-8 space-y-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-error">
                  Error Running Review
                </h2>
                <p className="text-sm text-error/80 mt-2">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="w-full btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex">
            <Loader className="h-12 w-12 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Running AI Review
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Parsing documents and running validations... This may take 30-60
            seconds.
          </p>
        </div>
      </main>
    );
  }

  if (step === "partner") {
    return <PartnerSelection onSelect={handlePartnerSelect} />;
  }

  if (step === "config") {
    return (
      <ReviewConfiguration
        partner={selectedPartner}
        onRun={handleReviewRun}
        onBack={() => setStep("partner")}
      />
    );
  }

  if (step === "results") {
    return (
      <ReviewResults
        results={reviewResults}
        onReset={() => {
          setStep("partner");
          setSelectedPartner(null);
          setReviewResults(null);
        }}
      />
    );
  }

  // fallback (shouldn't happen)
  return null;
}
