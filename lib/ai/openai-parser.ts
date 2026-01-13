const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface ParsedAccountsData {
  status: string;
  accountantName: string;
  accountantAddress: string;
  policiesDiffer: boolean;
  policies: string[];
  sections: Array<{ title: string }>;
  pnl?: {
    profitBeforeTax: number;
    depreciation?: { isSeparate: boolean };
    stockLines?: string[];
    headings?: string[];
    expenses?: string[];
  };
  balanceSheet?: {
    fixedAssets?: string[];
    hirePerchase?: { hasBreakdown: boolean };
    debtors?: string[];
    creditCardClassification?: string;
  };
  tax?: {
    corporationTax: number;
    deferredTax?: number;
    profitBeforeTaxNote: number;
  };
  dividends?: {
    noteAtEnd: boolean;
  };
  disclosures?: string[];
}

export async function parseDocumentsWithAI(
  fileContents: string[]
): Promise<ParsedAccountsData> {
  if (!OPENAI_API_KEY) {
    console.error("[v0] Missing OPENAI_API_KEY environment variable");
    return getDefaultParsedData();
  }

  const systemPrompt = `You are an expert accountant AI analyzing financial documents. Extract structured accounting data from the provided documents.

Return ONLY valid JSON (no markdown, no code blocks) matching this exact structure:
{
  "status": "DRAFT" | "Final",
  "accountantName": "string",
  "accountantAddress": "string",
  "policiesDiffer": boolean,
  "policies": ["string"],
  "sections": [{"title": "string"}],
  "pnl": {
    "profitBeforeTax": number,
    "depreciation": {"isSeparate": boolean},
    "stockLines": ["string"],
    "headings": ["string"],
    "expenses": ["string"]
  },
  "balanceSheet": {
    "fixedAssets": ["string"],
    "hirePerchase": {"hasBreakdown": boolean},
    "debtors": ["string"],
    "creditCardClassification": "string"
  },
  "tax": {
    "corporationTax": number,
    "deferredTax": number,
    "profitBeforeTaxNote": number
  },
  "dividends": {"noteAtEnd": boolean},
  "disclosures": ["string"]
}`;

  const userPrompt = `Extract financial data from these documents:\n\n${fileContents
    .join("\n---\n")
    .substring(0, 3000)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[v0] OpenAI API error:", error);
      return getDefaultParsedData();
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("[v0] No response from OpenAI");
      return getDefaultParsedData();
    }

    try {
      const parsed = JSON.parse(content);
      return {
        status: parsed.status || "DRAFT",
        accountantName: parsed.accountantName || "BBK Partnership Limited",
        accountantAddress: parsed.accountantAddress || "Potters Bar",
        policiesDiffer: parsed.policiesDiffer || false,
        policies: Array.isArray(parsed.policies) ? parsed.policies : [],
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        pnl: parsed.pnl || {},
        balanceSheet: parsed.balanceSheet || {},
        tax: parsed.tax || {},
        dividends: parsed.dividends || {},
        disclosures: Array.isArray(parsed.disclosures)
          ? parsed.disclosures
          : [],
      };
    } catch (parseError) {
      console.error("[v0] Failed to parse JSON from OpenAI:", parseError);
      return getDefaultParsedData();
    }
  } catch (error) {
    console.error("[v0] OpenAI parsing error:", error);
    return getDefaultParsedData();
  }
}

function getDefaultParsedData(): ParsedAccountsData {
  return {
    status: "DRAFT",
    accountantName: "BBK Partnership Limited",
    accountantAddress: "Potters Bar",
    policiesDiffer: false,
    policies: [],
    sections: [],
    pnl: {
      profitBeforeTax: 0,
      depreciation: { isSeparate: true },
      stockLines: [],
      headings: [],
      expenses: [],
    },
    balanceSheet: {
      fixedAssets: [],
      hirePerchase: { hasBreakdown: true },
      debtors: [],
      creditCardClassification: "Trade creditors",
    },
    tax: {
      corporationTax: 0,
      deferredTax: 0,
      profitBeforeTaxNote: 0,
    },
    dividends: { noteAtEnd: false },
    disclosures: [],
  };
}
