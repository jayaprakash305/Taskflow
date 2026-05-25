import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { handleGetUnreadCount } from "../controllers/messageController";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user, socket } = useAuth();
  const navigate = useNavigate();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await handleGetUnreadCount();
      if (res?.success !== false && res?.count !== undefined) {
        setUnreadMsgCount(res.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread messages count", err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Re-fetch to get accurate count from DB
      fetchUnreadCount();
      console.log("📨 New message received, refreshing unread count");
    };

    const handleChatNotification = (data) => {
      // Re-fetch to get accurate count from DB
      fetchUnreadCount();

      // Try OS-level push notification
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const senderName = data.message?.senderId?.name || data.chat?.name || "New Message";
          const pushNotif = new Notification(`Message from ${senderName}`, {
            body: data.message?.message || "You have a new message.",
            icon: "/vite.svg",
            tag: `chat-${data.chatId}-${Date.now()}`,
            requireInteraction: false,
          });

          pushNotif.onclick = () => {
            window.focus();
            navigate("/messages");
            pushNotif.close();
          };
        } catch (err) {
          console.warn("🔔 Failed to show OS notification:", err);
        }
      }
    };

    const handleMessagesRead = () => {
      fetchUnreadCount();
    };

    socket.on("new-message", handleNewMessage);
    socket.on("chat-notification", handleChatNotification);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("chat-notification", handleChatNotification);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socket, fetchUnreadCount, navigate]);

  return (
    <MessageContext.Provider value={{ unreadMsgCount, setUnreadMsgCount, refreshUnreadMsgCount: fetchUnreadCount }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => useContext(MessageContext);
