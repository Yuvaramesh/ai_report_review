import { ReviewEngine } from "@/lib/engine/review-engine";

export type ParsedDocument = {
  name: string;
  text: string;
  extracted?: Record<string, any>;
};

export async function parseDocumentsWithAI(
  docs: Array<{ name: string; text: string }>
): Promise<{
  documents: ParsedDocument[];
  meta?: Record<string, any>;
}> {
  const parsed: ParsedDocument[] = docs.map((d) => {
    const text = d.text ?? "";

    const totalMatch = text.match(
      /(?:total assets|total|closing stock|trial balance total)\s*[:-]?\s*([\d,.\-()]+)/i
    );
    const yearMatch = text.match(/(\b20\d{2}\b)/);
    const companyMatch = text.match(
      /(Company|Entity|Name)\s*[:-]?\s*([A-Za-z0-9 &.,-]+)/i
    );
    const statusMatch = text.match(/(draft|final|audit)/i);

    const extracted: Record<string, any> = {};
    if (totalMatch) extracted.total = totalMatch[1];
    if (yearMatch) extracted.year = yearMatch[1];
    if (companyMatch) extracted.company = companyMatch[2].trim();
    if (statusMatch) extracted.status = statusMatch[1].toLowerCase();

    return { name: d.name, text, extracted };
  });

  return { documents: parsed, meta: { parsedAt: new Date().toISOString() } };
}

export type ReviewFinding = {
  id: string;
  category: "error" | "query" | "presentation";
  issue?: string;
  query?: string;
  item?: string;
  location?: string;
  action?: string;
  evidence?: string;
  suggestion?: string;
  tbRef?: string;
  severity?: string;
  title?: string;
  message?: string;
};

type RulesOutcome = {
  errors: ReviewFinding[];
  warnings: ReviewFinding[];
  queries: ReviewFinding[];
  presentation: ReviewFinding[];
  passed: boolean;
};

export async function applyPartnerRules(
  partnerId: string,
  scope: string,
  parsed: { documents: ParsedDocument[]; meta?: any }
): Promise<RulesOutcome> {
  try {
    // Convert partner ID to number, default to 1
    const pId = parseInt(partnerId) || 1;

    // Convert parsed documents to format expected by ReviewEngine
    const accountsDoc = parsed.documents.find((d) => d.name === "accounts");
    const tbDoc = parsed.documents.find((d) => d.name === "trialBalance");

    const accountsText = accountsDoc?.text || "";
    const tbText = tbDoc?.text || "";

    // Build comprehensive accounts data object
    const accountsData = {
      ...accountsDoc?.extracted,
      text: accountsText,
      status: accountsDoc?.extracted?.status || extractStatus(accountsText),
      company: accountsDoc?.extracted?.company || extractCompany(accountsText),
      accountantName: extractAccountantName(accountsText),
      accountantAddress: extractAccountantAddress(accountsText),
      sections: extractSections(accountsText),
      policies: extractPolicies(accountsText),
      policiesDiffer: checkPoliciesDiffer(accountsText),
      pnl: extractPnLData(accountsText),
    };

    // Build comprehensive trial balance data object
    const trialBalance = {
      ...tbDoc?.extracted,
      text: tbText,
      closingStock: extractClosingStock(tbText),
      debtors: extractDebtors(tbText),
      accountancyFee: extractAccountancyFee(tbText),
      total: extractTotal(tbText),
    };

    // Run the review engine with detailed rulesets
    const engine = new ReviewEngine(pId);
    const result = await engine.runReview(accountsData, trialBalance, scope);

    return {
      errors: result.errors || [],
      warnings: result.queries || [],
      queries: result.queries || [],
      presentation: result.presentation || [],
      passed: (result.errors || []).length === 0,
    };
  } catch (err) {
    console.error("[v0] applyPartnerRules error:", err);
    return {
      errors: [
        {
          id: "ERR_PROCESSING",
          category: "error",
          issue: "Error processing review",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      ],
      warnings: [],
      queries: [],
      presentation: [],
      passed: false,
    };
  }
}

// Helper functions to extract data from document text
function extractStatus(text: string): string {
  // Check for DRAFT watermark or status indicators
  const patterns = [
    /\bDRAFT\b/i,
    /draft\s+(?:accounts|financial|statements)/i,
    /status\s*[:\-]?\s*(draft|final|audit)/i,
    /\[DRAFT\]/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return "DRAFT";
    }
  }

  return "";
}

function extractCompany(text: string): string {
  // Look for company name in various formats
  const patterns = [
    /(?:company|entity|name)\s*[:\-]?\s*([A-Za-z0-9 &.,-]+)/i,
    /^([A-Za-z0-9 &.,'-]+)\s*(?:Limited|Ltd|Inc|Company|Corp)/im,
    /([A-Za-z0-9 &.,'-]+)\s+(?:Financial Statements|Accounts)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

function extractAccountantName(text: string): string {
  // Look for accountant name - often appears after "Prepared by" or in footer
  const patterns = [
    /(?:prepared by|accountant|accounting firm|firm)\s*[:\-]?\s*([A-Za-z0-9 &.,-]+)/i,
    /([A-Za-z0-9 &.,'-]+)\s+(?:Accountant|Accounting|Chartered|CPA)/i,
    /(?:Accountant|Firm):\s*([A-Za-z0-9 &.,-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

function extractAccountantAddress(text: string): string {
  const match = text.match(/(?:address|located|based)\s*[:\-]?\s*([A-Za-z ]+)/i);
  return match ? match[1].trim() : "";
}

function extractSections(text: string): Record<string, any>[] {
  const sections: Record<string, any>[] = [];
  
  // Find major sections by looking for common headings
  const headingPatterns = [
    /(?:directors?\s+)?responsibilities?/i,
    /auditor(?:s|'s)?\s+report/i,
    /financial\s+(?:position|statements)/i,
    /balance\s+sheet/i,
    /(?:profit|loss)\s+(?:and\s+loss)?/i,
    /cash\s+flow/i,
  ];

  headingPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      sections.push({
        title: pattern.source,
        found: true,
      });
    }
  });

  return sections;
}

function extractPolicies(text: string): string[] {
  const policies: string[] = [];
  const policyMatch = text.match(/accounting policies[^]*?(?=\n\n|\n[A-Z]|\$)/i);
  if (policyMatch) {
    const policyText = policyMatch[0];
    if (policyText.includes("Rendering of Services"))
      policies.push("Rendering of Services");
    if (policyText.includes("Government Grants"))
      policies.push("Government Grants");
  }
  return policies;
}

function checkPoliciesDiffer(text: string): boolean {
  return /(?:policies?.*(?:changed|differ|different|updated))/i.test(text);
}

function extractPnLData(text: string): Record<string, any> {
  return {
    depreciation: {
      isSeparate: /depreciation.*separate|separate.*depreciation/i.test(text),
    },
    stockLines: [],
    expenses: extractExpenses(text),
  };
}

function extractExpenses(text: string): string[] {
  const expenses: string[] = [];
  if (text.includes("Insurance claim")) expenses.push("Insurance claim");
  if (text.includes("Repairs")) expenses.push("Repairs");
  return expenses;
}

function extractClosingStock(text: string): number | undefined {
  const match = text.match(/closing\s*stock\s*[:\-]?\s*([\d,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ""));
  }
  return undefined;
}

function extractDebtors(text: string): string[] {
  const debtors: string[] = [];
  if (text.includes("net wages")) debtors.push("net wages");
  return debtors;
}

function extractAccountancyFee(text: string): number | undefined {
  const match = text.match(/accountanc(?:y|ies?)\s*fee\s*[:\-]?\s*([\d,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ""));
  }
  return undefined;
}

function extractTotal(text: string): string | undefined {
  const match = text.match(
    /(?:total|total assets|balance|grand total)\s*[:\-]?\s*([\d,.\-()]+)/i
  );
  return match ? match[1] : undefined;
}
