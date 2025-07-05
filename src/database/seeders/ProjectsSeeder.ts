import { Project } from '@/database/entities/Project.entity';
import { User } from '@/database/entities/User.entity';
import { BaseSeeder } from './BaseSeeder';

/**
 * Projects Seeder
 * Creates demo projects with members
 */
export class ProjectsSeeder extends BaseSeeder {
  public name = 'ProjectsSeeder';
  public order = 2;

  async run(): Promise<void> {
    this.log('Seeding projects...');

    // Check if projects already exist
    const existingProjects = await Project.countDocuments();
    if (existingProjects > 0) {
      this.log('Projects already exist, skipping...');
      return;
    }

    // Get users for project assignment
    const users = await User.find({ isActive: true });
    if (users.length === 0) {
      this.log('No users found, please run UsersSeeder first');
      return;
    }

    const adminUser = users.find(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user');

    if (!adminUser) {
      this.log('No admin user found, please run UsersSeeder first');
      return;
    }

    // Demo projects data
    const projectsData = [
      {
        name: 'E-commerce Platform',
        description: 'Development of a modern e-commerce platform with React and Node.js. Features include user authentication, product catalog, shopping cart, and payment integration.',
        owner: adminUser._id,
        members: regularUsers.slice(0, 3).map(u => u._id),
        status: 'active' as const,
      },
      {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application for task management. Built with React Native and integrates with our backend API.',
        owner: regularUsers[0]?._id || adminUser._id,
        members: [adminUser._id, ...(regularUsers.slice(1, 3).map(u => u._id))],
        status: 'active' as const,
      },
      {
        name: 'Company Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX principles. Includes SEO optimization and responsive design.',
        owner: regularUsers[1]?._id || adminUser._id,
        members: [adminUser._id, regularUsers[0]?._id, regularUsers[3]?._id].filter(Boolean),
        status: 'active' as const,
      },
      {
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard for sales and marketing analytics. Built with D3.js and real-time data visualization.',
        owner: regularUsers[2]?._id || adminUser._id,
        members: [adminUser._id, regularUsers[4]?._id].filter(Boolean),
        status: 'paused' as const,
      },
      {
        name: 'Customer Support System',
        description: 'Comprehensive customer support ticketing system with automated responses and priority management.',
        owner: adminUser._id,
        members: regularUsers.slice(0, 2).map(u => u._id),
        status: 'completed' as const,
      },
      {
        name: 'API Documentation Portal',
        description: 'Interactive API documentation portal with code examples, testing interface, and developer resources.',
        owner: regularUsers[3]?._id || adminUser._id,
        members: [adminUser._id, regularUsers[1]?._id].filter(Boolean),
        status: 'active' as const,
      }
    ];

    // Create projects
    const createdProjects = [];
    for (const projectData of projectsData) {
      const project = await Project.create(projectData);
      createdProjects.push(project);
      this.log(`Created project: ${project.name}`);
    }

    this.log(`Successfully created ${createdProjects.length} projects`);

    // Store project IDs for tasks seeder
    const projectIds = createdProjects.map(p => p._id);
    this.log(`Project IDs: ${projectIds.join(', ')}`);
  }

  async clear(): Promise<void> {
    this.log('Clearing projects...');

    const projectNames = [
      'E-commerce Platform',
      'Mobile App Development',
      'Company Website Redesign',
      'Data Analytics Dashboard',
      'Customer Support System',
      'API Documentation Portal'
    ];

    const result = await Project.deleteMany({
      name: { $in: projectNames }
    });

    this.log(`Cleared ${result.deletedCount} projects`);
  }
}

export default ProjectsSeeder;
