import mongoose from "mongoose";
import Project from "../models/Project.js";

const findProjectByIdentifier = async (identifier, populate = false) => {
  let query = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = Project.findOne({
      $or: [{ _id: identifier }, { projectId: identifier }],
      isDeleted: { $ne: true },
    });
  } else {
    query = Project.findOne({ projectId: identifier, isDeleted: { $ne: true } });
  }

  if (populate) {
    query = query
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department");
  }

  return await query;
};

export default findProjectByIdentifier;
