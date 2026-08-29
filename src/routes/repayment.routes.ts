import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import { updateRepaymentSchema } from '../validators/repayment.validator';
import { idParamSchema } from '../validators/common.validator';
import * as repaymentController from '../controllers/repayment.controller';

const router = Router();

router.use(requireAuth, noCache);

router.put('/:id', validate(idParamSchema.merge(updateRepaymentSchema)), repaymentController.updateRepayment);
router.delete('/:id', validate(idParamSchema), repaymentController.deleteRepayment);

export default router;
