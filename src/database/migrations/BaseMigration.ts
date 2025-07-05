import mongoose from 'mongoose';
import { database } from '@/config/database';

/**
 * Base Migration class for database migrations
 */
export abstract class BaseMigration {
  public abstract name: string;
  public abstract version: number;

  /**
   * Execute the migration
   */
  abstract up(): Promise<void>;

  /**
   * Rollback the migration
   */
  abstract down(): Promise<void>;

  /**
   * Get database instance safely
   */
  protected async getDatabase(): Promise<mongoose.mongo.Db> {
    // Ensure connection is established
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      await database.connect();
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    return db;
  }

  /**
   * Check if migration has already been executed
   */
  async isExecuted(): Promise<boolean> {
    const MigrationModel = this.getMigrationModel();
    const executed = await MigrationModel.findOne({
      name: this.name,
      version: this.version
    });
    return !!executed;
  }

  /**
   * Mark migration as executed
   */
  async markAsExecuted(): Promise<void> {
    const MigrationModel = this.getMigrationModel();
    await MigrationModel.create({
      name: this.name,
      version: this.version,
      executedAt: new Date()
    });
  }

  /**
   * Mark migration as rolled back
   */
  async markAsRolledBack(): Promise<void> {
    const MigrationModel = this.getMigrationModel();
    await MigrationModel.deleteOne({
      name: this.name,
      version: this.version
    });
  }

  /**
   * Get migration tracking model
   */
  private getMigrationModel() {
    const migrationSchema = new mongoose.Schema({
      name: { type: String, required: true },
      version: { type: Number, required: true },
      executedAt: { type: Date, default: Date.now }
    }, {
      collection: 'migrations'
    });

    migrationSchema.index({ name: 1, version: 1 }, { unique: true });

    return mongoose.models.Migration || mongoose.model('Migration', migrationSchema);
  }

  /**
   * Log migration progress
   */
  protected log(message: string): void {
    console.log(`[Migration ${this.name} v${this.version}] ${message}`);
  }
}

/**
 * Migration Manager
 */
export class MigrationManager {
  private migrations: BaseMigration[] = [];

  /**
   * Register a migration
   */
  register(migration: BaseMigration): void {
    this.migrations.push(migration);
  }

  /**
   * Run all pending migrations
   */
  async runPending(): Promise<void> {
    console.log('🔄 Running pending migrations...');

    // Sort migrations by version
    const sortedMigrations = this.migrations.sort((a, b) => a.version - b.version);

    for (const migration of sortedMigrations) {
      if (!(await migration.isExecuted())) {
        console.log(`⏳ Running migration: ${migration.name} v${migration.version}`);
        try {
          await migration.up();
          await migration.markAsExecuted();
          console.log(`✅ Migration completed: ${migration.name} v${migration.version}`);
        } catch (error) {
          console.error(`❌ Migration failed: ${migration.name} v${migration.version}`, error);
          throw error;
        }
      } else {
        console.log(`⏭️  Migration already executed: ${migration.name} v${migration.version}`);
      }
    }

    console.log('✅ All migrations completed');
  }

  /**
   * Rollback migrations
   */
  async rollback(steps: number = 1): Promise<void> {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);

    // Get executed migrations in reverse order
    const sortedMigrations = this.migrations
      .sort((a, b) => b.version - a.version)
      .slice(0, steps);

    for (const migration of sortedMigrations) {
      if (await migration.isExecuted()) {
        console.log(`⏳ Rolling back migration: ${migration.name} v${migration.version}`);
        try {
          await migration.down();
          await migration.markAsRolledBack();
          console.log(`✅ Rollback completed: ${migration.name} v${migration.version}`);
        } catch (error) {
          console.error(`❌ Rollback failed: ${migration.name} v${migration.version}`, error);
          throw error;
        }
      }
    }

    console.log('✅ Rollback completed');
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<void> {
    console.log('📊 Migration Status:');

    const sortedMigrations = this.migrations.sort((a, b) => a.version - b.version);

    for (const migration of sortedMigrations) {
      const executed = await migration.isExecuted();
      const status = executed ? '✅ Executed' : '⏳ Pending';
      console.log(`  ${migration.name} v${migration.version}: ${status}`);
    }
  }
}

export default MigrationManager;
