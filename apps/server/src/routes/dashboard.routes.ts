import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getSeekerStats,
  getRecentlyViewed,
  trackView,
  trackProfileView,
  getCompaniesHiring,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/stats/seeker", requireAuth, getSeekerStats);
router.get("/recently-viewed", requireAuth, getRecentlyViewed);
router.post("/recently-viewed", requireAuth, trackView);
router.post("/profile-views/:seekerId", requireAuth, trackProfileView);
router.get("/companies-hiring", getCompaniesHiring);

export default router;
