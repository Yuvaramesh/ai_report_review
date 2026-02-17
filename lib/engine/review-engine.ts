import { PARTNER_1_RULESET } from "@/lib/rules/partner-1-ruleset";
import { PARTNER_2_RULESET } from "@/lib/rules/partner-2-ruleset";
import { PARTNER_3_RULESET } from "@/lib/rules/partner-3-ruleset";
import { PARTNER_4_RULESET } from "@/lib/rules/partner-4-ruleset";
import { PARTNER_5_RULESET } from "@/lib/rules/partner-5-ruleset";
import { PARTNER_6_RULESET } from "@/lib/rules/partner-6-ruleset";
import { PARTNER_7_RULESET } from "@/lib/rules/partner-7-ruleset";
import type {
  ReviewResults,
  PartnerRuleset,
  ReviewFinding,
} from "@/lib/types/review";
import {
  validateRuleWithAI,
  detectAnomalies,
  compareYearOverYear,
  generateExecutiveSummary,
} from "@/lib/ai/validation-service";

const RULESETS: Record<number, PartnerRuleset> = {
  1: PARTNER_1_RULESET,
  2: PARTNER_2_RULESET,
  3: PARTNER_3_RULESET,
  4: PARTNER_4_RULESET,
  5: PARTNER_5_RULESET,
  6: PARTNER_6_RULESET,
  7: PARTNER_7_RULESET,
};

export class ReviewEngine {
  private ruleset: PartnerRuleset;
  private useAI: boolean;

  constructor(partnerId: number, useAI: boolean = true) {
    this.ruleset = RULESETS[partnerId] || PARTNER_1_RULESET;
    this.useAI = useAI;
  }

  async runReview(
    accountsData: any,
    trialBalance: any,
    priorYearData: any = null,
    scope = "full",
  ): Promise<ReviewResults> {
    const findings: ReviewFinding[] = [];
    const aiInsights: any[] = [];

    console.log(
      `[Review Engine] Starting ${this.useAI ? "AI-enhanced" : "rule-based"} review for Partner ${this.ruleset.id}`,
    );

    // Stage 1: Traditional Rule-Based Validation
    if (scope === "full" || scope === "tax") {
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "taxation",
        )),
      );
    }

    if (scope === "full" || scope === "presentation") {
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "formatting",
        )),
      );
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "pnlPresentation",
        )),
      );
    }

    if (scope === "full") {
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "policies",
        )),
      );
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "tbReconciliation",
        )),
      );
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "balanceSheetLogic",
        )),
      );
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "dividends",
        )),
      );
      findings.push(
        ...(await this.runCategoryRules(
          accountsData,
          trialBalance,
          "disclosures",
        )),
      );
    }

    // Stage 2: AI-Enhanced Validation (if enabled)
    if (this.useAI) {
      try {
        console.log("[Review Engine] Running AI anomaly detection...");
        const anomalies = await detectAnomalies(
          accountsData,
          trialBalance,
          "small limited company",
        );

        // Add high and medium severity anomalies as findings
        for (const anomaly of anomalies) {
          if (anomaly.isAnomalous && anomaly.severity !== "low") {
            findings.push({
              id: `AI-${findings.length + 1}`,
              title: "AI-Detected Anomaly",
              category:
                anomaly.severity === "high" ? "error" : ("query" as any),
              issue: anomaly.description,
              location: "AI Analysis",
              action: anomaly.suggestion,
              source: "ai-detection",
              confidence: anomaly.severity === "high" ? 0.9 : 0.7,
            } as any);
          }
        }

        aiInsights.push({
          type: "anomaly-detection",
          count: anomalies.length,
          highSeverity: anomalies.filter((a) => a.severity === "high").length,
        });
      } catch (error) {
        console.error("[Review Engine] AI anomaly detection failed:", error);
      }

      // Stage 3: Year-over-Year Comparison (if prior year available)
      if (priorYearData) {
        try {
          console.log(
            "[Review Engine] Running AI year-over-year comparison...",
          );
          const comparison = await compareYearOverYear(
            accountsData,
            priorYearData,
          );

          // Add policy changes as queries
          for (const change of comparison.policyChanges) {
            findings.push({
              id: `YOY-P-${findings.length + 1}`,
              title: "Year-over-Year Policy Change",
              category: "query" as any,
              query: change,
              location: "Accounting Policies",
              evidence:
                "Compare with prior year and document reason for change",
              source: "ai-comparison",
            } as any);
          }

          // Add significant variances as queries
          for (const variance of comparison.significantVariances) {
            findings.push({
              id: `YOY-V-${findings.length + 1}`,
              title: "Significant Variance",
              category: "query" as any,
              query: variance,
              location: "P&L / Balance Sheet",
              evidence: "Explain material variance from prior year",
              source: "ai-comparison",
            } as any);
          }

          // Add presentation inconsistencies
          for (const inconsistency of comparison.presentationInconsistencies) {
            findings.push({
              id: `YOY-I-${findings.length + 1}`,
              title: "Presentation Inconsistency",
              category: "presentation" as any,
              item: inconsistency,
              location: "Document Structure",
              suggestion: "Align with prior year presentation",
              source: "ai-comparison",
            } as any);
          }

          aiInsights.push({
            type: "year-comparison",
            summary: comparison.summary,
            totalChanges:
              comparison.policyChanges.length +
              comparison.significantVariances.length +
              comparison.presentationInconsistencies.length,
          });
        } catch (error) {
          console.error("[Review Engine] Year comparison failed:", error);
        }
      }
    }

    // Apply downgrade logic if needed
    let errors = findings.filter((f) => f.category === "error");
    let queries = findings.filter((f) => f.category === "query");
    const presentation = findings.filter((f) => f.category === "presentation");

    if (this.ruleset.downgradeErrors) {
      const upgraded = errors.filter(
        (e) => !this.ruleset.presentationOnly.includes(e.id as any),
      );
      const downgraded = errors.filter((e) =>
        this.ruleset.presentationOnly.includes(e.id as any),
      );
      errors = upgraded as any;
      queries = [
        ...queries,
        ...downgraded.map((d) => ({ ...d, category: "query" })),
      ] as any;
    }

    // Stage 4: Generate AI Executive Summary
    let executiveSummary = "";
    if (this.useAI) {
      try {
        console.log("[Review Engine] Generating AI executive summary...");
        executiveSummary = await generateExecutiveSummary(
          findings,
          `${this.ruleset.name} - ${this.ruleset.title}`,
          accountsData,
        );
      } catch (error) {
        console.error("[Review Engine] Summary generation failed:", error);
        executiveSummary = `Review completed with ${findings.length} total findings.`;
      }
    }

    console.log(
      `[Review Engine] Review complete: ${errors.length} errors, ${queries.length} queries, ${presentation.length} presentation items`,
    );

    return {
      partner: {
        id: this.ruleset.id,
        name: this.ruleset.name,
        title: this.ruleset.title,
      },
      config: { scope: scope as any },
      errors: errors as any,
      queries: queries as any,
      presentation: presentation as any,
      timestamp: new Date().toISOString(),
      totalFindings: findings.length,
      aiEnhanced: this.useAI,
      executiveSummary,
      aiInsights,
    };
  }

  private async runCategoryRules(
    accountsData: any,
    trialBalance: any,
    category: keyof typeof this.ruleset.rules,
  ): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const rules = this.ruleset.rules[category];

    for (const rule of rules) {
      if (!rule.check) continue;

      // Check if this rule should use AI validation
      const shouldUseAI = this.useAI && rule.requiresAI;

      if (shouldUseAI) {
        try {
          // AI-powered validation for complex contextual rules
          const aiResult = await validateRuleWithAI(
            {
              name: rule.name,
              description: rule.description,
              category: rule.category,
            },
            accountsData,
            trialBalance,
            `${this.ruleset.name} - ${this.ruleset.title}`,
          );

          if (!aiResult.compliant && aiResult.confidence > 0.6) {
            findings.push({
              id: rule.id,
              title: rule.name,
              category: aiResult.severity as any,
              issue: aiResult.reasoning,
              location: "AI Analysis",
              action: aiResult.suggestedAction || "Review manually",
              source: "ai-validation",
              confidence: aiResult.confidence,
            } as any);
          }
        } catch (error) {
          console.error(
            `[Review Engine] AI validation failed for rule ${rule.id}:`,
            error,
          );
          // Fallback to traditional rule check
          const result = rule.check(accountsData, trialBalance);
          if (result) {
            findings.push({
              ...result,
              id: rule.id,
              title: rule.name,
              source: "rule-based",
            } as any);
          }
        }
      } else {
        // Traditional rule-based check
        const result = rule.check(accountsData, trialBalance);
        if (result) {
          findings.push({
            ...result,
            id: rule.id,
            title: rule.name,
            source: "rule-based",
          } as any);
        }
      }
    }

    return findings;
  }
}
