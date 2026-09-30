import express from 'express';
import {
  getKPIs,
  getKPIById,
  createKPI,
  updateKPI,
  deleteKPI,
  addKPIMeasurement,
  getKPIMeasurements
} from '../controllers/kpiController.js';
import { protect, authorize, enforceDepartmentScope } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(enforceDepartmentScope);

router
  .route('/:id/measurements')
  .get(getKPIMeasurements)
  .post(addKPIMeasurement);

router
  .route('/')
  .get(getKPIs)
  .post(authorize('Organization Admin'), createKPI);

router
  .route('/:id')
  .get(getKPIById)
  .put(authorize('Organization Admin'), updateKPI)
  .delete(authorize('Organization Admin'), deleteKPI);

export default router;
