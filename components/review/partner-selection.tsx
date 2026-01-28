"use client";

import { Info, Shield } from "lucide-react";
import PartnerCard from "./partner-card";

interface PartnerSelectionProps {
  onSelect: (partner: any) => void;
}

type Strictness = "maximum" | "high" | "medium" | "medium-light" | "light";

interface Partner {
  id: number;
  name: string;
  title: string;
  description: string;
  strictness: Strictness;
  color: string;
  recommended: boolean;
  details: string;
  tooltipRules: string[];
}

const PARTNERS: Partner[] = [
  {
    id: 1,
    name: "Partner 1",
    title: "Strict Benchmark",
    description: "Gold standard validation with zero overrides.",
    strictness: "maximum",
    color: "red",
    recommended: true,
    details:
      "Enforces all rules without exception. Perfect for establishing baseline quality and identifying all issues.",
    tooltipRules: [
      "Accounts must be marked DRAFT",
      "All policies must match prior year exactly",
      "Depreciation must be shown separately",
    ],
  },
  {
    id: 2,
    name: "Partner 2",
    title: "Commercial",
    description: "Lighter, client-focused review.",
    strictness: "high",
    color: "orange",
    recommended: false,
    details: "Relaxes formatting checks. More lenient on policy changes.",
    tooltipRules: [
      "DRAFT status preferred (not required)",
      "Policy changes allowed with explanation",
      "Balance sheet must balance",
    ],
  },
  {
    id: 3,
    name: "Partner 3",
    title: "Tax-Focused",
    description: "Prioritizes tax compliance.",
    strictness: "high",
    color: "amber",
    recommended: false,
    details: "Focuses on TB ↔ tax computations. Tolerates layout differences.",
    tooltipRules: [
      "Tax reconciliation is critical",
      "Trial balance must match tax computation",
      "Deferred tax must be calculated",
    ],
  },
  {
    id: 4,
    name: "Partner 4",
    title: "Client-Friendly",
    description: "Clarity and explanation focused.",
    strictness: "medium",
    color: "green",
    recommended: false,
    details: "Emphasizes clarity. Less rigid about historic consistency.",
    tooltipRules: [
      "Material policy changes allowed",
      "Balance sheet must balance",
      "Tax must reconcile",
    ],
  },
  {
    id: 5,
    name: "Partner 5",
    title: "Presentation & Consistency",
    description: "Clean, professional accounts.",
    strictness: "medium",
    color: "blue",
    recommended: false,
    details: "Obsessed with headings, order, and comparatives.",
    tooltipRules: [
      "Consistent heading order required",
      "Balance sheet presentation matters",
      "Comparative consistency important",
    ],
  },
  {
    id: 6,
    name: "Partner 6",
    title: "Light Touch",
    description: "Fast turnaround, minimal friction.",
    strictness: "light",
    color: "green",
    recommended: false,
    details: "Wants only real problems. 3–5 points maximum.",
    tooltipRules: [
      "Only critical errors flagged",
      "Balance sheet must balance",
      "Minimal presentation requirements",
    ],
  },
  {
    id: 7,
    name: "Partner 7",
    title: "Defensive / External",
    description: "Highly defensible for external scrutiny.",
    strictness: "maximum",
    color: "red",
    recommended: false,
    details: "Similar to Partner 1 + extra disclosure emphasis.",
    tooltipRules: [
      "Strict compliance like Partner 1",
      "Extra disclosure requirements",
      "Tax and policies must be precise",
    ],
  },
];

export default function PartnerSelection({ onSelect }: PartnerSelectionProps) {
  const handleSelectPartner = (partner: any) => {
    onSelect(partner);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950/50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white">
              Select Reviewing Partner
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Choose which partner profile will guide the review. This controls
              the strictness and focus of validation.
            </p>
          </div>

          {/* Info Banner */}
          <div className="rounded-xl border border-warning/20 bg-gradient-to-r from-warning/5 to-warning/10 p-4 flex gap-3 dark:from-warning/10 dark:to-warning/5">
            <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning dark:text-warning-light">
                Pro Tip
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Partner 1 is the strictest benchmark. If accounts pass Partner
                1, they will likely satisfy Partners 2–6. Hover over partner
                cards to see key rules for each profile.
              </p>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {PARTNERS.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onSelect={handleSelectPartner}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  Need guidance?
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  Partner 1 is recommended for first-time reviews
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
