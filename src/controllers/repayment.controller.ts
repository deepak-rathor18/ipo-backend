import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as repaymentService from '../services/repayment.service';
import { recordAudit } from '../services/audit.service';

export const getRepayments = asyncHandler(async (req: Request, res: Response) => {
  const repayments = await repaymentService.listRepayments(req.params.id);
  sendSuccess(res, repayments, 'Repayments fetched successfully');
});

export const createRepayment = asyncHandler(async (req: Request, res: Response) => {
  const repayment = await repaymentService.createRepayment(req.params.id, req.body, req.user!.name);

  await recordAudit({
    userName: req.user!.name,
    action: 'ADD_REPAYMENT',
    entityType: 'Repayment',
    entityId: repayment.id,
    metadata: { moneyTransactionId: req.params.id, amount: repayment.amount },
  });

  sendSuccess(res, repayment, 'Repayment recorded successfully', 201);
});

export const updateRepayment = asyncHandler(async (req: Request, res: Response) => {
  const repayment = await repaymentService.updateRepayment(req.params.id, req.body);

  await recordAudit({
    userName: req.user!.name,
    action: 'UPDATE_REPAYMENT',
    entityType: 'Repayment',
    entityId: repayment.id,
  });

  sendSuccess(res, repayment, 'Repayment updated successfully');
});

export const deleteRepayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await repaymentService.deleteRepayment(req.params.id);

  await recordAudit({
    userName: req.user!.name,
    action: 'DELETE_REPAYMENT',
    entityType: 'Repayment',
    entityId: result.id,
  });

  sendSuccess(res, result, 'Repayment deleted successfully');
});
