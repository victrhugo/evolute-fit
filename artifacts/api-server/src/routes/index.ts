import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import checkoutRouter from "./checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(checkoutRouter);

export default router;
