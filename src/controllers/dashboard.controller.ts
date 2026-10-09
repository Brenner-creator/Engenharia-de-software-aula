import { NextFunction, Request, Response } from "express";
import { DashboardService } from "@/services/dashboard.service";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  public getMetrics = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const metrics = await this.dashboardService.getMétricasGerais();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  };

  public getRecentMovements = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const movements = await this.dashboardService.getUltimasMovimentacoes();
      res.status(200).json(movements);
    } catch (error) {
      next(error);
    }
  };
}