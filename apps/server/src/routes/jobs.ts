import { Router, type IRouter } from "express";
import { JobModel } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/jobs", async (req, res) => {
  try {
    const { type, search, page = "1", limit = "20" } = req.query as Record<string, string>;

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
    req.log.error({ err }, "List jobs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const job = await JobModel.findById(req.params["id"]).lean();
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch (err) {
    req.log.error({ err }, "Get job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/jobs", requireAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "recruiter") {
      res.status(403).json({ error: "Only recruiters can post jobs" });
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
      res.status(400).json({ error: "title, company, type, location, and description are required" });
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
    req.log.error({ err }, "Create job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
