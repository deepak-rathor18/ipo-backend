import { NextFunction, Request, Response } from 'express';

/**
 * Ensures authenticated / financial API responses are never cached by
 * browsers, proxies, or CDNs, since they contain sensitive personal
 * financial data shared between the two application users.
 */
export function noCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}
