import { z } from 'zod';
import { Types, Document } from 'mongoose';

// Task Status and Priority Enums
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

// Base Task Schema
export const TaskSchema = z.object({
  _id: z.instanceof(Types.ObjectId).optional(),
  title: z.string().min(3, 'Task title must be at least 3 characters').max(200, 'Task title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  projectId: z.instanceof(Types.ObjectId),
  assignedTo: z.instanceof(Types.ObjectId),
  status: z.enum(['todo', 'in_progress', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.date().refine((date) => date > new Date(), {
    message: 'Due date must be in the future',
  }),
  completedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Task Schema
export const CreateTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(200, 'Task title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().transform((str) => new Date(str)).refine((date) => date > new Date(), {
    message: 'Due date must be in the future',
  }),
});

// Update Task Schema
export const UpdateTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(200, 'Task title must be less than 200 characters').optional(),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters').optional(),
  assignedTo: z.string().min(1, 'Assigned user ID is required').optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().transform((str) => new Date(str)).refine((date) => date > new Date(), {
    message: 'Due date must be in the future',
  }).optional(),
}).strict();

// Task Search Schema
export const TaskSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  overdue: z.boolean().optional(),
  dueSoon: z.number().min(1).max(30).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Task Filter Schema
export const TaskFilterSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  overdue: z.boolean().optional(),
  dueSoon: z.number().min(1).max(30).optional(),
});

// Bulk Update Tasks Schema
export const BulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
  updates: z.object({
    status: z.enum(['todo', 'in_progress', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignedTo: z.string().optional(),
  }),
});

// Inferred Types
export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type TaskSearch = z.infer<typeof TaskSearchSchema>;
export type TaskFilter = z.infer<typeof TaskFilterSchema>;
export type BulkUpdateTasks = z.infer<typeof BulkUpdateTasksSchema>;

// Document Types
export interface TaskDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  projectId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsCompleted(): Promise<TaskDocument>;
  isOverdue(): boolean;
  getDaysUntilDue(): number;
}

// Task with populated fields
export interface PopulatedTask extends Omit<Task, 'projectId' | 'assignedTo'> {
  projectId: {
    _id: Types.ObjectId;
    name: string;
    description: string;
  };
  assignedTo: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
  isOverdue?: boolean;
  daysUntilDue?: number;
}

// Task Statistics Type
export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueSoon: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  completionRate: number;
  averageCompletionTime: number;
}

// Project Task Summary
export interface ProjectTaskSummary {
  projectId: Types.ObjectId;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
  tasksByStatus: {
    todo: number;
    inProgress: number;
    completed: number;
  };
}

// User Task Summary
export interface UserTaskSummary {
  userId: Types.ObjectId;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  productivityScore: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

// Task Dashboard Type
export interface TaskDashboard {
  myTasks: {
    total: number;
    completed: number;
    overdue: number;
    dueSoon: number;
  };
  recentTasks: PopulatedTask[];
  tasksByStatus: {
    todo: number;
    inProgress: number;
    completed: number;
  };
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  upcomingDeadlines: Array<{
    taskId: Types.ObjectId;
    title: string;
    dueDate: Date;
    priority: TaskPriority;
    projectName: string;
  }>;
  productivity: {
    completionRate: number;
    averageCompletionTime: number;
    tasksCompletedThisWeek: number;
    tasksCompletedLastWeek: number;
  };
}
