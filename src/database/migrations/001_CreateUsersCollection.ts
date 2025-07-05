import { BaseMigration } from './BaseMigration';

/**
 * Migration: Create Users Collection
 * Version: 001
 */
export class CreateUsersCollection extends BaseMigration {
  public name = 'CreateUsersCollection';
  public version = 1;

  async up(): Promise<void> {
    this.log('Creating users collection with indexes...');

    const db = await this.getDatabase();

    // Create users collection if it doesn't exist
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('users');
      this.log('Users collection created');
    }

    // Create indexes for users collection
    const usersCollection = db.collection('users');

    // Email unique index
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, background: true }
    );
    this.log('Created unique index on email');

    // Name index for search
    await usersCollection.createIndex(
      { name: 1 },
      { background: true }
    );
    this.log('Created index on name');

    // Role index for filtering
    await usersCollection.createIndex(
      { role: 1 },
      { background: true }
    );
    this.log('Created index on role');

    // Active status index
    await usersCollection.createIndex(
      { isActive: 1 },
      { background: true }
    );
    this.log('Created index on isActive');

    // Created date index for sorting
    await usersCollection.createIndex(
      { createdAt: -1 },
      { background: true }
    );
    this.log('Created index on createdAt');

    // Last login index for analytics
    await usersCollection.createIndex(
      { lastLogin: -1 },
      { background: true }
    );
    this.log('Created index on lastLogin');

    // Compound index for active users by role
    await usersCollection.createIndex(
      { isActive: 1, role: 1 },
      { background: true }
    );
    this.log('Created compound index on isActive and role');

    this.log('Users collection migration completed');
  }

  async down(): Promise<void> {
    this.log('Dropping users collection...');

    const db = await this.getDatabase();
    await db.collection('users').drop();

    this.log('Users collection dropped');
  }
}

export default CreateUsersCollection;
