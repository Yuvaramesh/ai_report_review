import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_6_RULESET: PartnerRuleset = {
  id: 6,
  name: "Partner 6",
  title: "Light Touch",
  strictness: "light",
  downgradeErrors: true,
  presentationOnly: ["Formatting", "Presentation", "Headings", "Stock lines"],
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
