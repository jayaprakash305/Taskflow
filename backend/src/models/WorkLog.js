import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["TICKET"],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityTypeRef",
    },

    entityTypeRef: {
      type: String,
      enum: ["Ticket"],
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    logType: {
      type: String,
      enum: [
        "INVESTIGATION",
        "PROGRESS_UPDATE",
        "BLOCKER",
        "FIX_APPLIED",
        "TESTING_UPDATE",
        "RESOLUTION",
        "CLOSURE_NOTE",
      ],
      default: "PROGRESS_UPDATE",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [
      {
        fileName: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        fileType: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    links: [
      {
        label: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          trim: true,
        },
      },
    ],

    isClosureNote: {
      type: Boolean,
      default: false,
    },
    closureSummary: {
      type: String,
      default: "",
      trim: true,
    },
    mentionedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

workLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const WorkLog = mongoose.model("WorkLog", workLogSchema);

export default WorkLog;
