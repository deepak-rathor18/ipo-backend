import { z } from 'zod';
import { positiveRupeeAmountSchema } from './common.validator';

export const createRepaymentSchema = z.object({
  body: z.object({
    amount: positiveRupeeAmountSchema,
    paymentDate: z.coerce.date({ required_error: 'paymentDate is required' }),
    notes: z.string().trim().default(''),
  }),
});

export const updateRepaymentSchema = z.object({
  body: z
    .object({
      amount: positiveRupeeAmountSchema.optional(),
      paymentDate: z.coerce.date().optional(),
      notes: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export type CreateRepaymentInput = z.infer<typeof createRepaymentSchema>['body'];
export type UpdateRepaymentInput = z.infer<typeof updateRepaymentSchema>['body'];
