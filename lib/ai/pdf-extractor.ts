const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Extract text from PDF buffer using regex pattern matching
 * This handles text-based PDFs by parsing the PDF binary format
 */
function extractTextFromPDFBuffer(buffer: Buffer): string {
  try {
    // Convert buffer to binary string for text extraction
    const binaryString = buffer.toString("binary");

    // Regular expression to find text objects in PDF
    // PDF stores text in BT...ET blocks with Tj and TJ operators
    const textPattern = /BT[\s\S]*?ET/g;
    const matches = binaryString.match(textPattern) || [];

    const texts: string[] = [];

    for (const match of matches) {
      // Extract strings in parentheses or angle brackets
      const stringPatterns = [
        /$$(.*?)$$/g, // Strings in parentheses
        /<([0-9A-Fa-f]+)>/g, // Hex strings
      ];

      for (const pattern of stringPatterns) {
        let m;
        while ((m = pattern.exec(match)) !== null) {
          let text = m[1];

          // Decode hex strings
          if (pattern.source.includes("0-9A-Fa-f")) {
            try {
              text = Buffer.from(text, "hex").toString("utf8", 0, 50);
            } catch {
              continue;
            }
          }

          // Clean and add valid text
          text = text
            .replace(/\\/g, "")
            .replace(/[^\x20-\x7E\n\t]/g, "")
            .trim();

          if (text.length > 2 && text.length < 500) {
            texts.push(text);
          }
        }
      }
    }

    if (texts.length > 0) {
      const result = texts.join("\n").trim();
      console.log(
        `[v0] Extracted ${result.length} characters via PDF text parsing`
      );
      return result;
    }

    throw new Error("No text found via text pattern extraction");
  } catch (error) {
    console.warn(
      "[v0] Text pattern extraction failed:",
      error instanceof Error ? error.message : error
    );
    return "";
  }
}

/**
 * Fallback: Extract raw printable characters from PDF
 */
function extractRawTextFromPDF(buffer: Buffer): string {
  try {
    const text = buffer.toString("latin1");

    // Extract sequences of printable characters
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);

      // Keep printable ASCII and common accented characters
      if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
        if (char === "\n" || char === "\r") {
          if (currentLine.length > 2) {
            lines.push(currentLine.trim());
          }
          currentLine = "";
        } else {
          currentLine += char;
        }
      }
    }

    if (currentLine.length > 2) {
      lines.push(currentLine.trim());
    }

    const result = lines.filter((l) => l.length > 0).join("\n");
    console.log(
      `[v0] Extracted ${result.length} characters via raw text extraction`
    );
    return result;
  } catch (error) {
    console.error("[v0] Raw text extraction failed:", error);
    return "";
  }
}

/**
 * Main PDF extraction function with multi-stage fallback strategy
 */
export async function extractPDFTextWithFallback(
  buffer: Buffer,
  filename?: string
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return "[PDF_EMPTY]\n\nFile is empty or not a valid PDF.";
  }

  console.log(
    `[v0] Starting PDF extraction for: ${filename} (${buffer.length} bytes)`
  );

  // Stage 1: Try structured text extraction (fast and reliable for text PDFs)
  console.log("[v0] Stage 1: Attempting structured text extraction...");
  let extractedText = extractTextFromPDFBuffer(buffer);

  if (extractedText && extractedText.length > 150) {
    console.log(
      `[v0] Success! Extracted ${extractedText.length} characters at Stage 1`
    );
    return extractedText;
  }

  // Stage 2: Try raw character extraction (catches PDFs with different encodings)
  console.log("[v0] Stage 2: Attempting raw character extraction...");
  extractedText = extractRawTextFromPDF(buffer);

  if (extractedText && extractedText.length > 150) {
    console.log(
      `[v0] Success! Extracted ${extractedText.length} characters at Stage 2`
    );
    return extractedText;
  }

  // Stage 3: If we got some text but less than expected, use it anyway
  if (extractedText && extractedText.length > 50) {
    console.log(
      `[v0] Partial extraction successful: ${extractedText.length} characters`
    );
    return extractedText;
  }

  // Stage 4: Last resort - return diagnostic message
  console.error(`[v0] Failed to extract text from PDF: ${filename}`);
  return `[PDF_EXTRACTION_FAILED: ${
    filename || "unknown"
  }]\n\nCould not extract text content from this PDF. The file may be:\n- Encrypted or password-protected\n- Corrupted\n- A scanned image without OCR\n- In an unsupported format\n\nPlease verify the file and try again.`;
}
