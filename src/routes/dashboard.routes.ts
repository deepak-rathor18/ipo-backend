import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth, noCache);

router.get('/summary', dashboardController.getSummary);
router.get('/ipo', dashboardController.getIpoDashboard);
router.get('/money', dashboardController.getMoneyDashboard);

export default router;
