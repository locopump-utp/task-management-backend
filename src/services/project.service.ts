import { Types } from 'mongoose';
import ProjectRepository from '@/repositories/project.repository';
import UserRepository from '@/repositories/user.repository';
import {
  CreateProject,
  UpdateProject,
  ProjectSearch,
  PopulatedProject
} from '@/types/project.types';
import { ServiceResponse } from '@/types/common.types';

/**
 * Project service for handling project-related business logic
 */
export class ProjectService {
  private projectRepository: ProjectRepository;
  private userRepository: UserRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProject, ownerId: string): Promise<ServiceResponse<PopulatedProject>> {
    try {
      // Validate member IDs if provided
      if (projectData.members && projectData.members.length > 0) {
        const memberIds = projectData.members.map(id => new Types.ObjectId(id));
        const validMembers = await this.userRepository.findAll(
          { _id: { $in: memberIds }, isActive: true }
        );

        if (validMembers.length !== projectData.members.length) {
          return {
            success: false,
            error: {
              message: 'One or more members are invalid or inactive',
              code: 'INVALID_MEMBERS'
            }
          };
        }
      }

      // Create project
      const newProject = await this.projectRepository.create({
        name: projectData.name,
        description: projectData.description,
        owner: new Types.ObjectId(ownerId),
        members: projectData.members?.map(id => new Types.ObjectId(id)) || [],
      });

      // Populate and return
      const populatedProject = await this.projectRepository.findById(newProject._id.toString(), {
        populate: 'owner members'
      });

      return {
        success: true,
        data: populatedProject as unknown as PopulatedProject
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_CREATION_ERROR'
        }
      };
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string, userId?: string): Promise<ServiceResponse<PopulatedProject>> {
    try {
      const project = await this.projectRepository.findById(projectId, {
        populate: 'owner members'
      });

      if (!project) {
        return {
          success: false,
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        };
      }

      // Check access if userId provided
      if (userId && !project.isOwner(new Types.ObjectId(userId)) && !project.isMember(new Types.ObjectId(userId))) {
        return {
          success: false,
          error: {
            message: 'Access denied to this project',
            code: 'PROJECT_ACCESS_DENIED'
          }
        };
      }

      return {
        success: true,
        data: project as unknown as PopulatedProject
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Get user's projects
   */
  async getUserProjects(userId: string): Promise<ServiceResponse<PopulatedProject[]>> {
    try {
      const projects = await this.projectRepository.findByMember(userId);

      return {
        success: true,
        data: projects as unknown as PopulatedProject[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECTS_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Search projects with pagination
   */
  async searchProjects(
    searchParams: ProjectSearch,
    userId?: string
  ): Promise<ServiceResponse<{ projects: PopulatedProject[]; total: number }>> {
    try {
      const { data: projects, total } = await this.projectRepository.findWithSearch(searchParams, userId);

      return {
        success: true,
        data: { projects: projects as unknown as PopulatedProject[], total }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_SEARCH_ERROR'
        }
      };
    }
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updateData: UpdateProject,
    userId: string
  ): Promise<ServiceResponse<PopulatedProject>> {
    try {
      // Check if project exists and user has permission
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        };
      }

      // Only owner can update project
      if (!project.isOwner(new Types.ObjectId(userId))) {
        return {
          success: false,
          error: {
            message: 'Only project owner can update the project',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        };
      }

      // Update project
      await this.projectRepository.update(projectId, updateData);

      // Populate and return
      const populatedProject = await this.projectRepository.findById(projectId, {
        populate: 'owner members'
      });

      return {
        success: true,
        data: populatedProject as unknown as PopulatedProject
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Check if project exists and user has permission
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        };
      }

      // Only owner can delete project
      if (!project.isOwner(new Types.ObjectId(userId))) {
        return {
          success: false,
          error: {
            message: 'Only project owner can delete the project',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        };
      }

      // TODO: Also delete associated tasks
      await this.projectRepository.delete(projectId);

      return {
        success: true,
        data: { message: 'Project deleted successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_DELETE_ERROR'
        }
      };
    }
  }

  /**
   * Add member to project
   */
  async addMember(projectId: string, memberUserId: string, requestUserId: string): Promise<ServiceResponse<PopulatedProject>> {
    try {
      // Check if project exists and user has permission
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        };
      }

      // Only owner can add members
      if (!project.isOwner(new Types.ObjectId(requestUserId))) {
        return {
          success: false,
          error: {
            message: 'Only project owner can add members',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        };
      }

      // Check if user exists and is active
      const memberUser = await this.userRepository.findById(memberUserId);
      if (!memberUser || !memberUser.isActive) {
        return {
          success: false,
          error: {
            message: 'User not found or inactive',
            code: 'INVALID_USER'
          }
        };
      }

      // Check if user is already a member
      if (project.isMember(new Types.ObjectId(memberUserId)) || project.isOwner(new Types.ObjectId(memberUserId))) {
        return {
          success: false,
          error: {
            message: 'User is already a member of this project',
            code: 'ALREADY_MEMBER'
          }
        };
      }

      // Add member
      const updatedProject = await this.projectRepository.addMember(projectId, memberUserId);

      return {
        success: true,
        data: updatedProject as unknown as PopulatedProject
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'ADD_MEMBER_ERROR'
        }
      };
    }
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, memberUserId: string, requestUserId: string): Promise<ServiceResponse<PopulatedProject>> {
    try {
      // Check if project exists and user has permission
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        };
      }

      // Only owner can remove members (or members can remove themselves)
      if (!project.isOwner(new Types.ObjectId(requestUserId)) && requestUserId !== memberUserId) {
        return {
          success: false,
          error: {
            message: 'Only project owner can remove members or members can remove themselves',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        };
      }

      // Cannot remove owner
      if (project.isOwner(new Types.ObjectId(memberUserId))) {
        return {
          success: false,
          error: {
            message: 'Cannot remove project owner',
            code: 'CANNOT_REMOVE_OWNER'
          }
        };
      }

      // Check if user is actually a member
      if (!project.isMember(new Types.ObjectId(memberUserId))) {
        return {
          success: false,
          error: {
            message: 'User is not a member of this project',
            code: 'NOT_A_MEMBER'
          }
        };
      }

      // Remove member
      const updatedProject = await this.projectRepository.removeMember(projectId, memberUserId);

      return {
        success: true,
        data: updatedProject as unknown as PopulatedProject
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'REMOVE_MEMBER_ERROR'
        }
      };
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(): Promise<ServiceResponse<any>> {
    try {
      const [stats, projectsByMonth] = await Promise.all([
        this.projectRepository.getProjectStats(),
        this.projectRepository.getProjectsByMonth()
      ]);

      return {
        success: true,
        data: {
          ...stats,
          projectsByMonth
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
   * Get user's project dashboard
   */
  async getUserProjectDashboard(userId: string): Promise<ServiceResponse<any>> {
    try {
      const [dashboard, projectsWithTasks] = await Promise.all([
        this.projectRepository.getUserProjectDashboard(userId),
        this.projectRepository.getProjectsWithTaskCounts(userId)
      ]);

      return {
        success: true,
        data: {
          ...dashboard,
          projectsWithTasks: projectsWithTasks.slice(0, 5) // Limit to recent 5
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

export default ProjectService;
