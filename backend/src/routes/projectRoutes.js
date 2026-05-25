import express from "express";
import roleMiddleware from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  assignProject,
  createProject,
  getAllProjects,
  getMyAssignedProjects,
  getMyCreatedProjects,
  getProjectById,
  updateProjectDetails,
  updateProjectStatus,
  updateProjectPriority,
  deleteProject,
} from "../controllers/projectController.js";


const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("MANAGER", "ADMIN"), upload.array("attachments"), createProject);
router.get("/my-created", authMiddleware, getMyCreatedProjects);
router.get("/my-assigned", authMiddleware, getMyAssignedProjects);
router.get("/all", authMiddleware, getAllProjects);
router.get("/:id", authMiddleware, getProjectById);

router.patch("/:id/assign", authMiddleware, assignProject);
router.put("/:id", authMiddleware, updateProjectDetails);
router.patch("/:id/status", authMiddleware, updateProjectStatus);
router.patch("/:id/priority", authMiddleware, updateProjectPriority);
router.delete("/:id", authMiddleware, deleteProject);

export default router;
