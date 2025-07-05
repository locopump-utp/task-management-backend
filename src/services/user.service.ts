import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import UserRepository from '@/repositories/user.repository';
import {
  UserRegistration,
  UserLogin,
  UserUpdate,
  UserChangePassword,
  SafeUser,
  AuthResponse,
  JWTPayload
} from '@/types/user.types';
import { ServiceResponse } from '@/types/common.types';
import { AppError } from '@/middleware/errorHandler';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '@/middleware/auth';

/**
 * User service for handling user-related business logic
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(userData: UserRegistration): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS'
          }
        };
      }

      // Create new user
      const newUser = await this.userRepository.create({
        name: userData.name,
        email: userData.email,
        password: userData.password, // Will be hashed by pre-save middleware
      });

      // Generate tokens
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Remove sensitive data
      const safeUser = newUser.toSafeObject();

      return {
        success: true,
        data: {
          user: safeUser,
          accessToken,
          refreshToken,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'REGISTRATION_ERROR'
        }
      };
    }
  }

  /**
   * Login user
   */
  async login(loginData: UserLogin): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Find user with password
      const user = await this.userRepository.findByEmailWithPassword(loginData.email);
      if (!user) {
        return {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: {
            message: 'Account is deactivated',
            code: 'USER_INACTIVE'
          }
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // Update last login
      await this.userRepository.updateLastLogin(user._id.toString());

      // Generate tokens
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Remove sensitive data
      const safeUser = user.toSafeObject();

      return {
        success: true,
        data: {
          user: safeUser,
          accessToken,
          refreshToken,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'LOGIN_ERROR'
        }
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<{ accessToken: string }>> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          error: {
            message: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
          }
        };
      }

      // Generate new access token
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = generateToken(tokenPayload);

      return {
        success: true,
        data: { accessToken }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<SafeUser>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: user.toSafeObject()
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROFILE_ERROR'
        }
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UserUpdate): Promise<ServiceResponse<SafeUser>> {
    try {
      // Check if email is being changed and if it already exists
      if (updateData.email) {
        const emailExists = await this.userRepository.emailExists(updateData.email, userId);
        if (emailExists) {
          return {
            success: false,
            error: {
              message: 'Email already exists',
              code: 'EMAIL_EXISTS'
            }
          };
        }
      }

      const updatedUser = await this.userRepository.update(userId, updateData);
      if (!updatedUser) {
        return {
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: updatedUser.toSafeObject()
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: UserChangePassword): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find user with current password
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        };
      }

      // Get user with password for verification
      const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);
      if (!userWithPassword) {
        return {
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await userWithPassword.comparePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: {
            message: 'Current password is incorrect',
            code: 'INVALID_PASSWORD'
          }
        };
      }

      // Update password
      await this.userRepository.update(userId, { password: passwordData.newPassword });

      return {
        success: true,
        data: { message: 'Password changed successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PASSWORD_CHANGE_ERROR'
        }
      };
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 10): Promise<ServiceResponse<{ users: SafeUser[]; total: number }>> {
    try {
      const { data: users, total } = await this.userRepository.findPaginated({}, page, limit, {
        select: 'name email role avatar isActive lastLogin createdAt',
        sort: { createdAt: -1 }
      });

      const safeUsers = users.map(user => user.toSafeObject());

      return {
        success: true,
        data: { users: safeUsers, total }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'FETCH_USERS_ERROR'
        }
      };
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<ServiceResponse<SafeUser[]>> {
    try {
      const users = await this.userRepository.searchUsers(query);
      const safeUsers = users.map(user => user.toSafeObject());

      return {
        success: true,
        data: safeUsers
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'SEARCH_ERROR'
        }
      };
    }
  }

  /**
   * Get user statistics (admin only)
   */
  async getUserStatistics(): Promise<ServiceResponse<any>> {
    try {
      const [stats, newUsersThisMonth, loginStats] = await Promise.all([
        this.userRepository.getUserStats(),
        this.userRepository.getNewUsersThisMonth(),
        this.userRepository.getLoginStats()
      ]);

      return {
        success: true,
        data: {
          ...stats,
          newUsersThisMonth,
          lastLoginStats: loginStats
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
}

export default UserService;
