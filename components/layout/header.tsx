"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 backdrop-blur-sm dark:border-neutral-800 dark:from-neutral-900/95 dark:to-neutral-900/50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative rounded-xl bg-gradient-to-br from-primary to-primary via-primary p-2.5 shadow-lg">
              <CheckCircle2 className="h-6 w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  AI Accounts Review
                </h1>
                <span className="badge badge-primary">
                  <Sparkles className="h-3 w-3" />
                  Premium
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Pre-Partner Validation & Compliance Check
              </p>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="h-1 w-1 rounded-full bg-success" />
            <span>System Status: Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
