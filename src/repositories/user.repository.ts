import { FilterQuery } from 'mongoose';
import BaseRepository from './base.repository';
import { User, IUserDocument } from '@/database/entities/User.entity';
import { UserRole, UserSearch } from '@/types/user.types';
import { parseSort, buildFilter } from '@/utils/helpers';

/**
 * User repository with specific user-related operations
 */
export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email with password
   */
  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email }).select('+password').exec();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.findOne({ email });
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<IUserDocument[]> {
    return await this.findAll({ isActive: true });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<IUserDocument[]> {
    return await this.findAll({ role, isActive: true });
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<IUserDocument[]> {
    const searchRegex = new RegExp(query, 'i');
    return await this.findAll({
      isActive: true,
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    });
  }

  /**
   * Find users with search and filters
   */
  async findWithSearch(searchParams: UserSearch) {
    const { query, role, isActive, page, limit } = searchParams;

    // Build filter
    const filter: FilterQuery<IUserDocument> = buildFilter({ role, isActive });

    // Add text search if query provided
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ];
    }

    // Get paginated results
    return await this.findPaginated(filter, page, limit, {
      select: 'name email role avatar isActive lastLogin createdAt',
      sort: { createdAt: -1 }
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<IUserDocument | null> {
    return await this.update(userId, { lastLogin: new Date() });
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<IUserDocument | null> {
    return await this.update(userId, { isActive: false });
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<IUserDocument | null> {
    return await this.update(userId, { isActive: true });
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          regularUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
        }
      }
    ];

    const stats = await this.aggregate(pipeline);
    return stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
    };
  }

  /**
   * Get new users this month
   */
  async getNewUsersThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return await this.count({
      createdAt: { $gte: startOfMonth }
    });
  }

  /**
   * Get login statistics
   */
  async getLoginStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayLogins, weekLogins, monthLogins] = await Promise.all([
      this.count({ lastLogin: { $gte: today } }),
      this.count({ lastLogin: { $gte: thisWeek } }),
      this.count({ lastLogin: { $gte: thisMonth } })
    ]);

    return {
      today: todayLogins,
      thisWeek: weekLogins,
      thisMonth: monthLogins,
    };
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const filter: FilterQuery<IUserDocument> = { email };

    if (excludeUserId) {
      filter._id = { $ne: excludeUserId };
    }

    return await this.exists(filter);
  }

  /**
   * Get users for project assignment (exclude current members)
   */
  async getAvailableUsersForProject(excludeUserIds: string[] = []): Promise<IUserDocument[]> {
    const filter: FilterQuery<IUserDocument> = {
      isActive: true,
      _id: { $nin: excludeUserIds }
    };

    return await this.findAll(filter, {
      select: 'name email avatar role',
      sort: { name: 1 }
    });
  }
}

export default UserRepository;
