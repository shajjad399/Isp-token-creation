// ============================================================
// frontend/src/context/SocketContext.jsx
// ============================================================
// Description: Provides one shared Socket.IO connection to the
// whole app. Connects automatically when a user is logged in,
// disconnects automatically on logout.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { connectSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;

    if (userId) {
      const instance = connectSocket(userId);
      setSocket(instance);
    } else {
      disconnectSocket();
      setSocket(null);
    }

    // Disconnect when the app unmounts entirely (tab close etc.)
    return () => {
      if (!userId) return;
      // Don't disconnect on every re-render — only real logout
      // (handled by the `else` branch above when user becomes null).
    };
  }, [user?._id, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Access the shared socket instance anywhere in the app.
 * Returns null until the user is logged in and connected.
 */
export const useSocket = () => useContext(SocketContext);

export default SocketContext;