import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env, isProduction } from './config/env';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';
import apiRoutes from './routes';

export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (needed for correct secure cookies / rate
  // limiting behind a load balancer, e.g. on Render/Railway/Heroku).
  app.set('trust proxy', 1);

  // ---- Security headers ----
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );

  // ---- CORS: credentialed requests from the Next.js PWA only ----
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ---- Body parsing with sane size limits ----
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(compression());

  // ---- NoSQL injection protection ----
  app.use(mongoSanitize());

  // ---- Request logging (never logs cookies/auth headers) ----
  const morganFormat = isProduction ? 'combined' : 'dev';
  app.use(
    morgan(morganFormat, {
      stream: { write: (message: string) => logger.info(message.trim()) },
      skip: (req) => req.path === '/api/health',
    })
  );

  // ---- General rate limiting ----
  app.use('/api', generalRateLimiter);

  // ---- Routes ----
  app.use('/api', apiRoutes);

  // ---- 404 + centralized error handling ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
