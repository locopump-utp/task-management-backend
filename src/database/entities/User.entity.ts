import { Schema, model, Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserDocument, UserRole } from '@/types/user.types';

// User Schema Interface
interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Omit<IUserDocument, 'password'>;
}

// User Schema Definition
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be less than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: 'Role must be either admin or user',
      },
      default: 'user',
    },
    avatar: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Avatar must be a valid URL',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();

  try {
    // Hash password with salt rounds from config
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-update middleware to hash password
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;

  if (update.password) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      update.password = await bcrypt.hash(update.password, saltRounds);
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Instance method to get safe user object (without password)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email }).select('+password');
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role, isActive: true });
};

// Static method to search users by name or email
userSchema.statics.searchUsers = function(query: string) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } }
    ]
  });
};

// Static method to update last login
userSchema.statics.updateLastLogin = function(userId: string) {
  return this.findByIdAndUpdate(userId, { lastLogin: new Date() });
};

// Virtual for full name (if needed)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for projects (will be populated)
userSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'owner',
});

// Virtual for assigned tasks
userSchema.virtual('assignedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'assignedTo',
});

// Extend the User interface for static methods
interface IUserModel extends mongoose.Model<IUserDocument> {
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
  findActiveUsers(): Promise<IUserDocument[]>;
  findByRole(role: UserRole): Promise<IUserDocument[]>;
  searchUsers(query: string): Promise<IUserDocument[]>;
  updateLastLogin(userId: string): Promise<IUserDocument | null>;
}

// Export the User model
export const User = model<IUserDocument, IUserModel>('User', userSchema);
export type { IUserDocument, IUserModel };
export default User;
