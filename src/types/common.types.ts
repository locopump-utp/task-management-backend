import { z } from 'zod';

// Common response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    filters?: Record<string, any>;
    sort?: Record<string, any>;
  };
}

// Pagination interface
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Pagination query schema
export const PaginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, {
    message: 'Page must be greater than 0'
  }).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, {
    message: 'Limit must be between 1 and 100'
  }).default('10'),
});

// Sort schema
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range schema
export const DateRangeSchema = z.object({
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
});

// ID parameter schema
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Inferred types
export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type SortQuery = z.infer<typeof SortSchema>;
export type DateRangeQuery = z.infer<typeof DateRangeSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;

// Generic filter interface
export interface BaseFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// File upload interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Database query options
export interface QueryOptions {
  populate?: string | string[];
  select?: string;
  lean?: boolean;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}

// Error codes enum
export enum ErrorCodes {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_ID = 'INVALID_ID',
  DUPLICATE_FIELD = 'DUPLICATE_FIELD',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Business logic errors
  PROJECT_ACCESS_DENIED = 'PROJECT_ACCESS_DENIED',
  TASK_ACCESS_DENIED = 'TASK_ACCESS_DENIED',
  USER_INACTIVE = 'USER_INACTIVE',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// HTTP status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

// Generic repository interface
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: any, options?: QueryOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: any): Promise<number>;
}

// Service response interface
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Audit log interface
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
