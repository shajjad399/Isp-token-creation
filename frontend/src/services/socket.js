// ============================================================
// frontend/src/services/socket.js
// ============================================================
// Description: Single shared Socket.IO client instance for the
// whole app. Connect once after login, disconnect on logout.
// ============================================================

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Socket.IO connects to the server root, not the /api/v1 path
const SOCKET_URL = API_URL.replace(/\/api\/v1$/, '');

let socket = null;

/**
 * Create (if needed) and connect the shared socket, then join the
 * user's private room by authenticating with their user id.
 */
export const connectSocket = (userId) => {
  if (!userId) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  // Re-authenticate on every (re)connect so a network drop doesn't
  // silently leave the client outside its user room.
  const authenticate = () => socket.emit('authenticate', userId);
  socket.off('connect', authenticate);
  socket.on('connect', authenticate);

  if (socket.connected) authenticate();

  return socket;
};

/**
 * Get the current socket instance without creating a new one.
 */
export const getSocket = () => socket;

/**
 * Disconnect and clear the shared socket (call this on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };