import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

interface MongoError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  if (err instanceof Error) {
    if (err.name === "ValidationError") {
      res.status(400).json({ status: "error", message: err.message });
      return;
    }

    if (err.name === "CastError") {
      res.status(400).json({ status: "error", message: "Invalid ID format" });
      return;
    }

    if (err.name === "JsonWebTokenError") {
      res.status(401).json({ status: "error", message: "Invalid token" });
      return;
    }

    if (err.name === "TokenExpiredError") {
      res.status(401).json({ status: "error", message: "Token expired" });
      return;
    }
  }

  const mongoErr = err as MongoError;
  if (mongoErr?.code === 11000) {
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? "field";
    res.status(409).json({
      status: "error",
      message: `A record with this ${field} already exists`,
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Internal server error",
  });
}
