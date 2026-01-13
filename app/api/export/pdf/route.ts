import { PDFGenerator } from "@/lib/export/pdf-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { results } = body;

    if (!results) {
      return new Response(JSON.stringify({ error: "Missing results" }), {
        status: 400,
      });
    }

    const generator = new PDFGenerator();
    const html = generator.generateHTML(results);

    return new Response(
      JSON.stringify({
        success: true,
        html,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[v0] PDF export error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
    });
  }
}
