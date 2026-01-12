import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface ResultsSummaryProps {
  results: any;
}

export default function ResultsSummary({ results }: ResultsSummaryProps) {
  const cards = [
    {
      label: "Errors",
      count: results.errors.length,
      status: "error",
      icon: AlertCircle,
      description: "Must fix before partner review",
      color: "from-red-50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/10",
    },
    {
      label: "Queries",
      count: results.queries.length,
      status: "warning",
      icon: HelpCircle,
      description: "Partner decision required",
      color:
        "from-yellow-50 to-yellow-50/50 dark:from-yellow-950/20 dark:to-yellow-950/10",
    },
    {
      label: "Presentation",
      count: results.presentation.length,
      status: "success",
      icon: CheckCircle2,
      description: "Tidy-up suggestions",
      color:
        "from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl border-2 bg-gradient-to-br ${
              card.color
            } p-6 transition-all duration-300 hover:shadow-md ${
              card.status === "error"
                ? "border-error/30"
                : card.status === "warning"
                ? "border-warning/30"
                : "border-success/30"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-5xl font-bold text-neutral-900 dark:text-white">
                    {card.count}
                  </p>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-2">
                    {card.label}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    card.status === "error"
                      ? "bg-error/10"
                      : card.status === "warning"
                      ? "bg-warning/10"
                      : "bg-success/10"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      card.status === "error"
                        ? "text-error"
                        : card.status === "warning"
                        ? "text-warning"
                        : "text-success"
                    }`}
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
