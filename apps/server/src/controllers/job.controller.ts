import { type Request, type Response, type NextFunction } from "express";
import { JobModel } from "../models/index.js";
import { AppError } from "../middlewares/error.middleware.js";

export async function listJobs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      type,
      search,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter["type"] = type;
    if (search) filter["$text"] = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobModel.countDocuments(filter),
    ]);

    res.json({ jobs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
}

export async function nearbyJobs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitude, longitude, radius = "10000" } = req.query as Record<string, string>;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng)) {
      const jobs = await JobModel.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const catMap = new Map<string, number>();
      for (const job of jobs) {
        const cat = job.category || "General";
        catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
      }
      const categories = Array.from(catMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json({ totalJobs: jobs.length, categories, jobs });
      return;
    }

    let jobs: Array<Record<string, unknown>> = [];
    let categories: Array<{ name: string; count: number }> = [];

    try {
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point" as const, coordinates: [lng, lat] },
            distanceField: "distance",
            maxDistance,
            spherical: true,
            query: { isActive: true },
          },
        },
        {
          $facet: {
            jobs: [{ $limit: 200 }],
            categories: [
              { $group: { _id: "$category", count: { $sum: 1 } } },
              { $match: { _id: { $nin: [null, ""] } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ];

      const [result] = await JobModel.aggregate(pipeline);
      jobs = (result?.jobs ?? []) as Array<Record<string, unknown>>;
      const rawCats = (result?.categories ?? []) as Array<{ _id: string; count: number }>;
      categories = rawCats.map((c) => ({ name: c._id || "General", count: c.count }));
    } catch {
      // 2dsphere index may not exist yet (empty collection) — fall back to non-geo list
      const fallback = await JobModel.find({ isActive: true }).limit(100).lean();
      jobs = fallback as unknown as Array<Record<string, unknown>>;
      const catMap = new Map<string, number>();
      for (const j of fallback) {
        const cat = j.category || "General";
        catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
      }
      categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
    }

    res.json({ totalJobs: jobs.length, categories, jobs });
  } catch (err) {
    next(err);
  }
}

export async function getJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await JobModel.findById(req.params["id"]).lean();
    if (!job) {
      next(new AppError(404, "Job not found"));
      return;
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

export async function createJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.auth?.role !== "recruiter") {
      next(new AppError(403, "Only recruiters can post jobs"));
      return;
    }

    const {
      title,
      company,
      category,
      type,
      location,
      salary,
      description,
      skills,
      radiusKm,
      latitude,
      longitude,
    } = req.body as {
      title?: string;
      company?: string;
      category?: string;
      type?: string;
      location?: string;
      salary?: string;
      description?: string;
      skills?: string[];
      radiusKm?: number;
      latitude?: number;
      longitude?: number;
    };

    if (!title || !company || !type || !location || !description) {
      next(
        new AppError(
          400,
          "title, company, type, location, and description are required"
        )
      );
      return;
    }

    const jobData: Record<string, unknown> = {
      title,
      company,
      category: category ?? "General",
      type,
      location,
      salary,
      description,
      skills: skills ?? [],
      recruiter: req.auth.userId,
      radiusKm: radiusKm ?? 25,
    };

    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      jobData["latitude"] = latitude;
      jobData["longitude"] = longitude;
      jobData["geoLocation"] = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const job = await JobModel.create(jobData);

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

export async function updateJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await JobModel.findById(req.params["id"]);
    if (!job) {
      next(new AppError(404, "Job not found"));
      return;
    }

    if (String(job.recruiter) !== req.auth?.userId) {
      next(new AppError(403, "Not authorised to update this job"));
      return;
    }

    const allowed = [
      "title",
      "company",
      "category",
      "type",
      "location",
      "salary",
      "description",
      "skills",
      "radiusKm",
      "isActive",
      "latitude",
      "longitude",
    ] as const;

    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (
      typeof body["latitude"] === "number" &&
      typeof body["longitude"] === "number"
    ) {
      update["geoLocation"] = {
        type: "Point",
        coordinates: [body["longitude"], body["latitude"]],
      };
    }

    const updated = await JobModel.findByIdAndUpdate(
      req.params["id"],
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await JobModel.findById(req.params["id"]);
    if (!job) {
      next(new AppError(404, "Job not found"));
      return;
    }

    if (String(job.recruiter) !== req.auth?.userId) {
      next(new AppError(403, "Not authorised to delete this job"));
      return;
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    next(err);
  }
}
