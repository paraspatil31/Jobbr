import { Router } from "express";
import {
  listJobs,
  nearbyJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
} from "../controllers/job.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/jobs/nearby", nearbyJobs);
router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs", requireAuth, createJob);
router.put("/jobs/:id", requireAuth, updateJob);
router.delete("/jobs/:id", requireAuth, deleteJob);

export default router;
