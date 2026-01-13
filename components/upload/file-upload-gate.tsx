"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { UploadedFiles } from "../review/review-flow";
import { UploadCloud } from "lucide-react";

type Props = {
  onComplete: (files: UploadedFiles) => void;
};

function DropZone({
  label,
  accept,
  file,
  onFile,
  hint,
}: {
  label: string;
  accept?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  hint?: string;
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

            {/* Hidden native input (one per DropZone) */}
            <input
              ref={inputRef}
              aria-label={`Upload ${label}`}
              type="file"
              accept={accept}
              onChange={onFileChange}
              className="hidden"
            />

            {/* Button triggers native input.click() via ref */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
              >
                {file ? "Replace file" : "Choose file"}
              </button>
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

  const canContinue = !!trialBalanceFile && !!currentYearAccountsFile;

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Upload Account Documents</h1>
          <p className="mt-3 text-neutral-600">
            Prepare your accounts for AI-powered pre-partner review. All three
            documents are required.
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
            hint="Excel (.xlsx, .xls)"
            accept=".xlsx,.xls,.csv"
            file={trialBalanceFile}
            onFile={setTrialBalanceFile}
          />

          <DropZone
            label="Current Year Accounts"
            hint="PDF or Word (.pdf, .docx, .doc)"
            accept=".pdf,.docx,.doc"
            file={currentYearAccountsFile}
            onFile={setCurrentYearAccountsFile}
          />

          <DropZone
            label="Prior Year Accounts"
            hint="PDF or Word (.pdf, .docx, .doc)"
            accept=".pdf,.docx,.doc"
            file={priorYearAccountsFile}
            onFile={setPriorYearAccountsFile}
          />

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                i
              </div>
              <div className="text-sm text-neutral-700">
                Files are processed securely.{" "}
                <strong>For best results with PDFs:</strong> Use native PDFs
                (not scanned/photographed images). Scanned PDFs will have
                limited text extraction accuracy.
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={!canContinue}
              className={`w-1/2 py-3 rounded text-white ${
                canContinue
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-200 cursor-not-allowed"
              }`}
            >
              Upload All Documents to Continue
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
