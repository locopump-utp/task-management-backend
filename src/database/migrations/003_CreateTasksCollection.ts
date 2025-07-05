import { BaseMigration } from './BaseMigration';

/**
 * Migration: Create Tasks Collection
 * Version: 003
 */
export class CreateTasksCollection extends BaseMigration {
  public name = 'CreateTasksCollection';
  public version = 3;

  async up(): Promise<void> {
    this.log('Creating tasks collection with indexes...');

    const db = await this.getDatabase();

    // Create tasks collection if it doesn't exist
    const collections = await db.listCollections({ name: 'tasks' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('tasks');
      this.log('Tasks collection created');
    }

    // Create indexes for tasks collection
    const tasksCollection = db.collection('tasks');

    // Project ID index for finding tasks by project
    await tasksCollection.createIndex(
      { projectId: 1 },
      { background: true }
    );
    this.log('Created index on projectId');

    // Assigned user index for finding user's tasks
    await tasksCollection.createIndex(
      { assignedTo: 1 },
      { background: true }
    );
    this.log('Created index on assignedTo');

    // Status index for filtering by task status
    await tasksCollection.createIndex(
      { status: 1 },
      { background: true }
    );
    this.log('Created index on status');

    // Priority index for filtering by priority
    await tasksCollection.createIndex(
      { priority: 1 },
      { background: true }
    );
    this.log('Created index on priority');

    // Due date index for finding overdue/upcoming tasks
    await tasksCollection.createIndex(
      { dueDate: 1 },
      { background: true }
    );
    this.log('Created index on dueDate');

    // Created date index for sorting
    await tasksCollection.createIndex(
      { createdAt: -1 },
      { background: true }
    );
    this.log('Created index on createdAt');

    // Text index for search functionality
    await tasksCollection.createIndex(
      { title: 'text', description: 'text' },
      { background: true }
    );
    this.log('Created text index on title and description');

    // Compound index for project tasks by status
    await tasksCollection.createIndex(
      { projectId: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on projectId and status');

    // Compound index for user tasks by status
    await tasksCollection.createIndex(
      { assignedTo: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on assignedTo and status');

    // Compound index for due date and status (for overdue queries)
    await tasksCollection.createIndex(
      { dueDate: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on dueDate and status');

    // Compound index for project, assigned user, and status
    await tasksCollection.createIndex(
      { projectId: 1, assignedTo: 1, status: 1 },
      { background: true }
    );
    this.log('Created compound index on projectId, assignedTo, and status');

    this.log('Tasks collection migration completed');
  }

  async down(): Promise<void> {
    this.log('Dropping tasks collection...');

    const db = await this.getDatabase();
    await db.collection('tasks').drop();

    this.log('Tasks collection dropped');
  }
}

export default CreateTasksCollection;
