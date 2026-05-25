import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getEntityActivityLogs } from "../controllers/activityLogController.js";

const router = express.Router();

router.get("/:entityType/:identifier", authMiddleware, getEntityActivityLogs);

export default router;