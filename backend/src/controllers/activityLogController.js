import ActivityLog from "../models/ActivityLog.js";
import findProjectByIdentifier from "../utils/findProjectByIdentifier.js";
import findTicketByIdentifier from "../utils/findTicketByIdentifier.js";
import Project from "../models/Project.js";

const MANAGER_ADMIN_ROLES = ["MANAGER", "ADMIN"];

const canAccess = async (entityType, entity, user) => {
  const isGlobalManager = user.role === "ADMIN" || user.role === "MANAGER";

  if (entityType === "PROJECT") {
    const creatorId = entity.createdBy?._id || entity.createdBy;
    const managerId = entity.managerId?._id || entity.managerId;
    const leadId = entity.leadId?._id || entity.leadId;

    const uid = String(user._id);
    const isCreator = creatorId && String(creatorId) === uid;
    const isManager = managerId && String(managerId) === uid;
    const isLead = leadId && String(leadId) === uid;
    const isMember =
      entity.memberIds &&
      entity.memberIds.some((id) => String(id?._id || id) === uid);

    return isCreator || isManager || isLead || isMember || isGlobalManager;
  }

  if (entityType === "TICKET") {
    const isRaiser = String(entity.raisedBy?._id || entity.raisedBy) === String(user._id);
    const isAssignee =
      entity.assignedTo &&
      (Array.isArray(entity.assignedTo)
        ? entity.assignedTo.some((id) => String(id?._id || id) === String(user._id))
        : String(entity.assignedTo?._id || entity.assignedTo) === String(user._id));

    if (isRaiser || isAssignee || isGlobalManager || user.role === "LEAD") {
      return true;
    }

    if (entity.projectId) {
      const project = await Project.findById(entity.projectId).select(
        "createdBy managerId leadId memberIds"
      );
      if (project) {
        const creatorId = project.createdBy?._id || project.createdBy;
        const managerId = project.managerId?._id || project.managerId;
        const leadId = project.leadId?._id || project.leadId;
        const uid = String(user._id);
        
        const isCreator = creatorId && String(creatorId) === uid;
        const isProjectManager = managerId && String(managerId) === uid;
        const isProjectLead = leadId && String(leadId) === uid;
        const isMember =
          project.memberIds &&
          project.memberIds.some((id) => String(id?._id || id) === uid);

        return isCreator || isProjectManager || isProjectLead || isMember;
      }
    }

    return false;
  }

  return false;
};

export const getEntityActivityLogs = async (req, res) => {
  try {
    const { entityType, identifier } = req.params;

    let entity = null;
    let normalizedType = null;

    if (entityType === "project") {
      entity = await findProjectByIdentifier(identifier);
      normalizedType = "PROJECT";
    }

    if (entityType === "ticket") {
      entity = await findTicketByIdentifier(identifier);
      normalizedType = "TICKET";
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    if (!(await canAccess(normalizedType, entity, req.user))) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      entityType: normalizedType,
      entityId: entity._id,
    };

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("performedBy", "name email role department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      logs,
    });
  } catch (error) {
    console.error("getEntityActivityLogs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching activity logs",
    });
  }
};