import express from 'express';
import { createOfficer, loginUser, getMe } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', protect, authorize('Organization Admin'), createOfficer);
router.post('/login', loginUser);
router.post('/officers', protect, authorize('Organization Admin'), createOfficer);

// Protected routes
router.get('/me', protect, getMe);

export default router;
