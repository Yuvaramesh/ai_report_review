"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import FileUploadGate from "@/components/upload/file-upload-gate";
import ReviewFlow from "@/components/review/review-flow";

export default function Home() {
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    trialBalance: null,
    currentYearAccounts: null,
    priorYearAccounts: null,
  });

  if (!uploadComplete) {
    return (
      <>
        <Header />
        <FileUploadGate
          onComplete={(files: any) => {
            setUploadedFiles(files);
            setUploadComplete(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <ReviewFlow uploadedFiles={uploadedFiles} />
    </>
  );
}
