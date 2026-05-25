import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  adminGetAllProjects,
  adminGetAllTickets,
  adminDeleteTicket,
  adminRestoreProject,
  adminGetStats,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/stats", adminGetStats);
router.get("/projects", adminGetAllProjects);
router.get("/tickets", adminGetAllTickets);
router.delete("/tickets/:id", adminDeleteTicket);
router.patch("/projects/:id/restore", adminRestoreProject);

export default router;
