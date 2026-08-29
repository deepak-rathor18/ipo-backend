import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ERROR_CODES } from '../constants';

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: ERROR_CODES.RATE_LIMITED,
  },
});

// Stricter limiter for the login endpoint to slow down auth-code guessing.
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    errorCode: ERROR_CODES.RATE_LIMITED,
  },
});
