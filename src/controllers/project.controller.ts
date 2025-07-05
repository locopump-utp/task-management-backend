import { Request, Response } from 'express';
import ProjectService from '@/services/project.service';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectMemberSchema,
  ProjectSearchSchema
} from '@/types/project.types';
import { IdParamSchema } from '@/types/common.types';
import { asyncHandler } from '@/middleware/errorHandler';
import { createResponse, createPaginationMeta } from '@/utils/helpers';
import { HttpStatus } from '@/types/common.types';

/**
 * Project Controller
 */
export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  /**
   * Create a new project
   */
  createProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = CreateProjectSchema.parse(req.body);

    const result = await this.projectService.createProject(validatedData, userId);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.CREATED).json(
      createResponse(true, 'Project created successfully', result.data)
    );
  });

  /**
   * Get project by ID
   */
  getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    const result = await this.projectService.getProjectById(id, userId);

    if (!result.success) {
      const statusCode = result.error!.code === 'PROJECT_NOT_FOUND'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.FORBIDDEN;

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project retrieved successfully', result.data)
    );
  });

  /**
   * Get user's projects
   */
  getUserProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await this.projectService.getUserProjects(userId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Projects retrieved successfully', result.data)
    );
  });

  /**
   * Search projects
   */
  searchProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Validate query parameters
    const searchParams = ProjectSearchSchema.parse(req.query);

    const result = await this.projectService.searchProjects(searchParams, userId);

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
        'Projects search completed successfully',
        result.data!.projects,
        { pagination: paginationMeta }
      )
    );
  });

  /**
   * Update project
   */
  updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = UpdateProjectSchema.parse(req.body);

    const result = await this.projectService.updateProject(id, validatedData, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'PROJECT_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'INSUFFICIENT_PERMISSIONS') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project updated successfully', result.data)
    );
  });

  /**
   * Delete project
   */
  deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    const result = await this.projectService.deleteProject(id, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'PROJECT_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'INSUFFICIENT_PERMISSIONS') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project deleted successfully')
    );
  });

  /**
   * Add member to project
   */
  addMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    // Validate request body
    const { userId: memberUserId } = ProjectMemberSchema.parse(req.body);

    const result = await this.projectService.addMember(id, memberUserId, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'PROJECT_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'INSUFFICIENT_PERMISSIONS') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Member added successfully', result.data)
    );
  });

  /**
   * Remove member from project
   */
  removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const userId = req.user!.userId;

    // Validate request body
    const { userId: memberUserId } = ProjectMemberSchema.parse(req.body);

    const result = await this.projectService.removeMember(id, memberUserId, userId);

    if (!result.success) {
      let statusCode = HttpStatus.BAD_REQUEST;

      if (result.error!.code === 'PROJECT_NOT_FOUND') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (result.error!.code === 'INSUFFICIENT_PERMISSIONS') {
        statusCode = HttpStatus.FORBIDDEN;
      }

      res.status(statusCode).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Member removed successfully', result.data)
    );
  });

  /**
   * Get project statistics (Admin only)
   */
  getProjectStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.projectService.getProjectStatistics();

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project statistics retrieved successfully', result.data)
    );
  });

  /**
   * Get user's project dashboard
   */
  getProjectDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await this.projectService.getUserProjectDashboard(userId);

    if (!result.success) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createResponse(false, result.error!.message)
      );
      return;
    }

    res.status(HttpStatus.OK).json(
      createResponse(true, 'Project dashboard retrieved successfully', result.data)
    );
  });
}

// Export controller instance
export const projectController = new ProjectController();
