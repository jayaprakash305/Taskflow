import WorkLog from "../models/WorkLog.js";
import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import createEntityActivityLog from "../utils/createEntityActivityLog.js";
import { emitToUser } from "../socket/index.js";
import mongoose from "mongoose";
import { getTicketRecipientIds } from "../utils/notificationRecipients.js";

const findTicketByIdentifier = async (identifier, populate = false) => {
  let query = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = Ticket.findOne({
      $or: [{ _id: identifier }, { ticketId: identifier }],
    });
  } else {
    query = Ticket.findOne({ ticketId: identifier });
  }

  if (populate) {
    query = query
      .populate("projectId", "projectId title status managerId leadId memberIds createdBy")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");
  }

  return await query;
};

const isProjectControllerUser = (project, userId, role) => {
  const creatorId = project.createdBy?._id || project.createdBy;
  const managerId = project.managerId?._id || project.managerId;
  const leadId = project.leadId?._id || project.leadId;

  const uid = String(userId);
  const isCreator = creatorId && String(creatorId) === uid;
  const isManager = managerId && String(managerId) === uid;
  const isLead = leadId && String(leadId) === uid;
  const isAdmin = role === "ADMIN";

  return isCreator || isManager || isLead || isAdmin;
};

const isProjectMember = (project, userId) => {
  return (
    Array.isArray(project.memberIds) &&
    project.memberIds.some((id) => String(id) === String(userId))
  );
};

const canViewTicketWorkLogs = async (ticket, user) => {
  const isRaiser = String(ticket.raisedBy) === String(user._id);
  const isAssignee =
    Array.isArray(ticket.assignedTo) &&
    ticket.assignedTo.some((id) => String(id) === String(user._id));

  if (!ticket.projectId) {
    return (
      isRaiser ||
      isAssignee ||
      ["LEAD", "MANAGER", "ADMIN"].includes(user.role)
    );
  }

  const project = await Project.findById(ticket.projectId).select(
    "createdBy managerId leadId memberIds"
  );

  if (!project) return false;

  return (
    isRaiser ||
    isAssignee ||
    isProjectControllerUser(project, user._id, user.role) ||
    isProjectMember(project, user._id)
  );
};

const canAddTicketWorkLog = async (ticket, user) => {
  const isRaiser = String(ticket.raisedBy) === String(user._id);
  const isAssignee =
    Array.isArray(ticket.assignedTo) &&
    ticket.assignedTo.some((id) => String(id) === String(user._id));

  // Anyone who raised or is assigned can modify
  if (isRaiser || isAssignee) return true;

  // Admins can modify any ticket
  if (user.role === "ADMIN") return true;

  // For standalone tickets (no project), only lead/manager/admin
  if (!ticket.projectId) {
    return ["LEAD", "MANAGER"].includes(user.role);
  }

  // For project tickets, check if user is project lead/manager/creator
  const project = await Project.findById(ticket.projectId).select(
    "createdBy managerId leadId"
  );

  if (!project) return false;

  return isProjectControllerUser(project, user._id, user.role);
};

// Add work log to ticket
export const addTicketWorkLog = async (req, res) => {
  try {
    const { title, description, logType, links, isClosureNote, closureSummary, mentionedUsers = [] } = req.body;
    const { identifier } = req.params;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const ticket = await findTicketByIdentifier(identifier);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowed = await canAddTicketWorkLog(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add work logs for this ticket",
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
    console.log(`Ticket WorkLog - Files received: ${files.length}`);
    if (files.length > 0) {
      console.log("File details:", files.map(f => ({ name: f.originalname, type: f.mimetype })));
    }

    let attachments = files.map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    let parsedLinks = [];
    if (links) {
      try {
        parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
        if (!Array.isArray(parsedLinks)) parsedLinks = [];
      } catch (error) {
        parsedLinks = [];
      }
    }

    const workLog = await WorkLog.create({
      entityType: "TICKET",
      entityId: ticket._id,
      entityTypeRef: "Ticket",
      userId: req.user._id,
      logType: logType || "PROGRESS_UPDATE",
      title: title.trim(),
      description: description.trim(),
      attachments,
      links: parsedLinks,
      isClosureNote: Boolean(isClosureNote),
      closureSummary: closureSummary?.trim() || "",
      mentionedUsers: validMentionedUsers.map((u) => u._id),
    });

    await createEntityActivityLog({
      entityType: "TICKET",
      entityId: ticket._id,
      entityTypeRef: "Ticket",
      action: "COMMENT_ADDED",
      performedBy: req.user._id,
      message: `${req.user.name} added a work update to ticket ${ticket.ticketId}`,
      metadata: {
        ticketId: ticket.ticketId,
        workLogId: workLog._id,
        logType: workLog.logType,
        isClosureNote: workLog.isClosureNote,
      },
    });

    let project = null;
    if (ticket.projectId) {
      project = await Project.findById(ticket.projectId).select("managerId leadId");
    }

    const recipientIds = getTicketRecipientIds(ticket, project, req.user._id);

    if (recipientIds.length) {
      const notifications = await Notification.insertMany(
        recipientIds.map((receiverId) => ({
          receiverId,
          senderId: req.user._id,
          type: "TICKET_STATUS_CHANGED",
          entityType: "TICKET",
          entityId: ticket._id,
          entityTypeRef: "Ticket",
          entityIdentifier: ticket.ticketId,
          message: `${req.user.name} added a work update on ticket ${ticket.ticketId}`,
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
          entityType: "TICKET",
          entityId: ticket._id,
          entityTypeRef: "Ticket",
          entityIdentifier: ticket.ticketId,
          message: `${req.user.name} mentioned you in an update on ticket ${ticket.ticketId}`,
        }));

      if (mentionNotifications.length) {
        const savedMentionNotifications = await Notification.insertMany(mentionNotifications);
        savedMentionNotifications.forEach((n) => {
          emitToUser(n.receiverId, "new-notification", { notification: n });
        });
      }
    }

    const populatedWorkLog = await WorkLog.findById(workLog._id)
      .populate("userId", "name email role department")
      .populate("mentionedUsers", "name email role department");

    return res.status(201).json({
      success: true,
      message: "Work log added successfully",
      workLog: populatedWorkLog,
    });
  } catch (error) {
    console.error("addTicketWorkLog error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while adding work log",
    });
  }
};

// Get all work logs for ticket
export const getTicketWorkLogs = async (req, res) => {
  try {
    const { identifier } = req.params;

    const ticket = await findTicketByIdentifier(identifier);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowed = await canViewTicketWorkLogs(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view work logs for this ticket",
      });
    }

    const workLogs = await WorkLog.find({
      entityType: "TICKET",
      entityId: ticket._id,
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
    console.error("getTicketWorkLogs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching work logs",
    });
  }
};
