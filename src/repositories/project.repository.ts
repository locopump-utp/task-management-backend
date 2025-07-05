import { FilterQuery, Types } from 'mongoose';
import BaseRepository from './base.repository';
import { Project, IProjectDocument } from '@/database/entities/Project.entity';
import { ProjectStatus, ProjectSearch } from '@/types/project.types';
import { buildFilter } from '@/utils/helpers';

/**
 * Project repository with specific project-related operations
 */
export class ProjectRepository extends BaseRepository<IProjectDocument> {
  constructor() {
    super(Project);
  }

  /**
   * Find projects by owner
   */
  async findByOwner(userId: string): Promise<IProjectDocument[]> {
    return await this.findAll({ owner: userId }, {
      populate: 'owner members',
      select: 'name description status createdAt updatedAt',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Find projects where user is member or owner
   */
  async findByMember(userId: string): Promise<IProjectDocument[]> {
    return await this.findAll({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }, {
      populate: 'owner members',
      select: 'name description status createdAt updatedAt',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Find projects by status
   */
  async findByStatus(status: ProjectStatus): Promise<IProjectDocument[]> {
    return await this.findAll({ status }, {
      populate: 'owner members',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Search projects with filters and pagination
   */
  async findWithSearch(searchParams: ProjectSearch, userId?: string) {
    const { query, status, owner, member, page, limit } = searchParams;

    // Build base filter
    const filter: FilterQuery<IProjectDocument> = buildFilter({ status, owner, member });

    // Add user access filter if userId provided
    if (userId) {
      filter.$and = [{
        $or: [
          { owner: userId },
          { members: userId }
        ]
      }];
    }

    // Add text search if query provided
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      const textFilter = {
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } }
        ]
      };

      if (filter.$and) {
        filter.$and.push(textFilter);
      } else {
        filter.$and = [textFilter];
      }
    }

    return await this.findPaginated(filter, page, limit, {
      populate: 'owner members',
      select: 'name description status createdAt updatedAt',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Add member to project
   */
  async addMember(projectId: string, userId: string): Promise<IProjectDocument | null> {
    return await this.model.findByIdAndUpdate(
      projectId,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('owner members').exec();
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, userId: string): Promise<IProjectDocument | null> {
    return await this.model.findByIdAndUpdate(
      projectId,
      { $pull: { members: userId } },
      { new: true }
    ).populate('owner members').exec();
  }

  /**
   * Check if user has access to project
   */
  async userHasAccess(projectId: string, userId: string): Promise<boolean> {
    const project = await this.findById(projectId);
    if (!project) return false;

    const userObjectId = new Types.ObjectId(userId);
    return project.isOwner(userObjectId) || project.isMember(userObjectId);
  }

  /**
   * Get project statistics
   */
  async getProjectStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completedProjects: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pausedProjects: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
        }
      }
    ];

    const stats = await this.aggregate(pipeline);
    return stats[0] || {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      pausedProjects: 0,
    };
  }

  /**
   * Get projects by month for statistics
   */
  async getProjectsByMonth() {
    const pipeline = [
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]}
            ]
          },
          count: 1
        }
      }
    ];

    return await this.aggregate(pipeline);
  }

  /**
   * Get user's project dashboard data
   */
  async getUserProjectDashboard(userId: string) {
    const [ownedProjects, memberProjects, recentProjects] = await Promise.all([
      this.count({ owner: userId }),
      this.count({ members: userId }),
      this.findAll({
        $or: [
          { owner: userId },
          { members: userId }
        ]
      }, {
        populate: 'owner members',
        sort: { updatedAt: -1 },
        limit: 5
      })
    ]);

    const totalProjects = ownedProjects + memberProjects;

    return {
      myProjects: {
        owned: ownedProjects,
        member: memberProjects,
        total: totalProjects
      },
      recentProjects
    };
  }

  /**
   * Get projects with task counts
   */
  async getProjectsWithTaskCounts(userId?: string) {
    const matchStage: any = {};

    if (userId) {
      matchStage.$or = [
        { owner: new Types.ObjectId(userId) },
        { members: new Types.ObjectId(userId) }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'tasks'
        }
      },
      {
        $addFields: {
          taskCount: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          overdueTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                cond: {
                  $and: [
                    { $ne: ['$$this.status', 'completed'] },
                    { $lt: ['$$this.dueDate', new Date()] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          status: 1,
          owner: 1,
          members: 1,
          taskCount: 1,
          completedTasks: 1,
          overdueTasks: 1,
          progress: {
            $cond: [
              { $eq: ['$taskCount', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$taskCount'] }, 100] }
            ]
          },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { updatedAt: -1 } }
    ];

    return await this.aggregate(pipeline);
  }
}

export default ProjectRepository;
