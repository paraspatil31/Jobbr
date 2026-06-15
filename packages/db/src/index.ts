import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Set it when you're ready to connect MongoDB.");
  }
  await mongoose.connect(uri);
}

export * from "./models/index.js";
