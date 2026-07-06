import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import http from 'http';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ── Uncaught Exception Handler ──
process.on('uncaughtException', (err) => {
  console.error('[api-gateway] UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// ── Unhandled Promise Rejection Handler ──
process.on('unhandledRejection', (reason, promise) => {
  console.error('[api-gateway] UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

server.listen(PORT, () => {
  console.log(`[api-gateway] Gateway running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[api-gateway] Application URL: http://localhost:${PORT}`);
});

// ── Graceful Shutdown ──
const gracefulShutdown = (signal) => {
  console.log(`\n[api-gateway] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[api-gateway] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[api-gateway] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
