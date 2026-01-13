"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { UploadedFiles } from "../review/review-flow";
import { UploadCloud, Eye } from "lucide-react";
import DocumentPreview from "./document-preview";

type Props = {
  onComplete: (files: UploadedFiles) => void;
};

function DropZone({
  label,
  accept,
  file,
  onFile,
  hint,
  onPreview,
}: {
  label: string;
  accept?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  hint?: string;
  onPreview?: (f: File) => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsOver(false);
      const f = e.dataTransfer.files?.[0] ?? null;
      if (f) onFile(f);
    },
    [onFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.currentTarget.files?.[0] ?? null;
    onFile(f);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
          •
        </div>
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {hint && <div className="text-xs text-neutral-500">{hint}</div>}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        className={`border-2 rounded-lg p-8 text-center transition-colors ${
          isOver
            ? "border-blue-400 bg-blue-50"
            : "border-dashed border-neutral-300 bg-white"
        }`}
        style={{ minHeight: 120 }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="rounded-full bg-neutral-100 p-3">
              <UploadCloud className="h-6 w-6 text-neutral-400" />
            </div>
            <div className="text-sm text-neutral-600">
              {file ? (
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium">
                    Drop file here or click to upload
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Maximum file size: 50 MB
                  </div>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              aria-label={`Upload ${label}`}
              type="file"
              accept={accept}
              onChange={onFileChange}
              className="hidden"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                {file ? "Replace file" : "Choose file"}
              </button>
              {file && onPreview && (
                <button
                  type="button"
                  onClick={() => onPreview(file)}
                  className="px-4 py-2 rounded border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FileUploadGate({ onComplete }: Props) {
  const [trialBalanceFile, setTrialBalanceFile] = useState<File | null>(null);
  const [currentYearAccountsFile, setCurrentYearAccountsFile] =
    useState<File | null>(null);
  const [priorYearAccountsFile, setPriorYearAccountsFile] =
    useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const canContinue = !!trialBalanceFile && !!currentYearAccountsFile;

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Upload Account Documents
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Prepare your accounts for AI-powered pre-partner review. Trial
            Balance and Current Year Accounts are required.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canContinue) {
              alert(
                "Please upload the required files (Trial Balance and Current Year Accounts)."
              );
              return;
            }
            onComplete({
              trialBalance: trialBalanceFile,
              currentYearAccounts: currentYearAccountsFile,
              priorYearAccounts: priorYearAccountsFile ?? null,
            });
          }}
        >
          <DropZone
            label="Trial Balance"
            hint="Excel (.xlsx, .xls, .csv)"
            accept=".xlsx,.xls,.csv"
            file={trialBalanceFile}
            onFile={setTrialBalanceFile}
            onPreview={setPreviewFile}
          />

          <DropZone
            label="Current Year Accounts"
            hint="PDF or Word (.pdf, .docx, .doc)"
            accept=".pdf,.docx,.doc"
            file={currentYearAccountsFile}
            onFile={setCurrentYearAccountsFile}
            onPreview={setPreviewFile}
          />

          <DropZone
            label="Prior Year Accounts (Optional)"
            hint="PDF or Word (.pdf, .docx, .doc)"
            accept=".pdf,.docx,.doc"
            file={priorYearAccountsFile}
            onFile={setPriorYearAccountsFile}
            onPreview={setPreviewFile}
          />

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                i
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                Files are processed securely.{" "}
                <strong>For best results with PDFs:</strong> Use native PDFs
                (not scanned/photographed images).
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={!canContinue}
              className={`w-full md:w-1/2 py-3 rounded-lg font-semibold transition-colors ${
                canContinue
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-not-allowed"
              }`}
            >
              Continue to Partner Selection
            </button>
          </div>
        </form>
      </div>

      <DocumentPreview
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </main>
  );
}
