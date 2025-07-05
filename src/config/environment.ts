import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Environment configuration
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  // Database configuration
  database: {
    url: process.env.MONGODB_URI!,
    name: process.env.DB_NAME || 'task_management',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'task-management-api',
  },

  // Bcrypt configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10), // 5 auth attempts per window
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // Email configuration (for future implementation)
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@taskmanagement.com',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT || '10', 10),
    maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT || '100', 10),
  },

  // Security configuration
  security: {
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    },
  },

  // Application metadata
  app: {
    name: process.env.APP_NAME || 'Task Management API',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'A comprehensive task management system API',
    author: process.env.APP_AUTHOR || 'Frank Cáceres - locopump - AkisoftTech',
  },
};

// Validate configuration
export const validateConfig = (): void => {
  const errors: string[] = [];

  // Validate port
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate MongoDB URI
  if (!config.database.url.startsWith('mongodb://') && !config.database.url.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Validate JWT secrets
  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (config.jwt.refreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  // Validate bcrypt salt rounds
  if (config.bcrypt.saltRounds < 10 || config.bcrypt.saltRounds > 15) {
    errors.push('BCRYPT_SALT_ROUNDS must be between 10 and 15');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
};

export default config;
