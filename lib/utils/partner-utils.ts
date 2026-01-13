export interface PartnerProfile {
  id: number
  name: string
  profileType: string
  strictness: "Light" | "Medium" | "High" | "Maximum"
  color: string
  bgColor: string
  borderColor: string
  icon: string
  ruleCount: number
}

export const partnerProfiles: Record<number, PartnerProfile> = {
  1: {
    id: 1,
    name: "Partner 1",
    profileType: "Strict Benchmark",
    strictness: "Maximum",
    color: "text-red-700",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
    icon: "🔒",
    ruleCount: 20,
  },
  2: {
    id: 2,
    name: "Partner 2",
    profileType: "Commercial",
    strictness: "High",
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
    icon: "💼",
    ruleCount: 5,
  },
  3: {
    id: 3,
    name: "Partner 3",
    profileType: "Tax-Focused",
    strictness: "High",
    color: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-900",
    icon: "📊",
    ruleCount: 6,
  },
  4: {
    id: 4,
    name: "Partner 4",
    profileType: "Client-Friendly",
    strictness: "Medium",
    color: "text-green-700",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-900",
    icon: "🤝",
    ruleCount: 3,
  },
  5: {
    id: 5,
    name: "Partner 5",
    profileType: "Presentation & Consistency",
    strictness: "Medium",
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900",
    icon: "✨",
    ruleCount: 3,
  },
  6: {
    id: 6,
    name: "Partner 6",
    profileType: "Light Touch",
    strictness: "Light",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-900",
    icon: "☁️",
    ruleCount: 2,
  },
  7: {
    id: 7,
    name: "Partner 7",
    profileType: "Defensive / External",
    strictness: "Maximum",
    color: "text-slate-700",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-900",
    icon: "⚖️",
    ruleCount: 7,
  },
}

export function getPartnerProfile(partnerId: number | string): PartnerProfile {
  const id = Number(partnerId)
  return partnerProfiles[id] || partnerProfiles[1]
}

export function getStrictnessBadgeColor(strictness: "Light" | "Medium" | "High" | "Maximum"): string {
  switch (strictness) {
    case "Light":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Medium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
    case "High":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "Maximum":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}
