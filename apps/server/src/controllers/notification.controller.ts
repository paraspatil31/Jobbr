import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import { NotificationModel } from "../models/notification.model.js";

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const notifications = await NotificationModel.find({ user: req.auth.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markRead(
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
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, user: req.auth.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      next(new AppError(404, "Notification not found"));
      return;
    }

    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    await NotificationModel.updateMany(
      { user: req.auth.userId, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(
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
    const notification = await NotificationModel.findOneAndDelete({
      _id: id,
      user: req.auth.userId,
    });

    if (!notification) {
      next(new AppError(404, "Notification not found"));
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
