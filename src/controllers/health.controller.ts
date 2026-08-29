import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getDatabaseState } from '../config/database';

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const db = getDatabaseState();

  res.status(200).json({
    success: true,
    status: 'healthy',
    database: db.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});
