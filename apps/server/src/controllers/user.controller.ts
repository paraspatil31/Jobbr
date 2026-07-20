import { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/index.js";
import { AppError } from "../middlewares/error.middleware.js";

const SAFE_FIELDS = "-password";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    const user = await UserModel.findById(req.auth.userId)
      .select(SAFE_FIELDS)
      .lean();
    if (!user) {
      next(new AppError(404, "User not found"));
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await UserModel.find().select(SAFE_FIELDS).lean();
    res.json({ users, total: users.length });
  } catch (err) {
    next(err);
  }
}

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await UserModel.findById(req.params["id"])
      .select(SAFE_FIELDS)
      .lean();
    if (!user) {
      next(new AppError(404, "User not found"));
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, email, password, role, location, companyName, skills } =
      req.body as {
        fullName?: string;
        email?: string;
        password?: string;
        role?: string;
        location?: string;
        companyName?: string;
        skills?: string[];
      };

    if (!fullName || !email || !password || !role || !location) {
      next(
        new AppError(
          400,
          "fullName, email, password, role, and location are required"
        )
      );
      return;
    }

    if (role !== "seeker" && role !== "recruiter") {
      next(new AppError(400, 'role must be "seeker" or "recruiter"'));
      return;
    }

    if (password.length < 8) {
      next(new AppError(400, "Password must be at least 8 characters"));
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      fullName,
      email,
      password: hashed,
      role,
      location,
      companyName,
      skills: skills ?? [],
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      location: user.location,
      companyName: user.companyName,
      skills: user.skills,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allowed = [
      "fullName",
      "location",
      "companyName",
      "jobTitle",
      "skills",
      "preferredRadius",
    ] as const;
    type AllowedKey = (typeof allowed)[number];

    const body = req.body as Record<string, unknown>;
    const update: Partial<Record<AllowedKey, unknown>> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const user = await UserModel.findByIdAndUpdate(
      req.params["id"],
      { $set: update },
      { new: true, runValidators: true }
    )
      .select(SAFE_FIELDS)
      .lean();

    if (!user) {
      next(new AppError(404, "User not found"));
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function nearbySeekers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitude, longitude, radius = "25000" } = req.query as Record<string, string>;
    const lat = parseFloat(latitude ?? "");
    const lng = parseFloat(longitude ?? "");
    const maxDistance = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng)) {
      res.json({ seekers: [], total: 0 });
      return;
    }

    try {
      const seekers = await UserModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point" as const, coordinates: [lng, lat] },
            distanceField: "distance",
            maxDistance: isNaN(maxDistance) ? 25000 : maxDistance,
            spherical: true,
            query: { role: "seeker" },
          },
        },
        { $limit: 200 },
        { $project: { password: 0 } },
      ]);
      res.json({ seekers, total: seekers.length });
    } catch {
      res.json({ seekers: [], total: 0 });
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await UserModel.findByIdAndDelete(req.params["id"]);
    if (!user) {
      next(new AppError(404, "User not found"));
      return;
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
}
