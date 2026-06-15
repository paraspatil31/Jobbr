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

    const { title, company, type, location, salary, description, skills, radiusKm } =
      req.body as {
        title?: string;
        company?: string;
        type?: string;
        location?: string;
        salary?: string;
        description?: string;
        skills?: string[];
        radiusKm?: number;
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

    const job = await JobModel.create({
      title,
      company,
      type,
      location,
      salary,
      description,
      skills: skills ?? [],
      recruiter: req.auth.userId,
      radiusKm: radiusKm ?? 25,
    });

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
      "type",
      "location",
      "salary",
      "description",
      "skills",
      "radiusKm",
      "isActive",
    ] as const;

    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
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
