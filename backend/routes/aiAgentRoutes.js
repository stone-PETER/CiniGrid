import express from "express";
import { body } from "express-validator";
import {
  findLocations,
  getStats,
  clearCache,
  checkStatus,
} from "../controllers/aiAgentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public status check
router.get("/status", checkStatus);

// Protected routes (require authentication)
router.post(
  "/find-locations",
  protect,
  [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be between 10 and 500 characters"),
    body("projectId")
      .optional()
      .isMongoId()
      .withMessage("Invalid project ID format"),
    body("forceRefresh")
      .optional()
      .isBoolean()
      .withMessage("forceRefresh must be a boolean"),
    body("maxResults")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("maxResults must be between 1 and 10"),
  ],
  findLocations
);

// Admin routes - project-scoped
router.get("/stats", protect, getStats);
router.delete("/cache/expired", protect, clearCache);

export default router;
