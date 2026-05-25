import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/index.js";
import { TICKET_STATUS } from "../constants/ticketStatus.js";

const ACTIVE_STATUSES = [
  TICKET_STATUS.OPEN,
  TICKET_STATUS.ASSIGNED,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.REOPENED,
];

const uniqueIds = (ids = []) => {
  return [...new Set(ids.filter(Boolean).map((id) => String(id)))];
};

export const runTicketOverdueJob = async () => {
  try {
    const now = new Date();

    const overdueTickets = await Ticket.find({
      dueDate: { $lt: now },
      status: { $in: ACTIVE_STATUSES },
      $or: [
        { overdueNotifiedAt: null },
        { overdueNotifiedAt: { $exists: false } },
      ],
    })
      .populate("raisedBy", "_id name email isActive")
      .populate("assignedTo", "_id name email isActive")
      .populate("projectId", "_id projectId title managerId leadId");

    for (const ticket of overdueTickets) {
      let recipientIds = [];
      
      // Notify raiser
      if (ticket.raisedBy?._id && ticket.raisedBy.isActive !== false) {
        recipientIds.push(ticket.raisedBy._id);
      }

      // Notify assignees
      if (ticket.assignedTo && ticket.assignedTo.length > 0) {
        ticket.assignedTo.forEach(u => {
          if (u?._id && u.isActive !== false) recipientIds.push(u._id);
        });
      }

      // If project ticket, notify project lead and manager
      if (ticket.projectId) {
        const project = await Project.findById(ticket.projectId._id)
          .populate("managerId", "_id name email isActive")
          .populate("leadId", "_id name email isActive");

        if (project?.managerId?._id && project.managerId.isActive !== false) {
          recipientIds.push(project.managerId._id);
        }
        if (project?.leadId?._id && project.leadId.isActive !== false) {
          recipientIds.push(project.leadId._id);
        }
      }

      recipientIds = uniqueIds(recipientIds);

      if (!recipientIds.length) {
        // Even if no one to notify, mark it as checked to avoid re-querying
        ticket.overdueNotifiedAt = new Date();
        await ticket.save();
        continue;
      }

      const notifications = await Notification.insertMany(
        recipientIds.map((receiverId) => ({
          receiverId,
          senderId: ticket.raisedBy?._id || receiverId,
          type: "TICKET_STATUS_CHANGED",
          entityType: "TICKET",
          entityId: ticket._id,
          entityTypeRef: "Ticket",
          entityIdentifier: ticket.ticketId,
          message: `Ticket ${ticket.ticketId} is overdue. Please review the pending work.`,
        }))
      );

      notifications.forEach((notification) => {
        emitToUser(notification.receiverId, "new-notification", {
          notification,
        });
      });

      ticket.overdueNotifiedAt = new Date();
      await ticket.save();
    }

    if (overdueTickets.length > 0) {
      console.log(`[Overdue Job] Processed ${overdueTickets.length} overdue tickets`);
    }
  } catch (error) {
    console.error("runTicketOverdueJob error:", error);
  }
};
