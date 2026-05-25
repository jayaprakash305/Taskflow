import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitToUser, emitToProjectRoom } from "../socket/index.js";

import generateProjectId from "../utils/generateProjectId.js";
import findProjectByIdentifier from "../utils/findProjectByIdentifier.js";
import createEntityActivityLog from "../utils/createEntityActivityLog.js";
import { getProjectTeamRecipientIds } from "../utils/notificationRecipients.js";

const ENTITY_TYPE = "PROJECT";
const ENTITY_TYPE_REF = "Project";

const isProjectControllerUser = (project, userId, role) => {
  const creatorId = project.createdBy?._id || project.createdBy;
  const managerId = project.managerId?._id || project.managerId;
  const leadId = project.leadId?._id || project.leadId;

  const uid = String(userId);
  const isCreator = creatorId && String(creatorId._id || creatorId) === uid;
  const isManager = managerId && String(managerId._id || managerId) === uid;
  const isLead = leadId && String(leadId._id || leadId) === uid;
  const isAdmin = role === "ADMIN";

  return isCreator || isManager || isLead || isAdmin;
};

const canViewProject = (project, userId, role) => {
  const isController = isProjectControllerUser(project, userId, role);
  const isMember =
    Array.isArray(project.memberIds) &&
    project.memberIds.some((m) => String(m?._id || m) === String(userId));

  // Admins and the project's assigned manager/lead/creator can view.
  // We also allow any user with role MANAGER to view projects (optional, based on common needs)
  // but for now we follow the specific "control/view" rules.
  return isController || isMember;
};

// Create project
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      department,
      managerId,
      leadId,
      memberIds = [],
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    let manager = null;
    let lead = null;
    let members = [];

    if (managerId) {
      manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }
    }

    if (leadId) {
      lead = await User.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }
    }

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      members = await User.find({ _id: { $in: memberIds } });
    }

    const files = req.files;
    console.log("Project creation - Files received:", files?.length || 0);
    if (files && files.length > 0) {
      console.log("File details:", files.map(f => ({ name: f.originalname, type: f.mimetype })));
    }
    let attachments =
      files?.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype,
      })) || [];

    if (req.body.links) {
      try {
        const parsedLinks = typeof req.body.links === "string" ? JSON.parse(req.body.links) : req.body.links;
        if (Array.isArray(parsedLinks)) {
          attachments = [...attachments, ...parsedLinks];
        }
      } catch (e) {
        console.error("Error parsing project links:", e);
      }
    }

    const project = await Project.create({
      projectId: generateProjectId(),
      title,
      description,
      dueDate: dueDate || null,
      department: department || req.user.department || "GENERAL",
      createdBy: req.user._id,
      managerId: manager ? manager._id : null,
      leadId: lead ? lead._id : null,
      memberIds: members.map((u) => u._id),
      attachments,
    });

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: project._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "CREATED",
      performedBy: req.user._id,
      message: `${req.user.name} created project ${project.projectId}`,
      metadata: {
        projectId: project.projectId,
        title: project.title,
      },
    });

    const notifyUsers = [
      ...(manager ? [manager] : []),
      ...(lead ? [lead] : []),
      ...members,
    ].filter((u) => String(u._id) !== String(req.user._id));

    if (notifyUsers.length) {
      const savedNotifications = await Notification.insertMany(
        notifyUsers.map((u) => ({
          receiverId: u._id,
          senderId: req.user._id,
          type: "PROJECT_ASSIGNED",
          entityType: ENTITY_TYPE,
          entityId: project._id,
          entityTypeRef: ENTITY_TYPE_REF,
          entityIdentifier: project.projectId,
          message: `${req.user.name} added you to project ${project.projectId}`,
        }))
      );
      savedNotifications.forEach((n) => {
        emitToUser(n.receiverId, "new-notification", { notification: n });
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("createProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating project",
    });
  }
};

// Get projects created by logged-in user
export const getMyCreatedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id, isDeleted: { $ne: true } })
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("getMyCreatedProjects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching created projects",
    });
  }
};

// Get projects related to logged-in user
export const getMyAssignedProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { managerId: req.user._id },
        { leadId: req.user._id },
        { memberIds: req.user._id },
      ],
      isDeleted: { $ne: true },
    })
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("getMyAssignedProjects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching assigned projects",
    });
  }
};

// Get single project details
export const getProjectById = async (req, res) => {
  try {
    const project = await findProjectByIdentifier(req.params.id, true);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canViewProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this project",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("getProjectById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching project details",
    });
  }
};



// Assign project roles/members
export const assignProject = async (req, res) => {
  try {
    const { managerId, leadId, memberIds = [] } = req.body;

    const project = await findProjectByIdentifier(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isCreator = String(project.createdBy?._id || project.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === "ADMIN";
    const isManager = project.managerId && String(project.managerId?._id || project.managerId) === String(req.user._id);
    const isLead = project.leadId && String(project.leadId?._id || project.leadId) === String(req.user._id);

    if (!isCreator && !isAdmin && !isManager && !isLead) {
      return res.status(403).json({
        success: false,
        message: "Only project creator, assigned manager, lead, or admin can assign this project",
      });
    }

    let manager = null;
    let lead = null;
    let members = [];

    if (managerId) {
      manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }
      project.managerId = manager._id;
    }

    if (leadId) {
      lead = await User.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }
      project.leadId = lead._id;
    }

    if (Array.isArray(memberIds)) {
      members = memberIds.length ? await User.find({ _id: { $in: memberIds } }) : [];
      project.memberIds = members.map((u) => u._id);
    }

    await project.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: project._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "ASSIGNED",
      performedBy: req.user._id,
      message: `${req.user.name} updated assignments for project ${project.projectId}`,
      metadata: {
        projectId: project.projectId,
        managerId: project.managerId,
        leadId: project.leadId,
        memberIds: project.memberIds,
      },
    });

    const notifyUsers = [
      ...(manager ? [manager] : []),
      ...(lead ? [lead] : []),
      ...members,
    ].filter((u) => String(u._id) !== String(req.user._id));

    if (notifyUsers.length) {
      const savedNotifications = await Notification.insertMany(
        notifyUsers.map((u) => ({
          receiverId: u._id,
          senderId: req.user._id,
          type: "PROJECT_ASSIGNED",
          entityType: ENTITY_TYPE,
          entityId: project._id,
          entityTypeRef: ENTITY_TYPE_REF,
          entityIdentifier: project.projectId,
          message: `${req.user.name} added/updated you in project ${project.projectId}`,
        }))
      );
      savedNotifications.forEach((n) => {
        emitToUser(n.receiverId, "new-notification", { notification: n });
      });
    }

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department");

    return res.status(200).json({
      success: true,
      message: "Project assignment updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("assignProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while assigning project",
    });
  }
};



// Update project details
export const updateProjectDetails = async (req, res) => {
  try {
    const { title, description, dueDate, department } = req.body;

    const project = await findProjectByIdentifier(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!isProjectControllerUser(project, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this project's details",
      });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (department) project.department = department;

    await project.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: project._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "UPDATED",
      performedBy: req.user._id,
      message: `${req.user.name} updated details for project ${project.projectId}`,
      metadata: {
        projectId: project.projectId,
        title: project.title,
      },
    });

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department");

    return res.status(200).json({
      success: true,
      message: "Project details updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("updateProjectDetails error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating project details",
    });
  }
};

// Update project status
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const project = await findProjectByIdentifier(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const isManager = String(project.managerId) === String(req.user._id) || req.user.role === "ADMIN";
    const isLead = String(project.leadId) === String(req.user._id);

    if (req.user.role === "EMPLOYEE") {
      return res.status(403).json({ success: false, message: "Employees have view-only access to projects" });
    }

    if (isLead && !["IN_PROGRESS", "REVIEW"].includes(status)) {
      return res.status(403).json({ success: false, message: "Leads can only update status to IN_PROGRESS or REVIEW" });
    }

    if (!isManager && !isLead) {
      return res.status(403).json({ success: false, message: "Unauthorized to update project status" });
    }

    project.status = status;
    await project.save();

    emitToProjectRoom(project.projectId, "project-status-updated", {
      projectId: project._id,
      status: project.status,
      updatedBy: req.user.name,
    });

    return res.status(200).json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update project priority
export const updateProjectPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const project = await findProjectByIdentifier(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (!isProjectControllerUser(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized to update project priority" });
    }

    project.priority = priority;
    await project.save();

    emitToProjectRoom(project.projectId, "project-priority-updated", {
      projectId: project._id,
      priority: project.priority,
      updatedBy: req.user.name,
    });

    return res.status(200).json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const project = await findProjectByIdentifier(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!isProjectControllerUser(project, req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this project",
      });
    }

    project.isDeleted = true;
    await project.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: project._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "DELETED",
      performedBy: req.user._id,
      message: `${req.user.name} deleted project ${project.projectId}`,
      metadata: {
        projectId: project.projectId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("deleteProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting project",
    });
  }
};

// Get all projects (for dropdowns like ticket creation)
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isDeleted: { $ne: true } })
      .select("projectId title createdBy managerId leadId memberIds department")
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("getAllProjects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching all projects",
    });
  }
};
