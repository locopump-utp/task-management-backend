import { Request, Response } from 'express';
import TaskService from '@/services/task.service';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskSearchSchema,
  BulkUpdateTasksSchema
} from '@/types/task.types';
import { IdParamSchema } from '@/types/common.types';
import { asyncHandler } from '@/middleware/errorHandler';
import { createResponse, createPaginationMeta } from '@/utils/helpers';
import { HttpStatus } from '@/types/common.types';

/**
 * Task Controller
 */
export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new task
   */
  createTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = CreateTaskSchema.parse(req.body);

    const result = await this.taskService.createTask(validatedData, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'PROJECT_ACCESS_DENIED') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.CREATED).json(
      createResponse(true, 'Task created successfully', result.data)
    );
  });

  /**
   * Get task by ID
   */
  getTaskById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    const result = await this.taskService.getTaskById(id, userId);

    if (!result.success) {
      const statusCode = result.error!.code === 'TASK_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.FORBIDDEN;

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task retrieved successfully', result.data)
    );
  });

  /**
   * Get tasks for a project
   */
  getProjectTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const userId = req.user!.userId;

    if (!projectId) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, 'Project ID is required')
      );
      return;
    }

    const result = await this.taskService.getProjectTasks(projectId, userId);

    if (!result.success) {
      const statusCode = result.error!.code === 'PROJECT_ACCESS_DENIED'
        ? HttpStatus.FORBIDDEN
        : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project tasks retrieved successfully', result.data)
    );
  });

  /**
   * Get user's tasks
   */
  getUserTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await this.taskService.getUserTasks(userId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'User tasks retrieved successfully', result.data)
    );
  });

  /**
   * Search tasks
   */
  searchTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate query parameters
    const searchParams = TaskSearchSchema.parse(req.query);

    const result = await this.taskService.searchTasks(searchParams, userId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    const paginationMeta = createPaginationMeta(
      searchParams.page,
      searchParams.limit,
      result.data!.total
    );

    res.status(HttpStatus.OK).json(
      createResponse(
        true,
        'Tasks search completed successfully',
        result.data!.tasks,
        { pagination: paginationMeta }
      )
    );
  });

  /**
   * Update task
   */
  updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = UpdateTaskSchema.parse(req.body);

    const result = await this.taskService.updateTask(id, validatedData, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'TASK_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'TASK_ACCESS_DENIED') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task updated successfully', result.data)
    );
  });

  /**
   * Delete task
   */
  deleteTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    const result = await this.taskService.deleteTask(id, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'TASK_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'TASK_ACCESS_DENIED') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task deleted successfully')
    );
  });

  /**
   * Bulk update tasks
   */
  bulkUpdateTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = BulkUpdateTasksSchema.parse(req.body);

    const result = await this.taskService.bulkUpdateTasks(validatedData, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'TASKS_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'TASKS_ACCESS_DENIED') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, `${result.data!.updated} tasks updated successfully`, result.data)
    );
  });

  /**
   * Get overdue tasks
   */
  getOverdueTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { forAllUsers } = req.query;

    // If forAllUsers is true and user is admin, get all overdue tasks
    const targetUserId = (forAllUsers === 'true' && req.user!.role === 'admin') ? undefined : userId;

    const result = await this.taskService.getOverdueTasks(targetUserId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Overdue tasks retrieved successfully', result.data)
    );
  });

  /**
   * Get tasks due soon
   */
  getTasksDueSoon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { days, forAllUsers } = req.query;

    const daysNumber = days ? parseInt(days as string) : 7;

    // If forAllUsers is true and user is admin, get all due soon tasks
    const targetUserId = (forAllUsers === 'true' && req.user!.role === 'admin') ? undefined : userId;

    const result = await this.taskService.getTasksDueSoon(daysNumber, targetUserId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Due soon tasks retrieved successfully', result.data)
    );
  });

  /**
   * Get task statistics
   */
  getTaskStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { projectId, forAllUsers } = req.query;

    // If forAllUsers is true and user is admin, get all statistics
    const targetUserId = (forAllUsers === 'true' && req.user!.role === 'admin') ? undefined : userId;

    const result = await this.taskService.getTaskStatistics(
      projectId as string,
      targetUserId
    );

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task statistics retrieved successfully', result.data)
    );
  });

  /**
   * Get user's task dashboard
   */
  getTaskDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await this.taskService.getUserTaskDashboard(userId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Task dashboard retrieved successfully', result.data)
    );
  });
}

// Export controller instance
export const taskController = new TaskController();
