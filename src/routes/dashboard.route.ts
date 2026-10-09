import { Router } from "express";
import { DashboardController } from "@/controllers/dashboard.controller";
import { authenticate } from "@/middlewares/auth";

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);

router.get("/metricas", dashboardController.getMetrics);
router.get("/ultimas-movimentacoes", dashboardController.getRecentMovements);

export default router;