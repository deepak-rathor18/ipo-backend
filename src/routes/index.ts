import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import ipoRoutes from './ipo.routes';
import moneyRoutes from './money.routes';
import repaymentRoutes from './repayment.routes';
import peopleRoutes from './people.routes';
import dashboardRoutes from './dashboard.routes';
import reportsRoutes from './reports.routes';
import exportRoutes from './export.routes';

const router = Router();

router.get('/health', healthCheck);

router.use('/auth', authRoutes);
router.use('/ipos', ipoRoutes);
router.use('/money', moneyRoutes);
router.use('/repayments', repaymentRoutes);
router.use('/people', peopleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/export', exportRoutes);

export default router;
