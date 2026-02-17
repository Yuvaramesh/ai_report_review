const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface AIValidationResult {
  compliant: boolean;
  reasoning: string;
  severity: "error" | "warning" | "info";
  suggestedAction?: string;
  confidence: number; // 0-1
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  description: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
}

export interface YearComparisonResult {
  policyChanges: string[];
  significantVariances: string[];
  presentationInconsistencies: string[];
  missingDisclosures: string[];
  summary: string;
}

/**
 * AI-powered rule validation
 * Uses GPT-4o mini for contextual compliance checking
 */
export async function validateRuleWithAI(
  rule: {
    name: string;
    description: string;
    category: string;
  },
  accountsData: any,
  trialBalance: any,
  partnerContext: string,
): Promise<AIValidationResult> {
  if (!OPENAI_API_KEY) {
    console.warn(
      "[AI Validation] No OpenAI API key - falling back to basic validation",
    );
    return {
      compliant: true,
      reasoning: "AI validation unavailable - manual review needed",
      severity: "info",
      confidence: 0,
    };
  }

  const systemPrompt = `You are an expert financial auditor analyzing statutory accounts for compliance.

Your role is to evaluate whether the accounts comply with specific accounting rules.
Consider context, intent, and substance over form.
Be practical - flag only material issues.

Respond ONLY with valid JSON matching this structure:
{
  "compliant": true/false,
  "reasoning": "brief explanation of your assessment",
  "severity": "error" | "warning" | "info",
  "suggestedAction": "specific corrective action if non-compliant",
  "confidence": 0.0-1.0
}`;

  const userPrompt = `Evaluate compliance with this rule:

RULE: ${rule.name}
DESCRIPTION: ${rule.description}
CATEGORY: ${rule.category}
PARTNER CONTEXT: ${partnerContext}

ACCOUNTS DATA:
${JSON.stringify(accountsData, null, 2).substring(0, 2000)}

TRIAL BALANCE DATA:
${JSON.stringify(trialBalance, null, 2).substring(0, 1000)}

Does this comply? Consider variations, context, and practical application.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for consistency
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as AIValidationResult;

    // Validate confidence is within range
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0.7));

    return result;
  } catch (error) {
    console.error("[AI Validation] Error:", error);
    return {
      compliant: true,
      reasoning: "AI validation failed - manual review recommended",
      severity: "info",
      confidence: 0,
      suggestedAction: "Review this item manually",
    };
  }
}

/**
 * Detect anomalies and unusual patterns using AI
 */
export async function detectAnomalies(
  accountsData: any,
  trialBalance: any,
  companyType: string = "small limited company",
): Promise<AnomalyDetectionResult[]> {
  if (!OPENAI_API_KEY) {
    return [];
  }

  const systemPrompt = `You are an experienced accountant with 20 years of auditing experience.
Identify unusual patterns, anomalies, or red flags in financial accounts.
Focus on material issues that deserve attention.

Respond ONLY with valid JSON array:
[
  {
    "isAnomalous": true/false,
    "description": "what's unusual",
    "severity": "high" | "medium" | "low",
    "suggestion": "what to investigate or do"
  }
]`;

  const userPrompt = `Analyze these accounts for anomalies:

COMPANY TYPE: ${companyType}

ACCOUNTS DATA:
${JSON.stringify(accountsData, null, 2).substring(0, 3000)}

TRIAL BALANCE:
${JSON.stringify(trialBalance, null, 2).substring(0, 2000)}

Identify any unusual patterns, ratios, or items that warrant attention.
Focus on material issues only.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return [];
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]) as AnomalyDetectionResult[];
  } catch (error) {
    console.error("[Anomaly Detection] Error:", error);
    return [];
  }
}

/**
 * Compare current year vs prior year accounts using AI
 */
export async function compareYearOverYear(
  currentYearData: any,
  priorYearData: any,
): Promise<YearComparisonResult> {
  if (!OPENAI_API_KEY || !priorYearData) {
    return {
      policyChanges: [],
      significantVariances: [],
      presentationInconsistencies: [],
      missingDisclosures: [],
      summary: "Prior year comparison not available",
    };
  }

  const systemPrompt = `You are an accountant comparing year-over-year financial statements.
Identify material changes, inconsistencies, and missing items.

Respond ONLY with valid JSON:
{
  "policyChanges": ["policy change 1", "policy change 2"],
  "significantVariances": ["variance 1", "variance 2"],
  "presentationInconsistencies": ["inconsistency 1"],
  "missingDisclosures": ["missing item 1"],
  "summary": "2-3 sentence executive summary"
}`;

  const userPrompt = `Compare these two years of accounts:

CURRENT YEAR:
${JSON.stringify(currentYearData, null, 2).substring(0, 3000)}

PRIOR YEAR:
${JSON.stringify(priorYearData, null, 2).substring(0, 3000)}

Identify material changes, policy differences, presentation changes, and missing disclosures.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    return JSON.parse(jsonMatch[0]) as YearComparisonResult;
  } catch (error) {
    console.error("[Year Comparison] Error:", error);
    return {
      policyChanges: [],
      significantVariances: [],
      presentationInconsistencies: [],
      missingDisclosures: [],
      summary: "Year-over-year comparison failed - manual review recommended",
    };
  }
}

/**
 * Generate executive summary of review findings using AI
 */
export async function generateExecutiveSummary(
  findings: any[],
  partnerProfile: string,
  accountsData: any,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return `Review completed with ${findings.length} total findings. Manual review recommended.`;
  }

  const systemPrompt = `You are a senior accountant writing an executive summary for a partner.
Be concise, professional, and focus on actionable insights.
Write 2-4 sentences maximum.`;

  const userPrompt = `Summarize this accounts review:

PARTNER PROFILE: ${partnerProfile}
TOTAL FINDINGS: ${findings.length}

FINDINGS:
${JSON.stringify(findings, null, 2).substring(0, 2000)}

COMPANY: ${accountsData.accountantName || "Unknown"}
STATUS: ${accountsData.status || "Unknown"}

Provide a brief executive summary highlighting key issues and overall readiness.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return content || `Review completed with ${findings.length} findings.`;
  } catch (error) {
    console.error("[Executive Summary] Error:", error);
    return `Review completed with ${findings.length} findings. See detailed results below.`;
  }
}

/**
 * Smart variance explanation using AI
 */
export async function explainVariance(
  item: string,
  currentValue: number,
  priorValue: number,
  context: any,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return `${item} changed from ${priorValue} to ${currentValue}`;
  }

  const variance = currentValue - priorValue;
  const percentChange = priorValue !== 0 ? (variance / priorValue) * 100 : 0;

  const systemPrompt = `You are an accountant explaining financial variances.
Provide a brief, practical explanation in 1-2 sentences.`;

  const userPrompt = `Explain this variance:

ITEM: ${item}
PRIOR YEAR: £${priorValue.toLocaleString()}
CURRENT YEAR: £${currentValue.toLocaleString()}
CHANGE: £${variance.toLocaleString()} (${percentChange.toFixed(1)}%)

CONTEXT:
${JSON.stringify(context, null, 2).substring(0, 500)}

Provide a concise explanation of what might have caused this change.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return (
      content ||
      `Variance of £${variance.toLocaleString()} (${percentChange.toFixed(1)}%)`
    );
  } catch (error) {
    console.error("[Variance Explanation] Error:", error);
    return `${item}: £${variance.toLocaleString()} change (${percentChange.toFixed(1)}%)`;
  }
}
