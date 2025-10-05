import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskNote,
  getTasksByStatus,
  updateTaskStatus,
  updateChecklistItem,
  approveTask,
} from "../controllers/tasksController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Task CRUD routes
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Task-specific routes
router.post("/:id/notes", addTaskNote);
router.get("/status/:status", getTasksByStatus);
router.put("/:id/status", updateTaskStatus);
router.put("/:id/checklist/:itemId", updateChecklistItem);
router.post("/:id/approve", approveTask);

export default router;