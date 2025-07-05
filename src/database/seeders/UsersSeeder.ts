import bcrypt from 'bcryptjs';
import { User } from '@/database/entities/User.entity';
import { BaseSeeder } from './BaseSeeder';

/**
 * Users Seeder
 * Creates initial admin and demo users
 */
export class UsersSeeder extends BaseSeeder {
  public name = 'UsersSeeder';
  public order = 1;

  async run(): Promise<void> {
    this.log('Seeding users...');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      this.log('Users already exist, skipping...');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@taskmanagement.com',
      password: 'Admin123!@#', // Will be hashed by pre-save middleware
      role: 'admin',
      isActive: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0d47a1&color=fff',
    });

    this.log(`Created admin user: ${adminUser.email}`);

    // Create demo users
    const demoUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'User123!@#',
        role: 'user' as const,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1976d2&color=fff',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'User123!@#',
        role: 'user' as const,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=388e3c&color=fff',
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: 'User123!@#',
        role: 'user' as const,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=f57c00&color=fff',
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        password: 'User123!@#',
        role: 'user' as const,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=7b1fa2&color=fff',
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        password: 'User123!@#',
        role: 'user' as const,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=d32f2f&color=fff',
      }
    ];

    for (const userData of demoUsers) {
      const user = await User.create(userData);
      this.log(`Created demo user: ${user.email}`);
    }

    this.log(`Successfully created ${demoUsers.length + 1} users`);
  }

  async clear(): Promise<void> {
    this.log('Clearing users...');

    const result = await User.deleteMany({
      email: {
        $in: [
          'admin@taskmanagement.com',
          'john.doe@example.com',
          'jane.smith@example.com',
          'mike.johnson@example.com',
          'sarah.wilson@example.com',
          'david.brown@example.com'
        ]
      }
    });

    this.log(`Cleared ${result.deletedCount} users`);
  }
}

export default UsersSeeder;
