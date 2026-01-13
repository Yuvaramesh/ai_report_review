"use client";

import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PartnerCardProps {
  partner: {
    id: number;
    strictness: "maximum" | "high" | "medium" | "medium-light" | "light";
    recommended: boolean;
    name: string;
    title: string;
    description: string;
    details: string;
    tooltipRules?: string[];
  };
  onSelect: (partner: any) => void;
  isProtected?: boolean;
}

export default function PartnerCard({
  partner,
  onSelect,
  isProtected,
}: PartnerCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const strictnessConfig = {
    maximum: {
      color: "from-red-50 to-red-50/50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-900",
    },
    high: {
      color: "from-orange-50 to-orange-50/50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-900",
    },
    medium: {
      color: "from-yellow-50 to-yellow-50/50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-900",
    },
    "medium-light": {
      color: "from-green-50 to-green-50/50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-900",
    },
    light: {
      color: "from-blue-50 to-blue-50/50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-900",
    },
  };

  const config =
    strictnessConfig[partner.strictness as keyof typeof strictnessConfig];
  const isRecommended = partner.recommended;

  const isPartner1 = partner.id === 1;

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(partner)}
        disabled={isProtected}
        className={`group relative rounded-2xl border-2 ${
          config.border
        } bg-gradient-to-br ${
          config.color
        } p-6 text-left transition-all duration-300 ${
          !isProtected
            ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            : "cursor-not-allowed opacity-75"
        } dark:border-neutral-700 dark:bg-gradient-to-br dark:from-neutral-900 dark:to-neutral-800 w-full`}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute -top-3 -right-3 animate-in fade-in zoom-in">
            <div
              className={`${config.badge} flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Recommended
            </div>
          </div>
        )}

        {isPartner1 && isProtected && (
          <div className="absolute -top-3 -left-3 animate-in fade-in zoom-in">
            <div className="bg-blue-100 text-blue-900 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
              <AlertCircle className="h-3 w-3" />
              Protected
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {partner.name}
              </h3>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                {partner.title}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {partner.description}
          </p>

          {/* Details */}
          <p className="text-xs text-neutral-600 dark:text-neutral-500">
            {partner.details}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 pt-2 text-sm font-semibold text-primary dark:text-primary group-hover:gap-3 transition-all">
            {isProtected ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Already Selected
              </>
            ) : (
              <>
                Select Partner <ArrowRight className="h-4 w-4" />
              </>
            )}
          </div>
        </div>

        {/* Background Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/5 dark:to-white/0 pointer-events-none" />
      </button>

      {partner.tooltipRules && partner.tooltipRules.length > 0 && (
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50"
        >
          {showTooltip && (
            <div className="bg-neutral-900 dark:bg-neutral-950 text-white text-xs rounded-lg p-3 mb-2 whitespace-nowrap shadow-lg border border-neutral-700">
              <p className="font-semibold mb-1">Key Rules:</p>
              <ul className="text-xs space-y-0.5">
                {partner.tooltipRules.slice(0, 3).map((rule, idx) => (
                  <li key={idx}>• {rule}</li>
                ))}
                {partner.tooltipRules.length > 3 && (
                  <li>• +{partner.tooltipRules.length - 3} more rules</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
