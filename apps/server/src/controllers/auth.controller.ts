import { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../models/index.js";
import { AppError } from "../middlewares/error.middleware.js";

function assertDB(next: NextFunction): boolean {
  if (mongoose.connection.readyState !== 1) {
    next(
      new AppError(
        503,
        "Database not connected. Set MONGODB_URI in .env to enable accounts."
      )
    );
    return false;
  }
  return true;
}

function signToken(userId: string, role: string, email: string): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new AppError(500, "JWT_SECRET is not set");
  return jwt.sign({ userId, role, email }, secret, { expiresIn: "7d" });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!assertDB(next)) return;
  try {
    const { role, fullName, email, password, location, companyName } =
      req.body as {
        role?: string;
        fullName?: string;
        email?: string;
        password?: string;
        location?: string;
        companyName?: string;
      };

    if (!role || !fullName || !email || !password || !location) {
      next(new AppError(400, "All fields are required"));
      return;
    }
    if (role !== "seeker" && role !== "recruiter") {
      next(new AppError(400, "Invalid role"));
      return;
    }
    if (password.length < 8) {
      next(new AppError(400, "Password must be at least 8 characters"));
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      next(new AppError(409, "An account with this email already exists"));
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      role,
      fullName,
      email: email.toLowerCase(),
      password: hashed,
      location,
      ...(role === "recruiter" && companyName ? { companyName } : {}),
    });

    const token = signToken(String(user._id), user.role, user.email);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!assertDB(next)) return;
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      next(new AppError(400, "Email and password are required"));
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      next(new AppError(401, "Invalid email or password"));
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      next(new AppError(401, "Invalid email or password"));
      return;
    }

    const token = signToken(String(user._id), user.role, user.email);
    res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}
