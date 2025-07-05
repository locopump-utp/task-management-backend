import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { Repository, QueryOptions } from '@/types/common.types';
import { calculateSkip } from '@/utils/helpers';

/**
 * Base repository class with common CRUD operations
 */
export abstract class BaseRepository<T extends Document> implements Repository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Find document by ID
   */
  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    let query = this.model.findById(id);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    if (options?.select) {
      query = query.select(options.select) as any;
    }

    if (options?.lean) {
      query = query.lean() as any;
    }

    return await query.exec();
  }

  /**
   * Find all documents with optional filtering
   */
  async findAll(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    let query = this.model.find(filter);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    if (options?.select) {
      query = query.select(options.select) as any;
    }

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.lean) {
      query = query.lean() as any;
    }

    return await query.exec();
  }

  /**
   * Find documents with pagination
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    options?: QueryOptions
  ): Promise<{ data: T[]; total: number }> {
    const skip = calculateSkip(page, limit);

    const [data, total] = await Promise.all([
      this.findAll(filter, { ...options, skip, limit }),
      this.count(filter),
    ]);

    return { data, total };
  }

  /**
   * Find one document
   */
  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    let query = this.model.findOne(filter);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    if (options?.select) {
      query = query.select(options.select) as any;
    }

    if (options?.lean) {
      query = query.lean() as any;
    }

    return await query.exec();
  }

  /**
   * Create new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const documents = await this.model.insertMany(data);
    return documents as unknown as T[];
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Update one document
   */
  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Update multiple documents
   */
  async updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany(filter, data).exec();
    return result.modifiedCount;
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  /**
   * Delete one document
   */
  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.findOneAndDelete(filter).exec();
    return !!result;
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount;
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }

  /**
   * Aggregate query
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }

  /**
   * Get distinct values
   */
  async distinct(field: string, filter: FilterQuery<T> = {}): Promise<any[]> {
    return await this.model.distinct(field, filter).exec();
  }
}

export default BaseRepository;
