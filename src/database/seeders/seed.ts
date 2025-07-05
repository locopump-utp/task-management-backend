import { database } from '@/config/database';
import { SeederManager } from './BaseSeeder';

// Import all seeders
import UsersSeeder from './UsersSeeder';
import ProjectsSeeder from './ProjectsSeeder';
import TasksSeeder from './TasksSeeder';

/**
 * Seeder runner script
 */
async function runSeeders() {
  try {
    console.log('🌱 Starting database seeders...');

    // Connect to database
    await database.connect();

    // Create seeder manager
    const seederManager = new SeederManager();

    // Register all seeders in order
    seederManager.register(new UsersSeeder());
    seederManager.register(new ProjectsSeeder());
    seederManager.register(new TasksSeeder());

    // Get seeder status
    await seederManager.getStatus();

    // Run all seeders
    await seederManager.runAll();

    console.log('✅ All seeders completed successfully');
    console.log(`
📋 Demo Data Created:
• Admin User: admin@taskmanagement.com (password: Admin123!@#)
• 5 Demo Users: john.doe@example.com, jane.smith@example.com, etc. (password: User123!@#)
• 6 Projects: E-commerce Platform, Mobile App, Website Redesign, etc.
• ~20 Tasks: Various states (todo, in_progress, completed) across all projects

🚀 You can now start the server and test the API with demo data!
    `);

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
}

/**
 * Clear all seeded data
 */
async function clearSeeders() {
  try {
    console.log('🧹 Clearing seeded data...');

    // Connect to database
    await database.connect();

    // Create seeder manager
    const seederManager = new SeederManager();

    // Register all seeders
    seederManager.register(new UsersSeeder());
    seederManager.register(new ProjectsSeeder());
    seederManager.register(new TasksSeeder());

    // Clear all seeders
    await seederManager.clearAll();

    console.log('✅ All seeded data cleared successfully');

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Seeder clear failed:', error);
    process.exit(1);
  }
}

/**
 * Check seeder status
 */
async function checkSeederStatus() {
  try {
    console.log('📊 Checking seeder status...');

    // Connect to database
    await database.connect();

    // Create seeder manager
    const seederManager = new SeederManager();

    // Register all seeders
    seederManager.register(new UsersSeeder());
    seederManager.register(new ProjectsSeeder());
    seederManager.register(new TasksSeeder());

    // Get status
    await seederManager.getStatus();

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Seeder status check failed:', error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'run':
    runSeeders();
    break;
  case 'clear':
    clearSeeders();
    break;
  case 'status':
    checkSeederStatus();
    break;
  default:
    console.log(`
Usage: ts-node src/database/seeders/seed.ts <command>

Commands:
  run       Run all seeders to populate database with demo data
  clear     Clear all seeded data from database
  status    Check which seeders have been executed

Examples:
  npm run seed run
  npm run seed clear
  npm run seed status

Demo Login Credentials:
  Admin: admin@taskmanagement.com / Admin123!@#
  User:  john.doe@example.com / User123!@#
    `);
    break;
}

export { runSeeders, clearSeeders, checkSeederStatus };
