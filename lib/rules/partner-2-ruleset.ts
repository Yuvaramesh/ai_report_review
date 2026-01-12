import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_2_RULESET: PartnerRuleset = {
  id: 2,
  name: "Partner 2",
  title: "Commercial",
  strictness: "high",
  downgradeErrors: true,
  presentationOnly: ["Subcontractors", "Depreciation grouping"],
  rules: {
    formatting: [
      {
        id: "F1",
        name: "Accounts marked DRAFT",
        category: "query",
        description: "Should be marked DRAFT (warning only)",
        check: (accountsData, trialBalance) => {
          const isDraft = accountsData.status?.toLowerCase().includes("draft");
          if (!isDraft) {
            return {
              id: "Q1",
              category: "query",
              issue: "Accounts not explicitly marked DRAFT",
              location: "All pages",
              evidence: "Add DRAFT watermark for clarity",
            };
          }
          return null;
        },
      },
    ],
    policies: [
      {
        id: "P1",
        name: "Policies generally match prior year",
        category: "query",
        description: "Policy differences trigger query, not error",
        check: (accountsData, trialBalance) => {
          const policiesDiffer = accountsData.policiesDiffer;
          if (policiesDiffer) {
            return {
              id: "Q2",
              category: "query",
              issue: "Accounting policy differs from prior year",
              location: "Accounting policies note",
              evidence: "Explain reason for change",
            };
          }
          return null;
        },
      },
    ],
    tbReconciliation: [
      {
        id: "TB1",
        name: "Core TB reconciliation",
        category: "error",
        description: "Balance sheet must balance",
        check: (accountsData) => {
          const balanceSheetBalances =
            accountsData.balanceSheet?.balances === 0;
          if (!balanceSheetBalances) {
            return {
              id: "E1",
              category: "error",
              issue: "Balance sheet does not balance",
              location: "Balance Sheet",
              action: "Correct to achieve balance",
            };
          }
          return null;
        },
      },
    ],
    pnlPresentation: [
      {
        id: "PNL1",
        name: "Presentation suggestions",
        category: "presentation",
        description: "Suggestions only, not errors",
        check: () => null,
      },
    ],
    balanceSheetLogic: [],
    taxation: [
      {
        id: "TAX1",
        name: "Tax reconciliation",
        category: "error",
        description: "Tax computations must reconcile",
        check: (accountsData) => {
          const taxReconciles = accountsData.tax?.reconciles;
          if (!taxReconciles) {
            return {
              id: "E2",
              category: "error",
              issue: "Tax computations do not reconcile",
              location: "Tax note",
              action: "Correct tax calculation",
            };
          }
          return null;
        },
      },
    ],
    dividends: [],
    disclosures: [],
  },
};
