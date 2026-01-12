import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_5_RULESET: PartnerRuleset = {
  id: 5,
  name: "Partner 5",
  title: "Presentation & Consistency",
  strictness: "medium",
  downgradeErrors: true,
  presentationOnly: ["Stock lines", "Headings"],
  rules: {
    formatting: [],
    policies: [],
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
    pnlPresentation: [
      {
        id: "PNL1",
        name: "Presentation consistency",
        category: "presentation",
        description:
          "Headings and order should be consistent with comparatives",
        check: (accountsData) => {
          const headingsConsistent = accountsData.pnl?.headings?.length > 0;
          if (!headingsConsistent) {
            return {
              id: "P1",
              category: "presentation",
              issue: "P&L headings not standardized",
              location: "P&L",
              suggestion: "Ensure consistent heading order with prior year",
            };
          }
          return null;
        },
      },
    ],
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
