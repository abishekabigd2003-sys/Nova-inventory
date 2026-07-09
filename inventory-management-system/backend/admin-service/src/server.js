import app from './app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { initSocket } from './socket.js';
import { seedAdmin } from './utils/seedAdmin.js';

dotenv.config();

const PORT = process.env.ADMIN_PORT || 5001; // Avoid collision with Render's PORT
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL: MONGO_URI is not defined in environment variables or .env file');
  process.exit(1);
}

// ── Uncaught Exception Handler ──
process.on('uncaughtException', (err) => {
  console.error('[admin-service] UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// ── Unhandled Promise Rejection Handler ──
process.on('unhandledRejection', (reason, promise) => {
  console.error('[admin-service] UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

let server;

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000,         // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log(`[admin-service] MongoDB connected: ${MONGO_URI}`);

    // Monitor MongoDB connection events
    mongoose.connection.on('error', (err) => {
      console.error('[admin-service] MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('[admin-service] MongoDB disconnected. Attempting reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('[admin-service] MongoDB reconnected.');
    });

    seedAdmin();

    server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`[admin-service] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      console.log(`[admin-service] Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('[admin-service] MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Graceful Shutdown ──
const gracefulShutdown = async (signal) => {
  console.log(`\n[admin-service] ${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log('[admin-service] HTTP server closed.');
    });
  }

  try {
    await mongoose.connection.close();
    console.log('[admin-service] MongoDB connection closed.');
  } catch (err) {
    console.error('[admin-service] Error closing MongoDB:', err.message);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
