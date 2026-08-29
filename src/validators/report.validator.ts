import { z } from 'zod';
import { dateRangeSchema } from './common.validator';

export const reportQuerySchema = z.object({
  query: dateRangeSchema.extend({
    dematName: z.string().trim().optional(),
    status: z.string().trim().optional(),
  }),
});
