import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  role: "seeker" | "recruiter";
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorised" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
