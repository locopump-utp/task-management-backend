import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '@/middleware/auth';
import ProjectService from '@/services/project.service';
import TaskService from '@/services/task.service';
import UserService from '@/services/user.service';
import { asyncHandler } from '@/middleware/errorHandler';
import { createResponse } from '@/utils/helpers';
import { HttpStatus } from '@/types/common.types';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * Get general dashboard data for the current user
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const projectService = new ProjectService();
    const taskService = new TaskService();

    // Get dashboard data from services in parallel
    const [projectDashboard, taskDashboard] = await Promise.all([
      projectService.getUserProjectDashboard(userId),
      taskService.getUserTaskDashboard(userId)
    ]);

    const dashboardData = {
      projects: projectDashboard.success ? projectDashboard.data : null,
      tasks: taskDashboard.success ? taskDashboard.data : null,
      message: 'Use specific dashboard endpoints for detailed data: /dashboard/projects, /dashboard/tasks'
    };

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Dashboard data retrieved successfully', dashboardData)
    );
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      createResponse(false, 'Error retrieving dashboard data')
    );
  }
}));

/**
 * Get project dashboard
 */
router.get('/projects', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const projectService = new ProjectService();
    const result = await projectService.getUserProjectDashboard(userId);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project dashboard data retrieved successfully', result.data)
    );
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      createResponse(false, 'Error retrieving project dashboard data')
    );
  }
}));

/**
 * Get task dashboard
 */
router.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const taskService = new TaskService();
    const result = await taskService.getUserTaskDashboard(userId);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task dashboard data retrieved successfully', result.data)
    );
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      createResponse(false, 'Error retrieving task dashboard data')
    );
  }
}));

/**
 * Get admin dashboard (admin only)
 */
router.get('/admin', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const projectService = new ProjectService();
    const taskService = new TaskService();
    const userService = new UserService();

    // Get comprehensive stats for admin
    const [projectStats, taskStats, userStats] = await Promise.all([
      projectService.getProjectStatistics(),
      taskService.getTaskStatistics(),
      userService.getUserStatistics()
    ]);

    const adminDashboard = {
      projects: projectStats.success ? projectStats.data : null,
      tasks: taskStats.success ? taskStats.data : null,
      users: userStats.success ? userStats.data : null
    };

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Admin dashboard data retrieved successfully', adminDashboard)
    );
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      createResponse(false, 'Error retrieving admin dashboard data')
    );
  }
}));

export default router;
