import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_CNN || ''

let db: Db;

export async function connectToDatabase() {
  if (!db) {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("ludastore");
    console.log("Connected to database");
  }
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase first.");
  }
  return db;
}
