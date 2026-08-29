import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), { message: 'Invalid ID format' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
});

export const dateRangeSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const idParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// A monetary amount expressed in rupees (as sent by clients), converted
// to paise at the service boundary. Disallows negative values.
export const rupeeAmountSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .nonnegative('Amount cannot be negative')
  .finite();

export const positiveRupeeAmountSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .positive('Amount must be greater than zero')
  .finite();
