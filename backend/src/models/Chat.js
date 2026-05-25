import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatType: {
      type: String,
      enum: ["DIRECT", "GROUP"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    groupAvatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1, lastMessageAt: -1 });
chatSchema.index({ participants: 1, chatType: 1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
