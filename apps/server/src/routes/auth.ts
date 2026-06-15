import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "@workspace/db";

function checkDB(res: import("express").Response): boolean {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Database not connected. Add MONGODB_URI in Secrets to enable accounts." });
    return false;
  }
  return true;
}

const router: IRouter = Router();

function signToken(userId: string, role: string, email: string): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId, role, email }, secret, { expiresIn: "7d" });
}

router.post("/auth/register", async (req, res) => {
  if (!checkDB(res)) return;
  try {
    const { role, fullName, email, password, location, companyName } = req.body as {
      role?: string;
      fullName?: string;
      email?: string;
      password?: string;
      location?: string;
      companyName?: string;
    };

    if (!role || !fullName || !email || !password || !location) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (role !== "seeker" && role !== "recruiter") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
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
      user: { id: user._id, role: user.role, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  if (!checkDB(res)) return;
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(String(user._id), user.role, user.email);
    res.json({
      token,
      user: { id: user._id, role: user.role, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
