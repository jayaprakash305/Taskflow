import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import WorkLog from "../models/WorkLog.js";
import { emitToUser, emitToProjectRoom, emitToTicketRoom } from "../socket/index.js";
import { TICKET_STATUS } from "../constants/ticketStatus.js";
import { PRIORITY } from "../constants/priority.js";
import generateTicketId from "../utils/generateTicketId.js";
import mongoose from "mongoose";
import createEntityActivityLog from "../utils/createEntityActivityLog.js";
import findProjectByIdentifier from "../utils/findProjectByIdentifier.js";
import { getTicketRecipientIds } from "../utils/notificationRecipients.js";

const ENTITY_TYPE = "TICKET";
const ENTITY_TYPE_REF = "Ticket";

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
  const isCreator = creatorId && String(creatorId._id || creatorId) === uid;
  const isManager = managerId && String(managerId._id || managerId) === uid;
  const isLead = leadId && String(leadId._id || leadId) === uid;
  const isAdmin = role === "ADMIN";

  return isCreator || isManager || isLead || isAdmin;
};

const isProjectMember = (project, userId) => {
  return (
    Array.isArray(project.memberIds) &&
    project.memberIds.some((m) => String(m?._id || m) === String(userId))
  );
};

const canViewTicket = async (ticket, user) => {
  const raiserId = ticket.raisedBy?._id || ticket.raisedBy;
  const isRaiser = String(raiserId) === String(user._id);
  const isAssignee =
    Array.isArray(ticket.assignedTo) &&
    ticket.assignedTo.some((m) => String(m._id || m) === String(user._id));

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

/**
 * canModifyTicket — stricter than canViewTicket.
 * Employees can ONLY modify tickets they raised or are assigned to.
 * Leads, managers, admins can modify any ticket in their project.
 */
const canModifyTicket = async (ticket, user) => {
  const raiserId = ticket.raisedBy?._id || ticket.raisedBy;
  const isRaiser = String(raiserId) === String(user._id);
  const isAssignee =
    Array.isArray(ticket.assignedTo) &&
    ticket.assignedTo.some((m) => String(m._id || m) === String(user._id));

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

const canAssignTicket = async (ticket, user) => {
  const isRaiser = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
  const isAssignee =
    Array.isArray(ticket.assignedTo) &&
    ticket.assignedTo.some((id) => String(id?._id || id) === String(user._id));

  // Standalone ticket
  if (!ticket.projectId) {
    return (
      isRaiser ||
      isAssignee ||
      ["LEAD", "MANAGER", "ADMIN"].includes(user.role)
    );
  }

  // Project ticket
  const project = await Project.findById(ticket.projectId).select(
    "createdBy managerId leadId"
  );

  if (!project) return false;

  const isProjectManager =
    project.managerId && String(project.managerId?._id || project.managerId) === String(user._id);

  const isProjectLead =
    project.leadId && String(project.leadId?._id || project.leadId) === String(user._id);

  return isProjectManager || isProjectLead || isRaiser || user.role === "ADMIN";
};

// Raise ticket
export const createTicket = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      priority,
      assignedTo,
      dueDate,
      department,
      links,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    let project = null;
    if (projectId) {
      project = await findProjectByIdentifier(projectId);
      if (project) {
        // Re-query to select specific fields if needed, or just use project
        project = await Project.findById(project._id).select(
          "projectId title createdBy managerId leadId memberIds"
        );
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
    }

    let assignedUsers = [];

    if (assignedTo) {
      const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      assignedUsers = await User.find({ _id: { $in: assigneeIds } });

      if (assignedUsers.length === 0 && assigneeIds.length > 0) {
        return res.status(404).json({
          success: false,
          message: "Assigned users not found",
        });
      }

      if (project) {
        const validProjectUserIds = [
          String(project.createdBy),
          project.managerId ? String(project.managerId) : null,
          project.leadId ? String(project.leadId) : null,
          ...(project.memberIds || []).map((id) => String(id)),
        ].filter(Boolean);

        const invalidAssignee = assignedUsers.some(
          (u) => !validProjectUserIds.includes(String(u._id))
        );

        if (invalidAssignee) {
          return res.status(400).json({
            success: false,
            message: "Assigned users must belong to the selected project",
          });
        }
      }
    }

    const files = req.files;
    console.log(`Ticket creation - Files received: ${files?.length || 0}`);
    if (files && files.length > 0) {
      console.log("File details:", files.map(f => ({ name: f.originalname, type: f.mimetype })));
    }

    let attachments =
      files?.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype,
      })) || [];

    if (links) {
      try {
        const parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
        if (Array.isArray(parsedLinks)) {
          attachments = [...attachments, ...parsedLinks];
        }
      } catch (e) {
        console.error("Error parsing link attachments:", e);
      }
    }

    const initialStatus =
      assignedUsers.length > 0 ? TICKET_STATUS.ASSIGNED : TICKET_STATUS.OPEN;

    const assignedDepartment = department || req.user.department || "GENERAL";
    const generatedTicketId = await generateTicketId(project ? project.title : null, assignedDepartment);

    const ticket = await Ticket.create({
      ticketId: generatedTicketId,
      projectId: project ? project._id : null,
      title,
      description,
      category: category || "GENERAL",
      priority,
      status: initialStatus,
      raisedBy: req.user._id,
      assignedTo: assignedUsers.map((u) => u._id),
      dueDate: dueDate || null,
      department: department || req.user.department || "GENERAL",
      attachments,
    });

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: ticket._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "CREATED",
      performedBy: req.user._id,
      message: `${req.user.name} raised ticket ${ticket.ticketId}`,
      metadata: {
        ticketId: ticket.ticketId,
        title: ticket.title,
        projectId: project ? project._id : null,
        projectCode: project ? project.projectId : null,
      },
    });

    if (assignedUsers.length) {
      await createEntityActivityLog({
        entityType: ENTITY_TYPE,
        entityId: ticket._id,
        entityTypeRef: ENTITY_TYPE_REF,
        action: "ASSIGNED",
        performedBy: req.user._id,
        message: `${req.user.name} assigned ticket ${ticket.ticketId} to ${assignedUsers
          .map((u) => u.name)
          .join(", ")}`,
        metadata: {
          ticketId: ticket.ticketId,
          assignedTo: assignedUsers.map((u) => u._id),
        },
      });

      const recipientIds = getTicketRecipientIds(ticket, project, req.user._id);

      if (recipientIds.length) {
        const notifications = await Notification.insertMany(
          recipientIds.map((receiverId) => ({
            receiverId,
            senderId: req.user._id,
            type: "TICKET_ASSIGNED",
            entityType: ENTITY_TYPE,
            entityId: ticket._id,
            entityTypeRef: ENTITY_TYPE_REF,
            entityIdentifier: ticket.ticketId,
            message: `${req.user.name} raised and assigned ticket ${ticket.ticketId} to you`,
          }))
        );

        notifications.forEach((n) => {
          emitToUser(n.receiverId, "new-notification", { notification: n });
        });
      }
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");

    return res.status(201).json({
      success: true,
      message: "Ticket raised successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("createTicket error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while raising ticket",
    });
  }
};

// Get my raised tickets
export const getMyRaisedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ raisedBy: req.user._id })
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("getMyRaisedTickets error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching raised tickets",
    });
  }
};

// Get my assigned tickets
export const getMyAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user._id })
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("getMyAssignedTickets error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching assigned tickets",
    });
  }
};

// Get tickets by project
export const getTicketsByProject = async (req, res) => {
  try {
    const project = await findProjectByIdentifier(req.params.projectId);

    if (project) {
      // populate with select
      const populatedProject = await Project.findById(project._id).select(
        "createdBy managerId leadId memberIds"
      );

      if (!populatedProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const canView =
        isProjectControllerUser(populatedProject, req.user._id, req.user.role) ||
        isProjectMember(populatedProject, req.user._id);

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view tickets for this project",
        });
      }

      const tickets = await Ticket.find({ projectId: project._id })
        .populate("projectId", "projectId title status")
        .populate("raisedBy", "name email role department")
        .populate("assignedTo", "name email role department")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
  } catch (error) {
    console.error("getTicketsByProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching project tickets",
    });
  }
};

// Get single ticket details
export const getTicketById = async (req, res) => {
  try {
    const ticket = await findTicketByIdentifier(req.params.id, true);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const rawTicket = await Ticket.findById(ticket._id).select(
      "raisedBy assignedTo projectId"
    );

    const allowed = await canViewTicket(rawTicket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this ticket",
      });
    }

    // Check if user can modify (stricter than view)
    const modifyAllowed = await canModifyTicket(rawTicket, req.user);

    return res.status(200).json({
      success: true,
      ticket,
      canModify: modifyAllowed,
    });
  } catch (error) {
    console.error("getTicketById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching ticket details",
    });
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !Object.values(TICKET_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid ticket status is required",
      });
    }

    const ticket = await findTicketByIdentifier(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isLead = req.user.role === "LEAD";
    const isManager = req.user.role === "MANAGER";
    const isAdmin = req.user.role === "ADMIN";
    const isEmployee = req.user.role === "EMPLOYEE";

    if (isEmployee && (status === "CLOSED" || status === "REOPENED")) {
      return res.status(403).json({
        success: false,
        message: "Employees cannot close or reopen tickets. Please mark it as Resolved for lead/manager review.",
      });
    }

    if ((status === "CLOSED" || status === "REOPENED") && !(isLead || isManager || isAdmin)) {
      return res.status(403).json({
        success: false,
        message: "Only lead, manager, or admin can close or reopen tickets.",
      });
    }

    const allowed = await canModifyTicket(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this ticket",
      });
    }

    const previousStatus = ticket.status;

    if (status === TICKET_STATUS.CLOSED) {
      const closureNoteQuery = {
        entityId: ticket._id,
        isClosureNote: true,
        closureSummary: { $ne: "" },
      };

      if (ticket.reopenedAt) {
        closureNoteQuery.createdAt = { $gt: ticket.reopenedAt };
      }

      const closureNote = await WorkLog.findOne(closureNoteQuery);

      if (!closureNote) {
        return res.status(400).json({
          success: false,
          message: ticket.reopenedAt
            ? "Since this ticket was reopened, please add a new closure note before closing it again."
            : "Please add a closure note in the Updates tab before closing this ticket.",
        });
      }
    }

    ticket.status = status;

    if (status === TICKET_STATUS.RESOLVED) {
      ticket.resolvedAt = new Date();
      ticket.closedAt = null;
    } else if (status === TICKET_STATUS.CLOSED) {
      ticket.closedAt = new Date();
      if (!ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
    } else if (status === TICKET_STATUS.REOPENED) {
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    } else {
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: ticket._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "STATUS_CHANGED",
      performedBy: req.user._id,
      message: `${req.user.name} changed ticket ${ticket.ticketId} status from ${previousStatus} to ${status}`,
      metadata: {
        ticketId: ticket.ticketId,
        from: previousStatus,
        to: status,
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
          entityType: ENTITY_TYPE,
          entityId: ticket._id,
          entityTypeRef: ENTITY_TYPE_REF,
          entityIdentifier: ticket.ticketId,
          message: `${req.user.name} updated ticket ${ticket.ticketId} status to ${status}`,
        }))
      );

      notifications.forEach((n) => {
        emitToUser(n.receiverId, "new-notification", { notification: n });
      });
    }

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");

    emitToTicketRoom(ticket.ticketId, "ticket-status-updated", {
      ticketId: ticket.ticketId,
      status: ticket.status,
      updatedBy: req.user.name,
    });

    if (ticket.projectId) {
      const proj = await Project.findById(ticket.projectId);
      if (proj) {
        emitToProjectRoom(proj.projectId, "project-ticket-updated", { ticket: updatedTicket });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating ticket status",
    });
  }
};

// Assign or reassign ticket
export const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "assignedTo is required",
      });
    }

    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    const users = await User.find({ _id: { $in: assigneeIds } });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assigned users not found",
      });
    }

    const ticket = await findTicketByIdentifier(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowed = await canAssignTicket(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to assign this ticket",
      });
    }

    if (ticket.projectId) {
      const project = await Project.findById(ticket.projectId).select(
        "createdBy managerId leadId memberIds"
      );

      const validProjectUserIds = [
        String(project.createdBy),
        project.managerId ? String(project.managerId) : null,
        project.leadId ? String(project.leadId) : null,
        ...(project.memberIds || []).map((id) => String(id)),
      ].filter(Boolean);

      const invalidAssignee = users.some(
        (u) => !validProjectUserIds.includes(String(u._id))
      );

      if (invalidAssignee) {
        return res.status(400).json({
          success: false,
          message: "Assigned users must belong to the selected project",
        });
      }
    }

    const previousAssignees = ticket.assignedTo.map((id) => String(id));
    const newAssigneeIds = users.map((u) => u._id);

    ticket.assignedTo = newAssigneeIds;

    if (
      ticket.status === TICKET_STATUS.OPEN ||
      ticket.status === TICKET_STATUS.REOPENED
    ) {
      ticket.status = TICKET_STATUS.ASSIGNED;
    }

    await ticket.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: ticket._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: previousAssignees.length ? "REASSIGNED" : "ASSIGNED",
      performedBy: req.user._id,
      message: previousAssignees.length
        ? `${req.user.name} reassigned ticket ${ticket.ticketId} to ${users
          .map((u) => u.name)
          .join(", ")}`
        : `${req.user.name} assigned ticket ${ticket.ticketId} to ${users
          .map((u) => u.name)
          .join(", ")}`,
      metadata: {
        ticketId: ticket.ticketId,
        previousAssignees,
        newAssignees: newAssigneeIds,
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
          type: "TICKET_ASSIGNED",
          entityType: ENTITY_TYPE,
          entityId: ticket._id,
          entityTypeRef: ENTITY_TYPE_REF,
          entityIdentifier: ticket.ticketId,
          message: `${req.user.name} assigned ticket ${ticket.ticketId} to you`,
        }))
      );

      notifications.forEach((n) => {
        emitToUser(n.receiverId, "new-notification", { notification: n });
      });
    }

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("assignTicket error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while assigning ticket",
    });
  }
};

// Add attachments to an existing ticket
export const addAttachments = async (req, res) => {
  try {
    const ticket = await findTicketByIdentifier(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowed = await canViewTicket(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add attachments to this ticket",
      });
    }

    const files = req.files;
    if (files && files.length > 0) {
      const newAttachments = files.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype,
      }));

      ticket.attachments.push(...newAttachments);
      await ticket.save();
    }

    return res.status(200).json({
      success: true,
      message: "Attachments added successfully",
      ticket,
    });
  } catch (error) {
    console.error("addAttachments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while adding attachments",
    });
  }
};

// Update ticket priority
export const updateTicketPriority = async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !Object.values(PRIORITY).includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Valid priority is required",
      });
    }

    const ticket = await findTicketByIdentifier(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowed = await canModifyTicket(ticket, req.user);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this ticket",
      });
    }

    const previousPriority = ticket.priority;
    ticket.priority = priority;

    await ticket.save();

    await createEntityActivityLog({
      entityType: ENTITY_TYPE,
      entityId: ticket._id,
      entityTypeRef: ENTITY_TYPE_REF,
      action: "PRIORITY_CHANGED",
      performedBy: req.user._id,
      message: `${req.user.name} changed ticket ${ticket.ticketId} priority from ${previousPriority} to ${priority}`,
      metadata: {
        ticketId: ticket.ticketId,
        from: previousPriority,
        to: priority,
      },
    });

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("projectId", "projectId title status")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");

    emitToTicketRoom(ticket.ticketId, "ticket-priority-updated", {
      ticketId: ticket.ticketId,
      priority: ticket.priority,
      updatedBy: req.user.name,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicketPriority error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating ticket priority",
    });
  }
};


export const searchTickets = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, tickets: [] });
    const tickets = await Ticket.find({
      $or: [
        { ticketId: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    })
    .limit(10)
    .populate("projectId", "projectId title")
    .select("ticketId title status projectId assignedTo createdAt");
    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
