import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

const router = Router();

router.get("/applications", requireAuth, getMyApplications);
router.post("/applications", requireAuth, applyToJob);
router.get("/applications/job/:jobId", requireAuth, getJobApplications);
router.put("/applications/:id/status", requireAuth, updateApplicationStatus);

export default router;
