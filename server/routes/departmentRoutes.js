import express from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignUserToDepartment,
  getSystemUsers
} from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Users list for assignment dropdown
router.get('/users', getSystemUsers);

// User assignment route
router.put('/assign-user', authorize('Organization Admin'), assignUserToDepartment);

// Department CRUD routes
router
  .route('/')
  .get(getDepartments)
  .post(authorize('Organization Admin'), createDepartment);

router
  .route('/:id')
  .put(authorize('Organization Admin'), updateDepartment)
  .delete(authorize('Organization Admin'), deleteDepartment);

export default router;
