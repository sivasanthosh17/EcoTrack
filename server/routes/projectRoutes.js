import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectProgress,
  deleteProject
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.put('/:id/progress', updateProjectProgress);

router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

export default router;
