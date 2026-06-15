import { Router, type IRouter } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import jobRouter from "./job.routes.js";
import userRouter from "./user.routes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobRouter);
router.use(userRouter);

export default router;
