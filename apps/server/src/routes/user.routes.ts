import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.put("/users/:id", requireAuth, updateUser);
router.delete("/users/:id", requireAuth, deleteUser);

export default router;
