import express from 'express';
import {
  getEmissions,
  getEmissionFactors,
  createEmission,
  updateEmission,
  deleteEmission
} from '../controllers/emissionController.js';
import { protect, enforceDepartmentScope } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(enforceDepartmentScope);

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
