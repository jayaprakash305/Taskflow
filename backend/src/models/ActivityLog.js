import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
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

    action: {
      type: String,
      enum: [
        "CREATED",
        "COMMENT_ADDED",
        "USER_TAGGED",
        "STATUS_CHANGED",
        "ASSIGNED",
        "REASSIGNED",
        "PRIORITY_CHANGED",
        "UPDATED",
        "DELETED",
      ],
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;