import { io } from "socket.io-client";
import API_URL from "../config/api";

const SOCKET_URL = API_URL;

let socket = null;
let currentUserId = null;

export const initSocket = (userId) => {
  // If already connected for the same user, reuse
  if (socket?.connected && currentUserId === String(userId)) {
    return socket;
  }

  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUserId = String(userId);

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 30000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    if (currentUserId) {
      socket.emit("register-user", currentUserId);
      console.log("📡 Registered user:", currentUserId);
    }
  });

  socket.on("reconnect", () => {
    console.log("🔄 Socket reconnected:", socket.id);
    if (currentUserId) {
      socket.emit("register-user", currentUserId);
      console.log("📡 Re-registered user:", currentUserId);
    }
  });

  socket.on("connect_error", (err) => {
    console.warn("⚠️ Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
