import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as exportService from '../services/export.service';

function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(csv);
}

export const exportIpos = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await exportService.exportIposCsv();
  sendCsv(res, `fintrack-ipos-${Date.now()}.csv`, csv);
});

export const exportMoney = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await exportService.exportMoneyCsv();
  sendCsv(res, `fintrack-money-${Date.now()}.csv`, csv);
});

export const exportRepayments = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await exportService.exportRepaymentsCsv();
  sendCsv(res, `fintrack-repayments-${Date.now()}.csv`, csv);
});

export const exportComplete = asyncHandler(async (_req: Request, res: Response) => {
  const { ipos, money, repayments } = await exportService.exportCompleteCsv();

  const combined = [
    '# IPO RECORDS',
    ipos,
    '',
    '# MONEY TRANSACTIONS',
    money,
    '',
    '# REPAYMENTS',
    repayments,
  ].join('\r\n');

  sendCsv(res, `fintrack-complete-export-${Date.now()}.csv`, combined);
});
