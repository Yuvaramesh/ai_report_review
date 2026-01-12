export interface UploadedFiles {
  trialBalance: {
    name: string;
    size: number;
    type: string;
  } | null;
  currentYearAccounts: {
    name: string;
    size: number;
    type: string;
  } | null;
  priorYearAccounts: {
    name: string;
    size: number;
    type: string;
  } | null;
}

export interface ReviewError {
  id: string;
  category: "error";
  issue: string;
  location: string;
  tbRef: string;
  action: string;
  severity: "critical" | "high" | "medium";
}

export interface ReviewQuery {
  id: string;
  category: "query";
  query: string;
  location: string;
  evidence: string;
  severity: "high" | "medium" | "low";
}

export interface PresentationItem {
  id: string;
  category: "presentation";
  item: string;
  location: string;
  suggestion: string;
}

export type ReviewFinding = ReviewError | ReviewQuery | PresentationItem;

export interface ReviewResults {
  partner: {
    id: number;
    name: string;
    title: string;
  };
  config: {
    scope: "full" | "tax" | "presentation";
  };
  errors: ReviewError[];
  queries: ReviewQuery[];
  presentation: PresentationItem[];
  timestamp: string;
  totalFindings: number;
}

export interface PartnerRuleset {
  id: number;
  name: string;
  title: string;
  strictness:
    | "maximum"
    | "high"
    | "medium-high"
    | "medium"
    | "medium-light"
    | "light";
  rules: {
    formatting: ValidationRule[];
    policies: ValidationRule[];
    tbReconciliation: ValidationRule[];
    pnlPresentation: ValidationRule[];
    balanceSheetLogic: ValidationRule[];
    taxation: ValidationRule[];
    dividends: ValidationRule[];
    disclosures: ValidationRule[];
  };
  downgradeErrors: boolean;
  presentationOnly: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  category: "error" | "query" | "presentation";
  description: string;
  check: (accountsData: any, trialBalance: any) => ValidationResult | null;
}

export interface ValidationResult {
  id: string;
  category: "error" | "query" | "presentation";
  issue: string;
  location: string;
  tbRef?: string;
  action?: string;
  evidence?: string;
  suggestion?: string;
}
