import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import {
  createIpoSchema,
  updateIpoSchema,
  listIposQuerySchema,
} from '../validators/ipo.validator';
import { idParamSchema } from '../validators/common.validator';
import * as ipoController from '../controllers/ipo.controller';

const router = Router();

router.use(requireAuth, noCache);

router.get('/', validate(listIposQuerySchema), ipoController.getIpos);
router.get('/:id', validate(idParamSchema), ipoController.getIpo);
router.post('/', validate(createIpoSchema), ipoController.createIpo);
router.put('/:id', validate(idParamSchema.merge(updateIpoSchema)), ipoController.updateIpo);
router.delete('/:id', validate(idParamSchema), ipoController.deleteIpo);

export default router;
