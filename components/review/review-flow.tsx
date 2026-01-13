"use client";

import React, { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import PartnerSelection from "./partner-selection";
import ReviewConfiguration from "./review-configuration";
import ReviewResults from "./review-results";

// exported type so parent and uploader share the same shape
export type UploadedFiles = {
  trialBalance: File | string | null; // allow string temporarily (we will recover) but prefer File
  currentYearAccounts: File | string | null;
  priorYearAccounts?: File | string | null;
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

  // helper: convert data url to File in browser
  async function dataUrlToFile(dataUrl: string, filename = "file") {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  }

  // helper: try recover a File from several shapes (File, data URL, JSON envelope, base64)
  async function recoverFile(
    value: any,
    fallbackName: string
  ): Promise<File | null> {
    if (!value) return null;
    // Already a File from input.files[0]
    if (typeof File !== "undefined" && value instanceof File)
      return value as File;

    // If value is a Blob
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return new File([value], fallbackName, {
        type: (value as any).type || "application/octet-stream",
      });
    }

    // If string data:
    if (typeof value === "string") {
      // Data URL (data:...;base64,...)
      if (value.startsWith("data:")) {
        return await dataUrlToFile(value, fallbackName);
      }

      // JSON-stringified envelope
      try {
        const parsed = JSON.parse(value);
        return await recoverFile(parsed, fallbackName);
      } catch {
        // not JSON, maybe plain string (filename) -> cannot recover
        return null;
      }
    }

    // If object with .data (data URL) or .content (base64)
    if (typeof value === "object") {
      if (
        value.data &&
        typeof value.data === "string" &&
        value.data.startsWith("data:")
      ) {
        return await dataUrlToFile(value.data, value.name || fallbackName);
      }
      if (value.content && typeof value.content === "string") {
        // assume base64
        const base64 = value.content.replace(/^data:.*;base64,/, "");
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new File([arr], value.name || fallbackName, {
          type: value.type || "application/octet-stream",
        });
      }
    }

    return null;
  }

  const handleReviewRun = async (config: any) => {
    try {
      setError(null);
      setIsLoading(true);

      // Debug logs to browser console
      console.log("DEBUG uploadedFiles (browser):", uploadedFiles);
      console.log(
        "trialBalance instanceof File:",
        uploadedFiles.trialBalance instanceof File
      );
      console.log(
        "currentYearAccounts instanceof File:",
        uploadedFiles.currentYearAccounts instanceof File
      );
      console.log("trialBalance value:", uploadedFiles.trialBalance);
      console.log(
        "currentYearAccounts value:",
        uploadedFiles.currentYearAccounts
      );

      // Recover Files (convert data URLs / envelopes if necessary)
      const acFile = await recoverFile(
        uploadedFiles.currentYearAccounts,
        "accounts.pdf"
      );
      const tbFile = await recoverFile(
        uploadedFiles.trialBalance,
        "trial-balance.pdf"
      );

      if (!acFile || !tbFile) {
        throw new Error(
          "Trial balance and accounts files must be provided as actual File objects. Ensure your uploader stores input.files[0] in state."
        );
      }

      if (!selectedPartner) {
        throw new Error("Partner selection is required");
      }

      const formData = new FormData();
      formData.append("accountsFile", acFile);
      formData.append("trialBalanceFile", tbFile);
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
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-8 space-y-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-red-600">
                  Error Running Review
                </h2>
                <p className="text-sm text-red-700 mt-2">{error}</p>
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex">
            <Loader className="h-12 w-12 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Running AI Review</h2>
          <p className="text-neutral-600">
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

  return null;
}
