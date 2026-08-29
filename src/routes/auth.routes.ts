import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', authRateLimiter, noCache, validate(loginSchema), login);
router.post('/logout', noCache, requireAuth, logout);
router.get('/me', noCache, requireAuth, me);

export default router;
