import { NextResponse } from "next/server";
import {
  connectDB,
  getReviewsCollection,
  getReviewHistoryCollection,
} from "@/lib/db/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.reviewId || !body.partnerId) {
      return NextResponse.json(
        { error: "Missing required fields: reviewId, partnerId" },
        { status: 400 }
      );
    }

    await connectDB();
    const reviewsCollection = await getReviewsCollection();
    const historyCollection = await getReviewHistoryCollection();

    // Save full review
    const reviewData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const reviewResult = await reviewsCollection.insertOne(reviewData);
    console.log("[v0] Review saved to MongoDB:", reviewResult.insertedId);

    // Save to review history
    const historyData = {
      reviewId: body.reviewId,
      partnerId: body.partnerId,
      timestamp: body.timestamp,
      status: body.status,
      errorCount: body.errorCount,
      warningCount: body.warningCount,
      createdAt: new Date(),
    };

    const historyResult = await historyCollection.insertOne(historyData);
    console.log("[v0] History saved to MongoDB:", historyResult.insertedId);

    return NextResponse.json(
      {
        success: true,
        reviewId: body.reviewId,
        mongoId: reviewResult.insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error saving review to MongoDB:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error saving review";

    // Return graceful response even if MongoDB fails
    return NextResponse.json(
      {
        success: false,
        error: message,
        warning:
          "Review was not saved to database, but review was completed successfully.",
      },
      { status: 500 }
    );
  }
}
