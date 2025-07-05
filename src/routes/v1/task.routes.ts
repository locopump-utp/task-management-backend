import { Router } from 'express';
import { taskController } from '@/controllers/task.controller';
import { authenticate, requireAdmin, requireProjectMember } from '@/middleware/auth';
import { validate } from '@/middleware/errorHandler';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskSearchSchema,
  BulkUpdateTasksSchema
} from '@/types/task.types';
import { IdParamSchema } from '@/types/common.types';

const router = Router();

// Validation middleware
const validateCreateTask = validate({ body: CreateTaskSchema });
const validateUpdateTask = validate({ body: UpdateTaskSchema });
const validateBulkUpdate = validate({ body: BulkUpdateTasksSchema });
const validateIdParam = validate({ params: IdParamSchema });
const validateSearchQuery = validate({ query: TaskSearchSchema });

// All task routes require authentication
router.use(authenticate);

// General task routes
router.post('/', validateCreateTask, taskController.createTask);
router.get('/search', validateSearchQuery, taskController.searchTasks);
router.get('/my-tasks', taskController.getUserTasks);
router.get('/dashboard', taskController.getTaskDashboard);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/due-soon', taskController.getTasksDueSoon);
router.get('/statistics', taskController.getTaskStatistics);

// Bulk operations
router.patch('/bulk-update', validateBulkUpdate, taskController.bulkUpdateTasks);

// Task-specific routes
router.get('/:id', validateIdParam, taskController.getTaskById);
router.put('/:id', validateIdParam, validateUpdateTask, taskController.updateTask);
router.delete('/:id', validateIdParam, taskController.deleteTask);

export default router;
