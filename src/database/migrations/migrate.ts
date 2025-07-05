import { database } from '@/config/database';
import { MigrationManager } from './BaseMigration';

// Import all migrations
import CreateUsersCollection from './001_CreateUsersCollection';
import CreateProjectsCollection from './002_CreateProjectsCollection';
import CreateTasksCollection from './003_CreateTasksCollection';

/**
 * Migration runner script
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    // Connect to database
    await database.connect();

    // Create migration manager
    const migrationManager = new MigrationManager();

    // Register all migrations in order
    migrationManager.register(new CreateUsersCollection());
    migrationManager.register(new CreateProjectsCollection());
    migrationManager.register(new CreateTasksCollection());

    // Get migration status
    await migrationManager.getStatus();

    // Run pending migrations
    await migrationManager.runPending();

    console.log('✅ All migrations completed successfully');

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Rollback migrations
 */
async function rollbackMigrations(steps: number = 1) {
  try {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);

    // Connect to database
    await database.connect();

    // Create migration manager
    const migrationManager = new MigrationManager();

    // Register all migrations
    migrationManager.register(new CreateUsersCollection());
    migrationManager.register(new CreateProjectsCollection());
    migrationManager.register(new CreateTasksCollection());

    // Rollback migrations
    await migrationManager.rollback(steps);

    console.log('✅ Rollback completed successfully');

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

/**
 * Check migration status
 */
async function checkStatus() {
  try {
    console.log('📊 Checking migration status...');

    // Connect to database
    await database.connect();

    // Create migration manager
    const migrationManager = new MigrationManager();

    // Register all migrations
    migrationManager.register(new CreateUsersCollection());
    migrationManager.register(new CreateProjectsCollection());
    migrationManager.register(new CreateTasksCollection());

    // Get status
    await migrationManager.getStatus();

    // Disconnect from database
    await database.disconnect();

  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];
const steps = parseInt(process.argv[3]) || 1;

switch (command) {
  case 'up':
    runMigrations();
    break;
  case 'down':
    rollbackMigrations(steps);
    break;
  case 'status':
    checkStatus();
    break;
  default:
    console.log(`
Usage: ts-node src/database/migrations/migrate.ts <command> [options]

Commands:
  up              Run all pending migrations
  down [steps]    Rollback migrations (default: 1 step)
  status          Check migration status

Examples:
  npm run migrate up
  npm run migrate down
  npm run migrate down 2
  npm run migrate status
    `);
    break;
}

export { runMigrations, rollbackMigrations, checkStatus };
