import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  togglePause,
} from "../controllers/jobAlert.controller.js";

const router = Router();

router.get("/job-alerts", requireAuth, getAlerts);
router.post("/job-alerts", requireAuth, createAlert);
router.put("/job-alerts/:id", requireAuth, updateAlert);
router.delete("/job-alerts/:id", requireAuth, deleteAlert);
router.put("/job-alerts/:id/pause", requireAuth, togglePause);

export default router;
