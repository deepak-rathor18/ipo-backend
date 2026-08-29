import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import { createMoneySchema, updateMoneySchema, listMoneyQuerySchema } from '../validators/money.validator';
import { createRepaymentSchema } from '../validators/repayment.validator';
import { idParamSchema } from '../validators/common.validator';
import * as moneyController from '../controllers/money.controller';
import * as repaymentController from '../controllers/repayment.controller';

const router = Router();

router.use(requireAuth, noCache);

router.get('/', validate(listMoneyQuerySchema), moneyController.getMoneyList);
router.get('/:id', validate(idParamSchema), moneyController.getMoney);
router.post('/', validate(createMoneySchema), moneyController.createMoney);
router.put('/:id', validate(idParamSchema.merge(updateMoneySchema)), moneyController.updateMoney);
router.delete('/:id', validate(idParamSchema), moneyController.deleteMoney);

// Nested repayment routes
router.get('/:id/repayments', validate(idParamSchema), repaymentController.getRepayments);
router.post('/:id/repayments', validate(idParamSchema.merge(createRepaymentSchema)), repaymentController.createRepayment);

export default router;
