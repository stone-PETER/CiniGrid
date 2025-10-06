import express from "express";
import {
  addToPotential,
  getPotentialLocations,
  getPotentialLocation,
  finalizeLocation,
  unfinalizeLocation,
  getFinalizedLocations,
  directAddToPotential,
  directAddToFinalized,
  analyzeLocation,
  getSimilarLocations,
  searchPotentialLocations,
  addTeamNote,
  editTeamNote,
  deleteTeamNote,
  getTeamNotes,
} from "../controllers/locationsController.js";
import {
  addNoteToPotential,
  addNoteToFinalized,
  addApprovalToPotential,
} from "../controllers/notesController.js";
import {
  compareLocations,
  getLocationRequirements,
  createLocationRequirement,
  updateLocationRequirement,
  deleteLocationRequirement,
  refreshLocationCache,
} from "../controllers/locationComparisonController.js";
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

// Team notes routes for potential locations (new multi-user workflow)
router.post("/potential/:id/team-notes", authMiddleware, addTeamNote);
router.patch("/potential/:id/team-notes/:noteId", authMiddleware, editTeamNote);
router.delete(
  "/potential/:id/team-notes/:noteId",
  authMiddleware,
  deleteTeamNote
);
router.get("/potential/:id/team-notes", authMiddleware, getTeamNotes);

// Finalized locations routes
router.get("/finalized", authMiddleware, getFinalizedLocations);
router.post("/finalized/:id/unfinalize", authMiddleware, unfinalizeLocation);

// Notes routes for finalized locations
router.post("/finalized/:id/notes", authMiddleware, addNoteToFinalized);

// Direct add routes
router.post("/direct-add/potential", authMiddleware, directAddToPotential);
router.post("/direct-add/finalized", authMiddleware, directAddToFinalized);

// Location comparison routes
router.post("/compare/:requirementId", authMiddleware, compareLocations);
router.post("/:locationId/refresh-cache", authMiddleware, refreshLocationCache);

// Location requirements routes
router.get("/requirements/:projectId", authMiddleware, getLocationRequirements);
router.post("/requirements", authMiddleware, createLocationRequirement);
router.patch(
  "/requirements/:requirementId",
  authMiddleware,
  updateLocationRequirement
);
router.delete(
  "/requirements/:requirementId",
  authMiddleware,
  deleteLocationRequirement
);

export default router;
