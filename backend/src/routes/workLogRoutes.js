import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  addTicketWorkLog,
  getTicketWorkLogs,
} from "../controllers/workLogController.js";

const router = express.Router();

router.get("/ticket/:identifier", authMiddleware, getTicketWorkLogs);

router.post(
  "/ticket/:identifier",
  authMiddleware,
  upload.array("attachments"),
  addTicketWorkLog
);

export default router;
