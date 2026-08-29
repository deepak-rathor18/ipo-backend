import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';
import { ERROR_CODES } from '../constants';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: ERROR_CODES.NOT_FOUND,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorCode: string = ERROR_CODES.INTERNAL_ERROR;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied';
    errorCode = ERROR_CODES.BAD_REQUEST;
  } else if (err && typeof err === 'object' && 'code' in err && (err as any).code === 11000) {
    statusCode = 409;
    message = 'A record with the same unique value already exists';
    errorCode = ERROR_CODES.CONFLICT;
  }

  // Log full detail server-side only; never leak stack traces or internals to clients.
  logger.error('Request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorCode,
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: !isProduction && err instanceof Error ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProduction ? 'Something went wrong' : message,
    errorCode,
  });
}
