import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config, validateConfig } from '@/config/environment';
import { corsMiddleware } from '@/config/cors';
import { errorHandler, notFound } from '@/middleware/errorHandler';
import apiRoutes from '@/routes/v1';

// Validate configuration on startup
validateConfig();

// Create Express application
const app = express();

// Trust proxy (important for rate limiting and getting real IP addresses)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(config.security.helmet));

// CORS middleware
app.use(corsMiddleware);

// Compression middleware
app.use(compression());

// Request logging
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      service: config.app.name,
      version: config.app.version,
      environment: config.server.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Management API',
    data: {
      name: config.app.name,
      version: config.app.version,
      description: config.app.description,
      author: config.app.author,
      endpoints: {
        health: '/health',
        api: '/api/v1',
        documentation: '/api/docs'
      }
    }
  });
});

// API routes
app.use('/api/v1', apiRoutes);

// 404 handler - must be after all routes
app.use('*', notFound);

// Global error handler - must be last middleware
app.use(errorHandler);

export default app;
