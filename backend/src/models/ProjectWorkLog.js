import mongoose from "mongoose";

const projectWorklogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    todayActions: [String],

    blockers: [String],

    nextPlan: [String],

    ticketSnapshot: [
      {
        ticketId: String,
        title: String,
        assigneeName: String,
        status: String,
        dueDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ProjectWorklog",
  projectWorklogSchema
);

