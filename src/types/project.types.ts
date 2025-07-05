import { z } from 'zod';
import { Types, Document } from 'mongoose';

// Project Status Enum
export type ProjectStatus = 'active' | 'completed' | 'paused';

// Base Project Schema
export const ProjectSchema = z.object({
  _id: z.instanceof(Types.ObjectId).optional(),
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Project name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  owner: z.instanceof(Types.ObjectId),
  members: z.array(z.instanceof(Types.ObjectId)).default([]),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Project Schema
export const CreateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Project name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  members: z.array(z.string()).optional(),
});

// Update Project Schema
export const UpdateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Project name must be less than 100 characters').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
}).strict();

// Add/Remove Member Schema
export const ProjectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Project Search Schema
export const ProjectSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  owner: z.string().optional(),
  member: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Project Filter Schema
export const ProjectFilterSchema = z.object({
  status: z.enum(['active', 'completed', 'paused']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  membersOnly: z.boolean().default(false),
});

// Inferred Types
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type ProjectSearch = z.infer<typeof ProjectSearchSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;

// Document Types
export interface ProjectDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  addMember(userId: Types.ObjectId): Promise<ProjectDocument>;
  removeMember(userId: Types.ObjectId): Promise<ProjectDocument>;
  isMember(userId: Types.ObjectId): boolean;
  isOwner(userId: Types.ObjectId): boolean;
}

// Project with populated fields
export interface PopulatedProject extends Omit<Project, 'owner' | 'members'> {
  owner: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
  members: Array<{
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  }>;
}

// Project Statistics Type
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  projectsByMonth: Array<{
    month: string;
    count: number;
  }>;
  averageTasksPerProject: number;
  averageProjectDuration: number;
}

// Project Dashboard Type
export interface ProjectDashboard {
  myProjects: {
    owned: number;
    member: number;
    total: number;
  };
  recentProjects: PopulatedProject[];
  projectsByStatus: {
    active: number;
    completed: number;
    paused: number;
  };
  upcomingDeadlines: Array<{
    projectId: Types.ObjectId;
    projectName: string;
    tasksCount: number;
    nearestDeadline: Date;
  }>;
}
