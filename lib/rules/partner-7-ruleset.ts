import type { PartnerRuleset } from "@/lib/types/review"

export const PARTNER_7_RULESET: PartnerRuleset = {
  id: 7,
  name: "Partner 7",
  title: "Defensive / External",
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
          const isDraft = accountsData.status?.toLowerCase().includes("draft")
          if (!isDraft) {
            return {
              id: "E1",
              category: "error",
              issue: "Accounts not marked DRAFT",
              location: "All pages",
              action: "Add DRAFT watermark to all pages",
            }
          }
          return null
        },
      },
    ],
    policies: [
      {
        id: "P1",
        name: "Policies match prior year",
        category: "error",
        description: "Accounting policies must match prior year exactly",
        check: (accountsData) => {
          const policiesDiffer = accountsData.policiesDiffer
          if (policiesDiffer) {
            return {
              id: "E2",
              category: "error",
              issue: "Accounting policies differ from prior year",
              location: "Accounting policies note",
              action: "Align policies with prior year",
            }
          }
          return null
        },
      },
    ],
    tbReconciliation: [
      {
        id: "TB1",
        name: "Complete TB reconciliation",
        category: "error",
        description: "All TB items must reconcile to accounts",
        check: (accountsData) => {
          const balanceSheetBalances = accountsData.balanceSheet?.balances === 0
          if (!balanceSheetBalances) {
            return {
              id: "E3",
              category: "error",
              issue: "Balance sheet does not balance",
              location: "Balance Sheet",
              action: "Correct to achieve balance",
            }
          }
          return null
        },
      },
    ],
    pnlPresentation: [
      {
        id: "PNL1",
        name: "Strict presentation compliance",
        category: "error",
        description: "P&L must follow strict presentation rules",
        check: (accountsData) => {
          const hasDepreciation = accountsData.pnl?.depreciation?.isSeparate
          if (!hasDepreciation) {
            return {
              id: "E4",
              category: "error",
              issue: "Depreciation not shown separately",
              location: "P&L",
              action: "Separate depreciation from admin costs",
            }
          }
          return null
        },
      },
    ],
    balanceSheetLogic: [
      {
        id: "BS1",
        name: "Strict BS compliance",
        category: "error",
        description: "Balance sheet must follow strict rules",
        check: (accountsData) => {
          const creditCardClass = accountsData.balanceSheet?.creditCardClassification
          if (creditCardClass !== "Trade creditors") {
            return {
              id: "E5",
              category: "error",
              issue: "Credit card not classified as trade creditors",
              location: "Balance Sheet – p8",
              action: "Reclassify credit card as Trade creditors",
            }
          }
          return null
        },
      },
    ],
    taxation: [
      {
        id: "TAX1",
        name: "Strict tax compliance",
        category: "error",
        description: "Tax computations must be precisely correct",
        check: (accountsData) => {
          const taxReconciles = accountsData.tax?.reconciles
          if (!taxReconciles) {
            return {
              id: "E6",
              category: "error",
              issue: "Tax computations do not reconcile",
              location: "Tax note",
              action: "Correct tax calculation",
            }
          }
          return null
        },
      },
    ],
    dividends: [],
    disclosures: [
      {
        id: "D1",
        name: "Comprehensive disclosures",
        category: "query",
        description: "All key disclosures required",
        check: (accountsData, trialBalance) => {
          const hasRequiredDisclosures = accountsData.disclosures?.length > 0
          if (!hasRequiredDisclosures) {
            return {
              id: "Q1",
              category: "query",
              issue: "Key disclosures may be incomplete",
              location: "Notes",
              evidence: "Review against prior year disclosures",
            }
          }
          return null
        },
      },
    ],
  },
}
