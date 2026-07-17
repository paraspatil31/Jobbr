import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import { ApplicationModel } from "../models/application.model.js";
import { RecentlyViewedModel } from "../models/recentlyViewed.model.js";
import { ProfileViewModel } from "../models/profileView.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { JobModel } from "../models/job.model.js";

export async function getSeekerStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== "seeker") {
      next(new AppError(403, "Only seekers can access seeker stats"));
      return;
    }

    const userId = req.auth.userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalApplications, interviews, offers, profileViews] = await Promise.all([
      ApplicationModel.countDocuments({ seeker: userId }),
      ApplicationModel.countDocuments({ seeker: userId, status: "interview" }),
      ApplicationModel.countDocuments({ seeker: userId, status: "offer" }),
      ProfileViewModel.countDocuments({
        seeker: userId,
        viewedAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    res.json({
      appliedJobs: totalApplications,
      savedJobs: 0,
      interviews,
      profileViews,
      offerCount: offers,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentlyViewed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const items = await RecentlyViewedModel.find({ seeker: req.auth.userId })
      .sort({ viewedAt: -1 })
      .limit(10)
      .populate("job");

    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function trackView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const { jobId } = req.body as { jobId: string };
    if (!jobId) {
      next(new AppError(400, "jobId is required"));
      return;
    }

    await RecentlyViewedModel.findOneAndUpdate(
      { seeker: req.auth.userId, job: jobId },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function trackProfileView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== "recruiter") {
      next(new AppError(403, "Only recruiters can track profile views"));
      return;
    }

    const { seekerId } = req.params;

    await ProfileViewModel.create({
      seeker: seekerId,
      recruiter: req.auth.userId,
      viewedAt: new Date(),
    });

    await NotificationModel.create({
      user: seekerId,
      type: "profile_view",
      title: "Someone viewed your profile",
      body: "A recruiter viewed your profile",
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getCompaniesHiring(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const results = await JobModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$company",
          openPositions: { $sum: 1 },
        },
      },
      { $sort: { openPositions: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          company: "$_id",
          openPositions: 1,
        },
      },
    ]);

    const companies = results.map((r: { company: string; openPositions: number }) => ({
      company: r.company,
      openPositions: r.openPositions,
      logo: r.company.slice(0, 2).toUpperCase(),
    }));

    res.json(companies);
  } catch (err) {
    next(err);
  }
}
