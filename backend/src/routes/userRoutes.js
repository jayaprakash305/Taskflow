import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createUser,
  getAllUsers,
  updateUser,
  toggleUserStatus,
  getMentionUsers,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);
router.post("/", authMiddleware, roleMiddleware("ADMIN"), createUser);
router.put("/:id", authMiddleware, roleMiddleware("ADMIN"), updateUser);
router.patch("/:id/status", authMiddleware, roleMiddleware("ADMIN"), toggleUserStatus);
router.get("/mentions", authMiddleware, getMentionUsers);

export default router;
