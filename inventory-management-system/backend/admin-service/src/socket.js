import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

let io;

const isProd = process.env.NODE_ENV === 'production';

export const initSocket = (server) => {
  const allowedOrigins = isProd
    ? ['http://localhost:5000']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
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
