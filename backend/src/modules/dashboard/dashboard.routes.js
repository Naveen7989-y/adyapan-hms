import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as controller from './dashboard.controller.js';

const router = Router();

// All authenticated hospital staff can access their role-tailored dashboard stats
router.use(authenticate);

router.get('/stats', controller.getDashboardStats);

export default router;
