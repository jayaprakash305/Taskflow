import { Server } from "socket.io";

let io = null;
const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || [
        "http://localhost:5173",
        "https://semioriental-pam-nonhereditably.ngrok-free.dev"
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register-user", (userId) => {
      if (!userId) return;
      onlineUsers.set(String(userId), socket.id);
      socket.userId = String(userId);
      console.log(`Registered user ${userId} -> ${socket.id}`);
      
      // Broadcast online status to all connected clients
      io.emit("user-online", { userId: String(userId) });
    });

    socket.on("get-online-users", (callback) => {
      if (callback && typeof callback === "function") {
        callback(Array.from(onlineUsers.keys()));
      }
    });

    // Project rooms
    socket.on("join-project", (projectIdentifier) => {
      if (!projectIdentifier) return;
      socket.join(`project:${projectIdentifier}`);
      console.log(`Socket ${socket.id} joined project room: ${projectIdentifier}`);
    });

    socket.on("leave-project", (projectIdentifier) => {
      if (!projectIdentifier) return;
      socket.leave(`project:${projectIdentifier}`);
      console.log(`Socket ${socket.id} left project room: ${projectIdentifier}`);
    });

    // Ticket rooms
    socket.on("join-ticket", (ticketIdentifier) => {
      if (!ticketIdentifier) return;
      socket.join(`ticket:${ticketIdentifier}`);
      console.log(`Socket ${socket.id} joined ticket room: ${ticketIdentifier}`);
    });

    socket.on("leave-ticket", (ticketIdentifier) => {
      if (!ticketIdentifier) return;
      socket.leave(`ticket:${ticketIdentifier}`);
      console.log(`Socket ${socket.id} left ticket room: ${ticketIdentifier}`);
    });

    // ── Chat rooms ────────────────────────────────────────────────────────────────
    socket.on("join-chat", (chatId) => {
      if (!chatId) return;
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId) => {
      if (!chatId) return;
      socket.leave(`chat:${chatId}`);
    });

    // ── Call rooms & WebRTC Signaling ──────────────────────────────────────────────
    socket.on("join-call", ({ roomId, user }) => {
      socket.join(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit("user-joined-call", {
        user,
        socketId: socket.id,
      });
    });

    socket.on("leave-call", ({ roomId, userId }) => {
      socket.leave(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit("user-left-call", { userId });
    });

    socket.on("call-user", ({ to, offer, caller, roomId }) => {
      emitToUser(to, "incoming-call", { offer, caller, roomId });
    });

    socket.on("answer-call", ({ to, answer }) => {
      emitToUser(to, "call-answered", { answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      emitToUser(to, "ice-candidate", { candidate });
    });

    socket.on("end-call", ({ to }) => {
      emitToUser(to, "call-ended", { from: socket.userId });
    });

    // Group call signaling
    socket.on("group-call-offer", ({ roomId, offer, sender }) => {
      socket.to(`call:${roomId}`).emit("group-call-offer", { offer, sender });
    });

    socket.on("group-call-answer", ({ targetSocketId, answer, sender }) => {
      io.to(targetSocketId).emit("group-call-answer", { answer, sender });
    });

    socket.on("group-ice-candidate", ({ targetSocketId, candidate, sender }) => {
      io.to(targetSocketId).emit("group-ice-candidate", { candidate, sender });
    });

    // ── Send message via socket ───────────────────────────────────────────────────
    socket.on("send-message", async ({ chatId, message, messageType = "TEXT", ticketRef, replyTo }) => {
      if (!socket.userId || !chatId || (!message?.trim() && messageType === "TEXT")) return;

      try {
        const [Chat, Message, User] = await Promise.all([
          import("../models/Chat.js").then(m => m.default),
          import("../models/Message.js").then(m => m.default),
          import("../models/User.js").then(m => m.default),
        ]);

        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId,
          isActive: true,
        });
        if (!chat) return;

        const newMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          message: message?.trim() || "",
          messageType,
          ticketRef: ticketRef || null,
          replyTo: replyTo || null,
          readBy: [{ userId: socket.userId, readAt: new Date() }],
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message?.trim() || `[${messageType.toLowerCase()}]`,
          lastMessageAt: new Date(),
          lastMessageSender: socket.userId,
        });

        const populated = await Message.findById(newMessage._id)
          .populate("senderId", "name email role department")
          .populate("replyTo");

        // Broadcast to everyone in the chat room (including sender)
        io.to(`chat:${chatId}`).emit("new-message", {
          chatId,
          message: populated,
        });

        // Push notification to offline participants
        chat.participants.forEach((participantId) => {
          if (String(participantId) !== String(socket.userId)) {
            const isInRoom = [...(io.sockets.adapter.rooms.get(`chat:${chatId}`) || [])].some(
              (sid) => {
                const s = io.sockets.sockets.get(sid);
                return s?.userId === String(participantId);
              }
            );
            if (!isInRoom) {
              emitToUser(String(participantId), "chat-notification", {
                chatId,
                message: populated,
                chat: {
                  _id: chat._id,
                  chatType: chat.chatType,
                  name: chat.name,
                },
              });
            }
          }
        });
      } catch (err) {
        console.error("send-message socket error:", err);
      }
    });

    // ── Typing indicator ──────────────────────────────────────────────────────────
    socket.on("typing", ({ chatId }) => {
      if (!socket.userId || !chatId) return;
      socket.to(`chat:${chatId}`).emit("user-typing", {
        chatId,
        userId: socket.userId,
      });
    });

    socket.on("stop-typing", ({ chatId }) => {
      if (!socket.userId || !chatId) return;
      socket.to(`chat:${chatId}`).emit("user-stopped-typing", {
        chatId,
        userId: socket.userId,
      });
    });

    // ── Read receipt ──────────────────────────────────────────────────────────────
    socket.on("read-messages", async ({ chatId }) => {
      if (!socket.userId || !chatId) return;
      try {
        const Message = await import("../models/Message.js").then(m => m.default);

        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: socket.userId },
            "readBy.userId": { $ne: socket.userId },
          },
          { $push: { readBy: { userId: socket.userId, readAt: new Date() } } }
        );

        // Tell the other side their messages were read
        socket.to(`chat:${chatId}`).emit("messages-read", {
          chatId,
          readBy: socket.userId,
          readAt: new Date(),
        });
      } catch (err) {
        console.error("read-messages error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        // Only delete if the current socket is the one mapped to this user
        // (prevents accidental deletion if a new connection already replaced this one)
        if (onlineUsers.get(socket.userId) === socket.id) {
          onlineUsers.delete(socket.userId);
          io.emit("user-offline", { userId: socket.userId });
          console.log(`User ${socket.userId} went offline (Socket ${socket.id})`);
        } else {
          console.log(`Stale socket ${socket.id} disconnected for user ${socket.userId}, keeping newer mapping.`);
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

export const emitToUser = (userId, eventName, payload) => {
  if (!io) return;
  const socketId = onlineUsers.get(String(userId));
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
  }
};

export const emitToProjectRoom = (projectIdentifier, eventName, payload) => {
  if (!io || !projectIdentifier) return;
  io.to(`project:${projectIdentifier}`).emit(eventName, payload);
};

export const emitToTicketRoom = (ticketIdentifier, eventName, payload) => {
  if (!io || !ticketIdentifier) return;
  io.to(`ticket:${ticketIdentifier}`).emit(eventName, payload);
};
