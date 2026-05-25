import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitToUser, emitToProjectRoom, emitToTicketRoom } from "../socket/index.js";
import findProjectByIdentifier from "../utils/findProjectByIdentifier.js";
import findTicketByIdentifier from "../utils/findTicketByIdentifier.js";
import createEntityActivityLog from "../utils/createEntityActivityLog.js";
import Project from "../models/Project.js";



const getEntityConfig = async (entityType, identifier) => {
  if (entityType === "project") {
    const project = await findProjectByIdentifier(identifier);
    return {
      entity: project,
      normalizedEntityType: "PROJECT",
      entityTypeRef: "Project",
      entityIdentifier: project?.projectId || identifier,
    };
  }

  if (entityType === "ticket") {
    const ticket = await findTicketByIdentifier(identifier);
    return {
      entity: ticket,
      normalizedEntityType: "TICKET",
      entityTypeRef: "Ticket",
      entityIdentifier: ticket?.ticketId || identifier,
    };
  }

  return null;
};

const canAccessEntityComments = async (entityType, entity, user) => {
  if (!entity || !user) return false;

  const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(user.role);
  const isLead = user.role === "LEAD";

  if (entityType === "PROJECT") {
    const isCreator = String(entity.createdBy) === String(user._id);
    const isManager = entity.managerId && String(entity.managerId) === String(user._id);
    const isProjectLead = entity.leadId && String(entity.leadId) === String(user._id);
    const isMember =
      Array.isArray(entity.memberIds) &&
      entity.memberIds.some((id) => String(id) === String(user._id));

    return isCreator || isManager || isProjectLead || isMember || isManagerOrAdmin;
  }

  if (entityType === "TICKET") {
    const isRaiser = String(entity.raisedBy) === String(user._id);
    const isAssignee =
      entity.assignedTo &&
      (Array.isArray(entity.assignedTo)
        ? entity.assignedTo.some((id) => String(id) === String(user._id))
        : String(entity.assignedTo) === String(user._id));

    if (!entity.projectId) {
      return isRaiser || isAssignee || isLead || isManagerOrAdmin;
    }

    const project = await Project.findById(entity.projectId).select(
      "createdBy managerId leadId memberIds"
    );

    if (!project) return false;

    const isProjectCreator = String(project.createdBy) === String(user._id);
    const isProjectManager = project.managerId && String(project.managerId) === String(user._id);
    const isProjectLead = project.leadId && String(project.leadId) === String(user._id);
    const isProjectMember =
      Array.isArray(project.memberIds) &&
      project.memberIds.some((id) => String(id) === String(user._id));

    return (
      isRaiser ||
      isAssignee ||
      isProjectCreator ||
      isProjectManager ||
      isProjectLead ||
      isProjectMember ||
      isManagerOrAdmin
    );
  }

  return false;
};

export const addComment = async (req, res) => {
  try {
    const { message, mentionedUsers = [] } = req.body;
    const { entityType, identifier } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const entityConfig = await getEntityConfig(entityType, identifier);

    if (!entityConfig || !entityConfig.entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    const {
      entity,
      normalizedEntityType,
      entityTypeRef,
      entityIdentifier,
    } = entityConfig;

    const allowed = await canAccessEntityComments(
      normalizedEntityType,
      entity,
      req.user
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `You are not allowed to comment on this ${entityType}`,
      });
    }

    const mentionIds = Array.isArray(mentionedUsers) ? mentionedUsers : [];
    const validMentionedUsers = mentionIds.length
      ? await User.find({
          _id: { $in: mentionIds },
          isActive: true,
        }).select("_id name email role department")
      : [];

    const comment = await Comment.create({
      entityType: normalizedEntityType,
      entityId: entity._id,
      entityTypeRef,
      userId: req.user._id,
      message: message.trim(),
      mentionedUsers: validMentionedUsers.map((u) => u._id),
    });

    await createEntityActivityLog({
      entityType: normalizedEntityType,
      entityId: entity._id,
      entityTypeRef,
      action: "COMMENT_ADDED",
      performedBy: req.user._id,
      message: `${req.user.name} added a comment`,
      metadata: {
        commentId: comment._id,
      },
    });

    if (validMentionedUsers.length) {
      await createEntityActivityLog({
        entityType: normalizedEntityType,
        entityId: entity._id,
        entityTypeRef,
        action: "USER_TAGGED",
        performedBy: req.user._id,
        message: `${req.user.name} tagged ${validMentionedUsers
          .map((u) => u.name)
          .join(", ")}`,
        metadata: {
          commentId: comment._id,
          taggedUsers: validMentionedUsers.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
          })),
        },
      });

      const notifications = validMentionedUsers
        .filter((u) => String(u._id) !== String(req.user._id))
        .map((u) => ({
          receiverId: u._id,
          senderId: req.user._id,
          type: "COMMENT_MENTION",
          entityType: normalizedEntityType,
          entityId: entity._id,
          entityTypeRef,
          entityIdentifier,
          message: `${req.user.name} mentioned you in ${normalizedEntityType.toLowerCase()} ${entityIdentifier}`,
        }));

      if (notifications.length) {
        const savedNotifications = await Notification.insertMany(notifications);
        savedNotifications.forEach((n) => {
          emitToUser(n.receiverId, "new-notification", { notification: n });
        });
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email role department")
      .populate("mentionedUsers", "name email role department")
      .populate("entityId");

    if (normalizedEntityType === "PROJECT") {
      emitToProjectRoom(identifier, "project-comment-added", {
        comment: populatedComment,
        projectIdentifier: identifier,
      });
    }

    if (normalizedEntityType === "TICKET") {
      emitToTicketRoom(identifier, "ticket-comment-added", {
        comment: populatedComment,
        ticketIdentifier: identifier,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("addComment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while adding comment",
    });
  }
};

export const getEntityComments = async (req, res) => {
  try {
    const { entityType, identifier } = req.params;

    const entityConfig = await getEntityConfig(entityType, identifier);

    if (!entityConfig || !entityConfig.entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    const { entity, normalizedEntityType } = entityConfig;

    const allowed = await canAccessEntityComments(
      normalizedEntityType,
      entity,
      req.user
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `You are not allowed to view comments for this ${entityType}`,
      });
    }

    const query = {
      entityType: normalizedEntityType,
      entityId: entity._id,
    };

    const filter = req.query.filter;
    if (filter === "today" || filter === "older") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      if (filter === "today") {
        query.createdAt = { $gte: startOfToday };
      } else {
        query.createdAt = { $lt: startOfToday };
      }
    }

    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    const sortOrder = -1; // Newest first

    // If page & limit are provided, use pagination
    if (page > 0 && limit > 0) {
      const totalCount = await Comment.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const comments = await Comment.find(query)
        .populate("userId", "name email role department")
        .populate("mentionedUsers", "name email role department")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: comments.length,
        totalCount,
        totalPages,
        currentPage: page,
        comments,
      });
    }

    // Fallback: no pagination, return all
    const comments = await Comment.find(query)
      .populate("userId", "name email role department")
      .populate("mentionedUsers", "name email role department")
      .sort({ createdAt: sortOrder });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("getEntityComments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching comments",
    });
  }
};