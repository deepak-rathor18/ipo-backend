import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as moneyService from '../services/money.service';
import { recordAudit } from '../services/audit.service';

export const getMoneyList = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as any;
  const result = await moneyService.listMoney({
    search: q.search,
    type: q.type,
    status: q.status,
    personName: q.personName,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    year: q.year,
    month: q.month,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
  });

  sendSuccess(res, result.items, 'Money transactions fetched successfully', 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getMoney = asyncHandler(async (req: Request, res: Response) => {
  const tx = await moneyService.getMoneyById(req.params.id);
  sendSuccess(res, tx, 'Money transaction fetched successfully');
});

export const createMoney = asyncHandler(async (req: Request, res: Response) => {
  const tx = await moneyService.createMoney(req.body, req.user!.name);

  await recordAudit({
    userName: req.user!.name,
    action: 'CREATE_MONEY',
    entityType: 'MoneyTransaction',
    entityId: tx.id,
    metadata: { personName: tx.personName, type: tx.type },
  });

  sendSuccess(res, tx, 'Money transaction created successfully', 201);
});

export const updateMoney = asyncHandler(async (req: Request, res: Response) => {
  const tx = await moneyService.updateMoney(req.params.id, req.body);

  await recordAudit({
    userName: req.user!.name,
    action: 'UPDATE_MONEY',
    entityType: 'MoneyTransaction',
    entityId: tx.id,
  });

  sendSuccess(res, tx, 'Money transaction updated successfully');
});

export const deleteMoney = asyncHandler(async (req: Request, res: Response) => {
  const result = await moneyService.deleteMoney(req.params.id, req.user!.name);

  await recordAudit({
    userName: req.user!.name,
    action: 'DELETE_MONEY',
    entityType: 'MoneyTransaction',
    entityId: result.id,
  });

  sendSuccess(res, result, 'Money transaction deleted successfully');
});
