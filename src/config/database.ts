import mongoose from 'mongoose';
import { config } from './environment';

// MongoDB connection options
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
};

// Database connection class
class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      // Connect to MongoDB
      await mongoose.connect(config.database.url, mongooseOptions);

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');

      // Handle connection events
      this.setupEventListeners();

    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  public async dropDatabase(): Promise<void> {
    try {
      // Ensure we have an active connection
      if (!this.isConnectionOpen()) {
        await this.connect();
      }

      // Get database instance safely
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database instance not available after connection');
      }

      // Drop the database
      await db.dropDatabase();
      console.log('✅ Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  public isConnectionOpen(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📡 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        console.log('👋 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }
}

// Export singleton instance
export const database = Database.getInstance();
export default database;
