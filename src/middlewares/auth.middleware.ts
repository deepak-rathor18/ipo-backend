import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES, APP_USERS, AppUser } from '../constants';
import { logger } from '../utils/logger';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      throw ApiError.unauthorized('Authentication required', ERROR_CODES.UNAUTHORIZED);
    }

    const payload = verifyToken(token);

    if (!APP_USERS.includes(payload.name as AppUser)) {
      throw ApiError.unauthorized('Invalid session', ERROR_CODES.UNAUTHORIZED);
    }

    req.user = { name: payload.name as AppUser };
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    logger.debug('JWT verification failed');
    next(ApiError.unauthorized('Session expired or invalid', ERROR_CODES.UNAUTHORIZED));
  }
}
