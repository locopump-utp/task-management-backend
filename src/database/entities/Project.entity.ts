import { Schema, model, Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import { ProjectDocument, ProjectStatus } from '@/types/project.types';

// Project Schema Interface
interface IProjectDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addMember(userId: Types.ObjectId): Promise<IProjectDocument>;
  removeMember(userId: Types.ObjectId): Promise<IProjectDocument>;
  isMember(userId: Types.ObjectId): boolean;
  isOwner(userId: Types.ObjectId): boolean;
}

// Project Schema Definition
const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [100, 'Project name must be less than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [500, 'Project description must be less than 500 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'paused'],
        message: 'Status must be either active, completed, or paused',
      },
      default: 'active',
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
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text' });

// Virtual for tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
});

// Virtual for task statistics
projectSchema.virtual('taskStats', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
});

// Instance method to add member
projectSchema.methods.addMember = async function(userId: Types.ObjectId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    return await this.save();
  }
  return this;
};

// Instance method to remove member
projectSchema.methods.removeMember = async function(userId: Types.ObjectId) {
  this.members = this.members.filter(
    (memberId: Types.ObjectId) => !memberId.equals(userId)
  );
  return await this.save();
};

// Instance method to check if user is member
projectSchema.methods.isMember = function(userId: Types.ObjectId) {
  return this.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
};

// Instance method to check if user is owner
projectSchema.methods.isOwner = function(userId: Types.ObjectId) {
  return this.owner.equals(userId);
};

// Static method to find projects by owner
projectSchema.statics.findByOwner = function(userId: string) {
  return this.find({ owner: userId }).populate('owner members', 'name email avatar');
};

// Static method to find projects by member
projectSchema.statics.findByMember = function(userId: string) {
  return this.find({
    $or: [
      { owner: userId },
      { members: userId }
    ]
  }).populate('owner members', 'name email avatar');
};

// Static method to find projects by status
projectSchema.statics.findByStatus = function(status: ProjectStatus) {
  return this.find({ status }).populate('owner members', 'name email avatar');
};

// Static method to search projects
projectSchema.statics.searchProjects = function(query: string, userId?: string) {
  const searchRegex = new RegExp(query, 'i');
  const searchCondition: any = {
    $or: [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ]
  };

  if (userId) {
    searchCondition.$and = [{
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }];
  }

  return this.find(searchCondition).populate('owner members', 'name email avatar');
};

// Extend the Project interface for static methods
interface IProjectModel extends mongoose.Model<IProjectDocument> {
  findByOwner(userId: string): Promise<IProjectDocument[]>;
  findByMember(userId: string): Promise<IProjectDocument[]>;
  findByStatus(status: ProjectStatus): Promise<IProjectDocument[]>;
  searchProjects(query: string, userId?: string): Promise<IProjectDocument[]>;
}

// Export the Project model
export const Project = model<IProjectDocument, IProjectModel>('Project', projectSchema);
export type { IProjectDocument, IProjectModel };
export default Project;
