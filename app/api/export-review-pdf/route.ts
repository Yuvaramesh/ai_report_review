import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Keep this simple while you implement an actual PDF generator.
    // We accept JSON results and return "Not implemented" so the UI can handle it gracefully.
    const body = await req.json().catch(() => null);

    console.log(
      "[v0] export-review-pdf called, payload keys:",
      body ? Object.keys(body) : "none"
    );

    return NextResponse.json(
      { error: "Export endpoint not yet implemented" },
      { status: 501 }
    );
  } catch (err) {
    console.error("[v0] export error:", err);
    return NextResponse.json(
      { error: "Server error generating export" },
      { status: 500 }
    );
  }
}
