import { z } from 'zod';
import { Types, Document } from 'mongoose';

// User Role Enum
export type UserRole = 'admin' | 'user';

// Base User Schema
export const UserSchema = z.object({
  _id: z.instanceof(Types.ObjectId).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']).default('user'),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Registration Schema
export const UserRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login Schema
export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Update User Schema
export const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
}).strict();

// Change Password Schema
export const UserChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin Update User Schema
export const AdminUserUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'user']).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
}).strict();

// User Search Schema
export const UserSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Inferred Types
export type User = z.infer<typeof UserSchema>;
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserChangePassword = z.infer<typeof UserChangePasswordSchema>;
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;
export type UserSearch = z.infer<typeof UserSearchSchema>;

// Document Types
export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Omit<UserDocument, 'password'>;
}

// Safe User Type (without password)
export type SafeUser = Omit<User, 'password'>;

// JWT Payload Type
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Auth Response Type
export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

// User Statistics Type
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  regularUsers: number;
  newUsersThisMonth: number;
  lastLoginStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}
