import { Task } from '@/database/entities/Task.entity';
import { Project } from '@/database/entities/Project.entity';
import { User } from '@/database/entities/User.entity';
import { BaseSeeder } from './BaseSeeder';

/**
 * Tasks Seeder
 * Creates demo tasks for existing projects
 */
export class TasksSeeder extends BaseSeeder {
  public name = 'TasksSeeder';
  public order = 3;

  async run(): Promise<void> {
    this.log('Seeding tasks...');

    // Check if tasks already exist
    const existingTasks = await Task.countDocuments();
    if (existingTasks > 0) {
      this.log('Tasks already exist, skipping...');
      return;
    }

    // Get projects and users for task assignment
    const projects = await Project.find().populate('members owner');
    const users = await User.find({ isActive: true });

    if (projects.length === 0) {
      this.log('No projects found, please run ProjectsSeeder first');
      return;
    }

    if (users.length === 0) {
      this.log('No users found, please run UsersSeeder first');
      return;
    }

    let totalTasksCreated = 0;

    // Create tasks for each project
    for (const project of projects) {
      const projectMembers = [...project.members, project.owner];
      const tasksForProject = this.getTasksForProject(project.name, project._id, projectMembers);

      for (const taskData of tasksForProject) {
        const task = await Task.create(taskData);
        totalTasksCreated++;
        this.log(`Created task: ${task.title} for project: ${project.name}`);
      }
    }

    this.log(`Successfully created ${totalTasksCreated} tasks across ${projects.length} projects`);
  }

  private getTasksForProject(projectName: string, projectId: any, members: any[]): any[] {
    const getRandomMember = () => members[Math.floor(Math.random() * members.length)]._id;
    const getRandomDate = (daysFromNow: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    };

    switch (projectName) {
      case 'E-commerce Platform':
        return [
          {
            title: 'Setup project structure and dependencies',
            description: 'Initialize the project with proper folder structure, install necessary dependencies, and configure development environment.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-10),
            completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          },
          {
            title: 'Design user authentication system',
            description: 'Create login, registration, and password reset functionality with proper validation and security measures.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-5),
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
          {
            title: 'Implement product catalog',
            description: 'Build product listing, filtering, search functionality, and product detail pages.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'in_progress',
            priority: 'high',
            dueDate: getRandomDate(5),
          },
          {
            title: 'Develop shopping cart functionality',
            description: 'Create add to cart, update quantities, remove items, and persist cart state.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'medium',
            dueDate: getRandomDate(10),
          },
          {
            title: 'Integrate payment gateway',
            description: 'Implement secure payment processing with Stripe or PayPal integration.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'high',
            dueDate: getRandomDate(15),
          },
        ];

      case 'Mobile App Development':
        return [
          {
            title: 'Setup React Native development environment',
            description: 'Configure development environment for both iOS and Android platforms.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-12),
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Design app navigation structure',
            description: 'Implement navigation using React Navigation with proper screen flow.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'in_progress',
            priority: 'medium',
            dueDate: getRandomDate(3),
          },
          {
            title: 'Implement user interface components',
            description: 'Create reusable UI components following design system guidelines.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'medium',
            dueDate: getRandomDate(8),
          },
          {
            title: 'Integrate with backend API',
            description: 'Connect mobile app with backend services for data synchronization.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'high',
            dueDate: getRandomDate(12),
          },
        ];

      case 'Company Website Redesign':
        return [
          {
            title: 'Conduct user research and analysis',
            description: 'Analyze current website performance and gather user feedback for improvements.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'medium',
            dueDate: getRandomDate(-15),
            completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Create wireframes and mockups',
            description: 'Design new website layout, user interface, and user experience flow.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-8),
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Develop responsive frontend',
            description: 'Implement responsive design that works across all devices and browsers.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'in_progress',
            priority: 'high',
            dueDate: getRandomDate(7),
          },
          {
            title: 'Optimize for SEO',
            description: 'Implement SEO best practices, meta tags, and performance optimizations.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'medium',
            dueDate: getRandomDate(14),
          },
        ];

      case 'Data Analytics Dashboard':
        return [
          {
            title: 'Define dashboard requirements',
            description: 'Gather requirements from stakeholders and define key metrics to display.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-20),
            completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Design data visualization components',
            description: 'Create charts, graphs, and interactive visualizations using D3.js.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'medium',
            dueDate: getRandomDate(20),
          },
        ];

      case 'Customer Support System':
        return [
          {
            title: 'Design ticket management system',
            description: 'Create comprehensive ticket lifecycle management with status tracking.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'high',
            dueDate: getRandomDate(-30),
            completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Implement automated responses',
            description: 'Create smart auto-response system based on ticket categories and keywords.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'completed',
            priority: 'medium',
            dueDate: getRandomDate(-20),
            completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
        ];

      case 'API Documentation Portal':
        return [
          {
            title: 'Setup documentation framework',
            description: 'Configure documentation generator and interactive API explorer.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'in_progress',
            priority: 'high',
            dueDate: getRandomDate(5),
          },
          {
            title: 'Write comprehensive API documentation',
            description: 'Document all endpoints with examples, parameters, and response formats.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'high',
            dueDate: getRandomDate(12),
          },
          {
            title: 'Add code examples and tutorials',
            description: 'Create practical examples and getting started guides for developers.',
            projectId,
            assignedTo: getRandomMember(),
            status: 'todo',
            priority: 'medium',
            dueDate: getRandomDate(18),
          },
        ];

      default:
        return [];
    }
  }

  async clear(): Promise<void> {
    this.log('Clearing tasks...');

    // Get projects to clear their tasks
    const projects = await Project.find({
      name: {
        $in: [
          'E-commerce Platform',
          'Mobile App Development',
          'Company Website Redesign',
          'Data Analytics Dashboard',
          'Customer Support System',
          'API Documentation Portal'
        ]
      }
    });

    const projectIds = projects.map(p => p._id);

    const result = await Task.deleteMany({
      projectId: { $in: projectIds }
    });

    this.log(`Cleared ${result.deletedCount} tasks`);
  }
}

export default TasksSeeder;
