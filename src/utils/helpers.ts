import { ApiResponse, PaginationMeta } from '@/types/common.types';

/**
 * Create a standardized API response
 */
export const createResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  meta?: any
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
};

/**
 * Calculate skip value for pagination
 */
export const calculateSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Convert string to slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Parse sort string into MongoDB sort object
 */
export const parseSort = (sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Record<string, 1 | -1> => {
  if (!sortBy) {
    return { createdAt: -1 };
  }

  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

/**
 * Build MongoDB filter object from query parameters
 */
export const buildFilter = (params: Record<string, any>): Record<string, any> => {
  const filter: Record<string, any> = {};

  // Remove pagination and sort parameters
  const excludeParams = ['page', 'limit', 'sortBy', 'sortOrder'];

  Object.keys(params).forEach(key => {
    if (!excludeParams.includes(key) && params[key] !== undefined && params[key] !== '') {
      filter[key] = params[key];
    }
  });

  return filter;
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

/**
 * Get days between two dates
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format date to string
 */
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US');
};

/**
 * Remove sensitive fields from object
 */
export const removeSensitiveFields = <T extends Record<string, any>>(
  obj: T,
  fields: string[] = ['password', '__v']
): Omit<T, keyof typeof fields> => {
  const sanitized = { ...obj };

  fields.forEach(field => {
    delete sanitized[field];
  });

  return sanitized;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate a unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = generateRandomString(8);
  const extension = originalName.split('.').pop();

  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate password strength score
 */
export const calculatePasswordStrength = (password: string): number => {
  let score = 0;

  // Length
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;

  // Character types
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  return Math.min(score, 100);
};
