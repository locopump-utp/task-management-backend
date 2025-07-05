import { Schema, model, Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import { TaskDocument, TaskStatus, TaskPriority } from '@/types/task.types';

// Task Schema Interface
interface ITaskDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  projectId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markAsCompleted(): Promise<ITaskDocument>;
  isOverdue(): boolean;
  getDaysUntilDue(): number;
}

// Task Schema Definition
const taskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
      maxlength: [200, 'Task title must be less than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      maxlength: [1000, 'Task description must be less than 1000 characters'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'completed'],
        message: 'Status must be either todo, in_progress, or completed',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be either low, medium, or high',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function(v: Date) {
          return v > new Date();
        },
        message: 'Due date must be in the future',
      },
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
taskSchema.index({ projectId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set completedAt when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      // Use delete instead of undefined to remove the property
      delete this.completedAt;
    }
  }
  next();
});

// Pre-update middleware for completedAt
taskSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;

  if (update.status === 'completed' && !update.completedAt) {
    update.completedAt = new Date();
  } else if (update.status && update.status !== 'completed') {
    // Use $unset to properly remove the field in MongoDB
    if (!update.$unset) {
      update.$unset = {};
    }
    update.$unset.completedAt = 1;
    // Remove completedAt from the update object if it exists
    delete update.completedAt;
  }

  next();
});

// Instance method to mark task as completed
taskSchema.methods.markAsCompleted = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Instance method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  return this.status !== 'completed' && new Date() > this.dueDate;
};

// Instance method to get days until due
taskSchema.methods.getDaysUntilDue = function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to find tasks by project
taskSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).populate('assignedTo', 'name email avatar');
};

// Static method to find tasks by user
taskSchema.statics.findByUser = function(userId: string) {
  return this.find({ assignedTo: userId }).populate('projectId', 'name description');
};

// Static method to find tasks by status
taskSchema.statics.findByStatus = function(status: TaskStatus) {
  return this.find({ status }).populate('assignedTo projectId', 'name email avatar description');
};

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  }).populate('assignedTo projectId', 'name email avatar description');
};

// Static method to find tasks due soon
taskSchema.statics.findDueSoon = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: { $ne: 'completed' },
    dueDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).populate('assignedTo projectId', 'name email avatar description');
};

// Static method to search tasks
taskSchema.statics.searchTasks = function(query: string, userId?: string, projectId?: string) {
  const searchRegex = new RegExp(query, 'i');
  const searchCondition: any = {
    $or: [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ]
  };

  if (userId) {
    searchCondition.assignedTo = userId;
  }

  if (projectId) {
    searchCondition.projectId = projectId;
  }

  return this.find(searchCondition).populate('assignedTo projectId', 'name email avatar description');
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = function(projectId?: string, userId?: string) {
  const matchCondition: any = {};

  if (projectId) matchCondition.projectId = new mongoose.Types.ObjectId(projectId);
  if (userId) matchCondition.assignedTo = new mongoose.Types.ObjectId(userId);

  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'completed'] },
                  { $lt: ['$dueDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
      }
    }
  ]);
};

// Extend the Task interface for static methods
interface ITaskModel extends mongoose.Model<ITaskDocument> {
  findByProject(projectId: string): Promise<ITaskDocument[]>;
  findByUser(userId: string): Promise<ITaskDocument[]>;
  findByStatus(status: TaskStatus): Promise<ITaskDocument[]>;
  findOverdue(): Promise<ITaskDocument[]>;
  findDueSoon(days?: number): Promise<ITaskDocument[]>;
  searchTasks(query: string, userId?: string, projectId?: string): Promise<ITaskDocument[]>;
  getTaskStats(projectId?: string, userId?: string): Promise<any[]>;
}

// Export the Task model
export const Task = model<ITaskDocument, ITaskModel>('Task', taskSchema);
export type { ITaskDocument, ITaskModel };
export default Task;
