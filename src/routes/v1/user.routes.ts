import { Router } from 'express';
import { userController } from '@/controllers/auth.controller';
import { authenticate, requireAdmin, requireOwnership } from '@/middleware/auth';
import { validate } from '@/middleware/errorHandler';
import { IdParamSchema } from '@/types/common.types';

const router = Router();

// Validation middleware
const validateIdParam = validate({ params: IdParamSchema });

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/statistics', requireAdmin, userController.getUserStatistics);

// Search users (accessible by all authenticated users)
router.get('/search', userController.searchUsers);

// User specific routes
router.get('/:id', validateIdParam, requireOwnership('id'), userController.getUserById);

export default router;
