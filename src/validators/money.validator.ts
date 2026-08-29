import { z } from 'zod';
import { MONEY_TYPE } from '../constants';
import { dateRangeSchema, paginationSchema, positiveRupeeAmountSchema } from './common.validator';

const baseMoneyFields = {
  personName: z.string().trim().min(1, 'personName is required'),
  personPhone: z.string().trim().default(''),

  type: z.enum(MONEY_TYPE, {
    errorMap: () => ({ message: `type must be one of: ${MONEY_TYPE.join(', ')}` }),
  }),

  amount: positiveRupeeAmountSchema,

  transactionDate: z.coerce.date({ required_error: 'transactionDate is required' }),
  dueDate: z.coerce.date().nullable().optional(),

  reason: z.string().trim().default(''),
  // notes: z.string().trim().default(''),
};

export const createMoneySchema = z.object({
  body: z.object(baseMoneyFields),
});

export const updateMoneySchema = z.object({
  body: z
    .object(baseMoneyFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const listMoneyQuerySchema = z.object({
  query: paginationSchema.merge(dateRangeSchema).extend({
    search: z.string().trim().optional(),
    type: z.enum(MONEY_TYPE).optional(),
    status: z.string().optional(),
    personName: z.string().trim().optional(),
    sort: z.string().optional(),
  }),
});

export type CreateMoneyInput = z.infer<typeof createMoneySchema>['body'];
export type UpdateMoneyInput = z.infer<typeof updateMoneySchema>['body'];
