import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

let io;

const isProd = process.env.NODE_ENV === 'production';

export const initSocket = (server) => {
  const allowedOrigins = isProd
    ? [process.env.API_GATEWAY_URL, process.env.FRONTEND_URL].filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        process.env.API_GATEWAY_URL,
        process.env.FRONTEND_URL
      ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[admin-service] Socket connected: ${socket.id}`);
    
    // Users can join rooms based on their roles if needed
    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[admin-service] Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
