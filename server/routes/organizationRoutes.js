import express from 'express';
import {
  getOrganizationProfile,
  updateOrganizationProfile
} from '../controllers/organizationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getOrganizationProfile)
  .put(authorize('Organization Admin'), updateOrganizationProfile);

export default router;
