"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import PartnerRulesDisplay from "./partner-rules-display";
import type { UploadedFiles } from "./review-flow";

interface ReviewConfigurationProps {
  partner: any;
  uploadedFiles?: UploadedFiles;
  onRun: (config: any) => void;
  onBack: () => void;
}

export default function ReviewConfiguration({
  partner,
  uploadedFiles,
  onRun,
  onBack,
}: ReviewConfigurationProps) {
  const [scope, setScope] = useState("full");
  const [confirmed, setConfirmed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const scopeOptions = [
    {
      value: "full",
      label: "Full Review",
      description:
        "All validation checks including tax, presentation, and disclosures",
      recommended: true,
    },
    {
      value: "tax",
      label: "Tax-Focused Only",
      description: "Tax computations and reconciliation only",
    },
    {
      value: "presentation",
      label: "Presentation & Consistency",
      description: "Formatting, headings, and comparatives only",
    },
  ];

  const handleRun = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onRun({ scope });
    setIsRunning(false);
  };

  const trialBalanceName =
    (uploadedFiles?.trialBalance as any)?.name || "Trial Balance";
  const accountsName =
    (uploadedFiles?.currentYearAccounts as any)?.name ||
    "Current Year Accounts";

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary hover:opacity-80 font-semibold transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Partner Selection
          </button>

          {/* Partner Rules Display */}
          <PartnerRulesDisplay partnerId={partner?.id} scope={scope} />

          {/* Main Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 overflow-hidden">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-gradient-to-r from-primary/5 to-transparent p-8 dark:border-neutral-800">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                Review Configuration
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Partner:{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {partner.name} – {partner.title}
                </span>
              </p>

              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-1 text-sm">
                <p className="text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Files uploaded:</span>
                </p>
                <ul className="ml-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• {trialBalanceName}</li>
                  <li>• {accountsName}</li>
                </ul>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Scope Selection */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Review Scope
                </h3>

                <div className="space-y-3">
                  {scopeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        scope === option.value
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-neutral-200 hover:border-primary/50 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        value={option.value}
                        checked={scope === option.value}
                        onChange={(e) => setScope(e.target.value)}
                        className="mt-1 h-5 w-5 cursor-pointer accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {option.label}
                          </p>
                          {option.recommended && (
                            <span className="badge badge-primary text-xs">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {scope === option.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Confirmation */}
              <div className="border-t border-neutral-200 pt-8 dark:border-neutral-800">
                <div className="flex items-start gap-4 rounded-xl bg-warning/5 border border-warning/20 p-4 mb-6 dark:bg-warning/10">
                  <ShieldAlert className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-warning dark:text-warning">
                      Important Confirmation
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                      Please confirm these conditions before running the review.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-primary cursor-pointer"
                  />
                  <div className="space-y-3 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      I confirm:
                    </p>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Accounts are marked as DRAFT
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        This is a pre-partner review only
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        AI will not amend figures or post journals
                      </li>
                    </ul>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRun}
            disabled={!confirmed || isRunning}
            className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <span className="animate-spin">◌</span>
                Running Review (30-60 seconds)
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Run AI Review
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
