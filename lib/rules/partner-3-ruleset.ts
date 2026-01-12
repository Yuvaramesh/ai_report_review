import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_3_RULESET: PartnerRuleset = {
  id: 3,
  name: "Partner 3",
  title: "Tax-Focused",
  strictness: "high",
  downgradeErrors: true,
  presentationOnly: ["Subcontractors heading"],
  rules: {
    formatting: [
      {
        id: "F1",
        name: "DRAFT status preferred",
        category: "query",
        description: "DRAFT marking is a query, not an error",
        check: (accountsData) => {
          const isDraft = accountsData.status?.toLowerCase().includes("draft");
          if (!isDraft) {
            return {
              id: "Q1",
              category: "query",
              issue: "Accounts not marked DRAFT",
              location: "All pages",
              evidence: "Add DRAFT watermark",
            };
          }
          return null;
        },
      },
    ],
    policies: [
      {
        id: "P1",
        name: "Tax-critical policies",
        category: "error",
        description: "Only tax-critical policy issues are errors",
        check: (accountsData) => {
          const criticalPolicies = ["Tax basis", "Depreciation rates"];
          const hasCriticalIssue = criticalPolicies.some((p) =>
            accountsData.policies?.some((pol: any) => pol.includes(p))
          );
          if (hasCriticalIssue && accountsData.policiesDiffer) {
            return {
              id: "E1",
              category: "error",
              issue: "Critical tax policy differs from prior year",
              location: "Accounting policies",
              action: "Align with prior year",
            };
          }
          return null;
        },
      },
    ],
    tbReconciliation: [
      {
        id: "TB1",
        name: "TB to tax reconciliation",
        category: "error",
        description: "Trial balance must reconcile to tax computation",
        check: (accountsData, trialBalance) => {
          const taxReconciles = accountsData.tax?.reconciles;
          if (!taxReconciles) {
            return {
              id: "E2",
              category: "error",
              issue: "TB does not reconcile to tax computation",
              location: "Tax working papers",
              action: "Correct TB entries to match tax computation",
            };
          }
          return null;
        },
      },
    ],
    pnlPresentation: [
      {
        id: "PNL1",
        name: "Tax-relevant presentation",
        category: "query",
        description: "Presentation issues are queries only",
        check: () => null,
      },
    ],
    balanceSheetLogic: [
      {
        id: "BS1",
        name: "Deferred tax position",
        category: "error",
        description: "DT must be correctly computed and disclosed",
        check: (accountsData) => {
          const dtCharge = accountsData.tax?.deferredTax;
          if (dtCharge === undefined || dtCharge === null) {
            return {
              id: "E3",
              category: "error",
              issue: "Deferred tax not disclosed",
              location: "Tax note",
              action: "Calculate and disclose DT",
            };
          }
          return null;
        },
      },
    ],
    taxation: [
      {
        id: "TAX1",
        name: "Corporation tax computation",
        category: "error",
        description: "CT must be correctly computed",
        check: (accountsData) => {
          const ctCharge = accountsData.tax?.corporationTax;
          if (ctCharge % 1 !== 0) {
            return {
              id: "E4",
              category: "error",
              issue: "Corporation tax not in whole pounds",
              location: "P&L tax note",
              action: "Round to whole pounds",
            };
          }
          return null;
        },
      },
      {
        id: "TAX2",
        name: "Profit before tax reconciliation",
        category: "error",
        description: "PBT must reconcile between accounts and tax note",
        check: (accountsData) => {
          const pbtNote = accountsData.tax?.profitBeforeTaxNote;
          const pbtPnL = accountsData.pnl?.profitBeforeTax;
          if (pbtNote !== pbtPnL) {
            return {
              id: "E5",
              category: "error",
              issue: "Profit before tax does not reconcile",
              location: "P&L and tax note",
              action: "Correct to achieve reconciliation",
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
