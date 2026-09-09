import { Router } from 'express';
import {
  postDepartment,
  getDepartments,
  getDepartment,
  putDepartment,
  patchDepartmentStatus,
} from './department.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Listing & viewing is accessible to staff
router.get('/', getDepartments);
router.get('/:id', getDepartment);

// Creation, update, and status toggle restricted to Admins
router.post('/', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), postDepartment);
router.put('/:id', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), putDepartment);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), patchDepartmentStatus);

export default router;
