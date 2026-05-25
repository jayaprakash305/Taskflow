import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addComment,
  getEntityComments,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:entityType/:identifier", authMiddleware, addComment);
router.get("/:entityType/:identifier", authMiddleware, getEntityComments);

export default router;