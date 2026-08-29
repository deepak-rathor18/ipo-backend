import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';
import { AppUser } from '../constants';
import {
  verifyCredentials,
  issueSessionToken,
  getCookieOptions,
  getClearCookieOptions,
} from '../services/auth.service';
import { recordAudit } from '../services/audit.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, authCode } = req.body as { user: AppUser; authCode: string };

  verifyCredentials(user, authCode);

  const token = issueSessionToken(user);

  res.cookie(env.COOKIE_NAME, token, getCookieOptions());

  await recordAudit({
    userName: user,
    action: 'LOGIN',
    entityType: 'Auth',
    metadata: { ip: req.ip },
  });

  sendSuccess(res, { user: { name: user } }, 'Login successful');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(env.COOKIE_NAME, getClearCookieOptions());

  if (req.user) {
    await recordAudit({
      userName: req.user.name,
      action: 'LOGOUT',
      entityType: 'Auth',
    });
  }

  sendSuccess(res, null, 'Logout successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { user: { name: req.user!.name } }, 'Current session');
});
