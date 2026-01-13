import { generateText } from "ai";

/**
 * AI-powered document parser using Vercel AI SDK
 * Extracts structured financial data from PDF/Word documents
 */

interface ExtractedAccountsData {
  status: string;
  accountantName: string;
  accountantAddress: string;
  companiesHouseNumber: string;
  pnl: {
    stockLines: string[];
    headings: string[];
    depreciation: { isSeparate: boolean };
    expenses: { [key: string]: number };
    profitBeforeTax: number;
  };
  balanceSheet: {
    balances: number;
    fixedAssets: string[];
    hirePerchase: { hasBreakdown: boolean };
    debtors: string[];
    creditors: string[];
  };
  tax: {
    corporationTax: number;
    deferredTax: number;
    reconciles: boolean;
  };
  disclosures: string[];
}

interface TrialBalanceData {
  closingStock: number;
  accountancyFee: number;
  depreciation: number;
  wages: number;
  insuranceCost: number;
  debtors: { [key: string]: number };
  creditors: { [key: string]: number };
}

/**
 * Parse accounts PDF/Word using AI vision and text extraction
 */
export async function parseAccountsDocument(
  fileContent: string
): Promise<ExtractedAccountsData> {
  const prompt = `
You are a professional accountant analyzing financial statements. Extract the following data from the accounts:

1. Status (Draft/Final)
2. Accountant name and address
3. P&L Statement:
   - Opening and closing stock lines
   - All expense headings used
   - Whether depreciation is shown separately
   - Profit before tax figure
4. Balance Sheet:
   - Fixed assets and classifications
   - Hire/purchase details
   - Debtors breakdown (prepayments, trade debtors, other)
   - Creditors breakdown (trade, tax, other)
5. Tax:
   - Corporation tax amount
   - Deferred tax amount
   - Whether profit reconciles to tax note
6. Disclosures present

Document content:
${fileContent}

Return ONLY a valid JSON object with this structure:
{
  "status": "DRAFT" | "FINAL",
  "accountantName": "string",
  "accountantAddress": "string",
  "companiesHouseNumber": "string",
  "pnl": {
    "stockLines": ["string"],
    "headings": ["string"],
    "depreciation": { "isSeparate": boolean },
    "expenses": { "key": number },
    "profitBeforeTax": number
  },
  "balanceSheet": {
    "balances": number,
    "fixedAssets": ["string"],
    "hirePerchase": { "hasBreakdown": boolean },
    "debtors": ["string"],
    "creditors": ["string"]
  },
  "tax": {
    "corporationTax": number,
    "deferredTax": number,
    "reconciles": boolean
  },
  "disclosures": ["string"]
}
`;

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o mini",
      prompt,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    return JSON.parse(jsonMatch[0]) as ExtractedAccountsData;
  } catch (error) {
    console.error("[v0] Document parsing failed:", error);
    throw new Error("Failed to parse accounts document with AI");
  }
}

/**
 * Parse Trial Balance Excel using AI
 */
export async function parseTrialBalance(
  fileContent: string
): Promise<TrialBalanceData> {
  const prompt = `
You are an accountant analyzing a trial balance. Extract these specific line items:

1. Closing stock value
2. Accountancy fee
3. Depreciation amount
4. Total wages/salaries
5. Insurance cost
6. All debtor accounts and amounts
7. All creditor accounts and amounts

Trial Balance data:
${fileContent}

Return ONLY valid JSON:
{
  "closingStock": number,
  "accountancyFee": number,
  "depreciation": number,
  "wages": number,
  "insuranceCost": number,
  "debtors": { "accountName": number },
  "creditors": { "accountName": number }
}
`;

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o mini",
      prompt,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    return JSON.parse(jsonMatch[0]) as TrialBalanceData;
  } catch (error) {
    console.error("[v0] Trial balance parsing failed:", error);
    throw new Error("Failed to parse trial balance with AI");
  }
}
