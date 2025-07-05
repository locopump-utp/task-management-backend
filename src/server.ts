import app from './app';
import { config } from '@/config/environment';
import { database } from '@/config/database';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect();

    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      console.log(`
🚀 Server is running successfully!
📍 Environment: ${config.server.nodeEnv}
🌐 URL: http://${config.server.host}:${config.server.port}
📊 Health: http://${config.server.host}:${config.server.port}/health
📚 API: http://${config.server.host}:${config.server.port}/api/v1
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error('Error:', err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
      server.close(async () => {
        console.log('💥 Process terminated!');
        await database.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT RECEIVED. Shutting down gracefully...');
      server.close(async () => {
        console.log('💥 Process terminated!');
        await database.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
