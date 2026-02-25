import jsPDF from "jspdf";

export class PDFGenerator {
  generatePDF(results: any, filename = "review-report.pdf"): Blob {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Set default font
    doc.setFont("helvetica", "normal");

    // ===== HEADER =====
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175); // Blue
    doc.text("AI Accounts Review Report", margin, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray
    doc.text(
      `Partner: ${results.partner?.name || "N/A"} – ${results.partner?.title || "N/A"}`,
      margin,
      yPosition,
    );
    yPosition += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // ===== STATUS BADGE =====
    const isReady = results.errors?.length === 0;
    const statusText = isReady
      ? "READY FOR PARTNER REVIEW"
      : "REQUIRES CORRECTIONS";
    const statusColor = isReady ? [220, 252, 231] : [254, 226, 226]; // Green or Red background
    const statusTextColor = isReady ? [22, 101, 52] : [153, 27, 27]; // Green or Red text

    // Draw status box
    doc.setFillColor(...statusColor);
    doc.setDrawColor(...statusTextColor);
    doc.rect(margin, yPosition - 4, contentWidth, 8, "F");
    doc.setFontSize(9);
    doc.setTextColor(...statusTextColor);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, margin + 5, yPosition + 1);
    yPosition += 12;

    // ===== SUMMARY CARDS =====
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const cardWidth = (contentWidth - 4) / 3;
    const cardHeight = 18;
    const cards = [
      {
        label: "Errors",
        value: results.errors?.length || 0,
        bgColor: [254, 242, 242],
        borderColor: [220, 38, 38],
        textColor: [153, 27, 27],
      },
      {
        label: "Queries",
        value: results.queries?.length || 0,
        bgColor: [255, 251, 235],
        borderColor: [217, 119, 6],
        textColor: [146, 64, 14],
      },
      {
        label: "Presentation",
        value: results.presentation?.length || 0,
        bgColor: [240, 253, 244],
        borderColor: [22, 163, 74],
        textColor: [22, 101, 52],
      },
    ];

    cards.forEach((card, idx) => {
      const x = margin + idx * (cardWidth + 2);
      doc.setFillColor(...card.bgColor);
      doc.setDrawColor(...card.borderColor);
      doc.rect(x, yPosition, cardWidth, cardHeight, "FD");

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(card.label, x + 2, yPosition + 5);

      doc.setFontSize(14);
      doc.setTextColor(...card.textColor);
      doc.setFont("helvetica", "bold");
      doc.text(card.value.toString(), x + cardWidth / 2, yPosition + 12, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
    });

    yPosition += cardHeight + 12;

    // ===== AI SUMMARY =====
    this.addSection(
      doc,
      "AI Executive Summary",
      margin,
      yPosition,
      contentWidth,
      pageWidth,
      pageHeight,
    );
    yPosition += 8;

    const summaryText = `This accounts review for ${results.partner?.name || "Partner"} identified ${results.errors?.length || 0} error(s) and ${results.queries?.length || 0} query/recommendation(s). ${
      results.errors?.length === 0
        ? "The file is ready for partner review."
        : `${results.errors?.length} critical error(s) must be addressed before partner review. Additionally, ${results.queries?.length || 0} query/recommendation(s) have been flagged for attention.`
    } Please review the detailed findings section for specific actions required.`;

    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 4);
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    summaryLines.forEach((line: string) => {
      if (yPosition + 5 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin + 2, yPosition);
      yPosition += 4;
    });

    yPosition += 6;

    // ===== ERRORS SECTION =====
    if (results.errors?.length > 0) {
      yPosition = this.addFindingsTable(
        doc,
        "Errors",
        results.errors,
        ["ID", "Issue", "Location", "Action"],
        margin,
        yPosition,
        contentWidth,
        pageWidth,
        pageHeight,
        [153, 27, 27],
      );
    }

    // ===== QUERIES SECTION =====
    if (results.queries?.length > 0) {
      yPosition = this.addFindingsTable(
        doc,
        "Queries",
        results.queries,
        ["ID", "Query", "Location"],
        margin,
        yPosition,
        contentWidth,
        pageWidth,
        pageHeight,
        [146, 64, 14],
      );
    }

    // ===== PRESENTATION SECTION =====
    if (results.presentation?.length > 0) {
      yPosition = this.addFindingsTable(
        doc,
        "Presentation Suggestions",
        results.presentation,
        ["Suggestion", "Location"],
        margin,
        yPosition,
        contentWidth,
        pageWidth,
        pageHeight,
        [22, 101, 52],
      );
    }

    // ===== PARSED DATA SECTION =====
    if (results.parsed) {
      if (yPosition + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      this.addSection(
        doc,
        "Parsed Data",
        margin,
        yPosition,
        contentWidth,
        pageWidth,
        pageHeight,
      );
      yPosition += 8;

      const parsedText = JSON.stringify(results.parsed, null, 2);
      const parsedLines = doc.splitTextToSize(parsedText, contentWidth - 4);
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 70);
      doc.setFont("courier", "normal");

      parsedLines.forEach((line: string, idx: number) => {
        if (idx > 20) return; // Limit to prevent huge documents
        if (yPosition + 3 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin + 2, yPosition);
        yPosition += 3;
      });

      if (parsedLines.length > 20) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        if (yPosition + 3 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(
          `... (${parsedLines.length - 20} more lines)`,
          margin + 2,
          yPosition,
        );
      }

      yPosition += 6;
    }

    // ===== DECLARATION =====
    if (yPosition + 20 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(209, 213, 219);
    doc.rect(margin, yPosition - 2, contentWidth, 20, "FD");

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Declaration", margin + 3, yPosition + 2);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(
      "✓ Does not amend figures or post journals",
      margin + 5,
      yPosition + 7,
    );
    doc.text(
      "✓ Highlights issues for correction prior to partner review",
      margin + 5,
      yPosition + 11,
    );
    doc.text(
      `✓ AI-generated review using ${results.partner?.name || "Partner"} ruleset`,
      margin + 5,
      yPosition + 15,
    );

    yPosition += 22;

    // ===== FOOTER =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by AI Accounts Review System | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" },
      );
    }

    return doc.output("blob");
  }

  private addSection(
    doc: jsPDF,
    title: string,
    x: number,
    y: number,
    width: number,
    pageWidth: number,
    pageHeight: number,
  ): number {
    const margin = 15;
    if (y + 8 > pageHeight - margin) {
      doc.addPage();
      return margin;
    }

    doc.setFillColor(30, 64, 175);
    doc.rect(x, y - 4, width, 8, "F");

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 3, y + 1);
    doc.setFont("helvetica", "normal");

    return y;
  }

  private addFindingsTable(
    doc: jsPDF,
    title: string,
    findings: any[],
    columns: string[],
    x: number,
    y: number,
    width: number,
    pageWidth: number,
    pageHeight: number,
    titleColor: [number, number, number],
  ): number {
    const margin = 15;
    if (y + 15 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Section title
    doc.setFillColor(...titleColor);
    doc.rect(x, y - 4, width, 8, "F");

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 3, y + 1);
    doc.setFont("helvetica", "normal");

    y += 10;

    // Table header
    const colWidth = (width - 4) / columns.length;
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");

    columns.forEach((col, idx) => {
      doc.text(col, x + 2 + idx * colWidth, y, { maxWidth: colWidth - 2 });
    });

    y += 6;
    doc.setLineWidth(0.3);
    doc.line(x, y - 1, x + width, y - 1);

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);

    findings.forEach((finding) => {
      if (y + 5 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      // Get values for columns
      const values = columns.map((col) => {
        if (col === "ID") return finding.id || "";
        if (col === "Issue") return finding.issue || finding.item || "";
        if (col === "Query") return finding.query || "";
        if (col === "Suggestion") return finding.suggestion || "";
        if (col === "Location") return finding.location || "";
        if (col === "Action") return finding.action || "";
        return "";
      });

      // Draw row
      values.forEach((value, idx) => {
        const text = String(value).substring(0, 30);
        doc.text(text, x + 2 + idx * colWidth, y, { maxWidth: colWidth - 2 });
      });

      y += 5;
      doc.setLineWidth(0.1);
      doc.setDrawColor(229, 231, 235);
      doc.line(x, y - 1, x + width, y - 1);
    });

    return y + 4;
  }

  // Backward compatibility method
  generateHTML(results: any): string {
    return "<html><body>Use generatePDF method instead</body></html>";
  }
}
