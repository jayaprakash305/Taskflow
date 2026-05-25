import mongoose from "mongoose";

const profileRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["PASSWORD_CHANGE", "PROFILE_UPDATE"],
      required: true,
    },
    requestedChanges: {
      newPassword: { type: String },  // stored as plain text, hashed on approval
      name: { type: String },
      email: { type: String },
      department: { type: String },
      avatarUrl: { type: String },
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

profileRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });

const ProfileRequest = mongoose.model("ProfileRequest", profileRequestSchema);

export default ProfileRequest;
