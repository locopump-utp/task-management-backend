import { BaseMigration } from './BaseMigration';

/**
 * Migration: Create Projects Collection
 * Version: 002
 */
export class CreateProjectsCollection extends BaseMigration {
  public name = 'CreateProjectsCollection';
  public version = 2;

  async up(): Promise<void> {
    this.log('Creating projects collection with indexes...');

    const db = await this.getDatabase();

    // Create projects collection if it doesn't exist
    const collections = await db.listCollections({ name: 'projects' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('projects');
      this.log('Projects collection created');
    }

    // Create indexes for projects collection
    const projectsCollection = db.collection('projects');

    // Owner index for finding user's projects
    await projectsCollection.createIndex(
      { owner: 1 },
      { background: true }
    );
    this.log('Created index on owner');

    // Members index for finding projects user is member of
    await projectsCollection.createIndex(
      { members: 1 },
      { background: true }
    );
    this.log('Created index on members');

    // Status index for filtering by project status
    await projectsCollection.createIndex(
      { status: 1 },
      { background: true }
    );
    this.log('Created index on status');

    // Created date index for sorting
    await projectsCollection.createIndex(
      { createdAt: -1 },
      { background: true }
    );
    this.log('Created index on createdAt');

    // Updated date index for recent activity
    await projectsCollection.createIndex(
      { updatedAt: -1 },
      { background: true }
    );
    this.log('Created index on updatedAt');

    // Text index for search functionality
    await projectsCollection.createIndex(
      { name: 'text', description: 'text' },
      { background: true }
    );
    this.log('Created text index on name and description');

    // Compound index for owner and status
    await projectsCollection.createIndex(
      { owner: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on owner and status');

    // Compound index for members and status
    await projectsCollection.createIndex(
      { members: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on members and status');

    this.log('Projects collection migration completed');
  }

  async down(): Promise<void> {
    this.log('Dropping projects collection...');

    const db = await this.getDatabase();
    await db.collection('projects').drop();

    this.log('Projects collection dropped');
  }
}

export default CreateProjectsCollection;
