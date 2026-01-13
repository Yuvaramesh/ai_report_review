import { MongoClient, type Db, type Collection } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

if (!process.env.MONGODB_URI) {
  console.warn(
    "[v0] MONGODB_URI not set. Reviews will not be persisted to database."
  );
}

export async function connectDB(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is not set. Please configure MongoDB connection string."
    );
  }

  try {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();

    cachedDb = cachedClient.db("AI-Report");
    console.log("[v0] Connected to MongoDB database: AI-Report");

    // Create collections if they don't exist
    const collections = await cachedDb.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    if (!collectionNames.includes("reviews")) {
      await cachedDb.createCollection("reviews");
      console.log("[v0] Created 'reviews' collection");
    }

    if (!collectionNames.includes("review-history")) {
      await cachedDb.createCollection("review-history");
      console.log("[v0] Created 'review-history' collection");
    }

    return { client: cachedClient, db: cachedDb };
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error);
    throw error;
  }
}

export async function getReviewsCollection(): Promise<Collection> {
  const { db } = await connectDB();
  return db.collection("reviews");
}

export async function getReviewHistoryCollection(): Promise<Collection> {
  const { db } = await connectDB();
  return db.collection("review-history");
}
