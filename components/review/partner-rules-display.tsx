"use client";

import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";

interface PartnerRulesDisplayProps {
  partnerId: string | number;
  scope: string;
}

const partnerRulesInfo: Record<
  string,
  {
    name: string;
    title: string;
    focus: string[];
    keyRules: string[];
  }
> = {
  "1": {
    name: "Partner 1",
    title: "Strict Benchmark",
    focus: [
      "All validation rules",
      "Zero exceptions policy",
      "Comprehensive checks",
    ],
    keyRules: [
      "Complete trial balance with totals required",
      "Company name must be clearly identified",
      "Minimum 500+ characters of data required",
      "All numerical data must be present",
    ],
  },
  "2": {
    name: "Partner 2",
    title: "Commercial",
    focus: ["Client-focused", "Lighter validation", "Formatting flexibility"],
    keyRules: [
      "Trial balance totals essential",
      "Company identification required",
      "Basic content structure needed",
      "Formatting can be flexible",
    ],
  },
  "3": {
    name: "Partner 3",
    title: "Tax-Focused",
    focus: [
      "Tax compliance",
      "Reconciliation checks",
      "Tax-specific validation",
    ],
    keyRules: [
      "Trial balance for tax reconciliation",
      "Tax-related content verification",
      "Provision calculations checked",
      "Corporation tax compliance focus",
    ],
  },
  "4": {
    name: "Partner 4",
    title: "Client-Friendly",
    focus: ["Clarity emphasis", "Client comprehension", "Reduced rigidity"],
    keyRules: [
      "Sufficient content for analysis",
      "Clear presentation valued",
      "Less rigid structure requirements",
      "Emphasis on accessibility",
    ],
  },
  "5": {
    name: "Partner 5",
    title: "Presentation & Consistency",
    focus: [
      "Professional appearance",
      "Consistent formatting",
      "Comparative data",
    ],
    keyRules: [
      "Proper headings and structure",
      "Year-to-year consistency",
      "Professional presentation required",
      "Formatting consistency checked",
    ],
  },
  "6": {
    name: "Partner 6",
    title: "Light Touch",
    focus: ["Minimal friction", "Fast turnaround", "Real issues only"],
    keyRules: [
      "Only critical issues flagged",
      "Maximum 3-5 findings",
      "Fast review turnaround",
      "Flexible interpretation",
    ],
  },
  "7": {
    name: "Partner 7",
    title: "Defensive / External",
    focus: [
      "External scrutiny ready",
      "Extra disclosures",
      "Defensible position",
    ],
    keyRules: [
      "Trial balance totals mandatory",
      "Entity identification for defense",
      "Comprehensive disclosures required",
      "External audit-ready standard",
    ],
  },
};

export default function PartnerRulesDisplay({
  partnerId,
  scope,
}: PartnerRulesDisplayProps) {
  const rules = partnerRulesInfo[String(partnerId)];
  if (!rules) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {rules.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {rules.title}
            </p>
            {scope && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20">
                  Scope: {scope}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Focus Areas */}
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Focus Areas
          </h4>
          <div className="space-y-2">
            {rules.focus.map((area, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {area}
              </div>
            ))}
          </div>
        </div>

        {/* Key Rules */}
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Key Validation Rules
          </h4>
          <div className="space-y-2">
            {rules.keyRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/30 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-warning/10 text-warning flex-shrink-0 text-xs font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
