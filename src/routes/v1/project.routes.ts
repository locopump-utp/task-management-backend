import { Router } from 'express';
import { projectController } from '@/controllers/project.controller';
import { authenticate, requireAdmin, requireProjectMember } from '@/middleware/auth';
import { validate } from '@/middleware/errorHandler';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectMemberSchema,
  ProjectSearchSchema
} from '@/types/project.types';
import { IdParamSchema } from '@/types/common.types';

const router = Router();

// Validation middleware
const validateCreateProject = validate({ body: CreateProjectSchema });
const validateUpdateProject = validate({ body: UpdateProjectSchema });
const validateProjectMember = validate({ body: ProjectMemberSchema });
const validateIdParam = validate({ params: IdParamSchema });
const validateSearchQuery = validate({ query: ProjectSearchSchema });

// All project routes require authentication
router.use(authenticate);

// Public project routes (for authenticated users)
router.post('/', validateCreateProject, projectController.createProject);
router.get('/search', validateSearchQuery, projectController.searchProjects);
router.get('/my-projects', projectController.getUserProjects);
router.get('/dashboard', projectController.getProjectDashboard);

// Admin only routes
router.get('/statistics', requireAdmin, projectController.getProjectStatistics);

// Project-specific routes (require project membership)
router.get('/:id', validateIdParam, requireProjectMember, projectController.getProjectById);
router.put('/:id', validateIdParam, validateUpdateProject, requireProjectMember, projectController.updateProject);
router.delete('/:id', validateIdParam, requireProjectMember, projectController.deleteProject);

// Member management routes (require project membership)
router.post('/:id/members', validateIdParam, validateProjectMember, requireProjectMember, projectController.addMember);
router.delete('/:id/members', validateIdParam, validateProjectMember, requireProjectMember, projectController.removeMember);

export default router;
