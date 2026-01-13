export interface StoredReview {
  _id?: string;
  reviewId: string;
  partnerId: string | number;
  partnerName: string;
  profileType: string;
  scope: string;
  status: "ready" | "needs-review" | "error";
  errorCount: number;
  warningCount: number;
  errors: any[];
  warnings: any[];
  uploadedFileNames: {
    trialBalance: string;
    currentYearAccounts: string;
    priorYearAccounts?: string;
  };
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface ReviewHistory {
  _id?: string;
  reviewId: string;
  partnerId: string | number;
  timestamp: string;
  status: "ready" | "needs-review" | "error";
  errorCount: number;
  warningCount: number;
  createdAt: Date;
}
