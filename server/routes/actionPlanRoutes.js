import express from 'express';
import {
  getActionPlans,
  getActionPlanById,
  createActionPlan,
  updateActionPlan,
  deleteActionPlan,
  addAction,
  updateAction,
  deleteAction
} from '../controllers/actionPlanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Actions sub-routes
router.put('/actions/:actionId', updateAction);
router.delete('/actions/:actionId', deleteAction);

// Plan Sub-Actions route
router.post('/:id/actions', addAction);

// Main Plan routes
router
  .route('/')
  .get(getActionPlans)
  .post(createActionPlan);

router
  .route('/:id')
  .get(getActionPlanById)
  .put(updateActionPlan)
  .delete(deleteActionPlan);

export default router;
