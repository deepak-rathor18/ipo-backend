import { z } from 'zod';
import { APP_USERS } from '../constants';

export const loginSchema = z.object({
  body: z.object({
    user: z.enum(APP_USERS, {
      errorMap: () => ({ message: `user must be one of: ${APP_USERS.join(', ')}` }),
    }),
    authCode: z.string().min(1, 'authCode is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
