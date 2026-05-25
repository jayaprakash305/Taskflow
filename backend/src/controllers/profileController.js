import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ProfileRequest from "../models/ProfileRequest.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department");
      
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProfileRequest = async (req, res) => {
  try {
    const { requestType, reason } = req.body;
    let requestedChanges = {};
    if (req.body.requestedChanges) {
      if (typeof req.body.requestedChanges === 'string') {
        requestedChanges = JSON.parse(req.body.requestedChanges);
      } else {
        requestedChanges = req.body.requestedChanges;
      }
    }
    
    if (req.file) {
      const protocol = req.protocol === "https" ? "https" : "http";
      const host = req.get("host");
      requestedChanges.avatarUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }
    
    if (!["PASSWORD_CHANGE", "PROFILE_UPDATE"].includes(requestType)) {
      return res.status(400).json({ success: false, message: "Invalid request type" });
    }

    const newRequest = await ProfileRequest.create({
      userId: req.user._id,
      requestType,
      requestedChanges,
      reason,
    });

    return res.status(201).json({ success: true, message: "Request created", request: newRequest });
  } catch (error) {
    console.error("createProfileRequest error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await ProfileRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name");
      
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getMyRequests error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await ProfileRequest.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email role department")
      .populate("reviewedBy", "name");
      
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getAllRequests error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    const request = await ProfileRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    
    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Request already processed" });
    }

    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (request.requestType === "PASSWORD_CHANGE") {
      if (request.requestedChanges.newPassword) {
        user.password = await bcrypt.hash(request.requestedChanges.newPassword, 10);
      }
    } else if (request.requestType === "PROFILE_UPDATE") {
      if (request.requestedChanges.name) user.name = request.requestedChanges.name;
      if (request.requestedChanges.email) user.email = request.requestedChanges.email;
      if (request.requestedChanges.department) user.department = request.requestedChanges.department;
      if (request.requestedChanges.avatarUrl) user.avatarUrl = request.requestedChanges.avatarUrl;
    }

    await user.save();

    request.status = "APPROVED";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reviewNote) request.reviewNote = reviewNote;
    await request.save();

    return res.status(200).json({ success: true, message: "Request approved", request });
  } catch (error) {
    console.error("approveRequest error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    const request = await ProfileRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Request already processed" });
    }

    request.status = "REJECTED";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reviewNote) request.reviewNote = reviewNote;
    await request.save();

    return res.status(200).json({ success: true, message: "Request rejected", request });
  } catch (error) {
    console.error("rejectRequest error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminChangePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("adminChangePassword error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
