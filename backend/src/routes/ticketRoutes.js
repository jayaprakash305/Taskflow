import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addAttachments,
  assignTicket,
  createTicket,
  getMyAssignedTickets,
  getMyRaisedTickets,
  getTicketById,
  getTicketsByProject,
  updateTicketStatus,
  updateTicketPriority,
  searchTickets,
} from "../controllers/ticketController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload.array("attachments"), createTicket);
router.get("/my-raised", authMiddleware, getMyRaisedTickets);
router.get("/my-assigned", authMiddleware, getMyAssignedTickets);
router.get("/search", authMiddleware, searchTickets);
router.get("/:id", authMiddleware, getTicketById);
router.patch("/:id/status", authMiddleware, updateTicketStatus);
router.patch("/:id/priority", authMiddleware, updateTicketPriority);
router.patch("/:id/assign", authMiddleware, assignTicket);
router.patch("/:id/attachments", authMiddleware, upload.array("attachments"), addAttachments);
router.get("/project/:projectId", authMiddleware, getTicketsByProject);

export default router;