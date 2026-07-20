import { Router } from "express";
import {
  listUsers,
  getUser,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  nearbySeekers,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Current authenticated user — must come before /:id
router.get("/users/me", requireAuth, getMe);
router.get("/users/nearby-seekers", requireAuth, nearbySeekers);

// Admin / internal routes — require auth
router.get("/users", requireAuth, listUsers);
router.get("/users/:id", requireAuth, getUser);
router.post("/users", createUser);
router.put("/users/:id", requireAuth, updateUser);
router.delete("/users/:id", requireAuth, deleteUser);

export default router;
