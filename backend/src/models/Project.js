import mongoose from "mongoose";


const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "REVIEW", "COMPLETED", "REOPENED", "CANCELLED"],
      default: "OPEN",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
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



    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    department: {
      type: String,
      default: "GENERAL",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],


    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
