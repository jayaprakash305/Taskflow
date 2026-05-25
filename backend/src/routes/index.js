import express from "express";
import authRoutes from "./authRoutes.js";
import projectRoutes from "./projectRoutes.js";
import commentRoutes from "./commentRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import userRoutes from "./userRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import activityLogRoutes from "./activityLogRoutes.js";
import workLogRoutes from "./workLogRoutes.js";
import projectWorkLogRoutes from "./projectWorkLogRoutes.js";
import adminRoutes from "./adminRoutes.js";
import chatRoutes from "./chatRoutes.js";
import profileRoutes from "./profileRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/comments", commentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/worklogs", workLogRoutes);
router.use("/project-worklogs", projectWorkLogRoutes);
router.use("/admin", adminRoutes);
router.use("/chats", chatRoutes);
router.use("/profile", profileRoutes);


export default router;