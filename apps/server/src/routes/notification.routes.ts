import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/notifications", requireAuth, getNotifications);
router.put("/notifications/read-all", requireAuth, markAllRead);
router.put("/notifications/:id/read", requireAuth, markRead);
router.delete("/notifications/:id", requireAuth, deleteNotification);

export default router;
