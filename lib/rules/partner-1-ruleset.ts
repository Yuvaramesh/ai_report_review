import type { PartnerRuleset } from "@/lib/types/review";

export const PARTNER_1_RULESET: PartnerRuleset = {
  id: 1,
  name: "Partner 1",
  title: "Strict Benchmark",
  strictness: "maximum",
  downgradeErrors: false,
  presentationOnly: [],
  rules: {
    formatting: [
      {
        id: "F1",
        name: "Accounts marked DRAFT",
        category: "error",
        description: "Accounts must be clearly marked as DRAFT",
        check: (accountsData) => {
          const isDraft = accountsData.status?.toLowerCase().includes("draft");
          if (!isDraft) {
            return {
              id: "E1",
              category: "error",
              issue: "Accounts not marked DRAFT",
              location: "All pages",
              action: "Add DRAFT watermark to all pages",
            };
          }
          return null;
        },
      },
      {
        id: "F2",
        name: "Directors' Responsibilities Statement must be absent",
        category: "error",
        description: "Must not include Directors' Responsibilities Statement",
        check: (accountsData) => {
          const hasDirectorsStatement = accountsData.sections?.some((s: any) =>
            s.title?.includes("Directors' Responsibilities")
          );
          if (hasDirectorsStatement) {
            return {
              id: "E2",
              category: "error",
              issue: "Directors' Responsibilities Statement present",
              location: "Accounts document",
              action: "Remove Directors' Responsibilities Statement",
            };
          }
          return null;
        },
      },
      {
        id: "F3",
        name: "Correct accountant details",
        category: "error",
        description: "Must show BBK Partnership Limited, Potters Bar",
        check: (accountsData) => {
          const hasCorrectName = accountsData.accountantName?.includes(
            "BBK Partnership Limited"
          );
          const hasCorrectAddress =
            accountsData.accountantAddress?.includes("Potters Bar");
          if (!hasCorrectName || !hasCorrectAddress) {
            return {
              id: "E3",
              category: "error",
              issue: "Incorrect accountant details",
              location: "Accounts header",
              action: "Update to: BBK Partnership Limited, Potters Bar",
            };
          }
          return null;
        },
      },
    ],
    policies: [
      {
        id: "P1",
        name: "Policies match prior year",
        category: "error",
        description: "Accounting policies must match prior year exactly",
        check: (accountsData, trialBalance) => {
          const policiesDiffer = accountsData.policiesDiffer;
          if (policiesDiffer) {
            return {
              id: "E4",
              category: "error",
              issue: "Accounting policies differ from prior year",
              location: "Accounting policies note",
              action:
                "Align policies with prior year or obtain partner approval",
            };
          }
          return null;
        },
      },
      {
        id: "P2",
        name: "Prohibited policies absent",
        category: "error",
        description:
          "Must not include Rendering of Services or Government Grants policies",
        check: (accountsData) => {
          const prohibitedPolicies = [
            "Rendering of Services",
            "Government Grants",
          ];
          const hasProhibited = prohibitedPolicies.some((p) =>
            accountsData.policies?.some((policy: any) => policy.includes(p))
          );
          if (hasProhibited) {
            return {
              id: "E5",
              category: "error",
              issue: "Prohibited accounting policy present",
              location: "Accounting policies note",
              action: "Remove prohibited policy",
            };
          }
          return null;
        },
      },
    ],
    tbReconciliation: [
      {
        id: "TB1",
        name: "Closing stock reconciliation",
        category: "error",
        description: "Closing stock must equal £19,045 from trial balance",
        check: (accountsData, trialBalance) => {
          const requiredValue = 19045;
          const closingStock = trialBalance?.closingStock;
          if (closingStock !== requiredValue) {
            return {
              id: "E6",
              category: "error",
              issue: `Closing stock does not match TB (£${requiredValue})`,
              location: "Trading P&L – p14",
              tbRef: "Nom 1930",
              action: `Amend closing stock to £${requiredValue}`,
            };
          }
          return null;
        },
      },
      {
        id: "TB2",
        name: "Net wages not in debtors",
        category: "error",
        description: "Net wages must not appear in debtors",
        check: (accountsData, trialBalance) => {
          const hasNetWagesInDebtors =
            trialBalance?.debtors?.includes("net wages");
          if (hasNetWagesInDebtors) {
            return {
              id: "E7",
              category: "error",
              issue: "Net wages included in debtors",
              location: "Balance Sheet – p8",
              tbRef: "Nom 4400",
              action: "Write off to wages",
            };
          }
          return null;
        },
      },
      {
        id: "TB3",
        name: "Insurance claim not in P&L",
        category: "error",
        description: "Insurance claims must not appear in P&L",
        check: (accountsData, trialBalance) => {
          const hasInsuranceInPnL =
            accountsData.pnl?.expenses?.includes("Insurance claim");
          if (hasInsuranceInPnL) {
            return {
              id: "E8",
              category: "error",
              issue: "Insurance claim in P&L",
              location: "P&L",
              action: "Net to directors current account",
            };
          }
          return null;
        },
      },
      {
        id: "TB4",
        name: "Accountancy fee amount",
        category: "error",
        description: "Accountancy fee must equal £2,250",
        check: (accountsData, trialBalance) => {
          const requiredFee = 2250;
          const accountancyFee = trialBalance?.accountancyFee;
          if (accountancyFee !== requiredFee) {
            return {
              id: "E9",
              category: "error",
              issue: `Accountancy fee does not match (£${requiredFee})`,
              location: "P&L",
              tbRef: "Nom 7001",
              action: `Correct to £${requiredFee}`,
            };
          }
          return null;
        },
      },
    ],
    pnlPresentation: [
      {
        id: "PNL1",
        name: "Stock lines compliant",
        category: "error",
        description: "Only 'Opening stock' and 'Closing stock' allowed",
        check: (accountsData) => {
          const allowedLines = ["Opening stock", "Closing stock"];
          const prohibitedLines = ["Finished goods"];
          const hasForbiddenLine = accountsData.pnl?.stockLines?.some(
            (line: any) => prohibitedLines.some((p) => line.includes(p))
          );
          if (hasForbiddenLine) {
            return {
              id: "E10",
              category: "error",
              issue: "Prohibited stock line present",
              location: "P&L – stock section",
              action: "Remove prohibited stock line",
            };
          }
          return null;
        },
      },
      {
        id: "PNL2",
        name: "Depreciation separate",
        category: "error",
        description: "Depreciation must be shown separately",
        check: (accountsData) => {
          const hasDepreciation = accountsData.pnl?.depreciation?.isSeparate;
          if (!hasDepreciation) {
            return {
              id: "E11",
              category: "error",
              issue: "Depreciation not shown separately",
              location: "P&L",
              action: "Separate depreciation from admin costs",
            };
          }
          return null;
        },
      },
      {
        id: "PNL3",
        name: "Subcontractors heading replacement",
        category: "presentation",
        description: "Replace 'Subcontractors' with 'Fees payable'",
        check: (accountsData) => {
          const hasSubcontractorsHeading =
            accountsData.pnl?.headings?.includes("Subcontractors");
          if (hasSubcontractorsHeading) {
            return {
              id: "P1",
              category: "presentation",
              issue: '"Subcontractors" heading used',
              location: "P&L – p14",
              suggestion: "Rename to Fees payable",
            };
          }
          return null;
        },
      },
    ],
    balanceSheetLogic: [
      {
        id: "BS1",
        name: "Fixed assets classification",
        category: "error",
        description: "Land and property not allowed; use 'Short leasehold'",
        check: (accountsData) => {
          const hasLandProperty =
            accountsData.balanceSheet?.fixedAssets?.includes(
              "Land and Property"
            );
          if (hasLandProperty) {
            return {
              id: "E12",
              category: "error",
              issue: "Land and Property classified incorrectly",
              location: "Balance Sheet – p8",
              action: "Reclassify as Short leasehold",
            };
          }
          return null;
        },
      },
      {
        id: "BS2",
        name: "HP breakdown required",
        category: "error",
        description: "Hire purchase must show full breakdown",
        check: (accountsData) => {
          const hasHPBreakdown =
            accountsData.balanceSheet?.hirePerchase?.hasBreakdown;
          if (!hasHPBreakdown) {
            return {
              id: "E13",
              category: "error",
              issue: "Hire purchase lacks full breakdown",
              location: "Balance Sheet notes",
              action: "Provide complete HP breakdown by asset",
            };
          }
          return null;
        },
      },
      {
        id: "BS3",
        name: "Debtors classification",
        category: "error",
        description: "Prepayments must be separate; net wages not allowed",
        check: (accountsData) => {
          const debtorsData = accountsData.balanceSheet?.debtors;
          const hasNetWages = debtorsData?.includes("net wages");
          const hasPrepayments = debtorsData?.includes("Prepayments");
          if (hasNetWages || !hasPrepayments) {
            return {
              id: "E14",
              category: "error",
              issue: "Debtors classified incorrectly",
              location: "Balance Sheet – p8",
              action: "Ensure prepayments shown separately; exclude net wages",
            };
          }
          return null;
        },
      },
      {
        id: "BS4",
        name: "Creditors classification",
        category: "error",
        description: "Credit card classified as trade creditors",
        check: (accountsData) => {
          const creditCardClass =
            accountsData.balanceSheet?.creditCardClassification;
          if (creditCardClass !== "Trade creditors") {
            return {
              id: "E15",
              category: "error",
              issue: "Credit card not classified as trade creditors",
              location: "Balance Sheet – p8",
              action: "Reclassify credit card as Trade creditors",
            };
          }
          return null;
        },
      },
    ],
    taxation: [
      {
        id: "TAX1",
        name: "Corporation tax - no pence",
        category: "error",
        description: "Corporation tax must be round pounds (no pence)",
        check: (accountsData) => {
          const ctCharge = accountsData.tax?.corporationTax;
          if (ctCharge % 1 !== 0) {
            return {
              id: "E16",
              category: "error",
              issue: "Corporation tax contains pence",
              location: "P&L - Tax note",
              action: "Round corporation tax to whole pounds",
            };
          }
          return null;
        },
      },
      {
        id: "TAX2",
        name: "Deferred tax - no pence",
        category: "error",
        description: "Deferred tax must be round pounds (no pence)",
        check: (accountsData) => {
          const dtCharge = accountsData.tax?.deferredTax;
          if (dtCharge && dtCharge % 1 !== 0) {
            return {
              id: "E17",
              category: "error",
              issue: "Deferred tax contains pence",
              location: "P&L - Tax note",
              action: "Round deferred tax to whole pounds",
            };
          }
          return null;
        },
      },
      {
        id: "TAX3",
        name: "Profit before tax reconciliation",
        category: "error",
        description: "Profit before tax must reconcile to P&L",
        check: (accountsData) => {
          const pbtNote = accountsData.tax?.profitBeforeTaxNote;
          const pbtFromPnL = accountsData.pnl?.profitBeforeTax;
          if (pbtNote !== pbtFromPnL) {
            return {
              id: "E18",
              category: "error",
              issue: "Profit before tax does not reconcile",
              location: "P&L & Tax note",
              action: "Ensure profit before tax reconciles",
            };
          }
          return null;
        },
      },
    ],
    dividends: [
      {
        id: "DIV1",
        name: "Dividend note positioning",
        category: "error",
        description: "Dividend note must not be at end of accounts",
        check: (accountsData) => {
          const divNoteAtEnd = accountsData.dividends?.noteAtEnd;
          if (divNoteAtEnd) {
            return {
              id: "E19",
              category: "error",
              issue: "Dividend note positioned at end",
              location: "Accounts notes section",
              action: "Reposition dividend note within notes section",
            };
          }
          return null;
        },
      },
    ],
    disclosures: [
      {
        id: "D1",
        name: "Insurance cost comparison",
        category: "query",
        description: "Insurance cost comparison schedule required",
        check: (accountsData, trialBalance) => {
          const hasInsuranceComparison = accountsData.disclosures?.includes(
            "Insurance cost comparison"
          );
          if (!hasInsuranceComparison) {
            return {
              id: "Q1",
              category: "query",
              issue: "Insurance cost comparison schedule missing",
              location: "Notes",
              suggestion: "Comparison with prior year",
            };
          }
          return null;
        },
      },
    ],
  },
};
