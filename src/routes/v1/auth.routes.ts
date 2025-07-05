import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/errorHandler';
import {
  UserRegistrationSchema,
  UserLoginSchema,
  UserUpdateSchema,
  UserChangePasswordSchema
} from '@/types/user.types';
import { config } from '@/config/environment';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateRegistration = validate({ body: UserRegistrationSchema });
const validateLogin = validate({ body: UserLoginSchema });
const validateUpdate = validate({ body: UserUpdateSchema });
const validateChangePassword = validate({ body: UserChangePasswordSchema });

// Public routes
router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, validateUpdate, authController.updateProfile);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
