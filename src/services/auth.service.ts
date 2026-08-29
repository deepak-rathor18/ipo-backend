import { CookieOptions } from 'express';
import { env, isProduction } from '../config/env';
import { AppUser } from '../constants';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants';
import { secureCompare } from '../utils/secureCompare';
import { signToken } from '../utils/jwt';

const AUTH_CODE_MAP: Record<AppUser, string> = {
  Deepak: env.DEEPAK_AUTH_CODE,
  Aman: env.AMAN_AUTH_CODE,
};

export function verifyCredentials(user: AppUser, authCode: string): void {
  const expectedCode = AUTH_CODE_MAP[user];

  if (!expectedCode || !secureCompare(authCode, expectedCode)) {
    // Deliberately generic message: never reveal which part was wrong.
    throw ApiError.unauthorized('Invalid user or auth code', ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export function issueSessionToken(user: AppUser): string {
  return signToken({ name: user });
}

export function getCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, mirrors JWT_EXPIRES_IN default
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function getClearCookieOptions(): CookieOptions {
  const { maxAge, ...rest } = getCookieOptions();
  return rest;
}
