import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as dashboardService from '../services/dashboard.service';

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await dashboardService.getSummaryDashboard();
  sendSuccess(res, summary, 'Dashboard summary fetched successfully');
});

export const getIpoDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getIpoDashboard();
  sendSuccess(res, stats, 'IPO dashboard fetched successfully');
});

export const getMoneyDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getMoneyDashboard();
  sendSuccess(res, stats, 'Money dashboard fetched successfully');
});
