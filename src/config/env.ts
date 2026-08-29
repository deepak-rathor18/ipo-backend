import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  DEEPAK_AUTH_CODE: z.string().min(4, 'DEEPAK_AUTH_CODE must be set and non-trivial'),
  AMAN_AUTH_CODE: z.string().min(4, 'AMAN_AUTH_CODE must be set and non-trivial'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),

  COOKIE_NAME: z.string().default('fintrack_token'),
  COOKIE_DOMAIN: z.string().optional().default(''),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Never log secret values themselves, only which keys are missing/invalid.
  const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:\n' + problems.join('\n'));
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
