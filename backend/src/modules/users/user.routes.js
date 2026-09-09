import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUser,
  editUser,
  changeUserStatus,
} from './user.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// All user routes require authentication and Admin role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'));

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', editUser);
router.patch('/:id/status', changeUserStatus);

export default router;
