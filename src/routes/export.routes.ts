import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import * as exportController from '../controllers/export.controller';

const router = Router();

router.use(requireAuth);

router.get('/ipos', exportController.exportIpos);
router.get('/money', exportController.exportMoney);
router.get('/repayments', exportController.exportRepayments);
router.get('/complete', exportController.exportComplete);

export default router;
