import mongoose from 'mongoose';
import { database } from '@/config/database';

/**
 * Base Seeder class for database seeders
 */
export abstract class BaseSeeder {
  public abstract name: string;
  public abstract order: number;

  /**
   * Execute the seeder
   */
  abstract run(): Promise<void>;

  /**
   * Clear seeded data
   */
  abstract clear(): Promise<void>;

  /**
   * Check if seeder has already been executed
   */
  async isExecuted(): Promise<boolean> {
    const SeederModel = this.getSeederModel();
    const executed = await SeederModel.findOne({ name: this.name });
    return !!executed;
  }

  /**
   * Mark seeder as executed
   */
  async markAsExecuted(): Promise<void> {
    const SeederModel = this.getSeederModel();
    await SeederModel.create({
      name: this.name,
      order: this.order,
      executedAt: new Date()
    });
  }

  /**
   * Mark seeder as cleared
   */
  async markAsCleared(): Promise<void> {
    const SeederModel = this.getSeederModel();
    await SeederModel.deleteOne({ name: this.name });
  }

  /**
   * Get seeder tracking model
   */
  private getSeederModel() {
    const seederSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      order: { type: Number, required: true },
      executedAt: { type: Date, default: Date.now }
    }, {
      collection: 'seeders'
    });

    return mongoose.models.Seeder || mongoose.model('Seeder', seederSchema);
  }

  /**
   * Log seeder progress
   */
  protected log(message: string): void {
    console.log(`[Seeder ${this.name}] ${message}`);
  }
}

/**
 * Seeder Manager
 */
export class SeederManager {
  private seeders: BaseSeeder[] = [];

  /**
   * Register a seeder
   */
  register(seeder: BaseSeeder): void {
    this.seeders.push(seeder);
  }

  /**
   * Run all seeders
   */
  async runAll(): Promise<void> {
    console.log('🌱 Running database seeders...');

    // Sort seeders by order
    const sortedSeeders = this.seeders.sort((a, b) => a.order - b.order);

    for (const seeder of sortedSeeders) {
      if (!(await seeder.isExecuted())) {
        console.log(`⏳ Running seeder: ${seeder.name}`);
        try {
          await seeder.run();
          await seeder.markAsExecuted();
          console.log(`✅ Seeder completed: ${seeder.name}`);
        } catch (error) {
          console.error(`❌ Seeder failed: ${seeder.name}`, error);
          throw error;
        }
      } else {
        console.log(`⏭️  Seeder already executed: ${seeder.name}`);
      }
    }

    console.log('✅ All seeders completed');
  }

  /**
   * Clear all seeded data
   */
  async clearAll(): Promise<void> {
    console.log('🧹 Clearing seeded data...');

    // Sort seeders in reverse order for clearing
    const sortedSeeders = this.seeders.sort((a, b) => b.order - a.order);

    for (const seeder of sortedSeeders) {
      if (await seeder.isExecuted()) {
        console.log(`⏳ Clearing seeder: ${seeder.name}`);
        try {
          await seeder.clear();
          await seeder.markAsCleared();
          console.log(`✅ Seeder cleared: ${seeder.name}`);
        } catch (error) {
          console.error(`❌ Seeder clear failed: ${seeder.name}`, error);
          throw error;
        }
      }
    }

    console.log('✅ All seeders cleared');
  }

  /**
   * Get seeder status
   */
  async getStatus(): Promise<void> {
    console.log('📊 Seeder Status:');

    const sortedSeeders = this.seeders.sort((a, b) => a.order - b.order);

    for (const seeder of sortedSeeders) {
      const executed = await seeder.isExecuted();
      const status = executed ? '✅ Executed' : '⏳ Pending';
      console.log(`  ${seeder.name}: ${status}`);
    }
  }
}

export default SeederManager;
