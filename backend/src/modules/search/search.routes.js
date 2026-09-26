import { Router } from 'express';
import {
  getHospitals,
  getHospitalDetail,
  getDoctors,
} from './search.controller.js';

const router = Router();

// Public healthcare discovery endpoints (accessible from homepage without auth)
router.get('/hospitals', getHospitals);
router.get('/hospitals/:placeId', getHospitalDetail);
router.get('/doctors', getDoctors);

export default router;
