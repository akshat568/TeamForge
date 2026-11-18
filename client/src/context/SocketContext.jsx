import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications
} from "../services/notificationService";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineMembers, setOnlineMembers] = useState([]);

  // ─── FETCH INITIAL NOTIFICATIONS ──────────────────────────────────────────
  const fetchInitialNotifications = async () => {
    try {
      const data = await getNotifications(1, 50); // Get first 50 notifications initially
      if (data.success) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error loading initial notifications:", err.message);
    }
  };

  // ─── WEBSOCKET CONNECTION LIFECYCLE ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      setOnlineMembers([]);
      return;
    }

    // Connect to backend Socket.io server with fallback
    const token = localStorage.getItem("token");
    const rawSocketUrl =
      (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL.trim() !== "")
        ? import.meta.env.VITE_SOCKET_URL.trim()
        : (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== "")
        ? import.meta.env.VITE_API_URL.trim()
        : import.meta.env.PROD
        ? "https://teamforge-uy0n.onrender.com"
        : "http://localhost:5000";

    const SOCKET_URL = rawSocketUrl.replace(/\/+$/, "").replace(/\/api$/, "");

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    console.log("Connecting socket...");

    newSocket.on("connect", () => {
      console.log("Socket Connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket Disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.log("Socket Error:", err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Load initial notifications on connect
    fetchInitialNotifications();

    // Listen for live real-time notifications
    newSocket.on("notification_received", (notification) => {
      setNotifications((prev) => {
        // Prevent duplicate socket entries caused by reconnects
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
      setOnlineMembers([]);
    };
  }, [isAuthenticated]);

  // ─── MARK A SINGLE NOTIFICATION AS READ ────────────────────────────────────
  const markSingleRead = useCallback(
    async (id) => {
      try {
        // Optimistic UI update
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        await markNotificationRead(id);
      } catch (err) {
        console.error("Failed to mark notification read:", err.message);
        // Rollback on error by reloading notifications list
        fetchInitialNotifications();
      }
    },
    [notifications]
  );

  // ─── MARK ALL NOTIFICATIONS AS READ ────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to clear notifications count:", err.message);
      fetchInitialNotifications();
    }
  }, []);

  // ─── DELETE A SINGLE NOTIFICATION ──────────────────────────────────────────
  const deleteSingleNotification = useCallback(
    async (id) => {
      try {
        const target = notifications.find((n) => n._id === id);
        // Optimistic UI update
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (target && !target.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        await deleteNotification(id);
      } catch (err) {
        console.error("Failed to delete notification:", err.message);
        fetchInitialNotifications();
      }
    },
    [notifications]
  );

  // ─── CLEAR ALL READ NOTIFICATIONS ──────────────────────────────────────────
  const clearReadNotifications = useCallback(async () => {
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.filter((n) => !n.read));

      await deleteReadNotifications();
    } catch (err) {
      console.error("Failed to clear read notifications:", err.message);
      fetchInitialNotifications();
    }
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    markSingleRead,
    markAllRead,
    deleteSingleNotification,
    clearReadNotifications,
    fetchNotifications: fetchInitialNotifications,
    onlineMembers,
    setOnlineMembers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
