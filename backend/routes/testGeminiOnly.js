/**
 * TEST ROUTES: Pure Gemini AI Location Recommendations
 *
 * Routes for testing location generation without Google Places API
 */

import express from "express";
import {
  testGeminiOnly,
  testCompare,
} from "../controllers/testGeminiOnlyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/ai/test-gemini-only
 * Generate locations using ONLY Gemini AI (no Google Places)
 *
 * Body: {
 *   description: "Scene description",
 *   maxResults: 5,
 *   region: "India"
 * }
 */
router.post("/test-gemini-only", authMiddleware, testGeminiOnly);

/**
 * POST /api/ai/test-compare
 * Compare Gemini-only vs Full AI Agent
 *
 * Body: {
 *   description: "Scene description"
 * }
 */
router.post("/test-compare", authMiddleware, testCompare);

export default router;
