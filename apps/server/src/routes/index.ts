import { Router, type IRouter } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import jobRouter from "./job.routes.js";
import userRouter from "./user.routes.js";
import applicationRouter from "./application.routes.js";
import notificationRouter from "./notification.routes.js";
import jobAlertRouter from "./jobAlert.routes.js";
import dashboardRouter from "./dashboard.routes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobRouter);
router.use(userRouter);
router.use(applicationRouter);
router.use(notificationRouter);
router.use(jobAlertRouter);
router.use(dashboardRouter);

export default router;
