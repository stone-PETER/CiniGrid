import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as sceneBreakdownController from "../controllers/sceneBreakdownController.js";

const router = express.Router({ mergeParams: true }); // Allow access to :projectId

// Generate breakdown from uploaded script
router.post(
  "/generate",
  authMiddleware,
  sceneBreakdownController.generateBreakdown
);

// Get breakdown
router.get("/", authMiddleware, sceneBreakdownController.getBreakdown);

// Import single scene
router.post(
  "/import/:sceneId",
  authMiddleware,
  sceneBreakdownController.importScene
);

// Import all scenes
router.post(
  "/import-all",
  authMiddleware,
  sceneBreakdownController.importAllScenes
);

// Re-import and overwrite existing scene
router.post(
  "/reimport/:sceneId",
  authMiddleware,
  sceneBreakdownController.reimportScene
);

// Export as CSV
router.get("/export", authMiddleware, sceneBreakdownController.exportBreakdown);

export default router;
