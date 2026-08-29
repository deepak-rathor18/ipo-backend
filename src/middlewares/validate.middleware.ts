import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants';

/**
 * Validates req.{body,query,params} against a Zod schema shaped as
 * { body?, query?, params? }. On success, replaces req.body/query/params
 * with the parsed (coerced/defaulted) values.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((issue) => `${issue.path.slice(1).join('.') || issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        next(ApiError.badRequest(message, ERROR_CODES.VALIDATION_ERROR));
        return;
      }
      next(err);
    }
  };
}
