export async function generatePDFFromResults(results: any) {
  try {
    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const data = await response.json();
    if (!data.html) throw new Error("No HTML generated");

    // Create iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Could not access iframe document");

    iframeDoc.open();
    iframeDoc.write(data.html);
    iframeDoc.close();

    // Wait for content to load then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 500);
    };

    // Clean up after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  } catch (error) {
    console.error("[v0] PDF generation failed:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
