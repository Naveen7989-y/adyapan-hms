import { Router } from 'express';
import { login, getMe, logout, getQuickDoctors, changePassword } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, authLimiter, changePassword);
router.get('/quick-doctors', getQuickDoctors);

export default router;

