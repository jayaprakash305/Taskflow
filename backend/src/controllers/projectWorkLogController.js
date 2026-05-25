import Project from "../models/Project.js";
import ProjectWorkLog from "../models/ProjectWorkLog.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import createEntityActivityLog from "../utils/createEntityActivityLog.js";
import { emitToUser } from "../socket/index.js";
import findProjectByIdentifier from "../utils/findProjectByIdentifier.js";
import { getProjectTeamRecipientIds } from "../utils/notificationRecipients.js";

const canViewProjectWorkLogs = (project, user) => {
  if (!project || !user) return false;

  const isCreator = String(project.createdBy) === String(user._id);
  const isManager = project.managerId && String(project.managerId) === String(user._id);
  const isLead = project.leadId && String(project.leadId) === String(user._id);
  const isMember =
    Array.isArray(project.memberIds) &&
    project.memberIds.some((id) => String(id) === String(user._id));
  const isAdmin = user.role === "ADMIN";

  return isCreator || isManager || isLead || isMember || isAdmin;
};

const canAddProjectWorkLog = (project, user) => {
  if (!project || !user) return false;

  const isCreator = String(project.createdBy) === String(user._id);
  const isManager = project.managerId && String(project.managerId) === String(user._id);
  const isLead = project.leadId && String(project.leadId) === String(user._id);
  const isAdmin = user.role === "ADMIN";

  return isCreator || isManager || isLead || isAdmin;
};

export const addProjectWorkLog = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { title, description, logType, links, summaryDate, mentionedUsers = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const project = await findProjectByIdentifier(identifier);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAddProjectWorkLog(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add work logs for this project",
      });
    }

    const mentionIds = Array.isArray(mentionedUsers) ? mentionedUsers : [];
    const validMentionedUsers = mentionIds.length
      ? await User.find({
          _id: { $in: mentionIds },
          isActive: true,
        }).select("_id name email")
      : [];

    const files = req.files || [];
    console.log(`Project WorkLog - Files received: ${files.length}`);
    if (files.length > 0) {
      console.log("File details:", files.map(f => ({ name: f.originalname, type: f.mimetype })));
    }
    const attachments = files.map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    let parsedLinks = [];
    if (links) {
      try {
        parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
        if (!Array.isArray(parsedLinks)) parsedLinks = [];
      } catch {
        parsedLinks = [];
      }
    }

    const workLog = await ProjectWorkLog.create({
      entityType: "PROJECT",
      entityId: project._id,
      entityTypeRef: "Project",
      userId: req.user._id,
      logType: logType || "DAILY_UPDATE",
      title: title.trim(),
      description: description.trim(),
      summaryDate: summaryDate ? new Date(summaryDate) : new Date(),
      attachments,
      links: parsedLinks,
      mentionedUsers: validMentionedUsers.map((u) => u._id),
    });

    await createEntityActivityLog({
      entityType: "PROJECT",
      entityId: project._id,
      entityTypeRef: "Project",
      action: "COMMENT_ADDED",
      performedBy: req.user._id,
      message: `${req.user.name} added a project update to ${project.projectId}`,
      metadata: {
        projectId: project.projectId,
        projectWorkLogId: workLog._id,
        logType: workLog.logType,
      },
    });

    const recipientIds = getProjectTeamRecipientIds(project, req.user._id);

    if (recipientIds.length) {
      const notifications = await Notification.insertMany(
        recipientIds.map((receiverId) => ({
          receiverId,
          senderId: req.user._id,
          type: "PROJECT_STATUS_CHANGED",
          entityType: "PROJECT",
          entityId: project._id,
          entityTypeRef: "Project",
          entityIdentifier: project.projectId,
          message: `${req.user.name} added a project update in ${project.projectId}`,
        }))
      );
      notifications.forEach((n) => {
        emitToUser(n.receiverId, "new-notification", { notification: n });
      });
    }

    // Notify mentioned users
    if (validMentionedUsers.length) {
      const mentionNotifications = validMentionedUsers
        .filter((u) => String(u._id) !== String(req.user._id))
        .map((u) => ({
          receiverId: u._id,
          senderId: req.user._id,
          type: "COMMENT_MENTION",
          entityType: "PROJECT",
          entityId: project._id,
          entityTypeRef: "Project",
          entityIdentifier: project.projectId,
          message: `${req.user.name} mentioned you in an update on project ${project.projectId}`,
        }));

      if (mentionNotifications.length) {
        const savedMentionNotifications = await Notification.insertMany(mentionNotifications);
        savedMentionNotifications.forEach((n) => {
          emitToUser(n.receiverId, "new-notification", { notification: n });
        });
      }
    }

    const populatedWorkLog = await ProjectWorkLog.findById(workLog._id)
      .populate("userId", "name email role department")
      .populate("mentionedUsers", "name email role department");

    return res.status(201).json({
      success: true,
      message: "Project work log added successfully",
      workLog: populatedWorkLog,
    });
  } catch (error) {
    console.error("addProjectWorkLog error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while adding project work log",
    });
  }
};

export const getProjectWorkLogs = async (req, res) => {
  try {
    const { identifier } = req.params;

    const project = await findProjectByIdentifier(identifier);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canViewProjectWorkLogs(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view project work logs",
      });
    }

    const workLogs = await ProjectWorkLog.find({
      entityType: "PROJECT",
      entityId: project._id,
    })
      .populate("userId", "name email role department")
      .populate("mentionedUsers", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: workLogs.length,
      workLogs,
    });
  } catch (error) {
    console.error("getProjectWorkLogs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching project work logs",
    });
  }
};
