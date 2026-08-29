import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { noCache } from '../middlewares/noCache.middleware';
import * as peopleController from '../controllers/people.controller';

const router = Router();

router.use(requireAuth, noCache);

router.get('/', peopleController.getPeople);
router.get('/:name', peopleController.getPerson);

export default router;
