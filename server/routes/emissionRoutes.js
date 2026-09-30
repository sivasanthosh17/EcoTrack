import express from 'express';
import {
  getEmissions,
  getEmissionFactors,
  createEmission,
  updateEmission,
  deleteEmission
} from '../controllers/emissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/factors', getEmissionFactors);

router
  .route('/')
  .get(getEmissions)
  .post(createEmission);

router
  .route('/:id')
  .put(updateEmission)
  .delete(deleteEmission);

export default router;
