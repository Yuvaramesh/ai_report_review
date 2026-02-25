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

  constructor(partnerId: number) {
    this.ruleset = RULESETS[partnerId] || PARTNER_1_RULESET;
  }

  async runReview(
    accountsData: any,
    trialBalance: any,
    scope = "full",
  ): Promise<ReviewResults> {
    const findings: ReviewFinding[] = [];

    if (scope === "full" || scope === "tax") {
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "taxation"),
      );
    }

    if (scope === "full" || scope === "presentation") {
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "formatting"),
      );
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "pnlPresentation"),
      );
    }

    if (scope === "full") {
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "policies"),
      );
      findings.push(
        ...this.runCategoryRules(
          accountsData,
          trialBalance,
          "tbReconciliation",
        ),
      );
      findings.push(
        ...this.runCategoryRules(
          accountsData,
          trialBalance,
          "balanceSheetLogic",
        ),
      );
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "dividends"),
      );
      findings.push(
        ...this.runCategoryRules(accountsData, trialBalance, "disclosures"),
      );
    }

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
    };
  }

  private runCategoryRules(
    accountsData: any,
    trialBalance: any,
    category: keyof typeof this.ruleset.rules,
  ) {
    const findings: ReviewFinding[] = [];
    const rules = this.ruleset.rules[category];

    for (const rule of rules) {
      if (!rule.check) continue;

      const result = rule.check(accountsData, trialBalance);
      if (result) {
        findings.push({
          ...result,
          id: rule.id,
          title: rule.name,
        } as any);
      }
    }

    return findings;
  }
}
