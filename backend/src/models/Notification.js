import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "COMMENT_MENTION",
        "PROJECT_ASSIGNED",
        "PROJECT_STATUS_CHANGED",
        "TICKET_ASSIGNED",
        "TICKET_STATUS_CHANGED",
      ],
      required: true,
    },

    entityType: {
      type: String,
      enum: ["PROJECT", "TICKET"],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityTypeRef",
    },

    entityTypeRef: {
      type: String,
      enum: ["Project", "Ticket"],
      required: true,
    },

    entityIdentifier: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;