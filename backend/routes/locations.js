import express from "express";
import {
  addToPotential,
  getPotentialLocations,
  getPotentialLocation,
  finalizeLocation,
  getFinalizedLocations,
  directAddToPotential,
  directAddToFinalized,
  analyzeLocation,
  getSimilarLocations,
  searchPotentialLocations,
} from "../controllers/locationsController.js";
import {
  addNoteToPotential,
  addNoteToFinalized,
  addApprovalToPotential,
} from "../controllers/notesController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// AI-powered location routes
router.post("/analyze", authMiddleware, analyzeLocation);
router.get("/:id/similar", authMiddleware, getSimilarLocations);
router.post("/search", authMiddleware, searchPotentialLocations);

// Potential locations routes
router.post("/potential", authMiddleware, addToPotential);
router.get("/potential", authMiddleware, getPotentialLocations);
router.get("/potential/:id", authMiddleware, getPotentialLocation);
router.post("/potential/:id/finalize", authMiddleware, finalizeLocation);

// Notes routes for potential locations
router.post("/potential/:id/notes", authMiddleware, addNoteToPotential);

// Approvals routes for potential locations
router.post("/potential/:id/approvals", authMiddleware, addApprovalToPotential);

// Finalized locations routes
router.get("/finalized", authMiddleware, getFinalizedLocations);

// Notes routes for finalized locations
router.post("/finalized/:id/notes", authMiddleware, addNoteToFinalized);

// Direct add routes
router.post("/direct-add/potential", authMiddleware, directAddToPotential);
router.post("/direct-add/finalized", authMiddleware, directAddToFinalized);

export default router;
