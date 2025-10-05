import express from "express";
import {
  getScenes,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  addSceneNote,
  getScenesByStatus,
  updateSceneStatus,
} from "../controllers/scenesController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Scene CRUD routes
router.get("/", getScenes);
router.get("/:id", getSceneById);
router.post("/", createScene);
router.put("/:id", updateScene);
router.delete("/:id", deleteScene);

// Scene-specific routes
router.post("/:id/notes", addSceneNote);
router.get("/status/:status", getScenesByStatus);
router.put("/:id/status", updateSceneStatus);

export default router;