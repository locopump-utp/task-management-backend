import { Request, Response } from 'express';
import UserService from '@/services/user.service';
import {
  UserRegistrationSchema,
  UserLoginSchema,
  UserUpdateSchema,
  UserChangePasswordSchema
} from '@/types/user.types';
import { asyncHandler } from '@/middleware/errorHandler';
import { createResponse, createPaginationMeta } from '@/utils/helpers';
import { HttpStatus } from '@/types/common.types';

/**
 * Authentication and User Controller
 */
export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = UserRegistrationSchema.parse(req.body);

    const result = await this.userService.register(validatedData);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.CREATED).json(
      createResponse(true, 'User registered successfully', result.data)
    );
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = UserLoginSchema.parse(req.body);

    const result = await this.userService.login(validatedData);

    if (!result.success) {
      res.status(HttpStatus.UNAUTHORIZED).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Login successful', result.data)
    );
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, 'Refresh token is required')
      );
      return;
    }

    const result = await this.userService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(HttpStatus.UNAUTHORIZED).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Token refreshed successfully', result.data)
    );
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await this.userService.getUserProfile(userId);

    if (!result.success) {
      res.status(HttpStatus.NOT_FOUND).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Profile retrieved successfully', result.data)
    );
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = UserUpdateSchema.parse(req.body);

    const result = await this.userService.updateProfile(userId, validatedData);

    if (!result.success) {
      const statusCode = result.error!.code === 'USER_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Profile updated successfully', result.data)
    );
  });

  /**
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = UserChangePasswordSchema.parse(req.body);

    const result = await this.userService.changePassword(userId, validatedData);

    if (!result.success) {
      const statusCode = result.error!.code === 'USER_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Password changed successfully')
    );
  });

  /**
   * Logout user (client-side token removal)
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the tokens from storage
    res.status(HttpStatus.OK).json(
      createResponse(true, 'Logout successful')
    );
  });
}

/**
 * User Management Controller (Admin functions)
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users (Admin only)
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.userService.getAllUsers(page, limit);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    const paginationMeta = createPaginationMeta(page, limit, result.data!.total);

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Users retrieved successfully', result.data!.users, { pagination: paginationMeta })
    );
  });

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await this.userService.getUserProfile(id);

    if (!result.success) {
      res.status(HttpStatus.NOT_FOUND).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'User retrieved successfully', result.data)
    );
  });

  /**
   * Search users
   */
  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, 'Search query is required')
      );
      return;
    }

    const result = await this.userService.searchUsers(query);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Search completed successfully', result.data)
    );
  });

  /**
   * Get user statistics (Admin only)
   */
  getUserStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.userService.getUserStatistics();

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Statistics retrieved successfully', result.data)
    );
  });
}

// Export controller instances
export const authController = new AuthController();
export const userController = new UserController();
