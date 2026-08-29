import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as reportsService from '../services/reports.service';

function extractFilters(req: Request) {
  const q = req.query as any;
  return {
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    year: q.year,
    month: q.month,
    dematName: q.dematName,
    status: q.status,
  };
}

export const getIpoReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getIpoReport(extractFilters(req));
  sendSuccess(res, report, 'IPO report generated successfully');
});

export const getMoneyReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getMoneyReport(extractFilters(req));
  sendSuccess(res, report, 'Money report generated successfully');
});

export const getCombinedReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getCombinedReport(extractFilters(req));
  sendSuccess(res, report, 'Combined report generated successfully');
});
