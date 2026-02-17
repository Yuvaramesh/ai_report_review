import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { parseDocumentsWithAI } from "@/lib/ai/openai-parser";
import { extractPDFTextWithFallback } from "@/lib/ai/pdf-extractor";
import { ReviewEngine } from "@/lib/engine/review-engine";

async function fileToBuffer(file: any): Promise<Buffer> {
  if (file == null) throw new Error("No file provided");

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(file)) {
    return file;
  }

  if (
    file.buffer &&
    typeof Buffer !== "undefined" &&
    Buffer.isBuffer(file.buffer)
  ) {
    return file.buffer;
  }

  if (typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    return Buffer.from(ab);
  }

  if (typeof file.stream === "function") {
    const stream = file.stream();
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(Buffer.from(value));
      }
    }
    return Buffer.concat(chunks);
  }

  if (typeof file === "string") {
    if (file.startsWith("data:")) {
      const comma = file.indexOf(",");
      const base64 = file.slice(comma + 1);
      return Buffer.from(base64, "base64");
    }
    return Buffer.from(file, "utf8");
  }

  if (file instanceof ArrayBuffer) return Buffer.from(file);
  if (ArrayBuffer.isView(file))
    return Buffer.from(file.buffer, file.byteOffset, file.byteLength);

  throw new Error("Unsupported file object shape");
}

async function extractTextFromBuffer(
  buffer: Buffer,
  filename?: string,
  mime?: string,
): Promise<string> {
  const header = buffer.slice(0, 8).toString("utf8", 0, 8);

  // PDF detection and extraction
  if (header.startsWith("%PDF")) {
    return await extractPDFTextWithFallback(buffer, filename);
  }

  // XLSX/Excel detection
  const zipHeader = buffer.slice(0, 4).toString("hex");
  if (
    zipHeader === "504b0304" ||
    (filename && filename.toLowerCase().endsWith(".xlsx")) ||
    (mime && String(mime).includes("spreadsheet"))
  ) {
    try {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetTexts: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheetTexts.push(`=== SHEET: ${sheetName} ===\n${csv}`);
      }
      return sheetTexts.join("\n\n");
    } catch (err) {
      console.error("[AI Review] xlsx parse error:", err);
      throw new Error("Failed to extract text from spreadsheet");
    }
  }

  // Fallback: treat as UTF-8 text
  return buffer.toString("utf8");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const accountsFile = formData.get("accountsFile");
    const trialBalanceFile = formData.get("trialBalanceFile");
    const priorYearAccountsFile = formData.get("priorYearAccountsFile"); // NEW: Optional prior year
    const partnerIdRaw = formData.get("partnerId");
    const scope = String(formData.get("scope") ?? "");
    const useAI = String(formData.get("useAI") ?? "true") === "true"; // NEW: AI toggle

    if (!accountsFile || !trialBalanceFile) {
      return NextResponse.json(
        {
          error:
            "Missing files: accountsFile and trialBalanceFile are required.",
          errors: [],
        },
        { status: 400 },
      );
    }

    console.log(
      `[AI Review] Processing files with AI ${useAI ? "enabled" : "disabled"}...`,
    );

    // Extract current year files
    const accountsBuffer = await fileToBuffer(accountsFile);
    const trialBuffer = await fileToBuffer(trialBalanceFile);

    const accountsText = await extractTextFromBuffer(
      accountsBuffer,
      (accountsFile as any)?.name,
      (accountsFile as any)?.type,
    );
    const trialText = await extractTextFromBuffer(
      trialBuffer,
      (trialBalanceFile as any)?.name,
      (trialBalanceFile as any)?.type,
    );

    console.log("[AI Review] Extracted text lengths:", {
      accounts: accountsText.length,
      trial: trialText.length,
    });

    // Parse current year with AI
    console.log("[AI Review] Parsing documents with AI...");
    const parsed = await parseDocumentsWithAI([accountsText, trialText]);

    // Extract and parse prior year if provided
    let priorYearParsed = null;
    if (priorYearAccountsFile) {
      try {
        console.log("[AI Review] Processing prior year accounts...");
        const priorBuffer = await fileToBuffer(priorYearAccountsFile);
        const priorText = await extractTextFromBuffer(
          priorBuffer,
          (priorYearAccountsFile as any)?.name,
          (priorYearAccountsFile as any)?.type,
        );

        priorYearParsed = await parseDocumentsWithAI([priorText]);
        console.log("[AI Review] Prior year parsed successfully");
      } catch (error) {
        console.error("[AI Review] Prior year parsing failed:", error);
        // Continue without prior year comparison
      }
    }

    const partnerId = partnerIdRaw != null ? Number(partnerIdRaw) : 1;

    // Run enhanced review with AI
    console.log(
      `[AI Review] Running ${useAI ? "AI-enhanced" : "traditional"} review for Partner ${partnerId}...`,
    );
    const engine = new ReviewEngine(partnerId, useAI);
    const reviewResults = await engine.runReview(
      parsed,
      null, // trialBalance data would be extracted from parsed
      priorYearParsed,
      scope,
    );

    console.log("[AI Review] Review completed:", {
      errors: reviewResults.errors.length,
      queries: reviewResults.queries.length,
      presentation: reviewResults.presentation.length,
      aiEnhanced: reviewResults.aiEnhanced,
    });

    const response = {
      partnerId,
      scope,
      parsed,
      errors: reviewResults.errors,
      queries: reviewResults.queries,
      presentation: reviewResults.presentation,
      warnings: [], // For backward compatibility
      totalFindings: reviewResults.totalFindings,
      aiEnhanced: reviewResults.aiEnhanced,
      executiveSummary: reviewResults.executiveSummary,
      aiInsights: reviewResults.aiInsights,
      message:
        reviewResults.executiveSummary || "Review completed successfully.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[AI Review] API error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json(
      {
        error: message,
        errors: [],
        warnings: [],
        queries: [],
        presentation: [],
      },
      { status: 500 },
    );
  }
}
