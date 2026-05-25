import Project from "../models/Project.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

/**
 * Admin-only: Get ALL projects (including soft-deleted) with full population.
 */
export const adminGetAllProjects = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    const filter = includeDeleted === "true" ? {} : { isDeleted: { $ne: true } };

    const projects = await Project.find(filter)
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
    console.error("adminGetAllProjects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching all projects",
    });
  }
};

/**
 * Admin-only: Get ALL tickets with full population.
 */
export const adminGetAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("projectId", "projectId title")
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("adminGetAllTickets error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching all tickets",
    });
  }
};

/**
 * Admin-only: Delete a ticket (hard delete).
 */
export const adminDeleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await Ticket.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("adminDeleteTicket error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting ticket",
    });
  }
};

/**
 * Admin-only: Restore a soft-deleted project.
 */
export const adminRestoreProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.isDeleted = false;
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role department")
      .populate("managerId", "name email role department")
      .populate("leadId", "name email role department")
      .populate("memberIds", "name email role department");

    return res.status(200).json({
      success: true,
      message: "Project restored successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("adminRestoreProject error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while restoring project",
    });
  }
};

/**
 * Admin-only: Get dashboard stats overview.
 */
export const adminGetStats = async (req, res) => {
  try {
    const [totalProjects, activeProjects, deletedProjects, totalTickets, totalUsers, activeUsers] =
      await Promise.all([
        Project.countDocuments(),
        Project.countDocuments({ isDeleted: { $ne: true } }),
        Project.countDocuments({ isDeleted: true }),
        Ticket.countDocuments(),
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
      ]);

    // Ticket status breakdown
    const ticketStatusAgg = await Ticket.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const ticketsByStatus = {};
    ticketStatusAgg.forEach((s) => {
      ticketsByStatus[s._id] = s.count;
    });

    // Ticket priority breakdown
    const ticketPriorityAgg = await Ticket.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const ticketsByPriority = {};
    ticketPriorityAgg.forEach((p) => {
      ticketsByPriority[p._id] = p.count;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        deletedProjects,
        totalTickets,
        ticketsByStatus,
        ticketsByPriority,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
    });
  } catch (error) {
    console.error("adminGetStats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching admin stats",
    });
  }
};
