export class PDFGenerator {
  generateHTML(results: any): string {
    const timestamp = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    const errorRows = results.errors
      .map(
        (error: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #991b1b;">${
          error.id || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          error.issue || error.title || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          error.location || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          error.action || ""
        }</td>
      </tr>
    `
      )
      .join("");

    const queryRows = results.queries
      .map(
        (query: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          query.id || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          query.query || query.title || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          query.location || ""
        }</td>
      </tr>
    `
      )
      .join("");

    const presentationRows = results.presentation
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.suggestion || item.title || ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.location || ""
        }</td>
      </tr>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
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
            line-height: 1.6;
            color: #111827;
            background: white;
          }
          .page {
            max-width: 8.5in;
            height: 11in;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          .header {
            border-bottom: 2px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header p {
            color: #4b5563;
            font-size: 14px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 30px 0;
          }
          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .summary-card.errors {
            border-color: #fee2e2;
            background: #fef2f2;
          }
          .summary-card.queries {
            border-color: #fef3c7;
            background: #fffbeb;
          }
          .summary-card.presentation {
            border-color: #dcfce7;
            background: #f0fdf4;
          }
          .summary-card .number {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
          }
          .summary-card.errors .number {
            color: #991b1b;
          }
          .summary-card.queries .number {
            color: #92400e;
          }
          .summary-card.presentation .number {
            color: #166534;
          }
          .summary-card .label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .section-title {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: white;
            padding: 12px 15px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .section-title.errors {
            background: linear-gradient(to right, #dc2626, #f87171);
          }
          .section-title.queries {
            background: linear-gradient(to right, #d97706, #fbbf24);
          }
          .section-title.presentation {
            background: linear-gradient(to right, #16a34a, #86efac);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 12px;
          }
          table th {
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #d1d5db;
          }
          table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .declaration {
            border: 2px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            background: #f9fafb;
            font-size: 12px;
          }
          .declaration h3 {
            margin-bottom: 10px;
            color: #111827;
          }
          .declaration ul {
            list-style: none;
            margin-left: 0;
          }
          .declaration li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
          }
          .declaration li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #16a34a;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
            text-align: center;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 15px;
          }
          .status-badge.ready {
            background: #dcfce7;
            color: #166534;
          }
          .status-badge.not-ready {
            background: #fee2e2;
            color: #991b1b;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              max-width: 100%;
              height: auto;
              margin: 0;
              padding: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>AI Accounts Review Report</h1>
            <p>Partner: <strong>${results.partner.name}</strong> – ${
      results.partner.title
    }</p>
            <p>Generated: ${timestamp} at ${time}</p>
          </div>

          <div class="status-badge ${
            results.errors.length === 0 ? "ready" : "not-ready"
          }">
            ${
              results.errors.length === 0
                ? "READY FOR PARTNER REVIEW"
                : "REQUIRES CORRECTIONS"
            }
          </div>

          <div class="summary-cards">
            <div class="summary-card errors">
              <div class="label">Errors</div>
              <div class="number">${results.errors.length}</div>
              <div style="font-size: 11px; color: #666;">Must fix</div>
            </div>
            <div class="summary-card queries">
              <div class="label">Queries</div>
              <div class="number">${results.queries.length}</div>
              <div style="font-size: 11px; color: #666;">Partner decision</div>
            </div>
            <div class="summary-card presentation">
              <div class="label">Presentation</div>
              <div class="number">${results.presentation.length}</div>
              <div style="font-size: 11px; color: #666;">Suggestions</div>
            </div>
          </div>

          ${
            results.errors.length > 0
              ? `
            <div class="section">
              <div class="section-title errors">Errors</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Issue</th>
                    <th>Location</th>
                    <th>Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  ${errorRows}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          ${
            results.queries.length > 0
              ? `
            <div class="section">
              <div class="section-title queries">Queries</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Query</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  ${queryRows}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          ${
            results.presentation.length > 0
              ? `
            <div class="section">
              <div class="section-title presentation">Presentation Suggestions</div>
              <table>
                <thead>
                  <tr>
                    <th>Suggestion</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  ${presentationRows}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <div class="declaration">
            <h3>Declaration</h3>
            <ul>
              <li>Does not amend figures or post journals</li>
              <li>Highlights issues for correction prior to partner review</li>
              <li>AI-generated review using ${results.partner.name} ruleset</li>
            </ul>
          </div>

          <div class="footer">
            <p>This report was generated by AI Accounts Review System on ${timestamp}</p>
            <p>Review Scope: ${results.config.scope} | Total Findings: ${
      results.totalFindings
    }</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
