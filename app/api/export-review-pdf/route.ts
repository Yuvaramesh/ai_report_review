import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.results) {
      return NextResponse.json(
        { error: "No results provided" },
        { status: 400 },
      );
    }

    const { results } = body;
    const html = generateReportHTML(results);

    // Return HTML that can be printed to PDF by the browser
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (err) {
    console.error("[v0] export error:", err);
    return NextResponse.json(
      { error: "Server error generating export" },
      { status: 500 },
    );
  }
}

function generateReportHTML(results: any): string {
  const errors = Array.isArray(results?.errors) ? results.errors : [];
  const warnings = Array.isArray(results?.warnings) ? results.warnings : [];
  const timestamp = new Date().toLocaleString();
  const partnerName = getPartnerName(results?.partnerId);

  const errorRows = errors
    .map((err: any, idx: any) => {
      const message =
        typeof err === "string" ? err : err?.message || JSON.stringify(err);
      return `
        <tr>
          <td class="px-6 py-3 border-b border-gray-200">${idx + 1}</td>
          <td class="px-6 py-3 border-b border-gray-200">${escapeHtml(
            message,
          )}</td>
          <td class="px-6 py-3 border-b border-gray-200">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Error</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const warningRows = warnings
    .map((w: any, idx: any) => {
      const message =
        typeof w === "string" ? w : w?.message || JSON.stringify(w);
      return `
        <tr>
          <td class="px-6 py-3 border-b border-gray-200">${
            errors.length + idx + 1
          }</td>
          <td class="px-6 py-3 border-b border-gray-200">${escapeHtml(
            message,
          )}</td>
          <td class="px-6 py-3 border-b border-gray-200">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Warning</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const allRows = errorRows + warningRows;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Accounts Review Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      color: #1f2937;
      line-height: 1.6;
    }
    
    @media print {
      body {
        background-color: white;
      }
      .no-print {
        display: none !important;
      }
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 40px;
      border-radius: 8px;
      margin-bottom: 40px;
      text-align: center;
    }
    
    header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    header p {
      font-size: 14px;
      opacity: 0.95;
      margin: 4px 0;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .card.error-card {
      border-left: 4px solid #ef4444;
    }
    
    .card.warning-card {
      border-left: 4px solid #f59e0b;
    }
    
    .card.success-card {
      border-left: 4px solid #10b981;
    }
    
    .card-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .card-value {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }
    
    section {
      margin-bottom: 40px;
    }
    
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    thead {
      background-color: #f3f4f6;
    }
    
    th {
      padding: 12px 24px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 24px;
      text-align: left;
      font-size: 14px;
    }
    
    tr:hover {
      background-color: #f9fafb;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge.error {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .badge.warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px dashed #d1d5db;
    }
    
    .empty-state p {
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      justify-content: center;
    }
    
    button {
      padding: 10px 24px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms;
    }
    
    .btn-primary {
      background-color: #2563eb;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #1d4ed8;
    }
    
    .btn-secondary {
      background-color: #e5e7eb;
      color: #374151;
    }
    
    .btn-secondary:hover {
      background-color: #d1d5db;
    }
  </style>
  <script>
    // Auto-print on load (user can cancel)
    window.onload = function() {
      // Give the page a moment to render
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="no-print controls">
      <button class="btn-primary" onclick="window.print()">Print / Save as PDF</button>
      <button class="btn-secondary" onclick="window.close()">Close</button>
    </div>
    
    <header>
      <h1>AI Accounts Review Report</h1>
      <p><strong>Partner:</strong> ${escapeHtml(partnerName)}</p>
      <p><strong>Generated:</strong> ${timestamp}</p>
      <p><strong>Report ID:</strong> ${generateReportId()}</p>
    </header>
    
    <div class="summary-cards">
      <div class="card error-card">
        <div class="card-label">Errors</div>
        <div class="card-value">${errors.length}</div>
      </div>
      <div class="card warning-card">
        <div class="card-label">Warnings</div>
        <div class="card-value">${warnings.length}</div>
      </div>
      <div class="card success-card">
        <div class="card-label">Status</div>
        <div class="card-value">${
          errors.length === 0 ? "Ready" : "Review"
        }</div>
      </div>
    </div>
    
    ${
      errors.length > 0 || warnings.length > 0
        ? `
    <section>
      <h2>Findings</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">Ref</th>
            <th>Finding</th>
            <th style="width: 120px;">Type</th>
          </tr>
        </thead>
        <tbody>
          ${allRows}
        </tbody>
      </table>
    </section>
        `
        : `
    <section>
      <div class="empty-state">
        <p>✓ No issues found</p>
        <p style="font-size: 13px; color: #9ca3af;">This file appears ready for partner review</p>
      </div>
    </section>
        `
    }
    
    <section>
      <h2>Review Details</h2>
      <table>
        <tr>
          <td style="width: 200px; font-weight: 600; background-color: #f9fafb;">Partner ID</td>
          <td>${escapeHtml(String(results?.partnerId || "N/A"))}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; background-color: #f9fafb;">Scope</td>
          <td>${escapeHtml(results?.scope || "Full")}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; background-color: #f9fafb;">Overall Status</td>
          <td>${
            errors.length === 0
              ? '<span class="badge" style="background-color: #dcfce7; color: #166534;">PASS</span>'
              : '<span class="badge error">REVIEW REQUIRED</span>'
          }</td>
        </tr>
      </table>
    </section>
    
    <footer>
      <p>This report was automatically generated by AI Accounts Review.</p>
      <p>Please review all findings carefully and address errors before partner submission.</p>
    </footer>
  </div>
</body>
</html>`;
}

function getPartnerName(id: any): string {
  const partners: Record<string, string> = {
    "1": "Partner 1 - Strict Benchmark",
    "2": "Partner 2 - Commercial",
    "3": "Partner 3 - Tax-Focused",
    "4": "Partner 4 - Client-Friendly",
    "5": "Partner 5 - Presentation & Consistency",
    "6": "Partner 6 - Light Touch",
    "7": "Partner 7 - Defensive / External",
  };
  return partners[String(id)] || "Unknown Partner";
}

function generateReportId(): string {
  return `RPT-${Date.now().toString().slice(-8)}`;
}

function escapeHtml(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
