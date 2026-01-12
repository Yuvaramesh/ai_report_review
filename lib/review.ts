// Simple parsing + rules example — replace parseDocumentsWithAI with your real AI/parsing implementation.
// This module returns a consistent `parsed` shape and `rules` results for the API above.

export type ParsedDocument = {
  name: string;
  text: string;
  extracted?: Record<string, any>;
};

export async function parseDocumentsWithAI(
  docs: Array<{ name: string; text: string }>
): Promise<{
  documents: ParsedDocument[];
  meta?: Record<string, any>;
}> {
  // Simple placeholder parser: try to detect numeric totals or headings via regex.
  const parsed: ParsedDocument[] = docs.map((d) => {
    const text = d.text ?? "";

    // Attempt to find a "Total assets" line or "Total" followed by number
    const totalMatch = text.match(
      /(?:total assets|total)\s*[:\-]?\s*([\d,\.]+)/i
    );
    const yearMatch = text.match(/(\b20\d{2}\b)/); // naive year extraction
    const companyMatch = text.match(
      /(Company|Entity|Name)\s*[:\-]?\s*([A-Za-z0-9 &.,-]+)/i
    );

    const extracted: Record<string, any> = {};
    if (totalMatch) extracted.total = totalMatch[1];
    if (yearMatch) extracted.year = yearMatch[1];
    if (companyMatch) extracted.company = companyMatch[2].trim();

    return {
      name: d.name,
      text,
      extracted,
    };
  });

  // If you want to call an LLM or OCR service, do it here and fill extracted fields.
  return { documents: parsed, meta: { parsedAt: new Date().toISOString() } };
}

/**
 * Example set of partner rules. In a real app load from DB.
 * Each partner has an array of rule checkers — simple functions that
 * return { ok: boolean, message: string, severity: 'error'|'warning' }.
 */
type RuleResult = {
  ok: boolean;
  message: string;
  severity: "error" | "warning";
};
type RulesOutcome = {
  errors: RuleResult[];
  warnings: RuleResult[];
  passed: boolean;
};

const partnerRules: Record<
  string,
  Array<
    (
      parsed: { documents: ParsedDocument[]; meta?: any },
      scope: string
    ) => RuleResult | null
  >
> = {
  // partner "1" expects there to be a total and year present
  "1": [
    (parsed) => {
      const tb = parsed.documents.find((d) => d.name === "trialBalance");
      if (!tb)
        return {
          ok: false,
          message: "Missing trial balance content",
          severity: "error",
        };
      if (!tb.extracted?.total)
        return {
          ok: false,
          message: "Trial balance total not found",
          severity: "error",
        };
      return {
        ok: true,
        message: "Trial balance contains total",
        severity: "warning",
      };
    },
    (parsed) => {
      const ac = parsed.documents.find((d) => d.name === "accounts");
      if (!ac)
        return {
          ok: false,
          message: "Missing accounts file content",
          severity: "error",
        };
      if (!ac.extracted?.company)
        return {
          ok: false,
          message: "Company name not found in accounts",
          severity: "warning",
        };
      return {
        ok: true,
        message: "Accounts parsed for company",
        severity: "warning",
      };
    },
  ],
  // default partner rules — e.g., require at least some text
  default: [
    (parsed) => {
      const totalLength = parsed.documents.reduce(
        (s, d) => s + (d.text?.length ?? 0),
        0
      );
      if (totalLength < 50)
        return {
          ok: false,
          message: "Uploaded files appear to be empty or too short",
          severity: "error",
        };
      return { ok: true, message: "Files contain text", severity: "warning" };
    },
  ],
};

export function applyPartnerRules(
  partnerId: string,
  scope: string,
  parsed: { documents: ParsedDocument[]; meta?: any }
): RulesOutcome {
  const rules = partnerRules[partnerId] ?? partnerRules["default"];
  const errors: RuleResult[] = [];
  const warnings: RuleResult[] = [];

  for (const rule of rules) {
    try {
      const r = rule(parsed, scope);
      if (!r) continue;
      if (r.ok === false && r.severity === "error") errors.push(r);
      else if (r.ok === false && r.severity === "warning") warnings.push(r);
      else if (r.ok === true && r.severity === "warning") warnings.push(r);
      // ok:true & severity:error shouldn't happen — treat as warning
    } catch (err) {
      errors.push({
        ok: false,
        message: "Rule evaluation error",
        severity: "error",
      });
    }
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0,
  };
}
