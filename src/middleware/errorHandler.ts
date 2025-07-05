import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';
import { config } from '@/config/environment';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  stack?: string;
}

// Handle Zod validation errors
const handleZodError = (error: ZodError): AppError => {
  const message = error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  return new AppError(`Validation failed: ${message}`, 400, 'VALIDATION_ERROR');
};

// Handle Mongoose validation errors
const handleMongooseValidationError = (error: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `Invalid input data: ${errors.join(', ')}`;

  return new AppError(message, 400, 'VALIDATION_ERROR');
};

// Handle Mongoose cast errors
const handleCastError = (error: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (error: MongoError): AppError => {
  const field = Object.keys((error as any).keyValue)[0];
  const value = (error as any).keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;

  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
};

// Handle JWT expired errors
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');
};

// Send error response for development
const sendErrorDev = (err: AppError, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message,
    error: err.code || err.name,
    details: {
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational,
    },
    stack: err.stack,
  };

  res.status(err.statusCode).json(errorResponse);
};

// Send error response for production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: err.message,
      error: err.code,
    };

    res.status(err.statusCode).json(errorResponse);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);

    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Something went wrong!',
      error: 'INTERNAL_ERROR',
    };

    res.status(500).json(errorResponse);
  }
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = { ...error } as AppError;
  err.message = error.message;

  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Zod validation error
  if (error instanceof ZodError) {
    err = handleZodError(error);
  }
  // Mongoose validation error
  else if (error.name === 'ValidationError') {
    err = handleMongooseValidationError(error as mongoose.Error.ValidationError);
  }
  // Mongoose cast error
  else if (error.name === 'CastError') {
    err = handleCastError(error as mongoose.Error.CastError);
  }
  // MongoDB duplicate key error
  else if ((error as any).code === 11000) {
    err = handleDuplicateKeyError(error as MongoError);
  }
  // JWT error
  else if (error.name === 'JsonWebTokenError') {
    err = handleJWTError();
  }
  // JWT expired error
  else if (error.name === 'TokenExpiredError') {
    err = handleJWTExpiredError();
  }
  // If it's not an AppError, convert it
  else if (!(error instanceof AppError)) {
    err = new AppError(
      config.server.isProduction ? 'Something went wrong' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Send error response
  if (config.server.isDevelopment) {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.originalUrl} not found`;
  next(new AppError(message, 404, 'NOT_FOUND'));
};

// Validation middleware
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { AppError };
