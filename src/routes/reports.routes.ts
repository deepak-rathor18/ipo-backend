import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import { reportQuerySchema } from '../validators/report.validator';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

router.use(requireAuth, noCache);

router.get('/ipo', validate(reportQuerySchema), reportsController.getIpoReport);
router.get('/money', validate(reportQuerySchema), reportsController.getMoneyReport);
router.get('/combined', validate(reportQuerySchema), reportsController.getCombinedReport);

export default router;
