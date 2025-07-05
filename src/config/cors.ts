import cors from 'cors';
import { config } from './environment';

// CORS configuration options
const corsOptions: cors.CorsOptions = {
  // Allow requests from specified origins
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (config.server.isDevelopment) {
      return callback(null, true);
    }

    // Reject the request
    const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
    return callback(new Error(msg), false);
  },

  // Allow credentials (cookies, authorization headers)
  credentials: config.cors.credentials,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
    'X-Refresh-Token',
  ],

  // Headers exposed to the client
  exposedHeaders: [
    'X-Access-Token',
    'X-Refresh-Token',
    'X-Total-Count',
    'X-Page-Count',
  ],

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours

  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Create CORS middleware
export const corsMiddleware = cors(corsOptions);

// Custom CORS middleware for specific routes
export const createCustomCors = (customOrigins?: string[]) => {
  const customOptions: cors.CorsOptions = {
    ...corsOptions,
    origin: customOrigins || config.cors.origin,
  };

  return cors(customOptions);
};

// Strict CORS for admin routes
export const adminCorsOptions: cors.CorsOptions = {
  ...corsOptions,
  origin: config.server.isProduction
    ? config.cors.origin.filter(origin => origin.includes('admin'))
    : config.cors.origin,
};

export const adminCorsMiddleware = cors(adminCorsOptions);

export default corsMiddleware;
