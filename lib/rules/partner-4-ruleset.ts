import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_4_RULESET: PartnerRuleset = {
  id: 4,
  name: "Partner 4",
  title: "Client-Friendly",
  strictness: "medium",
  downgradeErrors: true,
  presentationOnly: [
    "Subcontractors heading",
    "Depreciation grouping",
    "Debtors classification",
  ],
  rules: {
    formatting: [],
    policies: [
      {
        id: "P1",
        name: "Material policy changes",
        category: "query",
        description: "Only material policy changes trigger queries",
        check: (accountsData, trialBalance) => {
          const policiesDiffer = accountsData.policiesDiffer;
          if (policiesDiffer) {
            return {
              id: "Q1",
              category: "query",
              issue: "Accounting policy has changed from prior year",
              location: "Accounting policies note",
              evidence: "Provide explanation for change",
            };
          }
          return null;
        },
      },
    ],
    tbReconciliation: [
      {
        id: "TB1",
        name: "Balance sheet balance",
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
    pnlPresentation: [],
    balanceSheetLogic: [],
    taxation: [
      {
        id: "TAX1",
        name: "Tax reconciles",
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
