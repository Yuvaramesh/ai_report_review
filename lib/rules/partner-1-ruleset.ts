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
        requiresAI: false, // Simple pattern match - no AI needed
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
        requiresAI: true, // AI can better detect variations of this statement
        aiContext:
          "Look for any variation of Directors' Responsibilities, Directors' Report, or similar statements that should not be in draft accounts",
        check: (accountsData) => {
          const hasDirectorsStatement = accountsData.sections?.some((s: any) =>
            s.title?.toLowerCase().includes("directors' responsibilities"),
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
        requiresAI: true, // AI can handle variations in formatting and spelling
        aiContext:
          "Check if accountant details match 'BBK Partnership Limited, Potters Bar' allowing for minor formatting differences",
        check: (accountsData) => {
          const hasCorrectName = accountsData.accountantName?.includes(
            "BBK Partnership Limited",
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
        requiresAI: true, // AI can better understand substantive vs cosmetic changes
        aiContext:
          "Determine if accounting policies have materially changed from prior year, ignoring minor wording updates that don't change the substance",
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
        requiresAI: false, // Simple keyword search
        check: (accountsData) => {
          const prohibitedPolicies = [
            "Rendering of Services",
            "Government Grants",
          ];
          const hasProhibited = prohibitedPolicies.some((p) =>
            accountsData.policies?.some((policy: any) => policy.includes(p)),
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
        requiresAI: false, // Exact number match
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
        requiresAI: true, // AI can detect variations: "net wages", "employee advances", "staff loans", etc.
        aiContext:
          "Look for any variation of employee-related advances, net wages, staff loans, or similar items that should not be in debtors",
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
        requiresAI: true, // AI can detect if this is truly an insurance claim vs legitimate insurance expense
        aiContext:
          "Distinguish between legitimate insurance expenses (allowed) and insurance claims/proceeds (not allowed in P&L)",
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
        requiresAI: false, // Exact number match
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
        requiresAI: true, // AI can better identify stock-related line items regardless of exact wording
        aiContext:
          "Check if stock presentation uses only 'Opening stock' and 'Closing stock', flag variations like 'Finished goods', 'Raw materials', 'Work in progress'",
        check: (accountsData) => {
          const allowedLines = ["Opening stock", "Closing stock"];
          const prohibitedLines = ["Finished goods"];
          const hasForbiddenLine = accountsData.pnl?.stockLines?.some(
            (line: any) => prohibitedLines.some((p) => line.includes(p)),
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
        requiresAI: true, // AI can determine if depreciation is "effectively" separate even if format varies
        aiContext:
          "Check if depreciation is clearly disclosed separately, not buried within administrative expenses or other categories",
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
        requiresAI: false, // Simple keyword replacement
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
        requiresAI: true, // AI can understand asset classifications better
        aiContext:
          "Check if property assets are correctly classified as 'Short leasehold' rather than 'Land and Property' or similar variations",
        check: (accountsData) => {
          const hasLandProperty =
            accountsData.balanceSheet?.fixedAssets?.includes(
              "Land and Property",
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
        requiresAI: true, // AI can assess if breakdown is adequate
        aiContext:
          "Check if hire purchase liabilities have adequate breakdown by asset, including amounts, terms, and reconciliation",
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
        requiresAI: true, // AI can understand debtor categories better
        aiContext:
          "Ensure debtors are properly classified with prepayments shown separately, and no employee-related items like net wages",
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
        requiresAI: false, // Simple classification check
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
        requiresAI: false, // Simple numeric check
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
        requiresAI: false, // Simple numeric check
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
        requiresAI: true, // AI can handle rounding differences and understand materiality
        aiContext:
          "Check if profit before tax in tax note reconciles to P&L, allowing for immaterial rounding differences (<£10)",
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
        requiresAI: false, // Simple position check
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
        requiresAI: true, // AI can determine if comparison is adequate
        aiContext:
          "Check if insurance costs are compared to prior year with explanation for significant variances",
        check: (accountsData, trialBalance) => {
          const hasInsuranceComparison = accountsData.disclosures?.includes(
            "Insurance cost comparison",
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
