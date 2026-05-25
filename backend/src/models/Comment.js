import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
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
      required: true,
      enum: ["Project", "Ticket"],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    mentionedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

commentSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;