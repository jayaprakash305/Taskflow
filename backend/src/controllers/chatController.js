import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO, emitToUser } from "../socket/index.js";

// ── Create or get direct chat ─────────────────────────────────────────────────
export const getOrCreateDirectChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const myId = req.user._id;

    if (String(participantId) === String(myId)) {
      return res.status(400).json({ success: false, message: "Cannot chat with yourself" });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find existing direct chat between these two users
    let chat = await Chat.findOne({
      chatType: "DIRECT",
      participants: { $all: [myId, participantId], $size: 2 },
      isActive: true,
    })
      .populate("participants", "name email role department")
      .populate("lastMessageSender", "name");

    if (chat) {
      return res.status(200).json({ success: true, chat, created: false });
    }

    // Create new direct chat
    chat = await Chat.create({
      chatType: "DIRECT",
      participants: [myId, participantId],
      createdBy: myId,
    });

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("lastMessageSender", "name");

    return res.status(201).json({ success: true, chat: populated, created: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Create group chat ─────────────────────────────────────────────────────────
export const createGroupChat = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const myId = req.user._id;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
    if (!participantIds?.length || participantIds.length < 2) {
      return res.status(400).json({ success: false, message: "Group needs at least 2 other members" });
    }

    const allParticipants = [...new Set([String(myId), ...participantIds.map(String)])];

    const chat = await Chat.create({
      chatType: "GROUP",
      name: name.trim(),
      participants: allParticipants,
      admins: [myId],
      createdBy: myId,
    });

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    // Notify all participants
    allParticipants.forEach((uid) => {
      if (String(uid) !== String(myId)) {
        emitToUser(uid, "added-to-group", { chat: populated });
      }
    });

    return res.status(201).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const renameGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name } = req.body;
    const myId = req.user._id;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, chatType: "GROUP", isActive: true });
    if (!chat) return res.status(404).json({ success: false, message: "Group chat not found" });

    // Only admins can rename the group
    if (!chat.admins.includes(myId)) {
      return res.status(403).json({ success: false, message: "Only group admins can rename the group" });
    }

    chat.name = name.trim();
    await chat.save();

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userIds } = req.body; // Array of user IDs
    const myId = req.user._id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "User IDs are required" });
    }

    const chat = await Chat.findOne({ _id: chatId, chatType: "GROUP", isActive: true });
    if (!chat) return res.status(404).json({ success: false, message: "Group chat not found" });

    if (!chat.admins.includes(myId)) {
      return res.status(403).json({ success: false, message: "Only group admins can add members" });
    }

    const newParticipants = userIds.filter((id) => !chat.participants.includes(id));
    if (newParticipants.length > 0) {
      chat.participants.push(...newParticipants);
      await chat.save();
      
      const populated = await Chat.findById(chat._id)
        .populate("participants", "name email role department")
        .populate("admins", "name email role")
        .populate("createdBy", "name email role");

      newParticipants.forEach((uid) => {
        emitToUser(uid, "added-to-group", { chat: populated });
      });
      
      // We could also notify existing members here that someone joined
    }

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const myId = req.user._id;

    const chat = await Chat.findOne({ _id: chatId, chatType: "GROUP", isActive: true });
    if (!chat) return res.status(404).json({ success: false, message: "Group chat not found" });

    // Admins can remove others, or users can remove themselves (leave)
    if (!chat.admins.includes(myId) && String(myId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized to remove this member" });
    }

    chat.participants = chat.participants.filter((p) => String(p) !== String(userId));
    chat.admins = chat.admins.filter((a) => String(a) !== String(userId));

    await chat.save();

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const makeGroupAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const myId = req.user._id;

    const chat = await Chat.findOne({ _id: chatId, chatType: "GROUP", isActive: true });
    if (!chat) return res.status(404).json({ success: false, message: "Group chat not found" });

    if (!chat.admins.includes(myId)) {
      return res.status(403).json({ success: false, message: "Only group admins can grant admin rights" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: "User is not a member of this group" });
    }

    if (!chat.admins.includes(userId)) {
      chat.admins.push(userId);
      await chat.save();
    }

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeGroupAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const myId = req.user._id;

    const chat = await Chat.findOne({ _id: chatId, chatType: "GROUP", isActive: true });
    if (!chat) return res.status(404).json({ success: false, message: "Group chat not found" });

    // Only admins can remove admin rights
    if (!chat.admins.includes(myId)) {
      return res.status(403).json({ success: false, message: "Only group admins can modify admin rights" });
    }

    // You can't demote the creator of the group
    if (String(chat.createdBy) === String(userId)) {
      return res.status(400).json({ success: false, message: "Cannot remove admin rights from the group creator" });
    }

    if (chat.admins.includes(userId)) {
      chat.admins = chat.admins.filter((a) => String(a) !== String(userId));
      await chat.save();
    }

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role department")
      .populate("admins", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({ success: true, chat: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get my chats (inbox) ──────────────────────────────────────────────────────
export const getMyChats = async (req, res) => {
  try {
    const myId = req.user._id;

    const chats = await Chat.find({
      participants: myId,
      isActive: true,
    })
      .populate("participants", "name email role department")
      .populate("lastMessageSender", "name")
      .sort({ lastMessageAt: -1 });

    // Attach unread count per chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unread = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: myId },
          "readBy.userId": { $ne: myId },
          deletedFor: { $ne: myId },
        });
        return { ...chat.toObject(), unreadCount: unread };
      })
    );

    return res.status(200).json({ success: true, chats: chatsWithUnread });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get messages for a chat ───────────────────────────────────────────────────
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const myId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: myId,
      isActive: true,
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const messages = await Message.find({
      chatId,
      deletedFor: { $ne: myId },
    })
      .populate("senderId", "name email role department")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chatId,
        senderId: { $ne: myId },
        "readBy.userId": { $ne: myId },
      },
      {
        $push: { readBy: { userId: myId, readAt: new Date() } },
      }
    );

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page: Number(page),
      hasMore: messages.length === Number(limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Send message (REST fallback — primary is socket) ─────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { chatId, message, messageType = "TEXT", ticketRef, replyTo } = req.body;
    const myId = req.user._id;

    const chat = await Chat.findOne({ _id: chatId, participants: myId, isActive: true });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!message?.trim() && messageType === "TEXT" && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const attachments = req.files ? req.files.map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    })) : [];

    const finalMessageType = attachments.length > 0 ? "ATTACHMENT" : messageType;

    const newMessage = await Message.create({
      chatId,
      senderId: myId,
      message: message?.trim() || "",
      messageType: finalMessageType,
      ticketRef: ticketRef ? JSON.parse(ticketRef) : null,
      replyTo: replyTo || null,
      attachments,
      readBy: [{ userId: myId, readAt: new Date() }],
    });

    // Update chat's last message
    const previewText = attachments.length > 0 ? `[Attachment]` : message?.trim() || `[${finalMessageType.toLowerCase()}]`;
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: previewText,
      lastMessageAt: new Date(),
      lastMessageSender: myId,
    });

    const populated = await Message.findById(newMessage._id)
      .populate("senderId", "name email role department")
      .populate("replyTo");

    const io = getIO();
    if (io) {
      io.to(`chat:${chatId}`).emit("new-message", {
        chatId,
        message: populated,
      });

      // Push notification to offline participants
      chat.participants.forEach((participantId) => {
        if (String(participantId) !== String(myId)) {
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
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get total unread count (for navbar badge) ─────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user._id;

    const count = await Message.countDocuments({
      senderId: { $ne: myId },
      "readBy.userId": { $ne: myId },
      deletedFor: { $ne: myId },
      chatId: {
        $in: await Chat.find({ participants: myId, isActive: true }).distinct("_id"),
      },
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Delete message for me ─────────────────────────────────────────────────────
export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id;

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: myId },
    });

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Search users to start a chat ──────────────────────────────────────────────
export const searchUsersForChat = async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.user._id;

    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: "Search query required" });
    }

    const users = await User.find({
      _id: { $ne: myId },
      isActive: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email role department")
      .limit(10);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
