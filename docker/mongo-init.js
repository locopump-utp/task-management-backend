// MongoDB initialization script
db = db.getSiblingDB('task_management');

// Create initial collections
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ owner: 1 });
db.projects.createIndex({ members: 1 });
db.tasks.createIndex({ projectId: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ dueDate: 1 });

print('Database initialized successfully!');
