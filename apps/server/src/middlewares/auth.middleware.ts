import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";

export interface AuthPayload {
  userId: string;
  role: "seeker" | "recruiter";
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authorisation required"));
    return;
  }

  const token = header.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    next(new AppError(500, "Server misconfiguration: JWT_SECRET not set"));
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(role: "seeker" | "recruiter") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== role) {
      next(new AppError(403, `Access restricted to ${role}s`));
      return;
    }
    next();
  };
}
