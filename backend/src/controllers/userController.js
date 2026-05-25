import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";

const VALID_ROLES = Object.values(ROLES);

const normalizeEmail = (email) => email?.trim().toLowerCase();

const validateLeadAndManager = async ({ role, leadId, managerId }) => {
  let leadUser = null;
  let managerUser = null;

  if (leadId) {
    leadUser = await User.findById(leadId);
    if (!leadUser) {
      return { error: "Lead not found" };
    }
    if (leadUser.role !== ROLES.LEAD) {
      return { error: "Assigned lead must have LEAD role" };
    }
  }

  if (managerId) {
    managerUser = await User.findById(managerId);
    if (!managerUser) {
      return { error: "Manager not found" };
    }
    if (managerUser.role !== ROLES.MANAGER) {
      return { error: "Assigned manager must have MANAGER role" };
    }
  }

  if (role === ROLES.EMPLOYEE) {
    return { leadUser, managerUser };
  }

  if (role === ROLES.LEAD) {
    if (leadId) {
      return { error: "Lead cannot have leadId" };
    }
    return { leadUser: null, managerUser };
  }

  if ([ROLES.MANAGER, ROLES.ADMIN].includes(role)) {
    if (leadId || managerId) {
      return { leadUser: null, managerUser: null };
    }
    return { leadUser: null, managerUser: null };
  }

  return { leadUser, managerUser };
};

export const getMentionUsers = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let query = { isActive: true };

    const { filterByTeam } = req.query;

    // If Manager and filterByTeam is requested, only show their own team members and themselves
    if (role === ROLES.MANAGER && filterByTeam === "true") {
      query = {
        isActive: true,
        $or: [
          { _id: _id }, // Include themselves
          { managerId: _id } // Include those who report to them
        ]
      };
    }

    const users = await User.find(query)
      .select("name email role department leadId managerId isActive")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("getMentionUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching users",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role department leadId managerId isActive createdAt")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching users",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, leadId, managerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const validation = await validateLeadAndManager({
      role,
      leadId,
      managerId,
    });

    if (validation?.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      department: department?.trim() || "GENERAL",
      leadId: role === ROLES.EMPLOYEE ? validation?.leadUser?._id || null : null,
      managerId:
        role === ROLES.EMPLOYEE || role === ROLES.LEAD
          ? validation?.managerUser?._id || null
          : null,
      isActive: true,
    });

    const populatedUser = await User.findById(user._id)
      .select("name email role department leadId managerId isActive createdAt")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: populatedUser,
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, leadId, managerId } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const nextRole = role || user.role;

    if (!VALID_ROLES.includes(nextRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Another user already uses this email",
        });
      }

      user.email = normalizedEmail;
    }

    const effectiveLeadId =
      leadId === undefined ? user.leadId : leadId === "" ? null : leadId;

    const effectiveManagerId =
      managerId === undefined ? user.managerId : managerId === "" ? null : managerId;

    const validation = await validateLeadAndManager({
      role: nextRole,
      leadId: effectiveLeadId,
      managerId: effectiveManagerId,
    });

    if (validation?.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    if (name !== undefined) user.name = name.trim();
    if (role !== undefined) user.role = nextRole;
    if (department !== undefined) user.department = department?.trim() || "GENERAL";

    if (nextRole === ROLES.EMPLOYEE) {
      user.leadId = validation?.leadUser?._id || null;
      user.managerId = validation?.managerUser?._id || null;
    } else if (nextRole === ROLES.LEAD) {
      user.leadId = null;
      user.managerId = validation?.managerUser?._id || null;
    } else {
      user.leadId = null;
      user.managerId = null;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("name email role department leadId managerId isActive createdAt")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating user",
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("name email role department leadId managerId isActive createdAt")
      .populate("leadId", "name email role department")
      .populate("managerId", "name email role department");

    return res.status(200).json({
      success: true,
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating user status",
    });
  }
};
