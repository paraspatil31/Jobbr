import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import { JobAlertModel } from "../models/jobAlert.model.js";

export async function getAlerts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const alerts = await JobAlertModel.find({ seeker: req.auth.userId }).sort({
      createdAt: -1,
    });
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function createAlert(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const { name, keywords, jobTypes, radius, latitude, longitude, salary, frequency } =
      req.body as {
        name: string;
        keywords: string;
        jobTypes?: string[];
        radius?: number;
        latitude?: number;
        longitude?: number;
        salary?: string;
        frequency?: "instant" | "daily" | "weekly";
      };

    const alert = await JobAlertModel.create({
      seeker: req.auth.userId,
      name,
      keywords,
      jobTypes: jobTypes ?? [],
      radius: radius ?? 25,
      latitude,
      longitude,
      salary,
      frequency: frequency ?? "instant",
    });

    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
}

export async function updateAlert(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const { id } = req.params;
    const { name, keywords, jobTypes, radius, latitude, longitude, salary, frequency } =
      req.body as {
        name?: string;
        keywords?: string;
        jobTypes?: string[];
        radius?: number;
        latitude?: number;
        longitude?: number;
        salary?: string;
        frequency?: "instant" | "daily" | "weekly";
      };

    const alert = await JobAlertModel.findOneAndUpdate(
      { _id: id, seeker: req.auth.userId },
      { name, keywords, jobTypes, radius, latitude, longitude, salary, frequency },
      { new: true, runValidators: true }
    );

    if (!alert) {
      next(new AppError(404, "Alert not found"));
      return;
    }

    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function deleteAlert(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const { id } = req.params;
    const alert = await JobAlertModel.findOneAndDelete({
      _id: id,
      seeker: req.auth.userId,
    });

    if (!alert) {
      next(new AppError(404, "Alert not found"));
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function togglePause(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const { id } = req.params;
    const alert = await JobAlertModel.findOne({ _id: id, seeker: req.auth.userId });

    if (!alert) {
      next(new AppError(404, "Alert not found"));
      return;
    }

    alert.paused = !alert.paused;
    await alert.save();

    res.json(alert);
  } catch (err) {
    next(err);
  }
}
