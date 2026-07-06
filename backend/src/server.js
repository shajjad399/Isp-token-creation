// ============================================================
// backend/src/server.js
// ============================================================
// Description: Entry point for the ISP Ticketing System backend
// Version: 1.0.0
// Author: ISP Ticketing Team
// ============================================================

import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// ============================================================
// CREATE HTTP SERVER
// ============================================================

const httpServer = createServer(app);

// ============================================================
// SOCKET.IO CONFIGURATION
// ============================================================

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.frontendUrl || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Store active socket connections
const userSockets = new Map();
const ticketRooms = new Map();

io.on('connection', (socket) => {
  logger.info(`🔌 New client connected: ${socket.id}`);

  // Authenticate user
  socket.on('authenticate', (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(`user_${userId}`);
    logger.info(`✅ User ${userId} authenticated`);
  });

  // Join ticket room
  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    ticketRooms.set(socket.id, ticketId);
    logger.info(`📌 Socket ${socket.id} joined ticket ${ticketId}`);
  });

  // Leave ticket room
  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
    ticketRooms.delete(socket.id);
    logger.info(`🚪 Socket ${socket.id} left ticket ${ticketId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove from userSockets
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    // Remove from ticketRooms
    ticketRooms.delete(socket.id);
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io and userSockets globally accessible
global.io = io;
global.userSockets = userSockets;

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB.connect();
    
    const PORT = env.port || 5000;
    
    httpServer.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 ISP TICKETING SYSTEM');
      console.log('='.repeat(50));
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`✅ Health: http://localhost:${PORT}/health`);
      console.log(`📡 WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${env.nodeEnv || 'development'}`);
      console.log('='.repeat(50) + '\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      httpServer.close(async () => {
        await connectDB.disconnect();
        logger.info('💥 Server terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================================
// ERROR HANDLING
// ============================================================

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥', err);
  process.exit(1);
});

// ============================================================
// START APPLICATION
// ============================================================

startServer();

export { io, userSockets };