import { Router } from 'express';

const router = Router();

// Import route modules
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';

// API v1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

// Add route for project tasks (nested route)
router.use('/projects/:projectId/tasks', (req, res, next) => {
  // Forward to task controller with projectId
  req.params.projectId = req.params.projectId;
  next();
}, taskRoutes);

// API v1 health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is working',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      projects: '/api/v1/projects',
      tasks: '/api/v1/tasks',
      dashboard: '/api/v1/dashboard'
    }
  });
});

export default router;
