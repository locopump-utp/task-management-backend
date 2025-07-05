import { FilterQuery, Types } from 'mongoose';
import BaseRepository from './base.repository';
import { Task, ITaskDocument } from '@/database/entities/Task.entity';
import { TaskStatus, TaskPriority, TaskSearch } from '@/types/task.types';
import { buildFilter } from '@/utils/helpers';

/**
 * Task repository with specific task-related operations
 */
export class TaskRepository extends BaseRepository<ITaskDocument> {
  constructor() {
    super(Task);
  }

  /**
   * Find tasks by project
   */
  async findByProject(projectId: string): Promise<ITaskDocument[]> {
    return await this.findAll({ projectId }, {
      populate: 'assignedTo',
      select: 'name email avatar',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Find tasks by user
   */
  async findByUser(userId: string): Promise<ITaskDocument[]> {
    return await this.findAll({ assignedTo: userId }, {
      populate: 'projectId',
      select: 'name description',
      sort: { dueDate: 1 }
    });
  }

  /**
   * Find tasks by status
   */
  async findByStatus(status: TaskStatus): Promise<ITaskDocument[]> {
    return await this.findAll({ status }, {
      populate: 'assignedTo projectId',
      sort: { dueDate: 1 }
    });
  }

  /**
   * Find overdue tasks
   */
  async findOverdue(): Promise<ITaskDocument[]> {
    return await this.findAll({
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    }, {
      populate: 'assignedTo projectId',
      sort: { dueDate: 1 }
    });
  }

  /**
   * Find tasks due soon
   */
  async findDueSoon(days: number = 7): Promise<ITaskDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.findAll({
      status: { $ne: 'completed' },
      dueDate: {
        $gte: new Date(),
        $lte: futureDate
      }
    }, {
      populate: 'assignedTo projectId',
      sort: { dueDate: 1 }
    });
  }

  /**
   * Search tasks with filters and pagination
   */
  async findWithSearch(searchParams: TaskSearch, userId?: string, projectId?: string) {
    const { query, status, priority, assignedTo, overdue, dueSoon, page, limit } = searchParams;

    // Build base filter
    const filter: FilterQuery<ITaskDocument> = buildFilter({
      status,
      priority,
      assignedTo: assignedTo || userId,
      projectId
    });

    // Add overdue filter
    if (overdue) {
      filter.status = { $ne: 'completed' };
      filter.dueDate = { $lt: new Date() };
    }

    // Add due soon filter
    if (dueSoon) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dueSoon);
      filter.status = { $ne: 'completed' };
      filter.dueDate = { $gte: new Date(), $lte: futureDate };
    }

    // Add text search if query provided
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }

    return await this.findPaginated(filter, page, limit, {
      populate: 'assignedTo projectId',
      sort: { dueDate: 1 }
    });
  }

  /**
   * Get task statistics
   */
  async getTaskStats(projectId?: string, userId?: string) {
    const matchCondition: any = {};

    if (projectId) matchCondition.projectId = new Types.ObjectId(projectId);
    if (userId) matchCondition.assignedTo = new Types.ObjectId(userId);

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
        }
      }
    ];

    const stats = await this.aggregate(pipeline);
    return stats[0] || {
      total: 0,
      todo: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdate(taskIds: string[], updates: Partial<ITaskDocument>): Promise<number> {
    const result = await this.model.updateMany(
      { _id: { $in: taskIds } },
      updates
    ).exec();

    return result.modifiedCount;
  }

  /**
   * Get user's task dashboard data
   */
  async getUserTaskDashboard(userId: string) {
    const [myTasks, recentTasks, upcomingDeadlines] = await Promise.all([
      this.getTaskStats(undefined, userId),
      this.findAll({ assignedTo: userId }, {
        populate: 'projectId',
        sort: { updatedAt: -1 },
        limit: 5
      }),
      this.findAll({
        assignedTo: userId,
        status: { $ne: 'completed' },
        dueDate: { $gte: new Date() }
      }, {
        populate: 'projectId',
        sort: { dueDate: 1 },
        limit: 5,
        select: 'title dueDate priority projectId'
      })
    ]);

    return {
      myTasks,
      recentTasks,
      upcomingDeadlines
    };
  }

  /**
   * Get productivity statistics for user
   */
  async getUserProductivityStats(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeekCompleted, lastWeekCompleted, totalStats] = await Promise.all([
      this.count({
        assignedTo: userId,
        status: 'completed',
        completedAt: { $gte: weekAgo }
      }),
      this.count({
        assignedTo: userId,
        status: 'completed',
        completedAt: { $gte: twoWeeksAgo, $lt: weekAgo }
      }),
      this.getTaskStats(undefined, userId)
    ]);

    const completionRate = totalStats.total > 0
      ? (totalStats.completed / totalStats.total) * 100
      : 0;

    return {
      completionRate,
      tasksCompletedThisWeek: thisWeekCompleted,
      tasksCompletedLastWeek: lastWeekCompleted,
      ...totalStats
    };
  }

  /**
   * Get average completion time for tasks
   */
  async getAverageCompletionTime(userId?: string, projectId?: string) {
    const matchCondition: any = {
      status: 'completed',
      completedAt: { $exists: true }
    };

    if (userId) matchCondition.assignedTo = new Types.ObjectId(userId);
    if (projectId) matchCondition.projectId = new Types.ObjectId(projectId);

    const pipeline = [
      { $match: matchCondition },
      {
        $addFields: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCompletionTime: { $avg: '$completionTime' }
        }
      }
    ];

    const result = await this.aggregate(pipeline);
    return result[0]?.averageCompletionTime || 0;
  }

  /**
   * Get project task summaries
   */
  async getProjectTaskSummaries(userId?: string) {
    const matchCondition: any = {};
    if (userId) matchCondition.assignedTo = new Types.ObjectId(userId);

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: '$projectId',
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          todoTasks: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgressTasks: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: '$project'
      },
      {
        $project: {
          projectId: '$_id',
          projectName: '$project.name',
          totalTasks: 1,
          completedTasks: 1,
          overdueTasks: 1,
          progress: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          },
          tasksByStatus: {
            todo: '$todoTasks',
            inProgress: '$inProgressTasks',
            completed: '$completedTasks'
          }
        }
      }
    ];

    return await this.aggregate(pipeline);
  }
}

export default TaskRepository;
