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
import { initSocketIO as initTicketSocket } from './controllers/ticketController.js';
import { initNotificationSocket } from './services/notificationService.js';
import { initChatSocket } from './services/chatService.js';

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
  // Frontend sends an object: { userId, role } (see frontend/src/services/socket.js)
  socket.on('authenticate', (payload) => {
    const userId = typeof payload === 'string' ? payload : payload?.userId;
    const role = typeof payload === 'string' ? null : payload?.role;

    if (!userId) return;

    userSockets.set(userId, socket.id);
    socket.join(`user_${userId}`);

    // Agents/admins also join the shared "agents" room so they get
    // live-chat alerts (chat_started) for new incoming chats.
    if (role === 'agent' || role === 'admin') {
      socket.join('agents');
    }

    logger.info(`✅ User ${userId} authenticated (role: ${role || 'unknown'})`);
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

  // ============================================================
  // LIVE CHAT ROOM HANDLING
  // (chatService.js emits to `chat_${chatId}` — sockets must
  // actually join that room for those events to reach anyone)
  // ============================================================

  // Join a chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    logger.info(`💬 Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    logger.info(`💬 Socket ${socket.id} left chat ${chatId}`);
  });

  // Relay typing indicator to everyone else in the chat room
  socket.on('chat_typing', ({ chatId, userId, name }) => {
    if (!chatId) return;
    socket.to(`chat_${chatId}`).emit('chat_typing', { chatId, userId, name });
  });

  socket.on('chat_stop_typing', ({ chatId, userId }) => {
    if (!chatId) return;
    socket.to(`chat_${chatId}`).emit('chat_stop_typing', { chatId, userId });
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
// ✅ WIRE UP SOCKET.IO INTO CONTROLLERS / SERVICES
// (without this, io stays null inside those files and no
// real-time event ever actually gets emitted)
// ============================================================
initTicketSocket(io, userSockets);
initNotificationSocket(io);
initChatSocket(io);

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