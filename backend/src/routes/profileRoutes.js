import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getMyProfile,
  createProfileRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  adminChangePassword,
} from "../controllers/profileController.js";

const router = express.Router();

// Any authenticated user
router.get("/me", authMiddleware, getMyProfile);
router.post("/requests", authMiddleware, upload.single("avatar"), createProfileRequest);
router.get("/requests/my", authMiddleware, getMyRequests);

// Admin only
router.get("/requests", authMiddleware, roleMiddleware("ADMIN"), getAllRequests);
router.patch("/requests/:id/approve", authMiddleware, roleMiddleware("ADMIN"), approveRequest);
router.patch("/requests/:id/reject", authMiddleware, roleMiddleware("ADMIN"), rejectRequest);
router.put("/admin/users/:id/password", authMiddleware, roleMiddleware("ADMIN"), adminChangePassword);

export default router;
