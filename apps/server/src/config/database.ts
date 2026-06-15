import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

let _memServer: import("mongodb-memory-server").MongoMemoryServer | undefined;

async function startInMemory(): Promise<string> {
  logger.warn("Falling back to in-memory MongoDB (data resets on restart)");
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  _memServer = await MongoMemoryServer.create();
  return _memServer.getUri();
}

export async function connectDB(): Promise<void> {
  const uri = process.env["MONGODB_URI"];

  if (!uri) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error(
        "MONGODB_URI is required in production. Set it in your environment variables."
      );
    }
    logger.warn(
      "MONGODB_URI not set — starting in-memory MongoDB for development"
    );
    const memUri = await startInMemory();
    await mongoose.connect(memUri);
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    if (process.env["NODE_ENV"] === "production") {
      throw err;
    }
    logger.warn(
      { err },
      "Atlas connection failed — falling back to in-memory MongoDB"
    );
    const memUri = await startInMemory();
    await mongoose.connect(memUri);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (_memServer) {
    await _memServer.stop();
    _memServer = undefined;
  }
}

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});
