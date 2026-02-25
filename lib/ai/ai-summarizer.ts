import { generateText } from "ai";
import type { ReviewResults } from "@/lib/types/review";

/**
 * Generate an AI-powered executive summary of review findings
 */
export async function generateExecutiveSummary(
  results: ReviewResults,
  parsedData: any,
): Promise<string> {
  const errorCount = results.errors?.length ?? 0;
  const queryCount = results.queries?.length ?? 0;
  const presentationCount = results.presentation?.length ?? 0;

  const errorsList =
    errorCount > 0
      ? results.errors
          ?.map((e) => `- ${e.title || e.message || JSON.stringify(e)}`)
          .join("\n")
      : "No errors";

  const queriesList =
    queryCount > 0
      ? results.queries
          ?.map((q) => `- ${q.title || q.message || JSON.stringify(q)}`)
          .join("\n")
      : "No queries";

  const prompt = `You are a professional accounts reviewer. Based on the following review findings for a ${results.partner?.title || "Partner"} review, generate a brief executive summary (2-3 paragraphs) that:

1. Clearly states the overall status and readiness for partner review
2. Summarizes the key issues and their impact
3. Provides actionable next steps

Partner Profile: ${results.partner?.name || "Unknown"}
Strictness Level: ${results.config?.scope || "Full Review"}
Total Errors: ${errorCount}
Total Queries: ${queryCount}
Presentation Items: ${presentationCount}

Errors Found:
${errorsList}

Queries/Recommendations:
${queriesList}

Generate a professional, concise executive summary suitable for financial review reports. Do not include recommendations for fixes - focus on the status and what was found.`;

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o mini",
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    return text.trim();
  } catch (error) {
    console.error("[v0] Summary generation failed:", error);
    // Return a fallback summary
    return `
This accounts review for ${results.partner?.name || "Partner"} identified ${errorCount} error(s) and ${queryCount} query/recommendation(s).

${
  errorCount === 0
    ? "No critical errors were found - the accounts appear ready for partner review."
    : `${errorCount} critical error(s) must be addressed before partner review. ${
        queryCount > 0
          ? `Additionally, ${queryCount} query/recommendation(s) have been flagged for your attention.`
          : ""
      }`
}

Please review the detailed findings section for specific actions required.
    `.trim();
  }
}

/**
 * Generate AI-powered insights for a specific finding
 */
export async function generateFindingInsight(
  finding: any,
  partnerContext: string,
): Promise<string> {
  const prompt = `As a professional accountant, briefly explain why this finding matters for ${partnerContext} reviews:

Finding: ${finding.title || finding.message}
Category: ${finding.category}
Severity: ${finding.severity || "Medium"}

Provide a 1-2 sentence explanation of the impact and importance. Be concise and professional.`;

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o mini",
      prompt,
      temperature: 0.5,
      maxTokens: 100,
    });

    return text.trim();
  } catch (error) {
    console.error("[v0] Insight generation failed:", error);
    return "Additional review recommended for this item.";
  }
}
