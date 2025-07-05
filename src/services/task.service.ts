import { Types } from 'mongoose';
import TaskRepository from '@/repositories/task.repository';
import ProjectRepository from '@/repositories/project.repository';
import UserRepository from '@/repositories/user.repository';
import {
  CreateTask,
  UpdateTask,
  TaskSearch,
  BulkUpdateTasks,
  PopulatedTask
} from '@/types/task.types';
import { ServiceResponse } from '@/types/common.types';

/**
 * Task service for handling task-related business logic
 */
export class TaskService {
  private taskRepository: TaskRepository;
  private projectRepository: ProjectRepository;
  private userRepository: UserRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.projectRepository = new ProjectRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTask, userId: string): Promise<ServiceResponse<PopulatedTask>> {
    try {
      // Validate project exists and user has access
      const hasAccess = await this.projectRepository.userHasAccess(taskData.projectId, userId);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'Access denied to this project',
            code: 'PROJECT_ACCESS_DENIED'
          }
        };
      }

      // Validate assigned user exists and is active
      const assignedUser = await this.userRepository.findById(taskData.assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        return {
          success: false,
          error: {
            message: 'Assigned user not found or inactive',
            code: 'INVALID_ASSIGNED_USER'
          }
        };
      }

      // Check if assigned user has access to the project
      const assignedUserHasAccess = await this.projectRepository.userHasAccess(taskData.projectId, taskData.assignedTo);
      if (!assignedUserHasAccess) {
        return {
          success: false,
          error: {
            message: 'Assigned user does not have access to this project',
            code: 'ASSIGNED_USER_NO_ACCESS'
          }
        };
      }

      // Create task
      const newTask = await this.taskRepository.create({
        title: taskData.title,
        description: taskData.description,
        projectId: new Types.ObjectId(taskData.projectId),
        assignedTo: new Types.ObjectId(taskData.assignedTo),
        priority: taskData.priority,
        dueDate: taskData.dueDate,
      });

      // Populate and return
      const populatedTask = await this.taskRepository.findById(newTask._id.toString(), {
        populate: 'assignedTo projectId'
      });

      return {
        success: true,
        data: populatedTask as PopulatedTask
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_CREATION_ERROR'
        }
      };
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string, userId: string): Promise<ServiceResponse<PopulatedTask>> {
    try {
      const task = await this.taskRepository.findById(taskId, {
        populate: 'assignedTo projectId'
      });

      if (!task) {
        return {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND'
          }
        };
      }

      // Check if user has access to the project
      const hasAccess = await this.projectRepository.userHasAccess(task.projectId.toString(), userId);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'Access denied to this task',
            code: 'TASK_ACCESS_DENIED'
          }
        };
      }

      return {
        success: true,
        data: task as PopulatedTask
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Get tasks for a project
   */
  async getProjectTasks(projectId: string, userId: string): Promise<ServiceResponse<PopulatedTask[]>> {
    try {
      // Check if user has access to the project
      const hasAccess = await this.projectRepository.userHasAccess(projectId, userId);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'Access denied to this project',
            code: 'PROJECT_ACCESS_DENIED'
          }
        };
      }

      const tasks = await this.taskRepository.findByProject(projectId);

      return {
        success: true,
        data: tasks as PopulatedTask[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASKS_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Get user's tasks
   */
  async getUserTasks(userId: string): Promise<ServiceResponse<PopulatedTask[]>> {
    try {
      const tasks = await this.taskRepository.findByUser(userId);

      return {
        success: true,
        data: tasks as PopulatedTask[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASKS_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Search tasks with pagination
   */
  async searchTasks(
    searchParams: TaskSearch,
    userId: string
  ): Promise<ServiceResponse<{ tasks: PopulatedTask[]; total: number }>> {
    try {
      const { data: tasks, total } = await this.taskRepository.findWithSearch(searchParams, userId);

      return {
        success: true,
        data: { tasks: tasks as PopulatedTask[], total }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_SEARCH_ERROR'
        }
      };
    }
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    updateData: UpdateTask,
    userId: string
  ): Promise<ServiceResponse<PopulatedTask>> {
    try {
      // Check if task exists and user has access
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND'
          }
        };
      }

      // Check if user has access to the project
      const hasAccess = await this.projectRepository.userHasAccess(task.projectId.toString(), userId);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'Access denied to this task',
            code: 'TASK_ACCESS_DENIED'
          }
        };
      }

      // If updating assigned user, validate the new user
      if (updateData.assignedTo) {
        const assignedUser = await this.userRepository.findById(updateData.assignedTo);
        if (!assignedUser || !assignedUser.isActive) {
          return {
            success: false,
            error: {
              message: 'Assigned user not found or inactive',
              code: 'INVALID_ASSIGNED_USER'
            }
          };
        }

        // Check if assigned user has access to the project
        const assignedUserHasAccess = await this.projectRepository.userHasAccess(task.projectId.toString(), updateData.assignedTo);
        if (!assignedUserHasAccess) {
          return {
            success: false,
            error: {
              message: 'Assigned user does not have access to this project',
              code: 'ASSIGNED_USER_NO_ACCESS'
            }
          };
        }

        updateData.assignedTo = updateData.assignedTo;
      }

      // Update task
      const updatedTask = await this.taskRepository.update(taskId, updateData);

      // Populate and return
      const populatedTask = await this.taskRepository.findById(taskId, {
        populate: 'assignedTo projectId'
      });

      return {
        success: true,
        data: populatedTask as PopulatedTask
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Check if task exists and user has access
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND'
          }
        };
      }

      // Check if user has access to the project (project owner/member can delete)
      const hasAccess = await this.projectRepository.userHasAccess(task.projectId.toString(), userId);
      if (!hasAccess) {
        return {
          success: false,
          error: {
            message: 'Access denied to this task',
            code: 'TASK_ACCESS_DENIED'
          }
        };
      }

      await this.taskRepository.delete(taskId);

      return {
        success: true,
        data: { message: 'Task deleted successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'TASK_DELETE_ERROR'
        }
      };
    }
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(bulkData: BulkUpdateTasks, userId: string): Promise<ServiceResponse<{ updated: number }>> {
    try {
      // Validate all tasks exist and user has access
      const tasks = await this.taskRepository.findAll({ _id: { $in: bulkData.taskIds } });

      if (tasks.length !== bulkData.taskIds.length) {
        return {
          success: false,
          error: {
            message: 'One or more tasks not found',
            code: 'TASKS_NOT_FOUND'
          }
        };
      }

      // Check access for all tasks
      for (const task of tasks) {
        const hasAccess = await this.projectRepository.userHasAccess(task.projectId.toString(), userId);
        if (!hasAccess) {
          return {
            success: false,
            error: {
              message: 'Access denied to one or more tasks',
              code: 'TASKS_ACCESS_DENIED'
            }
          };
        }
      }

      // Perform bulk update
      const updatedCount = await this.taskRepository.bulkUpdate(bulkData.taskIds, bulkData.updates);

      return {
        success: true,
        data: { updated: updatedCount }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'BULK_UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId?: string): Promise<ServiceResponse<PopulatedTask[]>> {
    try {
      let tasks = await this.taskRepository.findOverdue();

      // Filter by user if specified
      if (userId) {
        tasks = tasks.filter(task => task.assignedTo.toString() === userId);
      }

      return {
        success: true,
        data: tasks as PopulatedTask[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'OVERDUE_TASKS_ERROR'
        }
      };
    }
  }

  /**
   * Get tasks due soon
   */
  async getTasksDueSoon(days: number = 7, userId?: string): Promise<ServiceResponse<PopulatedTask[]>> {
    try {
      let tasks = await this.taskRepository.findDueSoon(days);

      // Filter by user if specified
      if (userId) {
        tasks = tasks.filter(task => task.assignedTo.toString() === userId);
      }

      return {
        success: true,
        data: tasks as PopulatedTask[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'DUE_SOON_TASKS_ERROR'
        }
      };
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(projectId?: string, userId?: string): Promise<ServiceResponse<any>> {
    try {
      const [stats, averageCompletionTime] = await Promise.all([
        this.taskRepository.getTaskStats(projectId, userId),
        this.taskRepository.getAverageCompletionTime(userId, projectId)
      ]);

      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

      return {
        success: true,
        data: {
          ...stats,
          completionRate,
          averageCompletionTime
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'STATS_ERROR'
        }
      };
    }
  }

  /**
   * Get user's task dashboard
   */
  async getUserTaskDashboard(userId: string): Promise<ServiceResponse<any>> {
    try {
      const [dashboard, productivity, projectSummaries] = await Promise.all([
        this.taskRepository.getUserTaskDashboard(userId),
        this.taskRepository.getUserProductivityStats(userId),
        this.taskRepository.getProjectTaskSummaries(userId)
      ]);

      return {
        success: true,
        data: {
          ...dashboard,
          productivity,
          projectSummaries: projectSummaries.slice(0, 5) // Limit to 5 projects
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'DASHBOARD_ERROR'
        }
      };
    }
  }
}

export default TaskService;
