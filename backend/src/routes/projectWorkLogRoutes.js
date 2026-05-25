import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  addProjectWorkLog,
  getProjectWorkLogs,
} from "../controllers/projectWorkLogController.js";

const router = express.Router();

router.get("/project/:identifier", authMiddleware, getProjectWorkLogs);

router.post(
  "/project/:identifier",
  authMiddleware,
  upload.array("attachments"),
  addProjectWorkLog
);

export default router;
