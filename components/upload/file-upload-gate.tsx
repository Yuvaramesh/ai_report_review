"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  Shield,
} from "lucide-react";
import StepIndicator from "./step-indicator";

interface FileUploadGateProps {
  onComplete: (files: Record<string, any>) => void;
}

export default function FileUploadGate({ onComplete }: FileUploadGateProps) {
  const [files, setFiles] = useState<Record<string, any>>({
    trialBalance: null,
    currentYearAccounts: null,
    priorYearAccounts: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const fileRequirements = [
    {
      key: "trialBalance",
      label: "Trial Balance",
      format: "Excel (.xlsx, .xls)",
      icon: FileText,
      required: true,
    },
    {
      key: "currentYearAccounts",
      label: "Current Year Accounts",
      format: "PDF or Word (.pdf, .docx, .doc)",
      icon: FileText,
      required: true,
    },
    {
      key: "priorYearAccounts",
      label: "Prior Year Accounts",
      format: "PDF or Word (.pdf, .docx, .doc)",
      icon: FileText,
      required: true,
    },
  ];

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(key, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (key: string, file: File) => {
    const newErrors = { ...errors };
    delete newErrors[key];

    setFiles((prev) => ({
      ...prev,
      [key]: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    }));

    setErrors(newErrors);
  };

  const handleInputChange = (key: string, event: any) => {
    if (event.target.files?.[0]) {
      handleFileSelect(key, event.target.files[0]);
    }
  };

  const isAllComplete = Object.values(files).every((f) => f !== null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white">
              Upload Account Documents
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Prepare your accounts for AI-powered pre-partner review. All three
              documents are required.
            </p>
          </div>

          {/* Upload Sections */}
          <div className="space-y-6">
            {fileRequirements.map((req, idx) => (
              <div key={req.key} className="group space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StepIndicator number={idx + 1} />
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {req.label}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {req.format}
                      </p>
                    </div>
                  </div>
                  {files[req.key] && (
                    <div className="animate-in fade-in">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  )}
                </div>

                <label
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, req.key)}
                  className={`block cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-300 ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : files[req.key]
                      ? "border-success bg-success-light/20 hover:border-success hover:bg-success-light/30"
                      : "border-neutral-300 hover:border-primary hover:bg-primary/5 dark:border-neutral-700"
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleInputChange(req.key, e)}
                  />

                  {files[req.key] ? (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                        <FileText className="h-6 w-6 text-success" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-success">
                          {files[req.key].name}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {(files[req.key].size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <Upload className="h-6 w-6 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          Drop file here or click to upload
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Maximum file size: 50 MB
                        </p>
                      </div>
                    </div>
                  )}
                </label>

                {errors[req.key] && (
                  <div className="flex gap-2 rounded-lg bg-error-light p-3 text-sm text-error border border-error/30 dark:bg-error/10 dark:border-error/30">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{errors[req.key]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 dark:bg-primary/5 dark:border-primary/20">
            <div className="flex gap-3 w-full">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary dark:text-primary">
                  Security & Privacy
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Files are processed securely with enterprise-grade encryption.
                  Your data is never stored after the review is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => isAllComplete && onComplete(files)}
            disabled={!isAllComplete}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAllComplete
              ? "Continue to Partner Selection"
              : "Upload All Documents to Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
