"use server";
import { NextResponse } from "next/server";
import { parseDocumentsWithAI, applyPartnerRules } from "@/lib/review";
import util from "util";

/**
 * Robust file reader for formData values returned by req.formData().get(...)
 * Tries text(), arrayBuffer(), stream(), Buffer-like etc.
 */
async function fileToText(file: any): Promise<string> {
  if (file == null) throw new Error("No file provided");

  if (typeof file === "string") return file;

  if (typeof file.text === "function") {
    return await file.text();
  }

  if (typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    return new TextDecoder().decode(ab);
  }

  if (typeof file.stream === "function") {
    const stream = file.stream();
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        if (typeof value === "string") {
          chunks.push(new TextEncoder().encode(value));
        } else {
          chunks.push(value);
        }
      }
    }
    const length = chunks.reduce((s, c) => s + c.length, 0);
    const merged = new Uint8Array(length);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return new TextDecoder().decode(merged);
  }

  // multer-style: file.buffer
  if (typeof Buffer !== "undefined") {
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      return file.buffer.toString("utf-8");
    }
    if (Buffer.isBuffer(file)) {
      return file.toString("utf-8");
    }
  }

  // Typed arrays / ArrayBuffer
  if (file instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(file));
  }
  if (ArrayBuffer.isView(file)) {
    return new TextDecoder().decode(
      new Uint8Array(file.buffer, file.byteOffset, file.byteLength)
    );
  }

  // Some multipart libraries put the file content in `data` or `content`
  if (
    file.data &&
    (file.data instanceof Uint8Array ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer(file.data)))
  ) {
    const payload = file.data;
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(payload))
      return payload.toString("utf-8");
    return new TextDecoder().decode(payload);
  }
  if (
    file.content &&
    (file.content instanceof Uint8Array ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer(file.content)))
  ) {
    const payload = file.content;
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(payload))
      return payload.toString("utf-8");
    return new TextDecoder().decode(payload);
  }

  const debug = {
    typeOf: typeof file,
    constructorName: file && file.constructor ? file.constructor.name : null,
    keys: Array.isArray(file) ? "array" : Object.keys(file || {}),
    proto:
      file && Object.getPrototypeOf(file)
        ? Object.getPrototypeOf(file).constructor?.name
        : null,
  };

  console.error(
    "[v0] Unsupported file object shape in fileToText():",
    util.inspect(debug, { depth: 2 })
  );

  throw new Error(
    "Unsupported file object (no text/arrayBuffer/stream/buffer). Server logged object shape for debugging."
  );
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const accountsFile = formData.get("accountsFile");
    const trialBalanceFile = formData.get("trialBalanceFile");
    const partnerIdRaw = formData.get("partnerId");
    const scope = String(formData.get("scope") ?? "");

    // partnerId may come as string or number
    const partnerId = partnerIdRaw != null ? String(partnerIdRaw) : null;

    if (!accountsFile || !trialBalanceFile) {
      return NextResponse.json(
        {
          error:
            "Missing files: accountsFile and trialBalanceFile are required.",
          errors: [],
        },
        { status: 400 }
      );
    }

    // Helpful debug: log constructor names so you can confirm File/Blob was received
    try {
      console.log("[v0] Received files:", {
        accountsType: accountsFile?.constructor?.name,
        trialBalanceType: trialBalanceFile?.constructor?.name,
      });
    } catch {}

    // Convert files to text (may throw with debugging output)
    const accountsText = await fileToText(accountsFile);
    const trialBalanceText = await fileToText(trialBalanceFile);

    // Parse/extract document content using a single function (replace with your AI)
    // after parsing:
    const parsed = await parseDocumentsWithAI([
      { name: "accounts", text: accountsText },
      { name: "trialBalance", text: trialBalanceText },
    ]);

    // Add this debug log to confirm extracted values:
    console.log(
      "[v0] parsed documents:",
      parsed.documents.map((d) => ({
        name: d.name,
        extracted: d.extracted,
        length: d.text?.length,
      }))
    );

    const ruleResults = applyPartnerRules(
      String(partnerId ?? "unknown"),
      scope,
      parsed
    );
    console.log("[v0] ruleResults:", ruleResults);

    // Build response — always include errors array for front-end stability
    const response = {
      partnerId,
      scope,
      parsed,
      rules: ruleResults,
      errors: ruleResults.errors ?? [],
      message: "Files received, parsed, and rules applied.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[v0] Review API error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message, errors: [] }, { status: 500 });
  }
}
