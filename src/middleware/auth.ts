import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '@/config/environment';
import { User } from '@/database/entities/User.entity';
import { JWTPayload, UserRole } from '@/types/user.types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] as string;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('+isActive');
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: 'INVALID_USER'
      });
      return;
    }

    // Update last login
    await User.updateLastLogin(decoded.userId);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access token has expired',
        error: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid access token',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.headers['x-access-token'] as string;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    const user = await User.findById(decoded.userId).select('+isActive');

    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = authorize('admin');

// User or Admin middleware
export const requireUser = authorize('user', 'admin');

// Resource ownership middleware
export const requireOwnership = (resourceParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const resourceId = req.params[resourceParam];
      const userId = req.user.userId;

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // For user resources, check if it's their own
      if (resourceParam === 'id' || resourceParam === 'userId') {
        if (resourceId !== userId) {
          res.status(403).json({
            success: false,
            message: 'You can only access your own resources',
            error: 'ACCESS_DENIED'
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization',
        error: 'AUTH_ERROR'
      });
    }
  };
};

// Project member middleware
export const requireProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.userId;

    // Admin can access any project
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is project owner or member
    const { Project } = await import('@/database/entities/Project.entity');
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'PROJECT_NOT_FOUND'
      });
      return;
    }

    const isOwner = project.isOwner(new Types.ObjectId(userId));
    const isMember = project.isMember(new Types.ObjectId(userId));

    if (!isOwner && !isMember) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
        error: 'PROJECT_ACCESS_DENIED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Project member check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during project authorization',
      error: 'AUTH_ERROR'
    });
  }
};

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    return jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.accessTokenExpiry,
      issuer: config.jwt.issuer,
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate access token');
  }
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
      issuer: config.jwt.issuer,
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    throw error;
  }
};
