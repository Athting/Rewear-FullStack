import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext.jsx';
import api from '../services/api.js';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Fetch initial unread notifications from database
    api.get('/users/me/notifications')
      .then(res => {
        const unread = res.data.notifications.filter(n => !n.isRead);
        setLiveNotifications(unread);
      })
      .catch(err => console.error('Failed to retrieve notifications:', err));

    // Connect using VITE_API_URL in production, fallback relative for local proxy
    const socketUrl = import.meta.env.VITE_API_URL || '/';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Join personal notification channel
    newSocket.emit('join', user.id);

    // Listen for direct messages broadcasts
    newSocket.on('receive_message', (msg) => {
      setLiveMessages((prev) => [...prev, msg]);
    });

    // Listen for notification alerts
    newSocket.on('new_notification', (notif) => {
      setLiveNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearLiveNotifications = () => setLiveNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket,
      liveMessages,
      setLiveMessages,
      liveNotifications,
      clearLiveNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};
